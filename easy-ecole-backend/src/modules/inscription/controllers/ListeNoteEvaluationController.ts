import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Enseignant } from "../../auth/models/Enseignant";
import { Cours } from "../models/Cours";
import { Classe } from "../models/Classe";
import { Parcours } from "../models/Parcours";
import { TypeNoteEvaluation } from "../models/TypeNoteEvaluation";
import { ListeNoteEvaluation } from "../models/ListeNoteEvaluation";
import { NoteEvaluation } from "../models/NoteEvaluation";
import { CoursParticipant } from "../models/CoursParticipant";
import { CursusApprenant } from "../models/CursusApprenant";
import { DemandeInscription } from "../models/DemandeInscription";
import { Seance } from "../models/Seance";
import { Etablissement } from "../../etablissement/models/Etablissement";
import { EchelleNote } from "../../bulletins/models/EchelleNote";
import * as ExcelJS from "exceljs";
import * as fs from "fs";
import { validateEvaluationInput, ValidationError } from "../../../core/validators/noteValidators";
import { PvDevoirService } from "../services/PvDevoirService";
import { AuditEvaluation } from "../../bulletins/models/AuditEvaluation";
import { AuditNote } from "../../bulletins/models/AuditNote";
import { Notification } from "../../elearning/models/Notification";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { validateNoteValue, ValidationError as NoteValidationError } from "../../../core/validators/noteValidators";

const NOM_ETABLISSEMENT_DEFAUT = 'Université des Sciences et Technologies (UST)';
const PV_SHEET_NAME = 'PV Notes';
const PV_HEADER_ROW = 9; // Ligne d'en-tête du tableau — NE PAS CHANGER (utilisée par importPv)

async function coursVisibles(req: Request): Promise<number[] | null> {
    if (req.utilisateurRole === RolesUtilisateur.SUPERVISEUR_GENERAL) return null;
    if (
        !req.etablissementId
        && [RolesUtilisateur.ADMIN, RolesUtilisateur.INSTITUTION, RolesUtilisateur.COMITE_ORIENTATION].includes(req.utilisateurRole!)
    ) return null;
    if (!req.etablissementId) return [];

    let coursIds: number[] | undefined;
    if (req.utilisateurRole === RolesUtilisateur.ENSEIGNANT) {
        const enseignant = await Enseignant.findOne({ where: { utilisateurId: req.utilisateurId! } });
        if (!enseignant) return [];
        const cours = await Cours.findAll({ where: { enseignantId: enseignant.id }, attributes: ['id'] });
        coursIds = cours.map(item => Number(item.id));
    }
    else if (req.utilisateurRole === RolesUtilisateur.APPRENANT) {
        const participants = await CoursParticipant.findAll({
            where: { utilisateurId: req.utilisateurId! },
            attributes: ['coursId']
        });
        coursIds = [...new Set(participants.map(item => Number(item.coursId)))];
    }
    const cours = await Cours.findAll({
        where: coursIds ? { id: { [Op.in]: coursIds } } : {},
        attributes: ['id'],
        include: [{
            association: Cours.associations.classe,
            where: { etablissementId: req.etablissementId },
            required: true,
            attributes: []
        }]
    });
    return cours.map(item => Number(item.id));
}

async function exigerEvaluationVisible(req: Request, res: Response, evaluationId: number): Promise<ListeNoteEvaluation | null> {
    const evaluation = await ListeNoteEvaluation.findByPk(evaluationId);
    if (!evaluation) {
        res.status(404).json({ success: false, message: "Évaluation non trouvée" });
        return null;
    }
    const visibleCourseIds = await coursVisibles(req);
    if (visibleCourseIds !== null && !visibleCourseIds.includes(Number(evaluation.coursId))) {
        res.status(404).json({ success: false, message: "Évaluation non trouvée" });
        return null;
    }
    return evaluation;
}

function estSuperviseur(req: Request): boolean {
    return req.utilisateurRole === RolesUtilisateur.SUPERVISEUR_GENERAL;
}

function estSecretariatGeneral(req: Request): boolean {
    return req.utilisateurRole === RolesUtilisateur.INSTITUTION;
}

export default class ListeNoteEvaluationController {

    constructor() { }

    static async getAllListesNoteEvaluation(req: Request, res: Response): Promise<Response> {
        try {
            const visibleCourseIds = await coursVisibles(req);
            const where: any = {};
            if (visibleCourseIds !== null) where.coursId = { [Op.in]: visibleCourseIds };
            if (req.utilisateurRole === RolesUtilisateur.ENSEIGNANT || req.utilisateurRole === RolesUtilisateur.APPRENANT) {
                where.statutGestion = 'publie';
            }
            const include: any[] = [
                ListeNoteEvaluation.associations.typeNoteEvaluation,
                {
                    association: ListeNoteEvaluation.associations.cours,
                    required: true,
                    include: [
                        Cours.associations.classe,
                        { association: Cours.associations.enseignant, include: [Enseignant.associations.utilisateur] },
                        { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] }
                    ]
                }
            ];
            if (req.utilisateurRole === RolesUtilisateur.APPRENANT) {
                const participantIds = await CoursParticipant.findAll({
                    where: { utilisateurId: req.utilisateurId! },
                    attributes: ['id']
                });
                include.push({
                    association: ListeNoteEvaluation.associations.notesEvaluation,
                    required: false,
                    where: {
                        coursParticipantId: { [Op.in]: participantIds.map(item => item.id) },
                        statut: 'publie'
                    }
                });
            }
            const listesNoteEvaluation = await ListeNoteEvaluation.findAll({ where, include });
            return res.status(200).send(listesNoteEvaluation);
        } catch (error) {
            console.error("Erreur récupération listes évaluation:", error);
            return res.status(500).json({ success: false, message: "Erreur lors de la récupération des listes" });
        }
    }

    static async getListeNoteEvaluation(req: Request, res: Response): Promise<Response> {
        try {
            const visibleCourseIds = await coursVisibles(req);
            const where: any = { id: req.params.id };
            if (visibleCourseIds !== null) where.coursId = { [Op.in]: visibleCourseIds };
            if (req.utilisateurRole === RolesUtilisateur.ENSEIGNANT || req.utilisateurRole === RolesUtilisateur.APPRENANT) {
                where.statutGestion = 'publie';
            }
            const noteInclude: any = {
                association: ListeNoteEvaluation.associations.notesEvaluation,
                include: [NoteEvaluation.associations.coursParticipant]
            };
            if (req.utilisateurRole === RolesUtilisateur.APPRENANT) {
                const participants = await CoursParticipant.findAll({
                    where: { utilisateurId: req.utilisateurId! },
                    attributes: ['id']
                });
                noteInclude.where = {
                    coursParticipantId: { [Op.in]: participants.map(item => item.id) },
                    statut: 'publie'
                };
            }
            const listeNoteEvaluation = await ListeNoteEvaluation.findOne({
                where,
                include: [
                    ListeNoteEvaluation.associations.typeNoteEvaluation,
                    {
                        association: ListeNoteEvaluation.associations.cours,
                        include: [
                            Cours.associations.classe,
                            { association: Cours.associations.enseignant, include: [Enseignant.associations.utilisateur] },
                            { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] }
                        ]
                    },
                    noteInclude
                ]
            });

            if (listeNoteEvaluation == null)
                return res.status(404).json({ success: false, message: "ListeNoteEvaluation non trouvée" });

            return res.status(200).send(listeNoteEvaluation);
        } catch (error) {
            console.error("Erreur récupération évaluation:", error);
            return res.status(500).json({ success: false, message: "Erreur lors de la récupération de l'évaluation" });
        }
    }

    static async createListeNoteEvaluation(req: Request, res: Response): Promise<Response> {

        if (!estSecretariatGeneral(req)) {
            return res.status(403).json({ success: false, message: "La création d’une évaluation est réservée au Secrétariat général" })
        }

        try {
            validateEvaluationInput(req.body);
        } catch (e) {
            if (e instanceof ValidationError) {
                return res.status(400).json({ success: false, message: e.message });
            }
            throw e;
        }

        let existing: ListeNoteEvaluation | null = await ListeNoteEvaluation.findOne({ where: { typeNoteEvaluationId: req.body.typeNoteEvaluationId, coursId: req.body.coursId, anneeAcademiqueId: req.body.anneeAcademiqueId } });

        if (existing != null) {
            return res.status(400).json({ success: false, alreadyExists: true });
        }

        try {
            let listeNoteEvaluation: ListeNoteEvaluation = new ListeNoteEvaluation();
            listeNoteEvaluation.date = req.body.date
            const type = await TypeNoteEvaluation.findByPk(req.body.typeNoteEvaluationId);
            if (!type) {
                return res.status(400).json({ success: false, message: "Type d'évaluation introuvable" });
            }
            const dateEvaluation = new Date(req.body.date);
            if (Number.isNaN(dateEvaluation.getTime())) {
                const estExamen = String(type.categorie).toLowerCase() === 'examen'
                    || String(type.libelle).toLowerCase().includes('examen');
                return res.status(400).json({
                    success: false,
                    message: estExamen ? "Date d'examen invalide" : "Date d'évaluation invalide"
                });
            }
            const cours = await Cours.findByPk(req.body.coursId);
            if (!cours) return res.status(400).json({ success: false, message: "Cours introuvable" });
            if (req.etablissementId && Number(cours.etablissementId) !== Number(req.etablissementId)) {
                return res.status(403).json({ success: false, message: "Le cours ne relève pas de votre site" });
            }
            listeNoteEvaluation.heureDebut = req.body.heureDebut
            listeNoteEvaluation.heureFin = req.body.heureFin
            listeNoteEvaluation.commentaire = req.body.commentaire
            listeNoteEvaluation.typeNoteEvaluationId = req.body.typeNoteEvaluationId
            listeNoteEvaluation.poidsTypeNoteEvaluation = req.body.poidsTypeNoteEvaluation
            listeNoteEvaluation.coursId = req.body.coursId
            listeNoteEvaluation.enseignantId = cours.enseignantId as any
            listeNoteEvaluation.anneeAcademiqueId = req.body.anneeAcademiqueId
            listeNoteEvaluation.datePublication = null
            listeNoteEvaluation.dateLimiteSaisie = null
            listeNoteEvaluation.statutGestion = 'brouillon'

            await listeNoteEvaluation.save();
            return res.status(201).send(listeNoteEvaluation);
        } catch (error) {
            console.error("Erreur création évaluation:", error);
            return res.status(500).json({ success: false, message: "Erreur lors de la création de l'évaluation" });
        }
    }

    static async updateListeNoteEvaluation(req: Request, res: Response): Promise<Response> {
        if (!estSecretariatGeneral(req)) return res.status(403).json({ success: false, message: "Modification réservée au Secrétariat général" });
        const listeNoteEvaluation = await ListeNoteEvaluation.findByPk(req.params.id);
        if (listeNoteEvaluation != null) {
            if (listeNoteEvaluation.statutGestion !== 'brouillon') {
                return res.status(409).json({ success: false, message: "Une évaluation publiée ne peut plus être modifiée ici" });
            }
            try {
                await listeNoteEvaluation.update({
                    date: req.body.date,
                    heureDebut: req.body.heureDebut,
                    heureFin: req.body.heureFin,
                    commentaire: req.body.commentaire,
                    typeNoteEvaluationId: req.body.typeNoteEvaluationId,
                    poidsTypeNoteEvaluation: req.body.poidsTypeNoteEvaluation,
                    coursId: req.body.coursId,
                });
                return res.status(200).send(listeNoteEvaluation);
            } catch (error) {
                console.error("Erreur mise à jour évaluation:", error);
                return res.status(400).json({ success: false, message: "Erreur lors de la mise à jour" });
            }
        } else {
            return res.status(404).json({ success: false, message: "ListeNoteEvaluation non trouvée" });
        }
    }

    static async deleteListeNoteEvaluation(req: Request, res: Response): Promise<Response> {
        if (!estSecretariatGeneral(req)) return res.status(403).json({ success: false, message: "Suppression réservée au Secrétariat général" });

        let listeNoteEvaluation: ListeNoteEvaluation | null = await ListeNoteEvaluation.findOne({ where: { id: req.params.id } });
        if (listeNoteEvaluation) {
            if (listeNoteEvaluation.statutGestion !== 'brouillon') {
                return res.status(409).json({ success: false, message: "Seule une évaluation en brouillon peut être supprimée" });
            }
            try {
                await listeNoteEvaluation.destroy();
                return res.status(200).json({ success: true, message: "ListeNoteEvaluation supprimée" });
            } catch (error) {
                console.error("Erreur suppression évaluation:", error);
                return res.status(500).json({ success: false, message: "Erreur lors de la suppression" });
            }
        } else {
            return res.status(404).json({ success: false, message: "ListeNoteEvaluation non trouvée" });
        }
    }

    static async publier(req: Request, res: Response): Promise<Response> {
            if (!estSecretariatGeneral(req)) return res.status(403).json({ success: false, message: "Publication réservée au Secrétariat général" });
            try {
                if (!Number.isSafeInteger(Number(req.params.id)) || Number(req.params.id) <= 0) {
                    return res.status(400).json({ success: false, message: "Identifiant d’évaluation invalide" });
                }
                const sequelize = DatabaseConnection.getInstance().sequelize;
                const result = await sequelize.transaction(async transaction => {
                    const evaluation = await ListeNoteEvaluation.findByPk(req.params.id, {
                        transaction,
                        lock: transaction.LOCK.UPDATE
                    });
                    if (!evaluation) return { status: 404 as const, body: { success: false, message: "Évaluation non trouvée" } };
                    if (evaluation.statutGestion !== 'brouillon') {
                        return { status: 409 as const, body: { success: false, message: "Seule une évaluation en brouillon peut être publiée" } };
                    }

                    const cours = await Cours.findByPk(evaluation.coursId, { transaction });
                    if (!cours) return { status: 409 as const, body: { success: false, message: "Le cours associé à cette évaluation est introuvable" } };
                    const [classe, type, participants, enseignant] = await Promise.all([
                        cours.classeId ? Classe.findByPk(cours.classeId, { transaction }) : Promise.resolve(null),
                        TypeNoteEvaluation.findByPk(evaluation.typeNoteEvaluationId, { transaction }),
                        CoursParticipant.findAll({ where: { coursId: cours.id }, attributes: ['utilisateurId'], transaction }),
                        cours.enseignantId ? Enseignant.findByPk(cours.enseignantId, { transaction }) : Promise.resolve(null)
                    ]);

                    const datePublication = new Date();
                    const dateLimiteSaisie = new Date(datePublication);
                    dateLimiteSaisie.setUTCDate(dateLimiteSaisie.getUTCDate() + 14);
                    evaluation.statutGestion = 'publie';
                    evaluation.datePublication = datePublication;
                    evaluation.dateLimiteSaisie = dateLimiteSaisie;
                    await evaluation.save({ transaction });
                    await AuditEvaluation.create({
                        evaluationId: evaluation.id,
                        effectuePar: req.utilisateurId!,
                        action: 'publication',
                        motif: req.body?.motif || null,
                        ancienneValeur: 'brouillon',
                        nouvelleValeur: JSON.stringify({ statut: 'publie', datePublication, dateLimiteSaisie })
                    }, { transaction });

                    const destinatations = new Map<number, string>();
                    if (enseignant?.utilisateurId) destinatations.set(Number(enseignant.utilisateurId), 'evaluation_publiee_professeur');
                    for (const participant of participants) {
                        destinatations.set(Number(participant.utilisateurId), 'evaluation_publiee_etudiant');
                    }
                    const classeNom = (classe as any)?.libelle || 'Classe';
                    const dateLimite = dateLimiteSaisie.toISOString();
                    const messages = [...destinatations.entries()].map(([utilisateurId, typeNotification]) => ({
                        utilisateurId,
                        evaluationId: Number(evaluation.id),
                        type: typeNotification,
                        titre: `${type?.libelle || 'Évaluation'} publiée`,
                        message: `${type?.libelle || 'Évaluation'} pour ${cours.intitule}, classe ${classeNom}. Publication officielle le ${datePublication.toISOString()}; saisie des notes jusqu’au ${dateLimite}.`,
                        lien: `/cours/notes/${evaluation.id}/saisie`,
                        lu: false
                    }));
                    if (messages.length) await Notification.bulkCreate(messages, { transaction, ignoreDuplicates: true });
                    return { status: 200 as const, body: { success: true, evaluation } };
                });
                return res.status(result.status).json(result.body);
            } catch (error) {
                console.error("Erreur publication évaluation:", error);
                return res.status(500).json({ success: false, message: "L’évaluation n’a pas pu être publiée" });
            }
        }

        private static async changerBlocage(req: Request, res: Response, bloquer: boolean): Promise<Response> {
            if (!estSuperviseur(req)) return res.status(403).json({ success: false, message: "Action réservée au Superviseur général" });
            const motif = typeof req.body?.motif === 'string' ? req.body.motif.trim() : '';
            if (!motif) return res.status(400).json({ success: false, message: "Un motif est requis pour cette action" });
            try {
                if (!Number.isSafeInteger(Number(req.params.id)) || Number(req.params.id) <= 0) {
                    return res.status(400).json({ success: false, message: "Identifiant d’évaluation invalide" });
                }
                const evaluation = await exigerEvaluationVisible(req, res, Number(req.params.id));
                if (!evaluation) return res;
                if (evaluation.verrouillageDefinitif && !bloquer) {
                    return res.status(409).json({ success: false, message: "Une évaluation clôturée définitivement ne peut pas être rouverte" });
                }
                const oldValue = JSON.stringify({ saisieBloquee: evaluation.saisieBloquee, motifBlocage: evaluation.motifBlocage });
                evaluation.saisieBloquee = bloquer;
                evaluation.motifBlocage = bloquer ? motif : null;
                evaluation.bloqueePar = bloquer ? req.utilisateurId! : null;
                await evaluation.save();
                await AuditEvaluation.create({
                    evaluationId: evaluation.id,
                    effectuePar: req.utilisateurId!,
                    action: bloquer ? 'blocage_evaluation' : 'deblocage_evaluation',
                    motif,
                    ancienneValeur: oldValue,
                    nouvelleValeur: JSON.stringify({ saisieBloquee: evaluation.saisieBloquee, motifBlocage: evaluation.motifBlocage })
                });
                return res.status(200).json({ success: true, evaluation });
            } catch (error) {
                console.error("Erreur blocage évaluation:", error);
                return res.status(500).json({ success: false, message: "L’état de blocage n’a pas pu être modifié" });
            }
        }

        static async bloquerSaisie(req: Request, res: Response): Promise<Response> {
            return this.changerBlocage(req, res, true);
        }

        static async debloquerSaisie(req: Request, res: Response): Promise<Response> {
            return this.changerBlocage(req, res, false);
        }

        static async cloturerDefinitivement(req: Request, res: Response): Promise<Response> {
            if (!estSuperviseur(req)) return res.status(403).json({ success: false, message: "Clôture réservée au Superviseur général" });
            const motif = typeof req.body?.motif === 'string' ? req.body.motif.trim() : '';
            if (!motif) return res.status(400).json({ success: false, message: "Un motif est requis pour la clôture définitive" });
            try {
                if (!Number.isSafeInteger(Number(req.params.id)) || Number(req.params.id) <= 0) {
                    return res.status(400).json({ success: false, message: "Identifiant d’évaluation invalide" });
                }
                const evaluation = await exigerEvaluationVisible(req, res, Number(req.params.id));
                if (!evaluation) return res;
                if (evaluation.verrouillageDefinitif) return res.status(409).json({ success: false, message: "Cette évaluation est déjà clôturée définitivement" });
                const ancienneValeur = JSON.stringify({ saisieBloquee: evaluation.saisieBloquee, verrouillageDefinitif: false });
                evaluation.saisieBloquee = true;
                evaluation.verrouillageDefinitif = true;
                evaluation.motifBlocage = motif;
                evaluation.bloqueePar = req.utilisateurId!;
                await evaluation.save();
                await AuditEvaluation.create({
                    evaluationId: evaluation.id,
                    effectuePar: req.utilisateurId!,
                    action: 'cloture_definitive',
                    motif,
                    ancienneValeur,
                    nouvelleValeur: JSON.stringify({ saisieBloquee: true, verrouillageDefinitif: true })
                });
                return res.status(200).json({ success: true, evaluation });
            } catch (error) {
                console.error("Erreur clôture évaluation:", error);
                return res.status(500).json({ success: false, message: "L’évaluation n’a pas pu être clôturée" });
            }
        }

        static async prolongerDelai(req: Request, res: Response): Promise<Response> {
            if (!estSuperviseur(req)) return res.status(403).json({ success: false, message: "Prolongation réservée au Superviseur général" });
            const motif = typeof req.body?.motif === 'string' ? req.body.motif.trim() : '';
            const dateLimite = new Date(req.body?.dateLimiteSaisie);
            if (!motif || Number.isNaN(dateLimite.getTime()) || dateLimite.getTime() <= Date.now()) {
                return res.status(400).json({ success: false, message: "Une nouvelle échéance future et un motif sont requis" });
            }
            try {
                if (!Number.isSafeInteger(Number(req.params.id)) || Number(req.params.id) <= 0) {
                    return res.status(400).json({ success: false, message: "Identifiant d’évaluation invalide" });
                }
                const evaluation = await exigerEvaluationVisible(req, res, Number(req.params.id));
                if (!evaluation) return res;
                if (evaluation.verrouillageDefinitif) return res.status(409).json({ success: false, message: "Une évaluation clôturée définitivement ne peut pas être prolongée" });
                const ancienneValeur = evaluation.dateLimiteSaisie?.toISOString() || null;
                evaluation.dateLimiteSaisie = dateLimite;
                await evaluation.save();
                await AuditEvaluation.create({
                    evaluationId: evaluation.id,
                    effectuePar: req.utilisateurId!,
                    action: 'prolongation_delai',
                    motif,
                    ancienneValeur,
                    nouvelleValeur: dateLimite.toISOString()
                });
                const cours = await Cours.findByPk(evaluation.coursId);
                if (cours?.enseignantId) {
                    const enseignant = await Enseignant.findByPk(cours.enseignantId);
                    if (enseignant?.utilisateurId) {
                        await Notification.create({
                            utilisateurId: Number(enseignant.utilisateurId),
                            evaluationId: Number(evaluation.id),
                            type: 'evaluation_delai_prolonge',
                            titre: 'Délai de saisie prolongé',
                            message: `Le délai de saisie a été prolongé jusqu’au ${dateLimite.toISOString()}. Motif : ${motif}`,
                            lien: `/cours/notes/${evaluation.id}/saisie`,
                            lu: false
                        });
                    }
                }
                return res.status(200).json({ success: true, evaluation });
            } catch (error) {
                console.error("Erreur prolongation délai:", error);
                return res.status(500).json({ success: false, message: "Le délai n’a pas pu être prolongé" });
            }
        }

        static async getSuivi(req: Request, res: Response): Promise<Response> {
            if (!estSuperviseur(req)) return res.status(403).json({ success: false, message: "Suivi réservé au Superviseur général" });
            try {
                const evaluations = await ListeNoteEvaluation.findAll({
                    include: [
                        { association: ListeNoteEvaluation.associations.cours, include: [Cours.associations.classe] },
                        { association: ListeNoteEvaluation.associations.notesEvaluation }
                    ],
                    order: [['datePublication', 'DESC'], ['id', 'DESC']]
                });
                const data = await Promise.all(evaluations.map(async evaluation => {
                    const participants = await CoursParticipant.count({ where: { coursId: evaluation.coursId } });
                    const saisies = (evaluation.notesEvaluation || []).filter(item => item.note !== null).length;
                    return {
                        id: evaluation.id,
                        statut: evaluation.statutGestion,
                        datePublication: evaluation.datePublication,
                        dateLimiteSaisie: evaluation.dateLimiteSaisie,
                        saisieBloquee: evaluation.saisieBloquee,
                        verrouillageDefinitif: evaluation.verrouillageDefinitif,
                        participants,
                        notesSaisies: saisies,
                        progression: participants ? Math.round(saisies * 100 / participants) : 100,
                        cours: evaluation.cours,
                        typeNoteEvaluation: evaluation.typeNoteEvaluation
                    };
                }));
                return res.status(200).json(data);
            } catch (error) {
                console.error("Erreur suivi évaluations:", error);
                return res.status(500).json({ success: false, message: "Le suivi des évaluations n’a pas pu être chargé" });
            }
        }

        static async getAudit(req: Request, res: Response): Promise<Response> {
            if (!estSuperviseur(req)) return res.status(403).json({ success: false, message: "Historique réservé au Superviseur général" });
            try {
                if (!Number.isSafeInteger(Number(req.params.id)) || Number(req.params.id) <= 0) {
                    return res.status(400).json({ success: false, message: "Identifiant d’évaluation invalide" });
                }
                const evaluation = await exigerEvaluationVisible(req, res, Number(req.params.id));
                if (!evaluation) return res;
                const audit = await AuditEvaluation.findAll({
                    where: { evaluationId: evaluation.id },
                    order: [['createdAt', 'DESC']]
                });
                return res.status(200).json(audit);
            } catch (error) {
                console.error("Erreur historique évaluation:", error);
                return res.status(500).json({ success: false, message: "L’historique n’a pas pu être chargé" });
            }
        }

    static async getCount(req: Request, res: Response): Promise<Response> {
        const visibleCourseIds = await coursVisibles(req);
        if (visibleCourseIds !== null && !visibleCourseIds.length) {
            return res.status(403).json({ success: false })
        }

        try {
            const options: CountOptions<InferAttributes<ListeNoteEvaluation>> = {
                where: visibleCourseIds === null ? {} : { coursId: { [Op.in]: visibleCourseIds } }
            };
            const value = await ListeNoteEvaluation.count(options);
            return res.status(200).json({ success: true, count: value });
        } catch (error) {
            console.error("Erreur comptage évaluations:", error);
            return res.status(500).json({ success: false, message: "Erreur lors du comptage" });
        }
    }

    static async exportPv(req: Request, res: Response): Promise<Response> {
        try {
            if ((req as any).utilisateurRole === RolesUtilisateur.APPRENANT) {
                return res.status(403).json({ success: false, message: "Vous n'avez pas le droit d'exporter un procès-verbal de notes" })
            }

            const evaluationId = Number(req.params.id)
            if (!Number.isSafeInteger(evaluationId) || evaluationId <= 0) {
                return res.status(400).json({ success: false, message: "Identifiant d’évaluation invalide" })
            }
            const evaluation = await ListeNoteEvaluation.findByPk(evaluationId)
            if (!evaluation) return res.status(404).json({ success: false, message: "Évaluation non trouvée" })
            const visibleCourseIds = await coursVisibles(req)
            if (visibleCourseIds !== null && !visibleCourseIds.includes(Number(evaluation.coursId))) {
                return res.status(404).json({ success: false, message: "Évaluation non trouvée" })
            }
            const format = (req.query.format as string || 'excel').toLowerCase()

            if (format === 'pdf') {
                const pdfBuffer = await PvDevoirService.exportPdf(evaluationId)
                res.setHeader('Content-Type', 'application/pdf')
                res.setHeader('Content-Disposition', `attachment; filename="PV_Devoir_${evaluationId}_${new Date().toISOString().split('T')[0]}.pdf"`)
                res.send(pdfBuffer)
                return res
            }

            const excelBuffer = await PvDevoirService.exportExcel(evaluationId)
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            res.setHeader('Content-Disposition', `attachment; filename="PV_Devoir_${evaluationId}_${new Date().toISOString().split('T')[0]}.xlsx"`)
            res.send(excelBuffer)
            return res
        } catch (error) {
            console.error("Erreur export PV:", error);
            if (error instanceof Error && error.message.includes("non trouvée"))
                return res.status(404).json({ success: false, message: error.message })
            return res.status(500).json({ success: false, message: "Erreur lors de l'export du PV" })
        }
    }

    static async importPv(req: Request, res: Response): Promise<Response> {
        try {
            if (req.utilisateurRole !== RolesUtilisateur.ENSEIGNANT) {
                if (req.file?.path) fs.unlink(req.file.path, () => {})
                return res.status(403).json({ success: false, message: "L’import des notes est réservé à l’enseignant affecté au cours" })
            }

            if (!req.file) {
                return res.status(400).json({ success: false, message: "Aucun fichier fourni" })
            }

            const evaluation = await ListeNoteEvaluation.findOne({
                where: { id: req.params.id },
                include: [{ association: ListeNoteEvaluation.associations.notesEvaluation }]
            })

            if (!evaluation) {
                return res.status(404).json({ success: false, message: "Évaluation non trouvée" })
            }
            const visibleCourseIds = await coursVisibles(req)
            if (visibleCourseIds === null || !visibleCourseIds.includes(Number(evaluation.coursId))) {
                if (req.file?.path) fs.unlink(req.file.path, () => {})
                return res.status(404).json({ success: false, message: "Évaluation non trouvée" })
            }
            if (
                evaluation.statutGestion !== 'publie'
                || evaluation.saisieBloquee
                || evaluation.verrouillageDefinitif
                || (evaluation.dateLimiteSaisie && Date.now() > new Date(evaluation.dateLimiteSaisie).getTime())
            ) {
                if (req.file?.path) fs.unlink(req.file.path, () => {})
                return res.status(409).json({ success: false, message: "Cette évaluation n’est pas ouverte à la saisie" })
            }

            const participants = await CoursParticipant.findAll({
                where: { coursId: evaluation.coursId },
                include: [
                    {
                        association: CoursParticipant.associations.utilisateur,
                        attributes: ['nom', 'prenoms', 'identifiant'],
                        required: true,
                    },
                    {
                        association: CoursParticipant.associations.cursusApprenant,
                        include: [{ association: CursusApprenant.associations.demandeInscription }],
                        required: true,
                    }
                ]
            })

            const results: { matricule: string, nom: string, note: number | null, status: string }[] = []
            const errors: string[] = []

            const existingNotes = evaluation.notesEvaluation || []

            const enregistrerNote = async (participant: any, note: number): Promise<boolean> => {
                let valeur: number | null
                try {
                    valeur = validateNoteValue(note)
                } catch (error) {
                    if (error instanceof NoteValidationError) return false
                    throw error
                }
                return DatabaseConnection.getInstance().sequelize.transaction(async transaction => {
                    const currentEvaluation = await ListeNoteEvaluation.findByPk(evaluation.id, {
                        transaction,
                        lock: transaction.LOCK.UPDATE
                    })
                    if (
                        !currentEvaluation
                        || currentEvaluation.statutGestion !== 'publie'
                        || currentEvaluation.saisieBloquee
                        || currentEvaluation.verrouillageDefinitif
                        || (currentEvaluation.dateLimiteSaisie && Date.now() > new Date(currentEvaluation.dateLimiteSaisie).getTime())
                    ) return false
                    const existingNote = await NoteEvaluation.findOne({
                        where: { listeNoteEvaluationId: evaluation.id, coursParticipantId: participant.id },
                        transaction,
                        lock: transaction.LOCK.UPDATE
                    })
                    if (existingNote?.verrouillee) return false
                    if (existingNote) {
                        const ancienneNote = existingNote.note
                        existingNote.note = valeur
                        await existingNote.save({ transaction })
                        if (ancienneNote !== valeur) {
                            await AuditNote.create({
                                noteEvaluationId: existingNote.id,
                                ancienneNote,
                                nouvelleNote: valeur,
                                modifiePar: req.utilisateurId!,
                                motif: 'Import du procès-verbal',
                                action: 'modification_note'
                            }, { transaction })
                        }
                    } else {
                        const created = await NoteEvaluation.create({
                            listeNoteEvaluationId: Number(evaluation.id),
                            coursParticipantId: Number(participant.id),
                            note: valeur
                        }, { transaction })
                        await AuditNote.create({
                            noteEvaluationId: created.id,
                            ancienneNote: null,
                            nouvelleNote: valeur,
                            modifiePar: req.utilisateurId!,
                            motif: 'Import du procès-verbal',
                            action: 'saisie_initiale'
                        }, { transaction })
                    }
                    return true
                })
            }

            const estPdf = (req.file!.path || '').toLowerCase().endsWith('.pdf')

            if (estPdf) {
                let notesExtraites: Map<number, number>
                try {
                    notesExtraites = await PvDevoirService.extraireNotesPdf(req.file!.path, participants)
                } catch (e) {
                    if (req.file?.path) fs.unlink(req.file.path, () => {})
                    console.error("Erreur lecture PDF:", e);
                    return res.status(400).json({ success: false, message: "Impossible de lire le fichier PDF : " + ((e as Error).message || 'format invalide') })
                }

                for (const p of participants) {
                    const pd = p as any
                    const nom = `${pd.utilisateur?.nom} ${pd.utilisateur?.prenoms}`.trim()
                    const ref = (pd.cursusApprenant?.demandeInscription?.matricule || pd.utilisateur?.identifiant || '').toString().trim()
                    const note = notesExtraites.get(Number(p.id))

                    if (note === undefined) {
                        results.push({ matricule: ref, nom, note: null, status: 'Ignoré (note non trouvée dans le PDF)' })
                        continue
                    }

                    const saved = await enregistrerNote(p, note)
                    results.push({ matricule: ref, nom, note, status: saved ? '✓ Importée' : 'Non importée (note verrouillée ou saisie fermée)' })
                }
            } else {
                const workbook = new ExcelJS.Workbook()
                await workbook.xlsx.readFile(req.file.path)

                const sheet = workbook.getWorksheet('PV Notes') || workbook.getWorksheet('PV Devoir')
                if (!sheet) {
                    return res.status(400).json({ success: false, message: "Format de fichier invalide : onglet 'PV Notes' ou 'PV Devoir' introuvable" })
                }

                const headerRow = 9

                // Détecter le format via l'en-tête ligne 9 : ancien (B='Matricule', note en D) vs nouveau (B='Nom...', note en G)
                const headerColB = (sheet.getCell(`B${headerRow}`).value?.toString() || '').toLowerCase()
                const isNewFormat = headerColB.includes('nom')

                for (let rowNum = headerRow + 1; rowNum <= headerRow + participants.length; rowNum++) {
                    let identifiantRef = ''
                    let nom = ''
                    let noteValue: any = null

                    if (isNewFormat) {
                        nom = sheet.getCell(`B${rowNum}`).value?.toString().trim() || ''
                        identifiantRef = sheet.getCell(`E${rowNum}`).value?.toString().trim() || ''
                        noteValue = sheet.getCell(`G${rowNum}`).value
                    } else {
                        identifiantRef = sheet.getCell(`B${rowNum}`).value?.toString().trim() || ''
                        nom = sheet.getCell(`C${rowNum}`).value?.toString().trim() || ''
                        noteValue = sheet.getCell(`D${rowNum}`).value
                    }

                    if (!identifiantRef && !nom) continue

                    const participant = participants.find(p => {
                        const pd = p as any
                        const pRef = (pd.cursusApprenant?.demandeInscription?.matricule || pd.utilisateur?.identifiant || '').toString().trim().toLowerCase()
                        const pNom = `${pd.utilisateur?.nom} ${pd.utilisateur?.prenoms}`.trim().toLowerCase()
                        return (!!identifiantRef && pRef === identifiantRef.toLowerCase()) || (!!nom && pNom === nom.toLowerCase())
                    })

                    if (!participant) {
                        errors.push(`Ligne ${rowNum}: Étudiant non trouvé (${identifiantRef || nom})`)
                        results.push({ matricule: identifiantRef, nom, note: null, status: 'Étudiant non trouvé' })
                        continue
                    }

                    if (noteValue === undefined || noteValue === null || noteValue === '') {
                        results.push({ matricule: identifiantRef, nom, note: null, status: 'Ignoré (note vide)' })
                        continue
                    }

                    const note = parseFloat(noteValue as string)

                    if (isNaN(note) || note < 0 || note > 20) {
                        errors.push(`Ligne ${rowNum}: Note invalide pour ${identifiantRef || nom} (${noteValue})`)
                        results.push({ matricule: identifiantRef, nom, note: null, status: 'Note invalide' })
                        continue
                    }

                    const saved = await enregistrerNote(participant, note)
                    results.push({ matricule: identifiantRef, nom, note, status: saved ? '✓ Importée' : 'Non importée (note verrouillée ou saisie fermée)' })
                }
            }

            const importedCount = results.filter(r => r.status === '✓ Importée').length
            const errorCount = errors.length

            if (req.file?.path) {
                fs.unlink(req.file.path, () => {})
            }

            return res.status(200).json({
                success: true,
                importedCount,
                errorCount,
                details: results,
                errors: errors.length > 0 ? errors : undefined
            })
        } catch (error) {
            if (req.file?.path) {
                fs.unlink(req.file.path, () => {})
            }
            console.error("Erreur import PV:", error);
            return res.status(500).json({ success: false, message: "Erreur lors de l'import du PV" })
        }
    }
}
