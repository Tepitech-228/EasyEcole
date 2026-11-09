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
import HikvisionEnrollmentService from "../services/HikvisionEnrollmentService";
import { creerEcritureComptable } from "../../comptabilite/helpers/ComptabiliteHelper";
import { Etablissement } from "../../etablissement/models/Etablissement";
import { SiteUtilisateur } from "../../auth/models/SiteUtilisateur";
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const getSiteScope = (req: Request): number | null | undefined => {
    if (req.utilisateurRole === RolesUtilisateur.ADMIN) return null;
    const etablissementId = Number(req.etablissementId);
    return Number.isSafeInteger(etablissementId) && etablissementId > 0 ? etablissementId : undefined;
};

const getReadSiteScope = (req: Request): number | null | undefined => {
    if (req.utilisateurRole === RolesUtilisateur.APPRENANT) return null;
    return getSiteScope(req);
};

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

    static async soumettreDemande(req: Request, res: Response): Promise<Response> {
        if (req.utilisateurRole !== RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false, message: "Seul l'apprenant peut soumettre sa demande." });
        }

        try {
            const demandeId = Number(req.params.id);
            if (!Number.isSafeInteger(demandeId) || demandeId <= 0) {
                return res.status(400).json({ success: false, message: "Identifiant de demande invalide." });
            }

            const demande = await DemandeInscription.findOne({
                where: { id: demandeId, utilisateurId: req.utilisateurId }
            });
            if (!demande) {
                return res.status(404).json({ success: false, message: "Demande d'inscription introuvable." });
            }

            const [parcoursChoisi, dossiersRequis, dossiersDeposes] = await Promise.all([
                ParcoursChoisi.findOne({ where: { demandeInscriptionId: demandeId } }),
                DossierInscription.findAll({
                    where: { sessionId: demande.sessionId },
                    attributes: ['id']
                }),
                DemandeInscriptionDossier.findAll({
                    where: { demandeId },
                    attributes: ['dossierId']
                })
            ]);
            if (!parcoursChoisi && demande.modeFormation !== 'en_ligne') {
                return res.status(400).json({ success: false, message: "Veuillez d'abord choisir une filière." });
            }

            const dossiersDeposesIds = new Set(dossiersDeposes.map(dossier => Number(dossier.dossierId)));
            const documentsManquants = dossiersRequis.filter(
                dossier => !dossiersDeposesIds.has(Number(dossier.id))
            );
            if (documentsManquants.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Veuillez téléverser tous les documents requis avant de soumettre la demande.",
                    documentsManquants: documentsManquants.map(dossier => dossier.id)
                });
            }

            if (demande.statutPipeline === 'soumis') {
                return res.status(409).json({
                    success: false,
                    message: "Cette demande a déjà été soumise. Merci de patienter pendant son traitement.",
                    alreadySubmitted: true,
                });
            }
            if (demande.statutPipeline && !['soumis', 'correction_demandee'].includes(demande.statutPipeline)) {
                return res.status(409).json({ success: false, message: "Cette demande ne peut plus être soumise à cette étape." });
            }

            const apprenant = await Apprenant.findOne({
                where: { utilisateurId: req.utilisateurId },
                attributes: ['photo'],
            });
            if (!apprenant?.photo) {
                return res.status(400).json({
                    success: false,
                    message: "Veuillez ajouter une photo à votre profil avant de soumettre la demande.",
                });
            }

            const matriculeEtudiant = typeof req.body?.matriculeEtudiant === 'string'
                ? req.body.matriculeEtudiant.trim()
                : '';
            if (demande.typeDemande !== 'reinscription' && (!matriculeEtudiant || matriculeEtudiant.length > 64 || /[\u0000-\u001f]/.test(matriculeEtudiant))) {
                return res.status(400).json({ success: false, message: "Veuillez saisir un matricule étudiant valide (64 caractères maximum)." });
            }
            if (matriculeEtudiant) {
                const dossierAvecMatricule = await DossierEtudiant.findOne({
                    where: { matricule: matriculeEtudiant, utilisateurId: { [Op.ne]: req.utilisateurId } },
                    paranoid: false,
                });
                if (dossierAvecMatricule) {
                    return res.status(409).json({ success: false, message: "Ce matricule étudiant est déjà attribué." });
                }
                const autreDemande = await DemandeInscription.findOne({
                    where: {
                        matriculeEtudiant,
                        utilisateurId: { [Op.ne]: req.utilisateurId },
                    },
                });
                if (autreDemande) {
                    return res.status(409).json({ success: false, message: "Ce matricule étudiant est déjà utilisé par une autre demande." });
                }
            }

            await demande.update({
                ...(matriculeEtudiant ? { matriculeEtudiant } : {}),
                statutPipeline: 'soumis',
                soumissionComite: false,
                motifPipeline: null
            });
            let hikvisionEnrollmentQueued = false;
            let hikvisionEnrollmentWarning: string | undefined;
            const etablissementId = Number(demande.etablissementId);
            if (Number.isSafeInteger(etablissementId) && etablissementId > 0) {
                try {
                    const queuedCount = await HikvisionEnrollmentService.enqueueStudent(
                        Number(demande.utilisateurId),
                        etablissementId,
                        matriculeEtudiant,
                        demande.consentementHikvisionAt ?? null
                    );
                    hikvisionEnrollmentQueued = queuedCount > 0;
                    if (hikvisionEnrollmentQueued) {
                        setImmediate(() => {
                            void HikvisionEnrollmentService.processPending().catch(error => {
                                console.error(
                                    `[Hikvision] Traitement immédiat de l'enrôlement impossible pour l'utilisateur ${demande.utilisateurId}:`,
                                    error,
                                );
                            });
                        });
                    } else {
                        hikvisionEnrollmentWarning = "Aucun terminal de pointage étudiant actif n'est configuré pour ce site.";
                    }
                } catch (error) {
                    console.error(
                        `[Hikvision] Enrôlement non planifié après la soumission de la demande ${demandeId}:`,
                        error,
                    );
                    hikvisionEnrollmentWarning = "Le dossier est soumis, mais l'enrôlement sur la pointeuse n'a pas pu être planifié.";
                }
            } else {
                hikvisionEnrollmentWarning = "Le dossier est soumis, mais aucun site n'est associé pour planifier l'enrôlement sur la pointeuse.";
            }
            return res.status(200).json({
                success: true,
                demandeId,
                statutPipeline: demande.statutPipeline,
                hikvisionEnrollmentQueued,
                ...(hikvisionEnrollmentWarning ? { hikvisionEnrollmentWarning } : {}),
            });
        } catch (error) {
            console.error('[soumettreDemandeInscription]', error);
            return res.status(500).json({ success: false, message: "La demande n'a pas pu être soumise." });
        }
    }

    static async enregistrerConsentementHikvision(req: Request, res: Response): Promise<Response> {
        if (req.utilisateurRole !== RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false, message: "Seul l'étudiant peut donner ou retirer cet accord." });
        }
        if (typeof req.body?.consentement !== "boolean") {
            return res.status(400).json({ success: false, message: "Le choix de consentement est invalide." });
        }
        try {
            const demande = await DemandeInscription.findOne({
                where: { id: req.params.id, utilisateurId: req.utilisateurId }
            });
            if (!demande) return res.status(404).json({ success: false, message: "Demande d'inscription introuvable." });
            await demande.update({
                consentementHikvisionAt: req.body.consentement ? new Date() : null
            });
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error("[Hikvision] Enregistrement du consentement impossible:", error);
            return res.status(500).json({ success: false, message: "Le choix de consentement n'a pas pu être enregistré." });
        }
    }

    static async getAllDemandesInscription(req: Request, res: Response): Promise<Response> {
        const siteScope = getReadSiteScope(req);
        if (siteScope === undefined) {
            return res.status(403).json({ success: false, message: "Aucun site actif sélectionné" });
        }

        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const offset = (page - 1) * limit;

        let where: any = {};
        if (siteScope !== null) where.etablissementId = siteScope;
        let include: any[] = [
            { association: DemandeInscription.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] },
            DemandeInscription.associations.reponseInscription
        ];

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            where.utilisateurId = (req as any).utilisateurId;
        }

        // Filtre par typeDemande (ex: ?type=reinscription)
        if (req.query.type === 'reinscription') {
            where.typeDemande = 'reinscription'
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
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getDemandeInscription(req: Request, res: Response): Promise<Response> {
        const siteScope = getReadSiteScope(req);
        if (siteScope === undefined) {
            return res.status(403).json({ success: false, message: "Aucun site actif sélectionné" });
        }

        const isApprenant = (req as any).utilisateurRole == RolesUtilisateur.APPRENANT;
        const where: any = isApprenant
            ? { id: req.params.id, utilisateurId: (req as any).utilisateurId }
            : { id: req.params.id };
        if (siteScope !== null) where.etablissementId = siteScope;

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
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
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
        else if (
            (req as any).utilisateurRole == RolesUtilisateur.INSTITUTION
            || (req as any).utilisateurRole == RolesUtilisateur.ESA_COMPTA
        ) {
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
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
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
            uploaderId: Number((req as any)?.utilisateurId) || undefined,
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
        let demandeSiteId: number | undefined
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            let submittedSiteId = Number(req.body?.etablissementId);
            const sessionId = Number(req.body?.sessionId);
            const activeSiteId = Number(req.etablissementId);

            if (!Number.isSafeInteger(sessionId) || sessionId <= 0) {
                return res.status(400).json({ success: false, message: "La session est obligatoire" });
            }
            if (!Number.isSafeInteger(submittedSiteId) || submittedSiteId <= 0) {
                submittedSiteId = activeSiteId;
            }
            if (!Number.isSafeInteger(submittedSiteId) || submittedSiteId <= 0) {
                return res.status(400).json({ success: false, message: "Choisissez votre site d'inscription avant la session." });
            }
            if (
                Number.isSafeInteger(activeSiteId)
                && activeSiteId > 0
                && activeSiteId !== submittedSiteId
            ) {
                return res.status(403).json({ success: false, message: "Le site choisi ne correspond pas au site actif." });
            }
            const session = await Session.findOne({
                where: { id: sessionId },
                attributes: ['id', 'etablissementId', 'anneeAcademiqueId', 'dateDebut', 'dateFin']
            });
            if (!session) {
                return res.status(404).json({ success: false, message: "Session non trouvée" });
            }
            const maintenant = Date.now();
            if (
                !session.dateDebut
                || !session.dateFin
                || new Date(session.dateDebut).getTime() > maintenant
                || new Date(session.dateFin).getTime() < maintenant
            ) {
                return res.status(400).json({ success: false, message: "Cette session d'inscription n'est pas ouverte." });
            }

            if (session.anneeAcademiqueId) {
                const demandesExistantes = await DemandeInscription.findAll({
                    where: {
                        utilisateurId: (req as any).utilisateurId,
                        etablissementId: submittedSiteId,
                    },
                    attributes: ['id', 'sessionId'],
                });

                const demandesExistantesArray = Array.isArray(demandesExistantes) ? demandesExistantes : [];
                const idsSessions = demandesExistantesArray
                    .map(demande => Number(demande.sessionId))
                    .filter((id): id is number => Number.isSafeInteger(id) && id > 0);

                if (idsSessions.length > 0) {
                    const sessionsMemeAnnee = await Session.findAll({
                        where: {
                            id: { [Op.in]: idsSessions },
                            anneeAcademiqueId: Number(session.anneeAcademiqueId),
                        },
                        attributes: ['id'],
                    });

                    const sessionsMemeAnneeArray = Array.isArray(sessionsMemeAnnee) ? sessionsMemeAnnee : [];
                    if (sessionsMemeAnneeArray.length > 0) {
                        return res.status(400).json({
                            alreadySignUp: true,
                            message: "Vous avez déjà une inscription dans cette session."
                        });
                    }
                }
            }

            const affectations = await SiteUtilisateur.findAll({
                where: { utilisateurId: (req as any).utilisateurId },
                attributes: ["etablissementId"],
            });
            const estAffecteAuSite = affectations.some(
                affectation => Number(affectation.etablissementId) === submittedSiteId
            );
            if (affectations.length > 0 && !estAffecteAuSite) {
                return res.status(403).json({ success: false, message: "Vous n'êtes pas affecté à ce site." });
            }
            const site = await Etablissement.findOne({
                where: { id: submittedSiteId, actif: true },
                attributes: ["id"],
            });
            if (!site) {
                return res.status(400).json({ success: false, message: "L'établissement choisi est indisponible." });
            }

            await SiteUtilisateur.findOrCreate({
                where: { utilisateurId: req.utilisateurId!, etablissementId: submittedSiteId },
                defaults: { utilisateurId: req.utilisateurId!, etablissementId: submittedSiteId }
            });
            demandeSiteId = submittedSiteId
            options = { where: { sessionId: req.body.sessionId, utilisateurId: (req as any).utilisateurId } }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION || (req as any).utilisateurRole == RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        if ((req as any).utilisateurRole !== RolesUtilisateur.APPRENANT) {
            const siteScope = getSiteScope(req);
            if (siteScope === undefined) {
                return res.status(403).json({ success: false, message: "Aucun site actif sélectionné" });
            }
        }

        const modeFormationBody = req.body?.modeFormation;
        if (
            modeFormationBody !== undefined
            && modeFormationBody !== 'presentiel'
            && modeFormationBody !== 'en_ligne'
        ) {
            return res.status(400).json({ success: false, message: "Mode de formation invalide (presentiel ou en_ligne)." });
        }
        const modeFormation: 'presentiel' | 'en_ligne' = modeFormationBody === 'en_ligne' ? 'en_ligne' : 'presentiel';

        let demandeInscription: DemandeInscription | null = await DemandeInscription.findOne(options);
        if (demandeInscription == null) {
            let demandeInscription: DemandeInscription = new DemandeInscription();
            demandeInscription.dateDemande = req.body.dateDemande
            demandeInscription.sessionId = req.body.sessionId
            demandeInscription.modeFormation = modeFormation
            if (demandeSiteId !== undefined) demandeInscription.etablissementId = demandeSiteId
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

    /**
     * PUT /inscription/demandesInscription/:id/mode-formation
     * Body : { modeFormation: 'presentiel' | 'en_ligne' }
     *
     * Permet à l'apprenant de basculer sa demande entre présentiel et
     * e-learning AVANT la transmission au comité (statut null, 'soumis' ou
     * 'correction_demandee'). Le mode est figé dès que la demande entre dans
     * le pipeline de validation collégiale.
     */
    static async updateModeFormation(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false, message: "Seul l'apprenant peut modifier le mode de sa demande." });
        }

        const demandeId = Number(req.params.id);
        if (!Number.isSafeInteger(demandeId) || demandeId <= 0) {
            return res.status(400).json({ success: false, message: "Identifiant de demande invalide." });
        }

        const modeFormation = req.body?.modeFormation;
        if (modeFormation !== 'presentiel' && modeFormation !== 'en_ligne') {
            return res.status(400).json({ success: false, message: "Mode de formation invalide (presentiel ou en_ligne)." });
        }

        try {
            const demande = await DemandeInscription.findOne({
                where: { id: demandeId, utilisateurId: (req as any).utilisateurId },
            });
            if (!demande) {
                return res.status(404).json({ success: false, message: "Demande d'inscription introuvable." });
            }

            if (demande.statutPipeline && !['soumis', 'correction_demandee'].includes(demande.statutPipeline)) {
                return res.status(409).json({
                    success: false,
                    message: "Le mode de formation est verrouillé : la demande est déjà engagée dans la validation.",
                });
            }

            if (demande.modeFormation !== modeFormation) {
                await demande.update({ modeFormation });
            }

            return res.status(200).json({ success: true, modeFormation });
        } catch (error) {
            console.error('[updateModeFormation]', error);
            return res.status(500).json({ success: false, message: "Le mode de formation n'a pas pu être mis à jour." });
        }
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
                { association: DemandeInscription.associations.coursChoisis },
                { association: DemandeInscription.associations.parcoursChoisis },
            ]
        })
        if (!demande) {
            return res.status(404).json({ success: false, message: "Demande non trouvée" })
        }
        if (!demande.preInscription || demande.preInscription.statut != EtatPreInscription.VALIDE) {
            return res.status(400).json({ success: false, message: "La préinscription doit d'abord être validée" })
        }

        // Cours obligatoires du parcours final : ils sont ajoutés automatiquement,
        // l'étudiant ne choisit que les cours facultatifs (qui restent optionnels).
        const parcoursChoisis = (demande.parcoursChoisis || []).filter(pc => pc.parcoursId != null)
        const parcoursFinal = getParcoursFinal(parcoursChoisis)
        const parcoursIds = parcoursFinal?.parcoursId != null
            ? [parcoursFinal.parcoursId]
            : parcoursChoisis.map(pc => pc.parcoursId as number)
        const coursParcours = parcoursIds.length > 0
            ? await Cours.findAll({ where: { parcoursId: { [Op.in]: parcoursIds } } })
            : []

        const ajouterObligatoires = async (): Promise<void> => {
            const dejaChoisis = new Set((demande.coursChoisis || []).map(cc => cc.coursId))
            const obligatoiresManquants = coursParcours
                .filter(c => c.estObligatoire && !dejaChoisis.has(c.id))
                .map(c => ({ coursId: c.id, demandeInscriptionId: demande.id, etat: EtatsCoursChoisi.VALIDE }))
            if (obligatoiresManquants.length > 0) {
                await DemandeInscriptionCours.bulkCreate(obligatoiresManquants)
            }
        }

        const coursIdRaw = req.body.coursId
        const coursId = coursIdRaw != null && coursIdRaw !== '' ? Number(coursIdRaw) : null

        if (coursId == null || isNaN(coursId)) {
            // L'apprenant ne choisit aucun cours facultatif : on ajoute quand même
            // les cours obligatoires du parcours final, puis on passe à l'étape suivante.
            try {
                await ajouterObligatoires()
                return res.status(201).send({ success: true, skipped: true });
            } catch (error) {
                return res.status(400).json({ success: false, error: error });
            }
        }

        let demandeInscriptionCours: DemandeInscriptionCours | null = await DemandeInscriptionCours.findOne({
            where: { coursId, demandeInscriptionId: Number(req.params.id) }
        });
        if (demandeInscriptionCours == null) {
            let nouveauCoursChoisi: DemandeInscriptionCours = new DemandeInscriptionCours();
            nouveauCoursChoisi.coursId = coursId
            nouveauCoursChoisi.demandeInscriptionId = Number(req.params.id)
            nouveauCoursChoisi.etat = EtatsCoursChoisi.VALIDE

            await nouveauCoursChoisi.save()
                .then(async () => {
                    await ajouterObligatoires()
                    return res.status(201).send({ success: true });
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            // ⚠️ Code distinct de `alreadySignUp` (qui signale « une demande
            // existe déjà pour cette session »). Réutiliser le même code
            // affichait à l'étudiant un message hors sujet sur l'ajout d'un cours.
            return res.status(400).json({ coursDejaChoisi: true });
        }

        return null
    }

    static async updateDemandeInscriptionCours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<DemandeInscriptionCours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION || (req as any).utilisateurRole == RolesUtilisateur.ADMIN) {
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
        try {
            return await DemandeInscriptionController.validerDemandeInscriptionInterne(req, res)
        } catch (error: any) {
            console.error('[validerDemandeInscription]', error)
            if (res.headersSent) return null
            return res.status(500).json({
                success: false,
                message: "Erreur lors de la validation de la demande d'inscription. Veuillez réessayer ou contacter l'administration."
            })
        }
    }

    private static async validerDemandeInscriptionInterne(req: Request, res: Response): Promise<Response | null> {
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

        const matriculeEtudiant = demandeInscription.typeDemande === 'reinscription'
            ? ''
            : String(demandeInscription.matriculeEtudiant || '').trim()
        if (demandeInscription.typeDemande !== 'reinscription' && !matriculeEtudiant) {
            return res.status(400).json({ success: false, message: "Un matricule étudiant doit être renseigné avant la validation du dossier." })
        }
        if (matriculeEtudiant) {
            const dossierAvecMatricule = await DossierEtudiant.findOne({
                where: {
                    matricule: matriculeEtudiant,
                    utilisateurId: { [Op.ne]: demandeInscription.utilisateurId },
                },
                paranoid: false,
            })
            if (dossierAvecMatricule) {
                return res.status(409).json({ success: false, message: "Ce matricule étudiant est déjà attribué à un autre étudiant." })
            }
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
        const dossiersRequisIds = new Set(dossiersRequis.map(dossier => Number(dossier.id)))
        const dossiersUploadesIds = new Set(dossiersUploades.map(dossier => Number(dossier.dossierId)))
        const dossiersManquants = [...dossiersRequisIds].filter(id => !dossiersUploadesIds.has(id))
        if (dossiersManquants.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Des documents requis sont manquants (${dossiersManquants.length})`
            })
        }

        // Vérifier préinscription validée
        if (!demandeInscription.preInscription || demandeInscription.preInscription.statut != EtatPreInscription.VALIDE) {
            return res.status(400).json({ success: false, message: "La préinscription doit être validée" })
        }

        const cursusExistant = await CursusApprenant.findOne({
            where: { demandeInscriptionId: demandeInscription.id }
        })
        if (cursusExistant
            && demandeInscription.matricule
            && /^[0-9]+-[A-Z]+[0-9]?[JS]-[0-9]{2}-[A-Z]+$/.test(demandeInscription.matricule)) {
            const dossierExistant = await DossierEtudiant.findOne({
                where: { matricule: demandeInscription.matricule }
            })
            if (dossierExistant) {
                return res.status(409).json({ success: false, message: "Cette demande d'inscription a déjà été validée" })
            }
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
            cursusApprenant.etablissementId = demandeInscription.etablissementId
                ?? parcoursChoisiFinal?.parcours?.etablissementId
                ?? null
            cursusApprenant.parcoursId = parcoursChoisiFinal?.parcoursId || req.body.cursusApprenant?.parcoursId
            cursusApprenant.classeId = req.body.cursusApprenant?.classeId
            cursusApprenant.anneeAcademiqueId = req.body.cursusApprenant?.anneeAcademiqueId
            cursusApprenant.niveauEtudeId = parcoursChoisiFinal?.parcours?.niveauEtudeId || req.body.cursusApprenant?.niveauEtudeId
            cursusApprenant.utilisateurId = demandeInscription.utilisateurId
            cursusApprenant.demandeInscriptionId = demandeInscription.id

            const savedCursus = await cursusApprenant.save()

            // Générer le matricule final: {ordre}-{filiere}{annee}{typeCours}-{anneeAcademique}-{site}
            const classeMatricule = req.body.cursusApprenant?.classeId
                ? await Classe.findByPk(req.body.cursusApprenant.classeId)
                : null
            const anneeLibelle = demandeInscription.session?.anneeAcademique?.libelle || new Date().getFullYear().toString()

            const etablissement = demandeInscription.etablissementId
                ? await Etablissement.findByPk(demandeInscription.etablissementId)
                : null

            // Une première inscription reprend le matricule proposé par l'étudiant.
            // Les réinscriptions historiques conservent la génération automatique.
            let matriculeFinal = matriculeEtudiant
            let dossierEtudiant: DossierEtudiant | null = null
            const nombreTentatives = matriculeEtudiant ? 1 : 3
            for (let tentative = 1; tentative <= nombreTentatives; tentative++) {
                if (!matriculeEtudiant) {
                    const ordre = await DossierEtudiant.prochainOrdreMatricule()
                    matriculeFinal = IDGenerator.getInstance().generateMatriculeFinal(
                        parcoursChoisiFinal?.parcours!,
                        anneeLibelle,
                        classeMatricule,
                        ordre,
                        etablissement,
                        'jour'
                    )
                }
                await demandeInscription.update({ matricule: matriculeFinal })
                const codeQR = JSON.stringify({ matricule: matriculeFinal, utilisateurId: demandeInscription.utilisateurId })
                const candidat = new DossierEtudiant()
                candidat.utilisateurId = demandeInscription.utilisateurId
                candidat.etablissementId = savedCursus.etablissementId
                candidat.matricule = matriculeFinal
                candidat.codeQR = codeQR
                candidat.statut = 'actif'
                candidat.fraisScolarite = req.body.dossierEtudiant?.fraisScolarite ?? fraisTotal
                candidat.modePaiement = req.body.dossierEtudiant?.modePaiement ?? 'mensuel'
                candidat.nbMensualites = req.body.dossierEtudiant?.nbMensualites ?? 10
                candidat.demarrageParcours = req.body.dossierEtudiant?.demarrageParcours ?? new Date()

                try {
                    await candidat.save()
                    dossierEtudiant = candidat
                    break
                } catch (error: any) {
                    const estConflit = error?.name === 'SequelizeUniqueConstraintError'
                        || error?.parent?.code === 'ER_DUP_ENTRY'
                    if (!estConflit || tentative === nombreTentatives) throw error
                }
            }
            if (!dossierEtudiant) {
                throw new Error(matriculeEtudiant
                    ? "Impossible d'attribuer le matricule étudiant proposé."
                    : 'Impossible de générer un matricule unique après 3 tentatives')
            }
            // Enrôlement facial systématique : indépendant du consentement facultatif.
            if (savedCursus.etablissementId) {
                try {
                    await HikvisionEnrollmentService.enqueueStudent(
                        Number(demandeInscription.utilisateurId),
                        Number(savedCursus.etablissementId),
                        matriculeFinal,
                        demandeInscription.consentementHikvisionAt ?? null
                    )
                } catch (error) {
                    console.error(`[Hikvision] Enrôlement non planifié pour le dossier ${dossierEtudiant.id}:`, error)
                }
            } else {
                console.warn(`[Hikvision] Enrôlement non planifié pour le dossier ${dossierEtudiant.id}: aucun site n'est associé au cursus validé.`)
            }

            // Générer la carte étudiant avec QR code
            try {
              const user = demandeInscription.utilisateur as any
              const apprenant = user.apprenant
              const etablissementCarte = dossierEtudiant.etablissementId
                ? await Etablissement.findByPk(dossierEtudiant.etablissementId)
                : null
              const cartePath = await GenerateurCarteService.generer({
                nom: user.nom,
                prenom: user.prenoms,
                matricule: matriculeFinal,
                dateNaissance: String(apprenant?.dateNaissance || ''),
                photo: apprenant?.photo || dossierEtudiant.photo || undefined,
                classe: savedCursus.classe?.libelle || req.body.cursusApprenant?.classeLibelle || '',
                filiere: parcoursChoisiFinal?.parcours?.titre || '',
                anneeAcademique: savedCursus.anneeAcademique?.libelle || req.body.cursusApprenant?.anneeAcademiqueLibelle || '',
                email: demandeInscription.utilisateur.email,
                utilisateurId: demandeInscription.utilisateurId,
                periode: apprenant?.periode || null,
                site: etablissementCarte?.site || etablissementCarte?.nom || '',
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
                    try {
                        await ArchiveGedService.archiverDocumentInscription(
                            Number(demandeInscription.id),
                            dossier.nomFichier,
                            {
                                titre: `Dossier inscription - ${demandeInscription.matricule}`,
                                anneeAcademiqueId: Number(savedCursus.anneeAcademiqueId!),
                                parcoursId: Number(savedCursus.parcoursId),
                                niveauEtudeId: Number(savedCursus.niveauEtudeId),
                                classeId: savedCursus.classeId ? Number(savedCursus.classeId) : undefined,
                                cursusApprenantId: Number(savedCursus.id),
                                uploaderId: Number((req as any)?.utilisateurId) || undefined
                            }
                        )
                    } catch (gedError) {
                        console.warn('[GED][non-bloquant]', 'archivage dossier inscription', gedError)
                    }
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
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION || (req as any).utilisateurRole == RolesUtilisateur.ADMIN) {
            options = { where: { id: req.params.id } }
        }

        let demandeInscription: DemandeInscription | null = await DemandeInscription.findOne({ where: { id: req.params.id } });
        if (demandeInscription) {
            await demandeInscription.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Demande supprimée" });
                })
                .catch((error) => {
                    console.error('Erreur', error);
                    return res.status(500).json({ success: false, message: 'Erreur interne' });
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
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async updateStatutBoursier(req: Request, res: Response): Promise<Response> {
        try {
            const isApprenant = (req as any).utilisateurRole == RolesUtilisateur.APPRENANT;
            const where: any = isApprenant
                ? { id: req.params.id, utilisateurId: (req as any).utilisateurId }
                : { id: req.params.id };

            const demande = await DemandeInscription.findOne({ where });
            if (!demande) {
                return res.status(404).json({ success: false, message: "Demande non trouvée" });
            }

            const { estBoursier } = req.body;
            const updates: any = {};

            if (typeof estBoursier === 'boolean') {
                updates.estBoursier = estBoursier;
            }

            // Si un fichier a été uploadé via multer → enregistrer le nom
            const fichier: Express.Multer.File | undefined = (req as any).file;
            if (fichier) {
                // Supprimer l'ancien fichier s'il existe
                if (demande.documentBourse) {
                    const oldPath = path.resolve('public', 'inscription', 'dossiers', demande.documentBourse);
                    if (fs.existsSync(oldPath)) {
                        try { fs.unlinkSync(oldPath); } catch (_) { /* best-effort */ }
                    }
                }
                updates.documentBourse = fichier.filename;
            }

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({ success: false, message: "Aucune donnée à mettre à jour" });
            }

            await demande.update(updates);
            return res.status(200).json(demande);
        } catch (error: any) {
            console.error('[updateStatutBoursier]', error);
            return res.status(500).json({ success: false, message: "Erreur lors de la mise à jour du statut boursier" });
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
                console.error('Erreur', error);
                return res.status(500).json({ success: false, message: 'Erreur interne' });
            });

        return null
    }
}