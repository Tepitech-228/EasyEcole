import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DemandeInscription } from "../models/DemandeInscription";
import { ParcoursChoisi } from "../models/ParcoursChoisi";
import { Parcours } from "../models/Parcours";
import { PrerequisParcoursChoisi } from "../models/PrerequisParcoursChoisi";
import { PrerequisParcours } from "../models/PrerequisParcours";
import { EmailSender } from "../../../core/helpers/EmailSender";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Apprenant } from "../../auth/models/Apprenant";
import { DemandeInscriptionCours } from "../models/DemandeInscriptionCours";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { IDGenerator } from "../../../core/helpers/IDGenerator";
import { Session } from "../models/Session";
import { Cours } from "../models/Cours";
import { CursusApprenant } from "../models/CursusApprenant";
import { EtatsCoursChoisi } from "../../../core/enums/EtatsCoursChoisi";
import { CoursParticipant } from "../models/CoursParticipant";
import { PreInscription, EtatPreInscription } from "../models/PreInscription";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { DemandeInscriptionDossier } from "../models/DemandeInscriptionDossier";
import { DossierInscription } from "../models/DossierInscription";
import { Classe } from "../models/Classe";
import { PaiementInscription } from "../models/PaiementInscription";
import { FraisInscription } from "../models/FraisInscription";
import { GenerateurCarteService } from "../services/GenerateurCarteService";
import fs from "fs";
import path from "path";
import { DocumentPDFGenerator } from "../../../core/helpers/DocumentPDFGenerator";
import { ArchiveGedService } from "../../../core/services/ArchiveGedService";
import { creerEcritureComptable } from "../../comptabilite/helpers/ComptabiliteHelper";
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const hasChoixFinalValue = (value: unknown): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === '1' || normalized === 'true';
    }
    return false;
};

const getParcoursFinal = <T extends { choixFinal?: any }>(parcoursChoisis?: Array<T> | null): T | undefined => {
    if (!Array.isArray(parcoursChoisis) || parcoursChoisis.length === 0) return undefined;

    const explicit = parcoursChoisis.find(pc => hasChoixFinalValue(pc.choixFinal));
    if (explicit) return explicit;
    if (parcoursChoisis.length === 1) return parcoursChoisis[0];

    return undefined;
};

export default class DemandeInscriptionController {

    constructor() { }

    static async getAllDemandesInscription(req: Request, res: Response): Promise<Response> {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const offset = (page - 1) * limit;

        let where: any = {};
        let include: any[] = [
            { association: DemandeInscription.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] },
            DemandeInscription.associations.reponseInscription
        ];

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            where.utilisateurId = (req as any).utilisateurId;
        }

        const sessionWhere: any = {};
        if (req.query.anneeAcademiqueId) sessionWhere.anneeAcademiqueId = req.query.anneeAcademiqueId;
        if (req.query.niveauEtudeId) sessionWhere.niveauEtudeId = req.query.niveauEtudeId;
        include.push(Object.keys(sessionWhere).length > 0
            ? { association: DemandeInscription.associations.session, where: sessionWhere }
            : DemandeInscription.associations.session
        );

        include.push(req.query.parcoursId
            ? { association: DemandeInscription.associations.parcoursChoisis, where: { choixFinal: true, parcoursId: req.query.parcoursId } }
            : DemandeInscription.associations.parcoursChoisis
        );

        const preInscriptionInclude: any = { association: DemandeInscription.associations.preInscription };
        if (req.query.statut) {
            preInscriptionInclude.where = { statut: req.query.statut as string };
            preInscriptionInclude.required = true;
        }
        include.push(preInscriptionInclude);

        include.push({
            association: DemandeInscription.associations.dossiersDemande,
            include: [{ model: DossierInscription, as: 'dossierInscription' }],
            required: false
        });

        try {
            const { rows, count: total } = await DemandeInscription.findAndCountAll({
                where,
                include,
                order: [['dateDemande', 'DESC']],
                distinct: true,
                limit,
                offset
            });

            return res.status(200).json({
                data: rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getDemandeInscription(req: Request, res: Response): Promise<Response> {
        const isApprenant = (req as any).utilisateurRole == RolesUtilisateur.APPRENANT;
        const where: any = isApprenant
            ? { id: req.params.id, utilisateurId: (req as any).utilisateurId }
            : { id: req.params.id };

        try {
            // ── 1. Requête racine (légère, sans hasMany) ─────────────────────────
            const demandeInscription: DemandeInscription | null = await DemandeInscription.findOne({
                where,
                include: [
                    {
                        association: DemandeInscription.associations.utilisateur, include: [{
                            model: Apprenant, as: 'apprenant'
                        }]
                    },
                    DemandeInscription.associations.session,
                    DemandeInscription.associations.preInscription,
                    DemandeInscription.associations.reponseInscription
                ]
            });

            if (demandeInscription == null)
                return res.status(404).json({ success: false, message: "Demande non trouvée" });

            const demandeId = Number(req.params.id);

            // ── 2. Collections en requêtes indépendantes (zéro produit cartésien) ──
            const [
                sessionDossiersInscription,
                sessionFraisInscription,
                coursChoisis,
                dossiersDemande,
                paiementsInscription,
                parcoursChoisis
            ] = await Promise.all([
                // Documents requis de la session
                DossierInscription.findAll({ where: { sessionId: demandeInscription.sessionId } }),
                // Frais d'inscription de la session
                FraisInscription.findAll({ where: { sessionId: demandeInscription.sessionId } }),
                // Cours choisis (avec le cours et sa classe)
                DemandeInscriptionCours.findAll({
                    where: { demandeInscriptionId: demandeId },
                    include: [
                        { association: DemandeInscriptionCours.associations.cours, include: [Cours.associations.classe] }
                    ]
                }),
                // Documents déposés (avec le dossier requis correspondant)
                DemandeInscriptionDossier.findAll({
                    where: { demandeId },
                    include: [{ association: DemandeInscriptionDossier.associations.dossierInscription }]
                }),
                // Paiements de la demande
                PaiementInscription.findAll({ where: { matriculeInscription: demandeInscription.matricule } }),
                // Parcours choisis (avec parcours → niveauEtude, prerequisParcours, prerequisParcoursChoisis)
                ParcoursChoisi.findAll({
                    where: { demandeInscriptionId: demandeId },
                    include: [
                        {
                            model: Parcours, as: 'parcours', include: [
                                Parcours.associations.niveauEtude,
                                {
                                    model: PrerequisParcours, as: 'prerequisParcours', include: [
                                        PrerequisParcours.associations.parcours,
                                        PrerequisParcours.associations.matierePrerequis,
                                        PrerequisParcours.associations.niveauEtude
                                    ]
                                }
                            ]
                        },
                        {
                            model: PrerequisParcoursChoisi, as: 'prerequisParcoursChoisis', include: [
                                {
                                    model: PrerequisParcours, as: 'prerequisParcours', include: [
                                        PrerequisParcours.associations.parcours,
                                        PrerequisParcours.associations.matierePrerequis,
                                        PrerequisParcours.associations.niveauEtude
                                    ]
                                }
                            ]
                        }
                    ]
                })
            ]);

            // ── 3. Cours du parcours (séparé de la requête parcours pour éviter la multiplication) ──
            const parcoursIds = [...new Set(parcoursChoisis.map(pc => pc.parcoursId).filter((id): id is number => id != null))];
            if (parcoursIds.length > 0) {
                const coursParParcours = await Cours.findAll({ where: { parcoursId: { [Op.in]: parcoursIds } } });
                for (const pc of parcoursChoisis) {
                    (pc.parcours as any)?.setDataValue('cours', coursParParcours.filter(c => c.parcoursId == pc.parcoursId));
                }
            }

            // ── 4. Assemblage du DTO en mémoire ─────────────────────────────────
            (demandeInscription as any).setDataValue('coursChoisis', coursChoisis);
            // `cours` (belongsToMany) se déduit de la même table de liaison que coursChoisis
            (demandeInscription as any).setDataValue('cours', coursChoisis.map(cc => (cc as any).cours).filter(c => c != null));
            (demandeInscription as any).setDataValue('dossiersDemande', dossiersDemande);
            (demandeInscription as any).setDataValue('paiementsInscription', paiementsInscription);
            (demandeInscription as any).setDataValue('parcoursChoisis', parcoursChoisis);

            const session = (demandeInscription as any).session;
            if (session) {
                session.setDataValue('dossiersInscription', sessionDossiersInscription);
                session.setDataValue('fraisInscription', sessionFraisInscription);
            }

            return res.status(200).send(demandeInscription);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getDemandeInscriptionFromPaiement(req: Request, res: Response): Promise<Response> {
        // console.log(req.params)
        let options: FindOptions<InferAttributes<DemandeInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = {
                where: { matricule: req.params.matricule, utilisateurId: (req as any).utilisateurId },
                include: [
                    {
                        association: DemandeInscription.associations.utilisateur, include: [{
                            model: Apprenant, as: 'apprenant'
                        }]
                    },]
            }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION || (req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            options = {
                where: { matricule: req.params.matricule },
                include: [
                    {
                        association: DemandeInscription.associations.utilisateur, include: [{
                            model: Apprenant, as: 'apprenant'
                        }]
                    },
                ]
            }
        }

        try {
            const demandeInscription: DemandeInscription | null = await DemandeInscription.findOne(options);

            if (demandeInscription == null)
                return res.status(404).json({ success: false, message: "Demande non trouvée" });

            return res.status(200).send(demandeInscription);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getFichePaiement(req: Request, res: Response): Promise<void> {
        const demande = await DemandeInscription.findByPk(req.params.id, {
            include: [
                { association: DemandeInscription.associations.utilisateur },
                { association: DemandeInscription.associations.session, include: [Session.associations.fraisInscription] },
                { association: DemandeInscription.associations.coursChoisis, include: [{ association: DemandeInscriptionCours.associations.cours }] },
                { association: DemandeInscription.associations.paiementsInscription },
            ]
        })

        if (!demande) {
            res.status(404).json({ success: false, message: "Demande non trouvée" })
            return
        }

        const etudiantNom = demande.utilisateur ? `${demande.utilisateur.nom} ${demande.utilisateur.prenoms}` : 'Étudiant'
        const frais = demande.session?.fraisInscription || []
        const coursChoisis = demande.coursChoisis || []

        const filename = DocumentPDFGenerator.generateFichePaiement(
            demande.id!,
            etudiantNom,
            demande.matricule,
            frais.map(f => ({ titre: f.titre, montant: f.montant, fraisDesCours: f.fraisDesCours })),
            [],
            (demande.paiementsInscription || []).reduce((sum, p) => sum + (p.montant || 0), 0),
            "public/inscription/bordereaux/"
        )

        ArchiveGedService.archiverDepuisFichier({
            fichierSource: `public/inscription/bordereaux/${filename}`,
            domaineCode: 'FIN',
            typeDocumentCode: 'bordereau',
            processusCode: 'BORDEREAU',
            processusLibelle: 'Bordereau de paiement',
            processusModule: 'finance',
            titre: `Fiche de paiement - ${demande.id}`,
            dossierGed: 'Bordereaux de paiement',
            sourceType: 'genere_application',
            confidentialite: 'confidentiel',
            cycleVie: 'courant',
        }).catch(err => console.error("Erreur archivage fiche de paiement:", err))

        const filePath = path.resolve(process.cwd(), 'public/inscription/bordereaux/', filename)
        if (!fs.existsSync(filePath)) {
            res.status(500).json({ success: false, message: "Erreur lors de la génération du fichier" })
            return
        }

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`)
        const stream = fs.createReadStream(filePath)
        stream.pipe(res)
    }

    static async createDemandeInscription(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<DemandeInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { where: { sessionId: req.body.sessionId, utilisateurId: (req as any).utilisateurId } }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let demandeInscription: DemandeInscription | null = await DemandeInscription.findOne(options);
        if (demandeInscription == null) {
            let demandeInscription: DemandeInscription = new DemandeInscription();
            demandeInscription.dateDemande = req.body.dateDemande
            demandeInscription.sessionId = req.body.sessionId
            demandeInscription.matricule = IDGenerator.getInstance().generateInscriptionMatricule()
            demandeInscription.utilisateurId = (req as any).utilisateurId

            await demandeInscription.save()
                .then(async (demandeInscription) => {
                    EmailSender.getInstance().sendConfirmationDemandeInscription((req as any).utilisateurIdentifiant, (req as any).utilisateurEmail)
                    // .then(async () => {
                    //     return res.status(201).send({success: true});
                    // })
                    // .catch((error) => {
                    //     return res.status(400).json({ success: false, error: error });
                    // });
                    return res.status(201).send(demandeInscription);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(400).json({ alreadySignUp: true });
        }

        return null
    }

    static async createDemandeInscriptionCours(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole
        // Seuls l'apprenant (choix des cours) et l'institution (saisie à sa place) peuvent ajouter des cours.
        // Les cours obligatoires comme les facultatifs sont acceptés automatiquement (etat = VALIDE).
        if (role != RolesUtilisateur.APPRENANT && role != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        const demande = await DemandeInscription.findByPk(req.params.id, {
            include: [
                { association: DemandeInscription.associations.preInscription },
                { association: DemandeInscription.associations.cours },
                { association: DemandeInscription.associations.coursChoisis },
            ]
        })
        if (!demande) {
            return res.status(404).json({ success: false, message: "Demande non trouvée" })
        }
        if (!demande.preInscription || demande.preInscription.statut != EtatPreInscription.VALIDE) {
            return res.status(400).json({ success: false, message: "La préinscription doit d'abord être validée" })
        }

        let options: FindOptions<InferAttributes<DemandeInscriptionCours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { where: { coursId: req.body.coursId, demandeInscriptionId: req.params.id } }
        }

        let demandeInscriptionCours: DemandeInscriptionCours | null = await DemandeInscriptionCours.findOne(options);
        if (demandeInscriptionCours == null) {
            let demandeInscriptionCours: DemandeInscriptionCours = new DemandeInscriptionCours();
            demandeInscriptionCours.coursId = Number(req.body.coursId)
            demandeInscriptionCours.demandeInscriptionId = Number(req.params.id)
            demandeInscriptionCours.etat = EtatsCoursChoisi.VALIDE

            await demandeInscriptionCours.save()
                .then(async () => {
                    // L'apprenant ne choisit que les cours facultatifs : les cours obligatoires
                    // du parcours final sont ajoutés automatiquement (acceptés en VALIDE).
                    const dejaChoisis = new Set((demande.coursChoisis || []).map(cc => cc.coursId))
                    dejaChoisis.add(Number(req.body.coursId))
                    const obligatoiresManquants = (demande.cours || [])
                        .filter(c => c.estObligatoire && !dejaChoisis.has(c.id))
                        .map(c => ({ coursId: c.id, demandeInscriptionId: demande.id, etat: EtatsCoursChoisi.VALIDE }))
                    if (obligatoiresManquants.length > 0) {
                        await DemandeInscriptionCours.bulkCreate(obligatoiresManquants)
                    }
                    return res.status(201).send({ success: true });
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(400).json({ alreadySignUp: true });
        }

        return null
    }

    static async updateDemandeInscriptionCours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<DemandeInscriptionCours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { coursId: req.body.coursId, demandeInscriptionId: req.params.id } }
        }
        else {
            return res.status(403).json({ success: false })
        }

        let demandeInscriptionCours: DemandeInscriptionCours | null = await DemandeInscriptionCours.findOne(options);
        if (demandeInscriptionCours != null) {
            await demandeInscriptionCours.update({
                etat: req.body.etat ?? EtatsCoursChoisi.ENCOURS
            })
                .then(async () => {
                    return res.status(200).send(demandeInscriptionCours);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: 'DemandeInscriptionCours non trouvé' });
        }

        return null
    }

    static async validerDemandeInscription(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        const demandeInscription = await DemandeInscription.findByPk(req.params.id, {
            include: [
                { association: DemandeInscription.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] },
                { association: DemandeInscription.associations.parcoursChoisis, include: [{ association: ParcoursChoisi.associations.parcours }] },
                { association: DemandeInscription.associations.preInscription },
                { association: DemandeInscription.associations.session, include: [Session.associations.dossiersInscription, Session.associations.fraisInscription, Session.associations.anneeAcademique] },
                { association: DemandeInscription.associations.dossiersDemande },
                { association: DemandeInscription.associations.cours, include: [Cours.associations.classe] },
                { association: DemandeInscription.associations.coursChoisis },
                DemandeInscription.associations.paiementsInscription,
                DemandeInscription.associations.reponseInscription,
            ]
        })

        if (!demandeInscription) {
            return res.status(404).json({ success: false, message: "Demande non trouvée" })
        }

        // Vérifier info personnelles
        if (!demandeInscription.utilisateur?.apprenant) {
            return res.status(400).json({ success: false, message: "Les informations personnelles ne sont pas complètes" })
        }

        // Vérifier parcours choisis + reponseInscription + choixFinal
        if (!demandeInscription.parcoursChoisis || demandeInscription.parcoursChoisis.length == 0) {
            return res.status(400).json({ success: false, message: "Aucun parcours choisi" })
        }
        if (!demandeInscription.reponseInscription) {
            return res.status(400).json({ success: false, message: "La réponse de l'institution n'a pas été envoyée" })
        }
        const hasFinalParcours = !!getParcoursFinal(demandeInscription.parcoursChoisis)
        if (!hasFinalParcours) {
            return res.status(400).json({ success: false, message: "Aucun parcours final sélectionné" })
        }

        // Vérifier documents uploadés
        const dossiersRequis = demandeInscription.session?.dossiersInscription || []
        const dossiersUploades = demandeInscription.dossiersDemande || []
        if (dossiersRequis.length > 0 && dossiersUploades.length != dossiersRequis.length) {
            return res.status(400).json({ success: false, message: "Tous les documents requis doivent être téléversés" })
        }

        // Vérifier préinscription validée
        if (!demandeInscription.preInscription || demandeInscription.preInscription.statut != EtatPreInscription.VALIDE) {
            return res.status(400).json({ success: false, message: "La préinscription doit être validée" })
        }

        // Vérifier cours choisis
        // Règle métier : les cours obligatoires sont acceptés automatiquement, l'étudiant
        // choisit ses cours facultatifs (créés directement en VALIDE). Aucune validation
        // par l'institution n'est requise sur les cours.
        const parcoursFinal = getParcoursFinal(demandeInscription.parcoursChoisis)
        if (parcoursFinal && parcoursFinal.parcoursId) {
            const coursParcours = demandeInscription.cours || []
            const coursObligatoires = coursParcours.filter(c => c.estObligatoire)
            if (coursObligatoires.length > 0) {
                const coursChoisisIds = (demandeInscription.coursChoisis || []).map(cc => cc.coursId)
                const tousObligatoiresChoisis = coursObligatoires.every(c => coursChoisisIds.includes(c.id))
                if (!tousObligatoiresChoisis) {
                    return res.status(400).json({ success: false, message: "Tous les cours obligatoires doivent être choisis" })
                }
            }
        }

        // Vérifier paiements
        const fraisTotal = (demandeInscription.session?.fraisInscription || []).reduce((sum, f) => sum + f.montant, 0)
        const fraisPayes = (demandeInscription.paiementsInscription || []).reduce((sum, p) => sum + (p.montant || 0), 0)
        if (fraisPayes < fraisTotal) {
            return res.status(400).json({ success: false, message: "Les frais d'inscription ne sont pas entièrement payés" })
        }

        // Vérifier capacité de la classe
        const classeId = req.body.cursusApprenant?.classeId
        if (classeId) {
            const classe = await Classe.findByPk(classeId)
            if (classe && classe.capaciteMax) {
                const inscrits = await CursusApprenant.count({
                    where: {
                        classeId,
                        parcoursId: parcoursFinal?.parcoursId || req.body.cursusApprenant?.parcoursId,
                        anneeAcademiqueId: req.body.cursusApprenant?.anneeAcademiqueId
                    }
                })
                if (inscrits >= classe.capaciteMax) {
                    return res.status(400).json({
                        success: false,
                        message: `La classe ${classe.libelle} a atteint sa capacité maximale (${classe.capaciteMax} étudiants)`
                    })
                }
            }
        }

        // Tout est ok, valider
        await demandeInscription.update({
            dateValidation: req.body.dateValidation ?? new Date(),
        })

        // INSC-1.1: Génération auto écriture comptable inscription (Débit 411 / Crédit 702100)
        if (fraisTotal > 0) {
            await creerEcritureComptable({
                req,
                journalCode: 'VEN',
                compteDebitNumero: '411',
                compteCreditNumero: '702100',
                montant: fraisTotal,
                libelle: `Frais d'inscription - ${demandeInscription.matricule}`,
                reference: demandeInscription.matricule,
                moduleSource: 'inscription',
                referenceModuleId: String(demandeInscription.id)
            })
        }

        if (demandeInscription.utilisateur) {
            const parcoursChoisiFinal = getParcoursFinal(demandeInscription.parcoursChoisis)
            const cursusApprenant = new CursusApprenant()
            cursusApprenant.externe = false
            cursusApprenant.parcoursId = parcoursChoisiFinal?.parcoursId || req.body.cursusApprenant?.parcoursId
            cursusApprenant.classeId = req.body.cursusApprenant?.classeId
            cursusApprenant.anneeAcademiqueId = req.body.cursusApprenant?.anneeAcademiqueId
            cursusApprenant.niveauEtudeId = parcoursChoisiFinal?.parcours?.niveauEtudeId || req.body.cursusApprenant?.niveauEtudeId
            cursusApprenant.utilisateurId = demandeInscription.utilisateurId
            cursusApprenant.demandeInscriptionId = demandeInscription.id

            const savedCursus = await cursusApprenant.save()

            // Générer le matricule final: ESA-AAAA-PP-FFFF-CODE
            const classeMatricule = req.body.cursusApprenant?.classeId
                ? await Classe.findByPk(req.body.cursusApprenant.classeId)
                : null
            const anneeLibelle = demandeInscription.session?.anneeAcademique?.libelle || new Date().getFullYear().toString()
            const matriculeFinal = IDGenerator.getInstance().generateMatriculeFinal(
                parcoursChoisiFinal?.parcours!,
                anneeLibelle,
                classeMatricule
            )
            await demandeInscription.update({ matricule: matriculeFinal })

            const codeQR = JSON.stringify({ matricule: matriculeFinal, utilisateurId: demandeInscription.utilisateurId })
            const dossierEtudiant = new DossierEtudiant()
            dossierEtudiant.utilisateurId = demandeInscription.utilisateurId
            dossierEtudiant.matricule = matriculeFinal
            dossierEtudiant.codeQR = codeQR
            dossierEtudiant.statut = 'actif'
            dossierEtudiant.fraisScolarite = req.body.dossierEtudiant?.fraisScolarite ?? fraisTotal
            dossierEtudiant.modePaiement = req.body.dossierEtudiant?.modePaiement ?? 'mensuel'
            dossierEtudiant.nbMensualites = req.body.dossierEtudiant?.nbMensualites ?? 10
            dossierEtudiant.demarrageParcours = req.body.dossierEtudiant?.demarrageParcours ?? new Date()
            await dossierEtudiant.save()

            // Générer la carte étudiant avec QR code
            try {
              const user = demandeInscription.utilisateur as any
              const apprenant = user.apprenant
              const cartePath = await GenerateurCarteService.generer({
                nom: user.nom,
                prenom: user.prenoms,
                matricule: matriculeFinal,
                dateNaissance: String(apprenant?.dateNaissance || ''),
                photo: dossierEtudiant.photo || undefined,
                classe: savedCursus.classe?.libelle || req.body.cursusApprenant?.classeLibelle || '',
                filiere: parcoursChoisiFinal?.parcours?.titre || '',
                anneeAcademique: savedCursus.anneeAcademique?.libelle || req.body.cursusApprenant?.anneeAcademiqueLibelle || '',
                email: demandeInscription.utilisateur.email,
                utilisateurId: demandeInscription.utilisateurId,
              })
              await dossierEtudiant.update({ cartePath, carteGeneree: true })
            } catch (cardError) {
              console.error('Erreur generation carte etudiant:', cardError)
            }

            if (demandeInscription.coursChoisis) {
                for (const coursChoisi of demandeInscription.coursChoisis) {
                    if (coursChoisi.etat == EtatsCoursChoisi.VALIDE) {
                        const coursParticipant = new CoursParticipant()
                        coursParticipant.coursId = coursChoisi.coursId
                        coursParticipant.utilisateurId = demandeInscription.utilisateurId
                        coursParticipant.cursusApprenantId = savedCursus.id
                        await coursParticipant.save()
                    }
                }
            }

            try {
                const apprenant = demandeInscription.utilisateur.apprenant
                if (apprenant) {
                    const infoParents = await apprenant.get('informationsParents')
                    if (infoParents) {
                        const generatePassword = () => crypto.randomBytes(6).toString('hex')
                        const createParentAccount = async (email: string, nomComplet: string) => {
                            if (!email) return
                            const existing = await Utilisateur.findOne({ where: { email } })
                            if (existing) return
                            const nameParts = (nomComplet || '').trim().split(/\s+/)
                            const nom = nameParts[0] || 'Parent'
                            const prenoms = nameParts.slice(1).join(' ') || 'Inconnu'
                            const motDePasse = generatePassword()
                            const identifiant = email
                            const newUser = await Utilisateur.create({
                                nom,
                                prenoms,
                                identifiant,
                                email,
                                motDePasse: bcrypt.hashSync(motDePasse, 12),
                                role: RolesUtilisateur.PARENT,
                                contact: ''
                            })
                            const { ParentEnfant } = await import('../../parent/models/ParentEnfant')
                            await ParentEnfant.create({
                                parentUtilisateurId: newUser.id,
                                apprenantId: apprenant.id
                            })
                            EmailSender.getInstance().sendParentWelcome(email, identifiant, motDePasse, nomComplet)
                                .catch(err => console.error('Erreur envoi email parent:', err))
                        }
                        await createParentAccount(infoParents.emailPere || '', infoParents.nomPrenomsPere || '')
                        await createParentAccount(infoParents.emailMere || '', infoParents.nomPrenomsMere || '')
                    }
                }
            } catch (parentError) {
                console.error('Erreur création compte parent:', parentError)
            }

            EmailSender.getInstance().sendValidationDemandeInscription(
                demandeInscription.utilisateur.identifiant,
                demandeInscription.utilisateur.email
            )

            if (demandeInscription.dossiersDemande) {
                for (const dossier of demandeInscription.dossiersDemande) {
                    await ArchiveGedService.archiverDocumentInscription(
                        Number(demandeInscription.id),
                        dossier.nomFichier,
                        {
                            titre: `Dossier inscription - ${demandeInscription.matricule}`,
                            anneeAcademiqueId: Number(savedCursus.anneeAcademiqueId!),
                            parcoursId: Number(savedCursus.parcoursId),
                            niveauEtudeId: Number(savedCursus.niveauEtudeId),
                            classeId: savedCursus.classeId ? Number(savedCursus.classeId) : undefined,
                            cursusApprenantId: Number(savedCursus.id)
                        }
                    )
                }
            }
        }

        return res.status(200).send(demandeInscription)
    }

    static async deleteDemandeInscription(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<DemandeInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let demandeInscription: DemandeInscription | null = await DemandeInscription.findOne({ where: { id: req.params.id } });
        if (demandeInscription) {
            await demandeInscription.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Demande supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Demande non trouvée" });
        }

        return null
    }

    static async batchStatut(req: Request, res: Response): Promise<Response> {
        const { ids, action, commentaire } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "IDs requis" });
        }

        if (!['valider', 'rejeter'].includes(action)) {
            return res.status(400).json({ success: false, message: "Action invalide" });
        }

        const transaction = await DatabaseConnection.getInstance().sequelize.transaction();

        try {
            let count = 0;
            for (const id of ids) {
                const demande = await DemandeInscription.findByPk(id, {
                    include: [DemandeInscription.associations.preInscription],
                    transaction
                });

                if (!demande || !demande.preInscription) continue;

                if (action === 'valider') {
                    await demande.preInscription.update({ statut: EtatPreInscription.VALIDE }, { transaction });
                } else if (action === 'rejeter') {
                    await demande.preInscription.update({
                        statut: 'rejete',
                        commentaire: commentaire || null
                    }, { transaction });
                }
                count++;
            }

            await transaction.commit();
            return res.status(200).json({ success: true, count });
        } catch (error) {
            await transaction.rollback();
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<DemandeInscription>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await DemandeInscription.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}