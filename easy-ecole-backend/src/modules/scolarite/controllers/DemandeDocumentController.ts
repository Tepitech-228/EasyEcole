import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DemandeDocument } from "../models/DemandeDocument";
import { TypeDocument } from "../models/TypeDocument";
import { DocumentDelivre } from "../models/DocumentDelivre";
import { DocumentPDFGenerator } from "../../../core/helpers/DocumentPDFGenerator";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { ArchiveGedService } from "../../../core/services/ArchiveGedService";
import DemandeDocumentPaiementService from "../services/DemandeDocumentPaiementService";
import { SecretariatWorkflowService, ErreurWorkflow } from "../services/SecretariatWorkflowService";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { RecuCaisse } from "../models/RecuCaisse";
import { DemandeDocumentPiece } from "../models/DemandeDocumentPiece";
import { DemandeDocumentVote } from "../models/DemandeDocumentVote";
import { DemandeDocumentWorkflowService } from "../services/DemandeDocumentWorkflowService";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const UPLOAD_DOCUMENTS_DIR = path.resolve(process.cwd(), 'storage', 'private', 'demandes-documents');
const STATUTS_MODIFIABLES_PAR_ETUDIANT = ['brouillon', 'rejetee'];

function fichiersCourantsParCle(pieces: DemandeDocumentPiece[]): Map<string, DemandeDocumentPiece> {
    return new Map(pieces.filter(piece => piece.estCourante).map(piece => [piece.cle, piece]));
}

function nomFichierSecurise(nom: string): string {
    return path.basename(nom).replace(/[\r\n"\\]/g, '_').slice(0, 255) || 'piece';
}


export default class DemandeDocumentController {

    constructor() { }

    static async getAllDemandesDocument(req: Request, res: Response): Promise<Response> {
        const page = parseInt(req.query.page as string) || 1
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
        const offset = (page - 1) * limit

        const where: any = {}

        if (req.query.statut) where.statut = req.query.statut
        if (req.query.typeDocumentId) where.typeDocumentId = req.query.typeDocumentId
        if (req.query.parcoursId) where.parcoursId = req.query.parcoursId
        if (req.query.niveauEtudeId) where.niveauEtudeId = req.query.niveauEtudeId
        if (req.query.anneeAcademiqueId) where.anneeAcademiqueId = req.query.anneeAcademiqueId
        if (req.query.classeId) where.classeId = req.query.classeId

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            where.etudiantId = (req as any).utilisateurId
        }

        const orderBy = (req.query.orderBy as string) || 'createdAt'
        const orderDir = (req.query.orderDir as string) || 'DESC'
        const order = [[orderBy, orderDir]] as any

        try {
            const { rows, count: total } = await DemandeDocument.findAndCountAll({
                where,
                include: [
                    { model: TypeDocument, as: 'typeDocument' },
                    { model: DocumentDelivre, as: 'documentDelivre' },
                    { model: Utilisateur, as: 'etudiant' },
                    { model: RecuCaisse, as: 'recuCaisse', required: false },
                    { model: DemandeDocumentPiece, as: 'pieces', where: { estCourante: true }, required: false }
                ],
                order,
                limit,
                offset,
                distinct: true
            })

            return res.status(200).json({
                data: rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            })
        } catch (error) {
            return res.status(500).json({ success: false, error })
        }
    }

    static async getAutorisationsProvisoires(req: Request, res: Response): Promise<Response> {
        try {
            const type = await TypeDocument.findOne({ where: { libelle: "Autorisation provisoire d'inscription" } });
            if (!type) return res.status(200).json({ data: [], pagination: { total: 0, page: 1, totalPages: 0 } });
            const autorisations = await DemandeDocument.findAll({
                where: { typeDocumentId: type.id, source: 'automatique' },
                include: [{ association: DemandeDocument.associations.etudiant, attributes: ['id', 'nom', 'prenoms', 'identifiant'] }],
                order: [['createdAt', 'DESC']],
            });
            const utilisateurIds = autorisations.map(demande => demande.etudiantId);
            const cursus = utilisateurIds.length > 0
                ? await CursusApprenant.findAll({
                    where: { utilisateurId: { [Op.in]: utilisateurIds } },
                    include: [
                        CursusApprenant.associations.demandeInscription,
                        CursusApprenant.associations.parcours,
                        CursusApprenant.associations.anneeAcademique,
                    ],
                })
                : [];
            const demandes = autorisations
                .map(demande => {
                    const cursusEtudiant = cursus.find(item =>
                        Number(item.utilisateurId) === Number(demande.etudiantId)
                        && (!demande.anneeAcademiqueId || Number(item.anneeAcademiqueId) === Number(demande.anneeAcademiqueId))
                        && (!demande.parcoursId || Number(item.parcoursId) === Number(demande.parcoursId))
                        );
                    if (!cursusEtudiant) return null;
                    const demandeInscription = cursusEtudiant.demandeInscription as any;
                    return {
                        ...demande.toJSON(),
                        matricule: demandeInscription?.matricule || null,
                        parcoursLibelle: (cursusEtudiant as any).parcours?.titre || cursusEtudiant.intituleParcours,
                        anneeLibelle: (cursusEtudiant as any).anneeAcademique?.libelle || null,
                    };
                })
                .filter(Boolean);
            return res.status(200).json({ data: demandes, pagination: { total: demandes.length, page: 1, totalPages: 1 } });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Erreur lors du chargement des autorisations provisoires" });
        }
    }

    static async telechargerAutorisationProvisoire(req: Request, res: Response): Promise<Response> {
        const demande = await DemandeDocument.findByPk(req.params.id);
        if (!demande || demande.source !== 'automatique' || !demande.fichierPDF) {
            return res.status(404).json({ success: false, message: "Autorisation provisoire introuvable" });
        }
        const fichier = path.resolve(demande.fichierPDF);
        if (!fs.existsSync(fichier)) return res.status(404).json({ success: false, message: "Fichier PDF indisponible" });
        return new Promise<Response>((resolve, reject) => {
            res.download(fichier, `autorisation-provisoire-${demande.numeroDemande || demande.id}.pdf`, (error) => {
                if (error) reject(error);
                else resolve(res);
            });
        });
    }

    static async getDemandeDocument(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<DemandeDocument>> = {
            where: { id: req.params.id },
            include: [
                { model: TypeDocument, as: 'typeDocument' },
                { model: DocumentDelivre, as: 'documentDelivre' },
                { model: DemandeDocumentPiece, as: 'pieces', where: { estCourante: true }, required: false }
            ]
        }

        try {
            const demande: DemandeDocument | null = await DemandeDocument.findOne(options);

            if (demande == null)
                return res.status(404).json({ success: false, message: "Demande non trouvée" });

            const role = (req as any).utilisateurRole;
            const proprietaire = role === RolesUtilisateur.APPRENANT && demande.etudiantId === (req as any).utilisateurId;
            const rolesInternes = [
                RolesUtilisateur.SECRETAIRE, RolesUtilisateur.INSTITUTION,
                RolesUtilisateur.ADMIN, RolesUtilisateur.COMITE_ORIENTATION,
                RolesUtilisateur.CAISSIER_BANQUE
            ];
            if (!proprietaire && !rolesInternes.includes(role)) return res.status(403).json({ success: false });

            return res.status(200).send(demande);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createDemandeDocument(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        const typeDocumentId = Number(req.body.typeDocumentId);
        if (!Number.isInteger(typeDocumentId) || typeDocumentId <= 0) {
            return res.status(400).json({ success: false, message: "typeDocumentId invalide" });
        }

        try {
            const typeDocument = await TypeDocument.findByPk(typeDocumentId);
            if (!typeDocument || !typeDocument.actif) {
                return res.status(404).json({ success: false, message: "Type de document indisponible" });
            }

            const montant = Number(typeDocument.frais) || 0;
            const demande = await DemandeDocument.create({
                etudiantId: (req as any).utilisateurId,
                typeDocumentId: typeDocument.id,
                statut: 'brouillon',
                etapeWizard: 1,
                source: 'demande_etudiant',
                montant,
                fraisPayes: montant <= 0,
                compteProduit: '704'
            });

            const cursus = await CursusApprenant.findOne({
                where: { utilisateurId: (req as any).utilisateurId },
                order: [['createdAt', 'DESC']]
            });
            if (cursus) {
                await demande.update({
                    parcoursId: cursus.parcoursId ? Number(cursus.parcoursId) : null,
                    niveauEtudeId: cursus.niveauEtudeId ? Number(cursus.niveauEtudeId) : null,
                    classeId: cursus.classeId ? Number(cursus.classeId) : null,
                    anneeAcademiqueId: cursus.anneeAcademiqueId ? Number(cursus.anneeAcademiqueId) : null
                });
            }
            return res.status(201).send(demande);
        } catch (error) {
            console.error('[DEMANDE_DOC][createDraft]', error);
            return res.status(500).json({ success: false, message: "Impossible de créer le brouillon" });
        }
    }

    static async sauvegarderProgressionWizard(req: Request, res: Response): Promise<Response> {
        const demande = await DemandeDocument.findByPk(req.params.id);
        if (!demande) return res.status(404).json({ success: false, message: "Demande non trouvée" });
        if (demande.etudiantId !== (req as any).utilisateurId || (req as any).utilisateurRole !== RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false });
        }
        if (!STATUTS_MODIFIABLES_PAR_ETUDIANT.includes(demande.statut)) {
            return res.status(409).json({ success: false, message: "Cette demande n'est plus modifiable" });
        }

        const etape = Number(req.body.etapeWizard);
        if (!Number.isInteger(etape) || etape < 1 || etape > 3) {
            return res.status(400).json({ success: false, message: "Étape du wizard invalide" });
        }
        try {
            await demande.update({ etapeWizard: etape });
            return res.status(200).json(demande);
        } catch (error) {
            console.error(`[DEMANDE_DOC][saveStep] id=${demande.id}`, error);
            return res.status(500).json({ success: false, message: "Impossible d'enregistrer la progression" });
        }
    }

    static async televerserPieceDemande(req: Request, res: Response): Promise<Response> {
        const demande = await DemandeDocument.findByPk(req.params.id, {
            include: [{ model: TypeDocument, as: 'typeDocument' }]
        });
        if (!demande) return res.status(404).json({ success: false, message: "Demande non trouvée" });
        if (demande.etudiantId !== (req as any).utilisateurId || (req as any).utilisateurRole !== RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false });
        }
        if (!STATUTS_MODIFIABLES_PAR_ETUDIANT.includes(demande.statut)) {
            return res.status(409).json({ success: false, message: "Cette demande n'est plus modifiable" });
        }
        if (!req.file) return res.status(400).json({ success: false, message: "Fichier requis" });

        const cle = String(req.body.cle || '').trim();
        const typeDocument = demande.typeDocument;
        const piecesRequises = Array.isArray(typeDocument?.piecesRequises) ? typeDocument.piecesRequises : [];
        const pieceConfiguree = piecesRequises.find(piece => piece.cle === cle);
        const estBordereau = cle === 'bordereau' && Number(demande.montant) > 0;
        if (!pieceConfiguree && !estBordereau) {
            return res.status(400).json({ success: false, message: "Cette pièce n'est pas requise pour la demande" });
        }

        const file = req.file;
        const signatures: Record<string, { signature: number[]; extension: string }> = {
            'application/pdf': { signature: [0x25, 0x50, 0x44, 0x46], extension: '.pdf' },
            'image/jpeg': { signature: [0xff, 0xd8, 0xff], extension: '.jpg' },
            'image/png': { signature: [0x89, 0x50, 0x4e, 0x47], extension: '.png' }
        };
        const signature = signatures[file.mimetype];
        if (!signature || !signature.signature.every((byte, index) => file.buffer[index] === byte)) {
            return res.status(400).json({ success: false, message: "Format de fichier invalide (PDF, JPG ou PNG requis)" });
        }

        const fichierId = crypto.randomBytes(24).toString('hex');
        const cheminFichier = path.join(UPLOAD_DOCUMENTS_DIR, `${fichierId}${signature.extension}`);
        const transaction = await DatabaseConnection.getInstance().sequelize.transaction();
        try {
            await fs.promises.mkdir(UPLOAD_DOCUMENTS_DIR, { recursive: true });
            await fs.promises.writeFile(cheminFichier, file.buffer, { flag: 'wx' });
            const precedente = await DemandeDocumentPiece.findOne({
                where: { demandeId: demande.id, cle, estCourante: true },
                transaction
            });
            const version = precedente ? precedente.version + 1 : 1;
            await DemandeDocumentPiece.update(
                { estCourante: false },
                { where: { demandeId: demande.id, cle, estCourante: true }, transaction }
            );
            const piece = await DemandeDocumentPiece.create({
                demandeId: demande.id,
                cle,
                libelle: estBordereau ? 'Bordereau de paiement' : pieceConfiguree!.libelle,
                nomOriginal: nomFichierSecurise(file.originalname),
                cheminFichier,
                typeMime: file.mimetype,
                tailleOctets: file.size,
                version,
                estCourante: true,
                statutAudit: 'en_attente',
                motifRejet: null
            }, { transaction });
            await transaction.commit();
            return res.status(201).json(piece);
        } catch (error) {
            await transaction.rollback();
            try { await fs.promises.unlink(cheminFichier); } catch (unlinkError: any) {
                if (unlinkError.code !== 'ENOENT') console.error('[DEMANDE_DOC][uploadCleanup]', unlinkError);
            }
            console.error(`[DEMANDE_DOC][uploadPiece] id=${demande.id} cle=${cle}`, error);
            return res.status(500).json({ success: false, message: "Impossible d'enregistrer cette pièce" });
        }
    }

    static async soumettreDemandeWizard(req: Request, res: Response): Promise<Response> {
        const demande = await DemandeDocument.findByPk(req.params.id, {
            include: [
                { model: TypeDocument, as: 'typeDocument' },
                { model: DemandeDocumentPiece, as: 'pieces', where: { estCourante: true }, required: false }
            ]
        });
        if (!demande) return res.status(404).json({ success: false, message: "Demande non trouvée" });
        if (demande.etudiantId !== (req as any).utilisateurId || (req as any).utilisateurRole !== RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false });
        }
        if (!STATUTS_MODIFIABLES_PAR_ETUDIANT.includes(demande.statut)) {
            return res.status(409).json({ success: false, message: "Cette demande ne peut pas être soumise depuis son état actuel" });
        }

        const piecesCourantes = fichiersCourantsParCle((demande as any).pieces || []);
        const piecesRequises = (demande.typeDocument?.piecesRequises || [])
            .filter(piece => piece.obligatoire !== false);
        const manquantes = piecesRequises
            .filter(piece => !piecesCourantes.has(piece.cle) || piecesCourantes.get(piece.cle)?.statutAudit === 'rejetee')
            .map(piece => piece.libelle);
        if (Number(demande.montant) > 0
            && (!piecesCourantes.has('bordereau') || piecesCourantes.get('bordereau')?.statutAudit === 'rejetee')) {
            manquantes.push('Bordereau de paiement');
        }
        for (const piece of piecesCourantes.values()) {
            if (piece.statutAudit === 'rejetee' && !manquantes.includes(piece.libelle)) manquantes.push(piece.libelle);
        }
        if (manquantes.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Pièces obligatoires manquantes : ${manquantes.join(', ')}`
            });
        }

        try {
            await demande.update({
                statut: 'soumise',
                etapeWizard: 3,
                motifRejet: null,
                tourComite: demande.statut === 'rejetee' ? demande.tourComite + 1 : demande.tourComite
            });
            await DemandeDocumentWorkflowService.promouvoirAuComiteSiPret(demande.id);
            return res.status(200).json(demande);
        } catch (error) {
            console.error(`[DEMANDE_DOC][submitWizard] id=${demande.id}`, error);
            return res.status(500).json({ success: false, message: "Impossible de soumettre cette demande" });
        }
    }

    static async telechargerPieceDemande(req: Request, res: Response): Promise<Response | void> {
        const piece = await DemandeDocumentPiece.findOne({
            where: { id: req.params.pieceId, demandeId: req.params.id, estCourante: true },
            include: [{ model: DemandeDocument, as: 'demande' }]
        });
        if (!piece?.demande) return res.status(404).json({ success: false, message: "Pièce introuvable" });

        const role = (req as any).utilisateurRole;
        const estProprietaire = role === RolesUtilisateur.APPRENANT && piece.demande.etudiantId === (req as any).utilisateurId;
        const rolesInternes = [
            RolesUtilisateur.SECRETAIRE, RolesUtilisateur.INSTITUTION,
            RolesUtilisateur.ADMIN, RolesUtilisateur.COMITE_ORIENTATION,
            RolesUtilisateur.CAISSIER_BANQUE
        ];
        if (!estProprietaire && !rolesInternes.includes(role)) return res.status(403).json({ success: false });

        const chemin = path.resolve(piece.cheminFichier);
        if (!chemin.startsWith(`${UPLOAD_DOCUMENTS_DIR}${path.sep}`) || !fs.existsSync(chemin)) {
            return res.status(404).json({ success: false, message: "Fichier indisponible" });
        }
        res.type(piece.typeMime);
        res.setHeader('Content-Disposition', `inline; filename="${nomFichierSecurise(piece.nomOriginal)}"`);
        return res.sendFile(chemin);
    }

    static async telechargerDocumentPret(req: Request, res: Response): Promise<Response | void> {
        const demande = await DemandeDocument.findByPk(req.params.id);
        if (!demande) return res.status(404).json({ success: false, message: "Demande non trouvée" });
        if (demande.statut !== 'document_pret' || !demande.fichierPDF) {
            return res.status(409).json({ success: false, message: "Le document n'est pas encore disponible" });
        }
        const role = (req as any).utilisateurRole;
        const proprietaire = role === RolesUtilisateur.APPRENANT && demande.etudiantId === (req as any).utilisateurId;
        const rolesInternes = [RolesUtilisateur.SECRETAIRE, RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN];
        if (!proprietaire && !rolesInternes.includes(role)) return res.status(403).json({ success: false });

        const directory = path.resolve(process.cwd(), 'public', 'scolarite', 'documents');
        const fichier = path.resolve(directory, path.basename(demande.fichierPDF));
        if (!fichier.startsWith(`${directory}${path.sep}`) || !fs.existsSync(fichier)) {
            return res.status(404).json({ success: false, message: "Fichier PDF indisponible" });
        }
        res.type('application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="document-${demande.numeroDemande || demande.id}.pdf"`);
        return res.sendFile(fichier);
    }

    static async auditerPieceDemandeDocument(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole;
        if (![RolesUtilisateur.SECRETAIRE, RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN].includes(role)) {
            return res.status(403).json({ success: false });
        }
        const statutAudit = req.body.statutAudit;
        const motif = String(req.body.motif || '').trim();
        if (!['validee', 'rejetee'].includes(statutAudit)) {
            return res.status(400).json({ success: false, message: "Décision d'audit invalide" });
        }
        if (statutAudit === 'rejetee' && !motif) {
            return res.status(400).json({ success: false, message: "Un motif est requis pour refuser une pièce" });
        }

        const demande = await DemandeDocument.findByPk(req.params.id);
        if (!demande) return res.status(404).json({ success: false, message: "Demande non trouvée" });
        if (!['soumise', 'paye'].includes(demande.statut)) {
            return res.status(409).json({ success: false, message: "Les pièces de cette demande ne sont pas en cours d'audit" });
        }

        const piece = await DemandeDocumentPiece.findOne({
            where: { id: req.params.pieceId, demandeId: demande.id, estCourante: true }
        });
        if (!piece) return res.status(404).json({ success: false, message: "Pièce courante introuvable" });

        const transaction = await DatabaseConnection.getInstance().sequelize.transaction();
        let transactionCommitted = false;
        try {
            await piece.update({
                statutAudit,
                motifRejet: statutAudit === 'rejetee' ? motif.slice(0, 255) : null
            }, { transaction });
            if (statutAudit === 'rejetee') {
                await demande.update({
                    statut: 'rejetee',
                    motifRejet: motif.slice(0, 255)
                }, { transaction });
            }
            await transaction.commit();
            transactionCommitted = true;
        } catch (error) {
            if (!transactionCommitted) {
                await transaction.rollback().catch(rollbackError =>
                    console.error(`[DEMANDE_DOC][auditPiece] rollback demande=${demande.id}`, rollbackError)
                );
            }
            console.error(`[DEMANDE_DOC][auditPiece] demande=${demande.id} piece=${piece.id}`, error);
            return res.status(500).json({ success: false, message: "Impossible d'enregistrer l'audit" });
        }

        try {
            const transmiseAuComite = statutAudit === 'validee'
                ? await DemandeDocumentWorkflowService.promouvoirAuComiteSiPret(demande.id)
                : false;
            return res.status(200).json({
                success: true,
                piece,
                statut: demande.statut,
                transmiseAuComite
            });
        } catch (error) {
            console.error(`[DEMANDE_DOC][advanceAfterAudit] demande=${demande.id} piece=${piece.id}`, error);
            return res.status(500).json({ success: false, message: "Audit enregistré, mais l'étape suivante n'a pas pu être activée" });
        }
    }

    static async listerDemandesComiteDocuments(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole;
        if (role !== RolesUtilisateur.COMITE_ORIENTATION && role !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false });
        }
        try {
            const votesRequis = await Utilisateur.count({
                where: { role: RolesUtilisateur.COMITE_ORIENTATION, deletedAt: null }
            });
            const demandes = await DemandeDocument.findAll({
                where: { statut: 'en_comite' },
                include: [
                    { model: TypeDocument, as: 'typeDocument' },
                    { model: Utilisateur, as: 'etudiant', attributes: ['id', 'nom', 'prenoms', 'identifiant'] },
                    {
                        model: DemandeDocumentVote,
                        as: 'votesComite',
                        required: false
                    },
                    {
                        model: DemandeDocumentPiece,
                        as: 'pieces',
                        where: { estCourante: true },
                        required: false
                    }
                ],
                order: [['createdAt', 'ASC']]
            });
            const data = demandes.map(demande => {
                const json: any = demande.toJSON();
                json.votesComite = (json.votesComite || []).filter((vote: any) => vote.tour === demande.tourComite);
                json.votesRequis = votesRequis;
                return json;
            });
            return res.status(200).json({ data });
        } catch (error) {
            console.error('[DEMANDE_DOC][listCommittee]', error);
            return res.status(500).json({ success: false, message: 'Impossible de charger les demandes du comité' });
        }
    }

    static async deciderComiteDemandeDocument(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole;
        const membreId = Number((req as any).utilisateurId);
        if (role !== RolesUtilisateur.COMITE_ORIENTATION) return res.status(403).json({ success: false });

        const decision = req.body.decision;
        const motif = String(req.body.motif || '').trim();
        if (!['valider', 'corriger'].includes(decision)) {
            return res.status(400).json({ success: false, message: "Décision du comité invalide" });
        }
        if (decision === 'corriger' && !motif) {
            return res.status(400).json({ success: false, message: "Un motif de correction est requis" });
        }

        const membreActif = await Utilisateur.findOne({
            where: { id: membreId, role: RolesUtilisateur.COMITE_ORIENTATION, deletedAt: null }
        });
        if (!membreActif) return res.status(403).json({ success: false, message: "Membre du comité inactif" });

        const sequelize = DatabaseConnection.getInstance().sequelize;
        const transaction = await sequelize.transaction();
        let transactionCommitted = false;
        let demandePourGeneration: DemandeDocument | null = null;
        let votesRequis = 0;
        let votesExprimes = 0;
        try {
            const demande = await DemandeDocument.findByPk(req.params.id, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!demande) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: "Demande non trouvée" });
            }
            const existingVote = await DemandeDocumentVote.findOne({
                where: { demandeId: demande.id, membreId, tour: demande.tourComite },
                transaction
            });
            if (demande.statut !== 'en_comite'
                && !(existingVote?.decision === 'valider' && ['validee', 'en_preparation', 'document_pret'].includes(demande.statut))) {
                await transaction.rollback();
                return res.status(409).json({ success: false, message: "Cette demande n'attend pas une décision du comité" });
            }
            if (existingVote) {
                if (existingVote.decision === 'valider' && ['validee', 'en_preparation', 'document_pret'].includes(demande.statut)) {
                    demandePourGeneration = demande;
                } else {
                    await transaction.rollback();
                    return res.status(409).json({ success: false, message: "Vous avez déjà voté pour ce tour" });
                }
            } else {
                await DemandeDocumentVote.create({
                    demandeId: demande.id,
                    membreId,
                    tour: demande.tourComite,
                    decision,
                    motif: decision === 'corriger' ? motif.slice(0, 255) : null
                }, { transaction });

                if (decision === 'corriger') {
                    await demande.update({
                        statut: 'rejetee',
                        motifRejet: motif.slice(0, 255)
                    }, { transaction });
                } else {
                    const membres = await Utilisateur.findAll({
                        where: { role: RolesUtilisateur.COMITE_ORIENTATION, deletedAt: null },
                        attributes: ['id'],
                        transaction
                    });
                    votesRequis = membres.length;
                    const votes = await DemandeDocumentVote.findAll({
                        where: { demandeId: demande.id, tour: demande.tourComite },
                        transaction
                    });
                    votesExprimes = votes.length;
                    const votesParMembre = new Map(votes.map(vote => [Number(vote.membreId), vote.decision]));
                    const unanimite = membres.length > 0
                        && membres.every(membre => votesParMembre.get(Number(membre.id)) === 'valider');
                    if (unanimite) {
                        await demande.update({ statut: 'validee' }, { transaction });
                        demandePourGeneration = demande;
                    }
                }
            }
            await transaction.commit();
            transactionCommitted = true;
        } catch (error) {
            if (!transactionCommitted) {
                await transaction.rollback().catch(rollbackError =>
                    console.error(`[DEMANDE_DOC][committeeVote] rollback demande=${req.params.id}`, rollbackError)
                );
            }
            console.error(`[DEMANDE_DOC][committeeVote] demande=${req.params.id} membre=${membreId}`, error);
            return res.status(500).json({ success: false, message: "Impossible d'enregistrer le vote" });
        }

        if (demandePourGeneration) {
            try {
                const demandeComplete = await DemandeDocument.findByPk(demandePourGeneration.id, {
                    include: [
                        { model: TypeDocument, as: 'typeDocument' },
                        { model: Utilisateur, as: 'etudiant' }
                    ]
                });
                if (!demandeComplete) return res.status(404).json({ success: false, message: "Demande non trouvée après vote" });
                if (demandeComplete.statut === 'validee') {
                    await SecretariatWorkflowService.passerEnPreparation(demandeComplete, membreId);
                    await demandeComplete.reload({
                        include: [
                            { model: TypeDocument, as: 'typeDocument' },
                            { model: Utilisateur, as: 'etudiant' }
                        ]
                    });
                }
                const documentPret = demandeComplete.statut === 'en_preparation'
                    ? await SecretariatWorkflowService.genererDocument(demandeComplete, membreId)
                    : demandeComplete;
                return res.status(200).json({
                    success: true,
                    unanimite: true,
                    votesRequis,
                    votesExprimes,
                    demande: documentPret
                });
            } catch (error) {
                if (error instanceof ErreurWorkflow) {
                    return res.status(error.httpStatus).json({ success: false, code: error.code, message: error.message });
                }
                console.error(`[DEMANDE_DOC][committeeFinalize] demande=${demandePourGeneration.id}`, error);
                return res.status(500).json({ success: false, message: "Vote enregistré, mais génération du document impossible" });
            }
        }

        return res.status(200).json({
            success: true,
            unanimite: false,
            votesRequis,
            votesExprimes
        });
    }

    static async traiterDemandeDocument(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let demande: DemandeDocument | null = await DemandeDocument.findOne({
            where: { id: req.params.id },
            include: [{ model: TypeDocument, as: 'typeDocument' }]
        });

        if (demande == null) {
            return res.status(404).json({ success: false, message: "Demande non trouvée" });
        }

        if (demande.source === 'demande_etudiant'
            && ['validee', 'delivree', 'paye', 'en_preparation', 'document_pret'].includes(String(req.body.statut))) {
            return res.status(409).json({
                success: false,
                message: "Les demandes volontaires suivent le circuit d'audit et de validation du comité"
            });
        }

            if (req.body.statut == 'validee' || req.body.statut == 'delivree') {
            // Règle métier : une demande volontaire payante doit être réglée avant
            // validation / délivrance du document.
            if (demande.source === 'demande_etudiant' && !demande.fraisPayes) {
                return res.status(400).json({ success: false, message: "Paiement requis avant délivrance du document" });
            }

            let typeDocument = demande.typeDocument
            if (!typeDocument) {
                typeDocument = (await TypeDocument.findOne({ where: { id: demande.typeDocumentId } })) ?? undefined
            }

            const filename = DocumentPDFGenerator.generateDocument(
                demande.id,
                typeDocument?.libelle || 'Document',
                "public/scolarite/documents/"
            )

            let docDelivre = new DocumentDelivre();
            docDelivre.demandeId = demande.id
            docDelivre.fichierPDF = filename
            await docDelivre.save()

            // Archivage avec le service dédié (plus de champs contextuels renseignés)
            const aai = Number(demande.anneeAcademiqueId) || 0;
            const pi = Number(demande.parcoursId) || 0;
            const nei = Number(demande.niveauEtudeId) || 0;
            if (aai && pi && nei) {
                ArchiveGedService.archiverDocumentScolarite({
                    titre: `${typeDocument?.libelle || 'Document'} - ${demande.id}`,
                    documentTypeCode: 'attestation',
                    fichier: filename,
                    anneeAcademiqueId: aai,
                    parcoursId: pi,
                    niveauEtudeId: nei,
                    classeId: Number(demande.classeId) || undefined,
                    semestre: undefined,
                    cursusApprenantId: undefined,
                    uploaderId: (req as any).utilisateurId || 1,
                }).catch((err: any) => console.error("Erreur archivage document scolarite:", err));
            }
        }

        await demande.update({ statut: req.body.statut })
            .then(async (demande) => {
                return res.status(200).send(demande);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async deleteDemandeDocument(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        let demande: DemandeDocument | null = await DemandeDocument.findOne({ where: { id: req.params.id } });
        if (demande) {
            await demande.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Demande supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Demande non trouvée" });
        }

        return null
    }

    /**
     * GET /scolarite/mes-documents
     * Liste les documents de l'étudiant connecté avec informations enrichies :
     * - statut de paiement
     * - référence du reçu de caisse
     * - fichier PDF généré
     * - disponibilité du téléchargement
     */
    static async getMesDocuments(req: Request, res: Response): Promise<Response> {
        const utilisateurId = (req as any).utilisateurId;
        const role = (req as any).utilisateurRole;

        if (role !== RolesUtilisateur.APPRENANT && role !== RolesUtilisateur.INSTITUTION && role !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false });
        }

        try {
            const where: any = {};
            // L'étudiant ne voit que ses propres demandes
            if (role === RolesUtilisateur.APPRENANT) {
                where.etudiantId = utilisateurId;
            }
            const demandes = await DemandeDocument.findAll({
                where,
                include: [
                    { model: TypeDocument, as: 'typeDocument' },
                    { model: DocumentDelivre, as: 'documentDelivre' },
                    { model: DemandeDocumentPiece, as: 'pieces', where: { estCourante: true }, required: false },
                    {
                        model: RecuCaisse,
                        as: 'recuCaisse',
                        required: false
                    }
                ],
                order: [['createdAt', 'DESC']]
            });

            // Enrichir chaque demande avec des indicateurs d'interface
            const result = demandes.map(d => {
                const montant = Number(d.montant) || 0;
                const estPayable = montant > 0 && d.source === 'demande_etudiant';
                const estTelechargeable = !!d.fichierPDF || !!d.documentDelivre?.fichierPDF;
                const estImprimable = ['document_pret', 'paye'].includes(d.statut || '') && estTelechargeable;
                const estEnAttentePaiement = estPayable && !d.fraisPayes;

                return {
                    id: d.id,
                    typeDocument: d.typeDocument ? {
                        id: d.typeDocument.id,
                        libelle: d.typeDocument.libelle,
                        categorie: d.typeDocument.categorie
                    } : null,
                    statut: d.statut,
                    etapeWizard: d.etapeWizard,
                    motifRejet: d.motifRejet,
                    pieces: ((d as any).pieces || []).map((piece: DemandeDocumentPiece) => ({
                        id: piece.id,
                        cle: piece.cle,
                        libelle: piece.libelle,
                        nomOriginal: piece.nomOriginal,
                        typeMime: piece.typeMime,
                        tailleOctets: piece.tailleOctets,
                        version: piece.version,
                        statutAudit: piece.statutAudit,
                        motifRejet: piece.motifRejet,
                        createdAt: piece.createdAt
                    })),
                    montant,
                    source: d.source,
                    date: d.date,
                    // Paiement
                    estPayable,
                    fraisPayes: !!d.fraisPayes,
                    modePaiement: d.modePaiement,
                    datePaiement: d.datePaiement,
                    // Reçu de caisse
                    recuCaisse: (d as any).recuCaisse ? {
                        id: (d as any).recuCaisse.id,
                        numero: (d as any).recuCaisse.numero,
                        montant: (d as any).recuCaisse.montant,
                        fichierPDF: (d as any).recuCaisse.fichierPDF
                    } : null,
                    // Document généré
                    fichierPDF: d.fichierPDF,
                    dateGeneration: d.dateGeneration,
                    documentDelivre: d.documentDelivre ? {
                        fichierPDF: d.documentDelivre.fichierPDF,
                        dateDelivrance: (d.documentDelivre as any).dateDelivrance
                    } : null,
                    // Indicateurs UI
                    estTelechargeable,
                    estImprimable,
                    estEnAttentePaiement
                };
            });

            return res.status(200).json(result);
        } catch (error) {
            console.error('[DEMANDE_DOC][getMesDocuments]', error);
            return res.status(500).json({ success: false, error });
        }
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await DemandeDocument.count()
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }

    static async batchStatut(req: Request, res: Response): Promise<Response> {
        const { ids, statut } = req.body

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "ids must be a non-empty array" })
        }

        const validStatuts = ['validee', 'rejetee', 'delivree']
        if (!validStatuts.includes(statut)) {
            return res.status(400).json({ success: false, message: "statut must be one of: validee, rejetee, delivree" })
        }

        if (statut === 'validee' || statut === 'delivree') {
            const demandes = await DemandeDocument.findAll({ where: { id: ids } })
            if (demandes.some(d => d.source === 'demande_etudiant')) {
                return res.status(409).json({
                    success: false,
                    message: "Les demandes volontaires ne peuvent être validées que par le comité"
                })
            }
            const nonPayees = demandes.filter(d =>
                d.source === 'demande_etudiant' && !d.fraisPayes && Number(d.montant) > 0
            )
            if (nonPayees.length > 0) {
                return res.status(400).json({ success: false, message: "Paiement requis avant délivrance du document" })
            }
        }

        const transaction = await DatabaseConnection.getInstance().sequelize.transaction()
        try {
            const [count] = await DemandeDocument.update(
                { statut },
                { where: { id: ids }, transaction }
            )
            await transaction.commit()
            return res.json({ success: true, count })
        } catch (error) {
            await transaction.rollback()
            return res.status(500).json({ success: false, error })
        }
    }

    static async creerBordereauDemandeDocument(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole
        const utilisateurId = (req as any).utilisateurId

        const demande: DemandeDocument | null = await DemandeDocument.findByPk(req.params.id)
        if (demande == null) {
            return res.status(404).json({ success: false, message: "Demande non trouvée" })
        }

        const isOwner = role == RolesUtilisateur.APPRENANT && demande.etudiantId == utilisateurId
        if (!isOwner && role != RolesUtilisateur.INSTITUTION && role != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        const montant = Number(demande.montant) || 0
        if (montant <= 0) {
            return res.status(400).json({ success: false, message: "Aucun frais à payer pour cette demande" })
        }
        if (demande.fraisPayes) {
            return res.status(400).json({ success: false, message: "Demande déjà payée" })
        }

        const bordereauExistant = await DemandeDocumentPaiementService.trouverBordereauDemande(demande)
        if (bordereauExistant) {
            return res.status(400).json({ success: false, message: "Un bordereau existe déjà pour cette demande" })
        }

        try {
            const bordereau = await DemandeDocumentPaiementService.creerBordereauPourDemande(demande, utilisateurId)
            return res.status(201).send(bordereau)
        } catch (error) {
            return res.status(500).json({ success: false, error })
        }
    }

    static async confirmerPaiementDemandeDocument(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole
        if (role != RolesUtilisateur.INSTITUTION && role != RolesUtilisateur.CAISSIER_BANQUE && role != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        const demande: DemandeDocument | null = await DemandeDocument.findByPk(req.params.id)
        if (demande == null) {
            return res.status(404).json({ success: false, message: "Demande non trouvée" })
        }

        if (demande.fraisPayes) {
            return res.status(400).json({ success: false, message: "Demande déjà payée" })
        }

        try {
            const demandeMaj = await DemandeDocumentPaiementService.confirmerPaiement(demande, {
                paiementId: req.body.paiementId
            })
            await DemandeDocumentWorkflowService.promouvoirAuComiteSiPret(demandeMaj.id)
            return res.status(200).send(demandeMaj)
        } catch (error) {
            return res.status(500).json({ success: false, error })
        }
    }

    static async confirmerPaiementAutoDemandeDocument(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole
        const utilisateurId = (req as any).utilisateurId

        const demande: DemandeDocument | null = await DemandeDocument.findByPk(req.params.id)
        if (demande == null) {
            return res.status(404).json({ success: false, message: "Demande non trouvée" })
        }

        const isOwner = role == RolesUtilisateur.APPRENANT && demande.etudiantId == utilisateurId
        if (!isOwner && role != RolesUtilisateur.INSTITUTION && role != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        const montant = Number(demande.montant) || 0
        if (montant <= 0) {
            return res.status(400).json({ success: false, message: "Aucun frais à payer pour cette demande" })
        }
        if (demande.fraisPayes) {
            return res.status(400).json({ success: false, message: "Demande déjà payée" })
        }

        try {
            const demandeMaj = await DemandeDocumentPaiementService.confirmerPaiementAuto(demande, req)
            await DemandeDocumentWorkflowService.promouvoirAuComiteSiPret(demandeMaj.id)
            return res.status(200).send(demandeMaj)
        } catch (error) {
            return res.status(500).json({ success: false, error })
        }
    }

    static async verifierAccesDemandeDocument(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole
        const utilisateurId = (req as any).utilisateurId

        const demande: DemandeDocument | null = await DemandeDocument.findByPk(req.params.id)
        if (demande == null) {
            return res.status(404).json({ success: false, message: "Demande non trouvée" })
        }

        const isOwner = role == RolesUtilisateur.APPRENANT && demande.etudiantId == utilisateurId
        if (!isOwner && role != RolesUtilisateur.INSTITUTION && role != RolesUtilisateur.ADMIN && role != RolesUtilisateur.CAISSIER_BANQUE) {
            return res.status(403).json({ success: false })
        }

        const montant = Number(demande.montant) || 0
        return res.status(200).json({
            gratuit: montant <= 0 || demande.source === 'automatique',
            montant,
            fraisPayes: !!demande.fraisPayes,
            source: demande.source
        })
    }

    static async preparerDocument(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole
        const utilisateurId = (req as any).utilisateurId

        if (role != RolesUtilisateur.SECRETAIRE && role != RolesUtilisateur.ADMIN && role != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false, message: "Accès réservé au secrétariat" })
        }

        try {
            const demande = await DemandeDocument.findByPk(req.params.id)
            if (!demande) {
                return res.status(404).json({ success: false, code: 'DEMANDE_NOT_FOUND', message: "Demande non trouvée" })
            }
            const updated = await SecretariatWorkflowService.passerEnPreparation(demande, utilisateurId)
            return res.status(200).json(updated)
        } catch (e) {
            if (e instanceof ErreurWorkflow) return res.status(e.httpStatus).json({ success: false, code: e.code, message: e.message })
            console.error(`[SECRETARIAT][preparerDocument] user=${utilisateurId} demande=${req.params.id}`, e)
            return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: "Erreur interne lors de la préparation" })
        }
    }

    static async genererDocument(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole
        const utilisateurId = (req as any).utilisateurId

        if (role != RolesUtilisateur.SECRETAIRE && role != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Accès réservé au secrétariat" })
        }

        try {
            const demande = await DemandeDocument.findByPk(req.params.id, {
                include: [
                    { model: TypeDocument, as: 'typeDocument' },
                    { model: Utilisateur, as: 'etudiant' }
                ]
            })
            if (!demande) {
                return res.status(404).json({ success: false, code: 'DEMANDE_NOT_FOUND', message: "Demande non trouvée" })
            }
            const updated = await SecretariatWorkflowService.genererDocument(demande, utilisateurId)
            return res.status(200).json(updated)
        } catch (e) {
            if (e instanceof ErreurWorkflow) return res.status(e.httpStatus).json({ success: false, code: e.code, message: e.message })
            console.error(`[SECRETARIAT][genererDocument] user=${utilisateurId} demande=${req.params.id}`, e)
            return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: "Erreur interne lors de la génération" })
        }
    }

    static async imprimerDocument(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole
        const utilisateurId = (req as any).utilisateurId

        if (role != RolesUtilisateur.SECRETAIRE && role != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Accès réservé au secrétariat" })
        }

        try {
            const demande = await DemandeDocument.findByPk(req.params.id)
            if (!demande) {
                return res.status(404).json({ success: false, code: 'DEMANDE_NOT_FOUND', message: "Demande non trouvée" })
            }
            const updated = await SecretariatWorkflowService.confirmerImpression(demande, utilisateurId)
            return res.status(200).json(updated)
        } catch (e) {
            if (e instanceof ErreurWorkflow) return res.status(e.httpStatus).json({ success: false, code: e.code, message: e.message })
            console.error(`[SECRETARIAT][imprimerDocument] user=${utilisateurId} demande=${req.params.id}`, e)
            return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: "Erreur interne lors de la confirmation d'impression" })
        }
    }

    static async remettreDocument(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole
        const utilisateurId = (req as any).utilisateurId

        if (role != RolesUtilisateur.SECRETAIRE && role != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Accès réservé au secrétariat" })
        }

        try {
            const demande = await DemandeDocument.findByPk(req.params.id, {
                include: [{ model: Utilisateur, as: 'etudiant' }]
            })
            if (!demande) {
                return res.status(404).json({ success: false, code: 'DEMANDE_NOT_FOUND', message: "Demande non trouvée" })
            }
            const updated = await SecretariatWorkflowService.confirmerRemise(demande, utilisateurId)
            return res.status(200).json(updated)
        } catch (e) {
            if (e instanceof ErreurWorkflow) return res.status(e.httpStatus).json({ success: false, code: e.code, message: e.message })
            console.error(`[SECRETARIAT][remettreDocument] user=${utilisateurId} demande=${req.params.id}`, e)
            return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: "Erreur interne lors de la remise" })
        }
    }

    static async rejeterDemande(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole
        const utilisateurId = (req as any).utilisateurId

        if (role != RolesUtilisateur.SECRETAIRE && role != RolesUtilisateur.ADMIN && role != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false, message: "Accès réservé au secrétariat" })
        }

        const motif = req.body.motif || "Demande rejetée"

        try {
            const demande = await DemandeDocument.findByPk(req.params.id)
            if (!demande) {
                return res.status(404).json({ success: false, code: 'DEMANDE_NOT_FOUND', message: "Demande non trouvée" })
            }
            const updated = await SecretariatWorkflowService.rejeterDemande(demande, motif, utilisateurId)
            return res.status(200).json(updated)
        } catch (e) {
            if (e instanceof ErreurWorkflow) return res.status(e.httpStatus).json({ success: false, code: e.code, message: e.message })
            console.error(`[SECRETARIAT][rejeterDemande] user=${utilisateurId} demande=${req.params.id}`, e)
            return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: "Erreur interne lors du rejet" })
        }
    }
}
