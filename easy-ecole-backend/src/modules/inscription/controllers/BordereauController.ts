import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import fs from "fs";
import path from "path";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { TypesPaiement } from "../../../core/enums/TypesPaiement";
import { Bordereau } from "../models/Bordereau";
import { Echeance } from "../models/Echeance";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Apprenant } from "../../auth/models/Apprenant";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { DemandeInscription } from "../models/DemandeInscription";
import { Quitus } from "../models/Quitus";
import { PaiementInscription } from "../models/PaiementInscription";
import { Session } from "../models/Session";
import { ParcoursChoisi } from "../models/ParcoursChoisi";
import { CursusApprenant } from "../models/CursusApprenant";
import { CoursParticipant } from "../models/CoursParticipant";
import { Cours } from "../models/Cours";
import { RattrapageInscription } from "../models/RattrapageInscription";
import { EtatsCoursChoisi } from "../../../core/enums/EtatsCoursChoisi";
import { Etablissement } from "../../etablissement/models/Etablissement";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { IDGenerator } from "../../../core/helpers/IDGenerator";
import { DocumentPDFGenerator } from "../../../core/helpers/DocumentPDFGenerator";
import { ArchiveGedService } from "../../../core/services/ArchiveGedService";
import { EmailSender } from "../../../core/helpers/EmailSender";
import { creerEcritureComptable } from "../../comptabilite/helpers/ComptabiliteHelper";
import { PreInscription, EtatPreInscription } from "../models/PreInscription";
import { ReponseInscription } from "../models/ReponseInscription";
import { DemandeInscriptionCours } from "../models/DemandeInscriptionCours";
import { DossierStorageService } from "../services/DossierStorageService";
import { FolderAutoService } from "../../ged/services/FolderAutoService";
import { GenerateurCarteService } from "../services/GenerateurCarteService";
import { GenerateurEcheancierService, estModalitePaiement } from "../services/GenerateurEcheancierService";
import { GenerateurEcheancierScolariteService } from "../services/GenerateurEcheancierScolariteService";
import { nombreEcheances } from "../services/GenerateurEcheancierSessionService";
import { ImputationService } from "../services/ImputationService";
import { SnapshotService } from "../services/SnapshotService";
import { TarifService } from "../services/TarifService";
import { DocGenGeneratorService } from "../../docgen/services/DocGenGeneratorService";
import { BordereauDossierService } from "../services/BordereauDossierService";

export const isChoixFinalValue = (value: unknown): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === '1' || normalized === 'true';
    }
    return false;
};

export const hasChoixFinal = (parcoursChoisis?: Array<{ choixFinal?: any; parcoursId?: number | string | null }> | null): boolean => {
    if (!Array.isArray(parcoursChoisis) || parcoursChoisis.length === 0) return false;

    if (parcoursChoisis.length === 1) return true;

    return parcoursChoisis.some(pc => isChoixFinalValue(pc?.choixFinal));
};

export const getParcoursFinal = <T extends { choixFinal?: any; parcoursId?: number | string | null }>(parcoursChoisis?: Array<T> | null): T | undefined => {
    if (!Array.isArray(parcoursChoisis) || parcoursChoisis.length === 0) return undefined;

    const explicit = parcoursChoisis.find(pc => isChoixFinalValue(pc?.choixFinal));
    if (explicit) return explicit;
    if (parcoursChoisis.length === 1) return parcoursChoisis[0];

    return undefined;
};

export default class BordereauController {

    constructor() { }

    static async getAllBordereaux(req: Request, res: Response): Promise<Response> {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const offset = (page - 1) * limit;

        let options: FindOptions<InferAttributes<Bordereau>> = {
            include: [
                { association: Bordereau.associations.echeance, include: [Echeance.associations.dossierEtudiant] },
                Bordereau.associations.utilisateur,
                Bordereau.associations.validePar,
                Bordereau.associations.quitus
            ]
        }

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options.where = { utilisateurId: (req as any).utilisateurId }
        }

        if (req.query.statut) {
            options.where = { ...options.where, statut: req.query.statut as string }
        }

        if (req.query.echeanceId) {
            options.where = { ...options.where, echeanceId: req.query.echeanceId as string }
        }

        if (req.query.type) {
            options.where = { ...options.where, type: req.query.type as string }
        }

        // Filters par année, niveau, parcours
        if (req.query.anneeAcademiqueId || req.query.niveauEtudeId || req.query.parcoursId) {
            const demandeWhere: any = { include: [] as any[] }
            const sessionWhere: any = {}

            if (req.query.anneeAcademiqueId) sessionWhere.anneeAcademiqueId = req.query.anneeAcademiqueId
            if (req.query.niveauEtudeId) sessionWhere.niveauEtudeId = req.query.niveauEtudeId

            if (Object.keys(sessionWhere).length > 0) {
                demandeWhere.include.push({
                    association: DemandeInscription.associations.session,
                    where: sessionWhere
                })
            }

            if (req.query.parcoursId) {
                demandeWhere.include.push({
                    association: DemandeInscription.associations.parcoursChoisis,
                    where: { choixFinal: true, parcoursId: req.query.parcoursId }
                })
            }

            const matchingDemandes = await DemandeInscription.findAll(demandeWhere)
            const utilisateurIds = [...new Set(matchingDemandes.map(d => d.utilisateurId))]

            if (utilisateurIds.length === 0) {
                return res.status(200).json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
            }

            options.where = { ...options.where, utilisateurId: utilisateurIds as any }
        }

        try {
            const { rows, count: total } = await Bordereau.findAndCountAll({ ...options, limit, offset });

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

    static async getBordereau(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Bordereau>> = {
            where: { id: req.params.id },
            include: [
                { association: Bordereau.associations.echeance, include: [Echeance.associations.dossierEtudiant] },
                Bordereau.associations.utilisateur,
                Bordereau.associations.validePar,
                Bordereau.associations.quitus
            ]
        }

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options.where = { ...options.where, utilisateurId: (req as any).utilisateurId }
        }

        try {
            const bordereau: Bordereau | null = await Bordereau.findOne(options);

            if (bordereau == null)
                return res.status(404).json({ success: false, message: "Bordereau non trouvé" });

            return res.status(200).send(bordereau);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async createBordereau(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        const type = req.body.type
        if (type && !['inscription', 'scolarite', 'rattrapage'].includes(type)) {
            return res.status(400).json({ success: false, message: "Type invalide (inscription, scolarite ou rattrapage)" });
        }

        const echeanceId = type === 'scolarite' ? req.body.echeanceId : null
        if (type === 'scolarite' && !echeanceId) {
            return res.status(400).json({ success: false, message: "echeanceId requis pour un bordereau de scolarité" });
        }

        if (echeanceId) {
            const echeance = await Echeance.findByPk(echeanceId)
            if (echeance == null) {
                return res.status(404).json({ success: false, message: "Échéance non trouvée" });
            }
        }

        let fichier: string | null = null
        let files: any = req.files
        if (files && files['fichier']) {
            let fichierFile: Express.Multer.File | undefined = (files['fichier'])[0] as Express.Multer.File | undefined
            if (fichierFile) {
                fichier = fichierFile.filename
            }
        }

        if (fichier == null) {
            return res.status(400).json({ success: false, message: "Fichier bordereau requis" });
        }

        let bordereau: Bordereau = new Bordereau();
        bordereau.type = type || null
        bordereau.echeanceId = echeanceId
        bordereau.utilisateurId = (req as any).utilisateurId
        bordereau.fichier = fichier
        bordereau.montant = req.body.montant ? Number(req.body.montant) : null
        bordereau.referenceBancaire = req.body.referenceBancaire ?? null
        bordereau.statut = 'en_attente'
        bordereau.dateSoumission = new Date()
        bordereau.modalite = req.body.modalite ?? '1x'

        await bordereau.save()
            .then(async (bordereau) => {
                return res.status(201).send(bordereau);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async validerBordereau(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole;
        if (role != RolesUtilisateur.CABINET_COMPTABLE && role != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        // ── Transaction + verrou de ligne (anti double-soumission) ──
        // La route n'était pas transactionnelle : deux clics simultanés passaient les
        // garde-fous et le 2e appel explosait sur une contrainte unique (Duplicate entry).
        // On verrouille la ligne bordereau (SELECT ... FOR UPDATE) : le 2e appel attend
        // le commit du 1er puis voit le statut 'valide' → 400 "Bordereau déjà traité"
        // propre. Le commit intervient APRÈS le bordereau.save() final ; toute exception
        // pendant le traitement provoque un rollback global.
        const transaction = await DatabaseConnection.getInstance().sequelize.transaction();

        try {
            let bordereau: Bordereau | null = await Bordereau.findByPk(req.params.id, {
                transaction,
                lock: transaction.LOCK.UPDATE,
                include: [
                    { association: Bordereau.associations.echeance, include: [Echeance.associations.dossierEtudiant] },
                    Bordereau.associations.utilisateur
                ]
            });

            if (bordereau == null) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: "Bordereau non trouvé" });
            }

            if (bordereau.statut != 'en_attente') {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: "Bordereau déjà traité" });
            }

            const bordereauType = bordereau.type

            // Garde : les bordereaux de type 'rattrapage' sont traités exclusivement
            // par le workflow officiel (RattrapageWorkflowController.confirmerPaiement).
            // La validation classique n'a aucune branche dédiée pour ce type : elle
            // marquerait le bordereau 'valide' sans quitus ni mise à jour de la demande
            // (qui resterait 'impaye' → blocage du workflow). On refuse donc explicitement.
            if (bordereauType === 'rattrapage') {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: "Bordereau à traiter via le workflow de rattrapage" });
            }

            if (bordereauType === 'scolarite' && !bordereau.echeance) {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: "Échéance associée introuvable" });
            }

            bordereau.statut = 'valide'
            bordereau.dateValidation = new Date()
            bordereau.valideParId = (req as any).utilisateurId
            bordereau.commentaire = req.body.commentaire ?? null

            // Flux définitif : le cabinet AUTHENTIFIE seulement. La saisie comptable
            // et l'imputation relèvent d'ESA-COMPTA (FinanceRouter.saisir) ; la
            // création de l'étudiant (matricule, cursus, cours, carte) est déclenchée
            // par la validation FINALE du comité (ComiteValidationController).
            await bordereau.save({ transaction })

            // Pipeline d'inscription : dès l'AUTHENTIFICATION du bordereau par le
            // cabinet, le dossier est transmis au comité d'orientation. La saisie
            // ESA-COMPTA se déroule en parallèle et ne bloque plus cette transmission.
            const demande = await DemandeInscription.findOne({
                where: { utilisateurId: bordereau.utilisateurId },
                order: [['createdAt', 'DESC']],
                transaction,
                lock: transaction.LOCK.UPDATE,
            })
            if (demande && (!demande.statutPipeline || ['soumis', 'authentifie'].includes(demande.statutPipeline))) {
                demande.statutPipeline = 'transmis_comite'
                demande.soumissionComite = true
                await demande.save({ transaction })
            }

            // ── Commit de la transaction ──
            // Le 2e appel concurrent, bloqué sur le verrou de ligne, lit ensuite un
            // bordereau 'valide' → 400 "Bordereau déjà traité" propre.
            await transaction.commit();

            return res.status(200).send(bordereau);
        } catch (error) {
            // Si le rollback lui-même échoue, la transaction reste ouverte (locks) :
            // c'est une alerte opérationnelle qui doit être visible immédiatement.
            await transaction.rollback().catch(rbErr => console.error('[BORDEREAU][validation] ROLLBACK EN ÉCHEC — transaction possiblement orpheline:', rbErr));
            console.error("Erreur validation bordereau:", error);
            return res.status(400).json({ success: false, message: (error as Error).message || "Erreur inconnue" });
        }
    }

    static async rejeterBordereau(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole;
        if (role != RolesUtilisateur.CABINET_COMPTABLE && role != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        let bordereau: Bordereau | null = await Bordereau.findByPk(req.params.id);

        if (bordereau == null) {
            return res.status(404).json({ success: false, message: "Bordereau non trouvé" });
        }

        if (bordereau.statut != 'en_attente') {
            return res.status(400).json({ success: false, message: "Bordereau déjà traité" });
        }

        if (!req.body.commentaire) {
            return res.status(400).json({ success: false, message: "Commentaire requis pour le rejet" });
        }

        bordereau.statut = 'rejete'
        bordereau.dateValidation = new Date()
        bordereau.valideParId = (req as any).utilisateurId
        bordereau.commentaire = req.body.commentaire

        await bordereau.save()
            .then(async (bordereau) => {
                return res.status(200).send(bordereau);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async batchStatut(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole;
        if (role != RolesUtilisateur.CABINET_COMPTABLE && role != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        const { ids, statut, commentaire } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "IDs requis" });
        }

        // Le batch ne permet que le rejet : la validation d'un bordereau d'inscription
        // déclenche la mise à jour du pipeline (statutPipeline='authentifie') et doit
        // rester un acte individuel et traçable du cabinet.
        // Validation individuelle : PUT /bordereaux/:id/valider.
        // Rappel nouveau workflow : le cabinet authentifie seulement ; la création du
        // dossier étudiant relève du comité d'orientation, l'imputation d'ESA-COMPTA.
        if (statut === 'valide') {
            return res.status(400).json({
                success: false,
                message: "La validation en lot n'est pas autorisée : utilisez la validation individuelle (PUT /bordereaux/:id/valider)."
            });
        }

        if (statut !== 'rejete') {
            return res.status(400).json({ success: false, message: "Statut invalide. Seul 'rejete' est accepté en lot." });
        }

        const transaction = await DatabaseConnection.getInstance().sequelize.transaction();

        try {
            let count = 0;
            for (const id of ids) {
                const bordereau = await Bordereau.findByPk(id, { transaction });
                if (!bordereau || bordereau.statut !== 'en_attente') continue;

                bordereau.statut = statut;
                bordereau.dateValidation = new Date();
                bordereau.valideParId = (req as any).utilisateurId;

                if (statut === 'rejete') {
                    bordereau.commentaire = commentaire || null;
                }

                await bordereau.save({ transaction });
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

    static downloadBordereau(req: Request, res: Response): void {
        res.removeHeader('X-Frame-Options');
        Bordereau.findByPk(req.params.id).then((bordereau) => {
            if (!bordereau || !bordereau.fichier) {
                res.status(404).json({ success: false, message: "Fichier non trouvé" })
                return
            }

            // Chercher d'abord dans le nouveau chemin (dossier étudiant), puis dans l'ancien
            let filePath = path.resolve(process.cwd(), bordereau.fichier)
            if (!fs.existsSync(filePath)) {
                filePath = path.resolve(process.cwd(), 'public/inscription/bordereaux', bordereau.fichier)
            }
            if (!fs.existsSync(filePath)) {
                res.status(404).json({ success: false, message: "Fichier introuvable sur le serveur" })
                return
            }

            const ext = path.extname(bordereau.fichier) || '.pdf'
            const mimeTypes: Record<string, string> = {
                '.pdf': 'application/pdf',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.bmp': 'image/bmp',
            }
            const contentType = mimeTypes[ext] || 'application/octet-stream'

            res.setHeader('Content-Type', contentType)
            res.setHeader('Content-Disposition', 'inline; filename="bordereau' + ext + '"')

            const stream = fs.createReadStream(filePath)
            stream.on('error', () => {
                res.status(500).json({ success: false, message: "Erreur lors de la lecture du fichier" })
            })
            stream.pipe(res)
        }).catch(() => {
            res.status(500).json({ success: false, error: "Erreur lors de la récupération du bordereau" })
        })
    }

    static async traiterBordereau(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole
        if (role != RolesUtilisateur.CABINET_COMPTABLE && role != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        const transaction = await DatabaseConnection.getInstance().sequelize.transaction()

        try {
            let bordereau: Bordereau | null = await Bordereau.findByPk(req.params.id, {
                transaction,
                lock: transaction.LOCK.UPDATE,
                include: [
                    { association: Bordereau.associations.echeance, include: [Echeance.associations.dossierEtudiant] },
                    Bordereau.associations.utilisateur
                ]
            })

            if (bordereau == null) {
                await transaction.rollback()
                return res.status(404).json({ success: false, message: "Bordereau non trouvé" })
            }

            if (bordereau.statut != 'en_attente') {
                await transaction.rollback()
                return res.status(400).json({ success: false, message: "Bordereau déjà traité" })
            }

            const typeConstate = req.body.type
            if (!typeConstate || !['inscription', 'scolarite', 'rattrapage'].includes(typeConstate)) {
                await transaction.rollback()
                return res.status(400).json({ success: false, message: "Type requis (inscription, scolarite ou rattrapage)" })
            }

            const montantConstate = Number(req.body.montantConstate)
            if (!Number.isFinite(montantConstate) || montantConstate <= 0) {
                await transaction.rollback()
                return res.status(400).json({ success: false, message: "Montant constaté requis (positif)" })
            }

            bordereau.type = typeConstate
            bordereau.montant = montantConstate
            bordereau.referenceBancaire = req.body.referenceBancaire ?? bordereau.referenceBancaire
            bordereau.statut = 'valide'
            bordereau.dateValidation = new Date()
            bordereau.valideParId = (req as any).utilisateurId
            bordereau.commentaire = req.body.commentaire ?? bordereau.commentaire

            await bordereau.save({ transaction })

            if (typeConstate === 'rattrapage') {
                const demandeRattrapage = await RattrapageInscription.findOne({
                    where: { bordereauId: bordereau.id },
                    transaction,
                    lock: transaction.LOCK.UPDATE,
                })

                if (!demandeRattrapage) {
                    await transaction.commit()
                    return res.status(200).json({
                        success: true,
                        data: bordereau,
                        lettrage: { surplus: montantConstate, lignes: [] },
                    })
                }

                await demandeRattrapage.update({
                    statutPaiement: 'paye',
                    paiementId: bordereau.id,
                }, { transaction })

                await transaction.commit()

                return res.status(200).json({
                    success: true,
                    data: bordereau,
                    lettrage: { surplus: 0, lignes: [] },
                })
            }

            if (typeConstate === 'inscription') {
                // ── NOUVEAU WORKFLOW ─────────────────────────────────────────
                // Le cabinet AUTHENTIFIE seulement : constat du type et du montant
                // constaté, passage du bordereau à 'valide'. La création du dossier
                // étudiant (matricule final, cursus, cours participants, échéanciers)
                // est déclenchée par la validation du comité d'orientation
                // (ComiteValidationController), PAS ici. L'imputation comptable
                // relève de la saisie ESA-COMPTA (FinanceRouter.saisir), pas ici.

                // Pipeline d'inscription : dès l'authentification, le dossier est
                // transmis au comité d'orientation (même comportement que
                // PUT /bordereaux/:id/valider). Saisie ESA en parallèle.
                const demandePipeline = await DemandeInscription.findOne({
                    where: { utilisateurId: bordereau.utilisateurId },
                    order: [['createdAt', 'DESC']],
                    transaction,
                    lock: transaction.LOCK.UPDATE,
                })
                if (demandePipeline && (!demandePipeline.statutPipeline || ['soumis', 'authentifie'].includes(demandePipeline.statutPipeline))) {
                    demandePipeline.statutPipeline = 'transmis_comite'
                    demandePipeline.soumissionComite = true
                    await demandePipeline.save({ transaction })
                }

                await transaction.commit()
                return res.status(200).json({
                    success: true,
                    data: bordereau,
                    lettrage: { surplus: montantConstate, lignes: [] },
                })
            }

            // Bordereaux de scolarité : imputation sur les échéances du dossier
            // existant (flux historique conservé, hors workflow d'inscription).
            const resultatImputation = await ImputationService.imputerPourUtilisateur(
                bordereau.id,
                bordereau.utilisateurId,
                montantConstate,
                transaction
            )

            await transaction.commit()

            return res.status(200).json({
                success: true,
                data: bordereau,
                lettrage: resultatImputation,
            })
        } catch (error) {
            await transaction.rollback()
            console.error('[traiterBordereau]', error)
            return res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
        }
    }
}
