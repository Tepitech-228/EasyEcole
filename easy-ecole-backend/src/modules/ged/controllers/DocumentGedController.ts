import { Request, Response } from "express";
import { DocumentGed } from "../models/DocumentGed";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DocumentPDFGenerator } from "../../../core/helpers/DocumentPDFGenerator";
import { OcrService } from "../../../core/services/OcrService";
import { ReferenceService } from "../../../core/services/ReferenceService";
import { AuditService } from "../../../core/services/AuditService";
import { Op } from "sequelize";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import DisposalRecord from "../models/DisposalRecord";
import DocumentAuditLog from "../models/DocumentAuditLog";
import DocumentAccessGrant from "../models/DocumentAccessGrant";
import Domain from "../models/Domain";
import DocumentType from "../models/DocumentType";
import { SessionGed } from "../models/SessionGed";
import GedSignature from "../models/GedSignature";
import { NotificationGedService } from "../services/NotificationGedService";
import { NamingConventionService } from "../services/NamingConventionService";
import { GED_CONFIG } from "../../../core/config/GedConfig";

function parseJsonField(value: any): any {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return null; }
}

const UPLOAD_DIR = GED_CONFIG.UPLOAD_DIR;

export default class DocumentGedController {

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
            const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize || '20'), 10)));
            const offset = (page - 1) * pageSize;

            const where: any = {};

            if (req.query.statut) where.statut = String(req.query.statut);
            if (req.query.folderId) where.folderId = Number(req.query.folderId);
            if (req.query.sessionId) where.sessionId = Number(req.query.sessionId);
            if (req.query.domainId) where.domainId = Number(req.query.domainId);
            if (req.query.documentTypeId) where.documentTypeId = Number(req.query.documentTypeId);
            if (req.query.confidentialityLevel) where.confidentialityLevel = String(req.query.confidentialityLevel);
            if (req.query.lifecycleStatus) where.lifecycleStatus = String(req.query.lifecycleStatus);
            if (req.query.anneeAcademiqueId) where.anneeAcademiqueId = Number(req.query.anneeAcademiqueId);
            if (req.query.parcoursId) where.parcoursId = Number(req.query.parcoursId);
            if (req.query.niveauEtudeId) where.niveauEtudeId = Number(req.query.niveauEtudeId);
            if (req.query.semestre) where.semestre = String(req.query.semestre);
            if (req.query.classeId) where.classeId = Number(req.query.classeId);
            if (req.query.sourceType) where.sourceType = String(req.query.sourceType);
            if (req.query.processusGenerateurId) where.processusGenerateurId = String(req.query.processusGenerateurId);
            if (req.query.storageLocation) where.storageLocation = String(req.query.storageLocation);
            if (req.query.isEncrypted === 'true') where.isEncrypted = true;
            else if (req.query.isEncrypted === 'false') where.isEncrypted = false;

            if (req.query.dateCreationFrom || req.query.dateCreationTo) {
                where.createdAt = {};
                if (req.query.dateCreationFrom) where.createdAt[Op.gte] = new Date(String(req.query.dateCreationFrom));
                if (req.query.dateCreationTo) where.createdAt[Op.lte] = new Date(String(req.query.dateCreationTo));
            }

            if (req.query.duaApproaching === 'true') {
                const now = new Date();
                const max = new Date();
                max.setDate(max.getDate() + 90);
                where.duaEndDate = {
                    [Op.between]: [now.toISOString().slice(0, 10), max.toISOString().slice(0, 10)]
                };
            } else if (req.query.duaExpired === 'true') {
                const now = new Date().toISOString().slice(0, 10);
                where.duaEndDate = {
                    [Op.lt]: now
                };
            }

            if (req.query.q) {
                const query = String(req.query.q);
                where[Op.or] = [
                    { titre: { [Op.substring]: query } },
                    { reference: { [Op.substring]: query } },
                    { contenuTexte: { [Op.substring]: query } },
                    { tags: { [Op.substring]: query } },
                    { auteur: { [Op.substring]: query } }
                ];
            }

            const userRole = (req as any).utilisateurRole;
            if (userRole !== RolesUtilisateur.ADMIN && userRole !== RolesUtilisateur.INSTITUTION) {
                where.confidentialityLevel = { [Op.in]: ['public', 'interne'] };
            }

            const includeList: any[] = [
                { association: 'uploader', attributes: ['id', 'nom', 'prenoms'] },
                { association: 'domain', attributes: ['id', 'code', 'label'] },
                { association: 'documentType', attributes: ['id', 'code', 'shortCode', 'label'] }
            ]
            if (req.query.sessionId) {
                includeList.push({ association: 'session', attributes: ['id', 'nom'] })
            }

            // Filter by tag IDs (comma‑separated)
            if (req.query.tagIds) {
                const tagIdArray = String(req.query.tagIds).split(',').map(Number).filter(n => !isNaN(n));
                if (tagIdArray.length > 0) {
                    includeList.push({
                        association: 'documentTags',
                        required: true,
                        where: { tagId: tagIdArray }
                    });
                }
            }

            const sortField = String(req.query.sortField || 'createdAt');
            const sortDirection = String(req.query.sortDirection || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
            const allowedSortFields = ['createdAt', 'titre', 'reference', 'taille', 'updatedAt'];
            const orderField = allowedSortFields.includes(sortField) ? sortField : 'createdAt';

            const { count: total, rows: data } = await DocumentGed.findAndCountAll({
                where,
                offset,
                limit: pageSize,
                include: includeList,
                order: [[orderField, sortDirection]]
            });

            return res.status(200).json({ data, total, page, pageSize });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const document = await DocumentGed.findByPk(req.params.id, {
                include: [
                    { association: 'uploader', attributes: ['id', 'nom', 'prenoms'] },
                    { association: 'domain' },
                    { association: 'documentType' },
                    { association: 'folder' },
                    { association: 'session' },
                    { association: 'parent' },
                    { association: 'signatures', include: [
                        { association: 'requester', attributes: ['id', 'nom', 'prenoms'] },
                        { association: 'signer', attributes: ['id', 'nom', 'prenoms'] },
                        { association: 'rejector', attributes: ['id', 'nom', 'prenoms'] }
                    ]}
                ]
            });

            if (!document) {
                return res.status(404).json({ success: false, message: "Document non trouvé" });
            }

            await AuditService.log(document.id, (req as any).utilisateurId, 'consultation');

            let versions: any[] = [];
            if (document.reference) {
                versions = await DocumentGed.findAll({
                    where: {
                        reference: document.reference,
                        id: { [Op.ne]: document.id }
                    },
                    order: [['versionMajor', 'DESC'], ['versionMinor', 'DESC']],
                    include: [
                        { association: 'uploader', attributes: ['id', 'nom', 'prenoms'] }
                    ]
                });
            }

            return res.status(200).json({ ...document.toJSON(), versions });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async upload(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
            (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        try {
            const file = req.file;
            if (!file) {
                return res.status(400).json({ success: false, message: "Aucun fichier fourni" });
            }

            const folderId = req.body.folderId;
            let finalFilename = file.filename;
            if (folderId) {
                const folderPath = path.resolve(process.cwd(), UPLOAD_DIR, String(folderId));
                if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
                const oldPath = path.resolve(process.cwd(), UPLOAD_DIR, file.filename);
                const newPath = path.resolve(folderPath, file.filename);
                fs.renameSync(oldPath, newPath);
                finalFilename = path.join(String(folderId), file.filename).replace(/\\/g, '/');
            }

            const fullPath = path.resolve(process.cwd(), UPLOAD_DIR, finalFilename);

            let ocrData: any = { nbPages: undefined, auteur: undefined, dateDocument: undefined, motsCles: [], contenuTexte: undefined };
            try {
              ocrData = await OcrService.extraireMetadonnees(fullPath);
            } catch (ocrErr) {
              console.error('OCR skipped for', file.filename, ocrErr);
            }

            const fileBuffer = fs.readFileSync(fullPath);
            const integrityHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

            const existingHash = await DocumentGed.findOne({ where: { integrityHash } });
            if (existingHash) {
                fs.unlinkSync(fullPath);
                return res.status(409).json({ success: false, message: "Ce fichier existe déjà", existingDocumentId: existingHash.id });
            }

            let reference = req.body.reference || null;
            if (!reference && req.body.domainId && req.body.documentTypeId) {
                const domain = await Domain.findByPk(Number(req.body.domainId));
                const docType = await DocumentType.findByPk(Number(req.body.documentTypeId));
                if (domain && docType && docType.shortCode) {
                    const year = new Date().getFullYear();
                    reference = await ReferenceService.generer(domain.code, docType.shortCode, year);
                }
            }

            let classificationPath = req.body.classificationPath || null;
            if (!classificationPath && (req.body.anneeAcademiqueId || req.body.parcoursId || req.body.niveauEtudeId)) {
                const parts = [];
                if (req.body.anneeAcademiqueId) parts.push(`annee:${req.body.anneeAcademiqueId}`);
                if (req.body.parcoursId) parts.push(`parcours:${req.body.parcoursId}`);
                if (req.body.niveauEtudeId) parts.push(`niveau:${req.body.niveauEtudeId}`);
                if (req.body.semestre) parts.push(`semestre:${req.body.semestre}`);
                if (req.body.classeId) parts.push(`classe:${req.body.classeId}`);
                classificationPath = parts.join('/');
            }

            const namingDomain = req.body.domainId ? await Domain.findByPk(Number(req.body.domainId)) : null;
            const autoTitre = req.body.titre || (await NamingConventionService.buildDocumentName({
                anneeAcademiqueId: req.body.anneeAcademiqueId ? Number(req.body.anneeAcademiqueId) : undefined,
                domainCode: namingDomain?.code,
                processusGenerateurId: req.body.processusGenerateurId || undefined,
                niveauEtudeId: req.body.niveauEtudeId ? Number(req.body.niveauEtudeId) : undefined,
                classeId: req.body.classeId ? Number(req.body.classeId) : undefined,
                documentTypeId: req.body.documentTypeId ? Number(req.body.documentTypeId) : undefined
            })) || file.originalname;

            const document = await DocumentGed.create({
                titre: autoTitre,
                reference,
                eleve: req.body.eleve || null,
                parcours: req.body.parcours || null,
                categorie: req.body.categorie || null,
                tags: req.body.tags || ocrData.motsCles.join(', '),
                type: req.body.type || (file.mimetype && file.mimetype.includes('tiff') ? 'TIFF' : 'PDF'),
                statut: req.body.statut || 'Disponible',
                fichier: finalFilename,
                taille: `${(file.size / 1024).toFixed(1)} Ko`,
                uploaderId: (req as any).utilisateurId,
                folderId: folderId ? Number(folderId) : undefined,
                sessionId: req.body.sessionId ? Number(req.body.sessionId) : undefined,
                metadata: parseJsonField(req.body.metadata) || null,
                dureeConservation: req.body.dureeConservation || null,
                archivedUntil: req.body.archivedUntil || null,
                isArchived: req.body.isArchived === 'true' || req.body.isArchived === true,
                nbPages: ocrData.nbPages || undefined,
                auteur: ocrData.auteur || undefined,
                dateDocument: ocrData.dateDocument ? new Date(ocrData.dateDocument) : undefined,
                contenuTexte: ocrData.contenuTexte || undefined,
                domainId: req.body.domainId ? Number(req.body.domainId) : undefined,
                documentTypeId: req.body.documentTypeId ? Number(req.body.documentTypeId) : undefined,
                classificationPath,
                sourceType: req.body.sourceType || 'numerise_interne',
                externalIssuer: req.body.externalIssuer || null,
                receptionDate: new Date(),
                confidentialityLevel: req.body.confidentialityLevel || 'interne',
                lifecycleStatus: req.body.lifecycleStatus || 'courant',
                integrityHash,
                versionMajor: 1,
                versionMinor: 0,
                isCurrentVersion: true,
                isLocked: false,
                anneeAcademiqueId: req.body.anneeAcademiqueId ? Number(req.body.anneeAcademiqueId) : undefined,
                parcoursId: req.body.parcoursId ? Number(req.body.parcoursId) : undefined,
                niveauEtudeId: req.body.niveauEtudeId ? Number(req.body.niveauEtudeId) : undefined,
                semestre: req.body.semestre || undefined,
                classeId: req.body.classeId ? Number(req.body.classeId) : undefined,
                salleId: req.body.salleId ? Number(req.body.salleId) : undefined,
                processusGenerateurId: req.body.processusGenerateurId || undefined,
                storageLocation: req.body.storageLocation || undefined,
                isEncrypted: req.body.isEncrypted === 'true' || req.body.isEncrypted === true,
                cursusApprenantId: req.body.cursusApprenantId ? Number(req.body.cursusApprenantId) : undefined,
                inscriptionDossierId: req.body.inscriptionDossierId ? Number(req.body.inscriptionDossierId) : undefined,
                bulletinId: req.body.bulletinId ? Number(req.body.bulletinId) : undefined,
                bordereauId: req.body.bordereauId ? Number(req.body.bordereauId) : undefined,
                verificationCode: crypto.randomBytes(4).toString('hex').toUpperCase()
            });

            await AuditService.log(document.id, (req as any).utilisateurId, 'creation', {
                titre: document.titre,
                reference: document.reference
            });

            return res.status(201).json(document);
        } catch (error) {
            console.error('upload ERROR:', error);
            return res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
        }
    }

    static async uploadBatch(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
            (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        try {
            const files = req.files as Express.Multer.File[];
            if (!files || files.length === 0) {
                return res.status(400).json({ success: false, message: "Aucun fichier fourni" });
            }

            const folderId = req.body.folderId;

            let classificationPath = req.body.classificationPath || null;
            if (!classificationPath && (req.body.anneeAcademiqueId || req.body.parcoursId || req.body.niveauEtudeId)) {
                const parts: string[] = [];
                if (req.body.anneeAcademiqueId) parts.push(`annee:${req.body.anneeAcademiqueId}`);
                if (req.body.parcoursId) parts.push(`parcours:${req.body.parcoursId}`);
                if (req.body.niveauEtudeId) parts.push(`niveau:${req.body.niveauEtudeId}`);
                if (req.body.semestre) parts.push(`semestre:${req.body.semestre}`);
                if (req.body.classeId) parts.push(`classe:${req.body.classeId}`);
                classificationPath = parts.join('/');
            }

            const domainId = req.body.domainId ? Number(req.body.domainId) : undefined;
            const domain = domainId ? await Domain.findByPk(domainId) : null;
            const docTypeId = req.body.documentTypeId ? Number(req.body.documentTypeId) : undefined;
            const docType = docTypeId ? await DocumentType.findByPk(docTypeId) : null;
            const dateDocumentStr = req.body.dateDocument;

            const createdDocs: any[] = [];

            for (const file of files) {
                let finalFilename = file.filename;
                if (folderId) {
                    const folderPath = path.resolve(process.cwd(), UPLOAD_DIR, String(folderId));
                    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
                    const oldPath = path.resolve(process.cwd(), UPLOAD_DIR, file.filename);
                    const newPath = path.resolve(folderPath, file.filename);
                    fs.renameSync(oldPath, newPath);
                    finalFilename = path.join(String(folderId), file.filename).replace(/\\/g, '/');
                }

                const fullPath = path.resolve(process.cwd(), UPLOAD_DIR, finalFilename);
                let ocrData: any = { nbPages: undefined, auteur: undefined, dateDocument: undefined, motsCles: [], contenuTexte: undefined };
                try {
                  ocrData = await OcrService.extraireMetadonnees(fullPath);
                } catch (ocrErr) {
                  console.error('OCR skipped for', file.filename, ocrErr);
                }
                const fileBuffer = fs.readFileSync(fullPath);
                const integrityHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

                const existingHash = await DocumentGed.findOne({ where: { integrityHash } });
                if (existingHash) {
                    fs.unlinkSync(fullPath);
                    createdDocs.push({ skipped: true, reason: 'Doublon', existingDocumentId: existingHash.id, originalName: file.originalname });
                    continue;
                }

                let dateDocument = dateDocumentStr || ocrData.dateDocument || null;
                let duaEndDate: Date | undefined = undefined;
                if (dateDocument && docType && docType.duaDurationYears) {
                    const d = new Date(dateDocument);
                    d.setFullYear(d.getFullYear() + docType.duaDurationYears);
                    duaEndDate = d;
                }

                const autoTitre = req.body.titre || (await NamingConventionService.buildDocumentName({
                    anneeAcademiqueId: req.body.anneeAcademiqueId ? Number(req.body.anneeAcademiqueId) : undefined,
                    domainCode: domain?.code,
                    processusGenerateurId: req.body.processusGenerateurId || undefined,
                    niveauEtudeId: req.body.niveauEtudeId ? Number(req.body.niveauEtudeId) : undefined,
                    classeId: req.body.classeId ? Number(req.body.classeId) : undefined,
                    documentTypeId: docTypeId
                })) || file.originalname;

                const doc = await DocumentGed.create({
                    titre: autoTitre,
                    reference: req.body.reference || null,
                    categorie: req.body.categorie || null,
                    tags: req.body.tags || ocrData.motsCles.join(', '),
                    type: file.mimetype?.includes('tiff') ? 'TIFF' : 'PDF',
                    statut: 'Disponible',
                    fichier: finalFilename,
                    taille: `${(file.size / 1024).toFixed(1)} Ko`,
                    uploaderId: (req as any).utilisateurId,
                    folderId: folderId ? Number(folderId) : undefined,
                    metadata: parseJsonField(req.body.metadata) || null,
                    nbPages: ocrData.nbPages || undefined,
                    auteur: ocrData.auteur || undefined,
                    dateDocument: dateDocument ? new Date(dateDocument) : undefined,
                    contenuTexte: ocrData.contenuTexte || undefined,
                    domainId,
                    documentTypeId: docTypeId,
                    classificationPath,
                    sourceType: req.body.sourceType || 'numerise_interne',
                    externalIssuer: req.body.externalIssuer || null,
                    receptionDate: new Date(),
                    confidentialityLevel: req.body.confidentialityLevel || 'interne',
                    lifecycleStatus: req.body.lifecycleStatus || 'courant',
                    duaEndDate,
                    integrityHash,
                    versionMajor: 1,
                    versionMinor: 0,
                    isCurrentVersion: true,
                    isLocked: false,
                    anneeAcademiqueId: req.body.anneeAcademiqueId ? Number(req.body.anneeAcademiqueId) : undefined,
                    parcoursId: req.body.parcoursId ? Number(req.body.parcoursId) : undefined,
                    niveauEtudeId: req.body.niveauEtudeId ? Number(req.body.niveauEtudeId) : undefined,
                    semestre: req.body.semestre || undefined,
                    classeId: req.body.classeId ? Number(req.body.classeId) : undefined,
                    processusGenerateurId: req.body.processusGenerateurId || undefined,
                    storageLocation: req.body.storageLocation || undefined,
                    isEncrypted: req.body.isEncrypted === 'true' || req.body.isEncrypted === true,
                    verificationCode: crypto.randomBytes(4).toString('hex').toUpperCase()
                });

                await AuditService.log(doc.id, (req as any).utilisateurId, 'creation', {
                    titre: doc.titre,
                    batch: true
                });

                createdDocs.push(doc);
            }

            return res.status(201).json({ data: createdDocs, total: createdDocs.length });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async requestSignature(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
            (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        try {
            const document = await DocumentGed.findByPk(req.params.id);
            if (!document) {
                return res.status(404).json({ success: false, message: "Document non trouvé" });
            }
            if (document.lifecycleStatus !== 'courant') {
                return res.status(400).json({ success: false, message: "Seuls les documents 'courant' peuvent être soumis à signature" });
            }

            const existing = await GedSignature.findOne({ where: { documentId: document.id, status: 'en_attente' } });
            if (existing) {
                return res.status(409).json({ success: false, message: "Une demande de signature est déjà en attente" });
            }

            const signature = await GedSignature.create({
                documentId: document.id,
                requestedBy: (req as any).utilisateurId
            });

            await document.update({ lifecycleStatus: 'intermediaire', isLocked: true, lockedBy: (req as any).utilisateurId, lockedAt: new Date() });
            await AuditService.log(document.id, (req as any).utilisateurId, 'validation', { action: 'demande_signature', signatureId: signature.id });
            await NotificationGedService.notifierSignatureDemandee(document.id, (req as any).utilisateurId);

            return res.status(201).json(signature);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async sign(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
            (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        try {
            const document = await DocumentGed.findByPk(req.params.id);
            if (!document) {
                return res.status(404).json({ success: false, message: "Document non trouvé" });
            }

            const signature = await GedSignature.findOne({ where: { documentId: document.id, status: 'en_attente' } });
            if (!signature) {
                return res.status(404).json({ success: false, message: "Aucune demande de signature en attente" });
            }

            const verificationCode = crypto.randomBytes(4).toString('hex').toUpperCase();

            await signature.update({
                status: 'signe',
                signedBy: (req as any).utilisateurId,
                signedAt: new Date()
            });

            await document.update({
                lifecycleStatus: 'definitif',
                isLocked: false,
                lockedBy: null,
                lockedAt: null
            });

            await AuditService.log(document.id, (req as any).utilisateurId, 'validation', { action: 'signature', verificationCode });
            await NotificationGedService.notifierSignatureEffectuee(document.id, (req as any).utilisateurId);

            return res.status(200).json({ signature, verificationCode });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async rejectSignature(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
            (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        try {
            const document = await DocumentGed.findByPk(req.params.id);
            if (!document) {
                return res.status(404).json({ success: false, message: "Document non trouvé" });
            }

            const signature = await GedSignature.findOne({ where: { documentId: document.id, status: 'en_attente' } });
            if (!signature) {
                return res.status(404).json({ success: false, message: "Aucune demande de signature en attente" });
            }

            const reason = req.body.reason || 'Aucune raison fournie';

            await signature.update({
                status: 'rejete',
                rejectReason: reason,
                rejectedBy: (req as any).utilisateurId,
                rejectedAt: new Date()
            });

            await document.update({
                lifecycleStatus: 'courant',
                isLocked: false,
                lockedBy: null,
                lockedAt: null
            });

            await AuditService.log(document.id, (req as any).utilisateurId, 'modification', { action: 'rejet_signature', reason });

            return res.status(200).json(signature);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async verifyDocument(req: Request, res: Response): Promise<Response> {
        try {
            const document = await DocumentGed.findByPk(req.params.id, {
                attributes: ['id', 'titre', 'reference', 'integrityHash', 'versionMajor', 'versionMinor', 'createdAt', 'lifecycleStatus']
            });
            if (!document) {
                return res.status(404).json({ success: false, message: "Document non trouvé" });
            }

            const signature = await GedSignature.findOne({
                where: { documentId: document.id, status: 'signe' },
                include: [{ association: 'signer', attributes: ['id', 'nom', 'prenoms'] }],
                order: [['signedAt', 'DESC']]
            });

            return res.status(200).json({
                document: {
                    id: document.id,
                    titre: document.titre,
                    reference: document.reference,
                    version: `${document.versionMajor}.${document.versionMinor}`,
                    dateEmission: document.createdAt,
                    statut: document.lifecycleStatus === 'definitif' ? 'Authentifié' : document.lifecycleStatus
                },
                signature: signature ? {
                    signePar: signature.signer ? `${signature.signer.prenoms} ${signature.signer.nom}` : 'Inconnu',
                    dateSignature: signature.signedAt
                } : null,
                authentique: document.lifecycleStatus === 'definitif' && !!signature
            });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
            (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        try {
            const document = await DocumentGed.findByPk(req.params.id);
            if (!document) {
                return res.status(404).json({ success: false, message: "Document non trouvé" });
            }

            if (document.isLocked && document.lockedBy && document.lockedBy !== (req as any).utilisateurId) {
                return res.status(423).json({ success: false, message: "Document verrouillé par un autre utilisateur" });
            }

            if (document.lifecycleStatus === 'definitif' || document.lifecycleStatus === 'a_detruire') {
                return res.status(400).json({
                    success: false,
                    message: `Impossible de modifier un document avec le statut '${document.lifecycleStatus}'`
                });
            }

            const updatableFields = [
                'titre', 'eleve', 'parcours', 'categorie', 'tags',
                'classificationPath', 'externalIssuer', 'folderId', 'sessionId',
                'anneeAcademiqueId', 'parcoursId', 'niveauEtudeId',
                'semestre', 'classeId', 'salleId', 'cursusApprenantId',
                'inscriptionDossierId', 'bulletinId', 'bordereauId',
                'processusGenerateurId', 'storageLocation', 'isEncrypted', 'encryptionKeyId'
            ];
            const updates: any = {};
            for (const field of updatableFields) {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field];
                }
            }

            if (req.file) {
                const oldFilePath = path.resolve(process.cwd(), UPLOAD_DIR, document.fichier);
                if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);

                const folderId = req.body.folderId || document.folderId;
                let finalFilename = req.file.filename;
                if (folderId) {
                    const folderPath = path.resolve(process.cwd(), UPLOAD_DIR, String(folderId));
                    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
                    const tmpPath = path.resolve(process.cwd(), UPLOAD_DIR, req.file.filename);
                    const newPath = path.resolve(folderPath, req.file.filename);
                    fs.renameSync(tmpPath, newPath);
                    finalFilename = path.join(String(folderId), req.file.filename).replace(/\\/g, '/');
                }
                updates.fichier = finalFilename;
                updates.taille = `${(req.file.size / 1024).toFixed(1)} Ko`;

                const fullPath = path.resolve(process.cwd(), UPLOAD_DIR, finalFilename);
                let ocrData: any = { nbPages: undefined, auteur: undefined, dateDocument: undefined, contenuTexte: undefined };
                try {
                  ocrData = await OcrService.extraireMetadonnees(fullPath);
                } catch (ocrErr) {
                  console.error('OCR skipped for', req.file?.filename, ocrErr);
                }
                updates.nbPages = ocrData.nbPages || undefined;
                updates.auteur = ocrData.auteur || undefined;
                updates.dateDocument = ocrData.dateDocument ? new Date(ocrData.dateDocument) : undefined;
                updates.contenuTexte = ocrData.contenuTexte || undefined;

                const fileBuffer = fs.readFileSync(fullPath);
                updates.integrityHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
            }

            await document.update(updates);
            await AuditService.log(document.id, (req as any).utilisateurId, 'modification', { updates: Object.keys(updates) });

            return res.status(200).json(document);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async download(req: Request, res: Response): Promise<void> {
        try {
            const document = await DocumentGed.findByPk(req.params.id);
            if (!document) {
                res.status(404).json({ success: false, message: "Document non trouvé" });
                return;
            }

            const filePath = path.resolve(process.cwd(), UPLOAD_DIR, document.fichier);
            if (!fs.existsSync(filePath)) {
                res.status(404).json({ success: false, message: "Fichier introuvable" });
                return;
            }

            const ext = path.extname(document.fichier).toLowerCase();
            const contentType = ext === '.tiff' || ext === '.tif' ? 'image/tiff' : 'application/pdf';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `inline; filename="${document.titre}${ext}"`);

            await AuditService.log(document.id, (req as any).utilisateurId, 'telechargement');

            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
        } catch (error) {
            res.status(500).json({ success: false, error });
        }
    }

    static async exportPdf(req: Request, res: Response): Promise<void> {
        try {
            const document = await DocumentGed.findByPk(req.params.id);
            if (!document) {
                res.status(404).json({ success: false, message: "Document non trouvé" });
                return;
            }

            const outputDir = path.resolve(process.cwd(), UPLOAD_DIR, 'pdf');
            const filename = await DocumentPDFGenerator.generateGedSummary(document.toJSON(), outputDir);
            const filePath = path.resolve(outputDir, filename);
            if (!fs.existsSync(filePath)) {
                res.status(500).json({ success: false, message: "Impossible de générer le PDF" });
                return;
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${document.titre.replace(/\s+/g, '_')}.pdf"`);
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
        } catch (error) {
            res.status(500).json({ success: false, error });
        }
    }

    static async validate(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
            (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        try {
            const document = await DocumentGed.findByPk(req.params.id);
            if (!document) {
                return res.status(404).json({ success: false, message: "Document non trouvé" });
            }

            if (document.lifecycleStatus !== 'courant') {
                return res.status(400).json({
                    success: false,
                    message: "Seuls les documents avec le statut 'courant' peuvent être validés"
                });
            }

            const updates: any = {
                lifecycleStatus: 'intermediaire',
                isLocked: true,
                lockedBy: (req as any).utilisateurId,
                lockedAt: new Date()
            };

            if (document.documentTypeId) {
                const docType = await DocumentType.findByPk(document.documentTypeId);
                if (docType && docType.duaDurationYears) {
                    const duaDate = new Date();
                    duaDate.setFullYear(duaDate.getFullYear() + docType.duaDurationYears);
                    updates.duaEndDate = duaDate;
                }
            }

            await document.update(updates);
            await AuditService.log(document.id, (req as any).utilisateurId, 'validation');

            return res.status(200).json(document);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async newVersion(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
            (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        try {
            const type = req.body.type;
            const comment = req.body.comment;

            if (!type || !['mineur', 'majeur'].includes(type)) {
                return res.status(400).json({ success: false, message: "Le type doit être 'mineur' ou 'majeur'" });
            }
            if (!comment) {
                return res.status(400).json({ success: false, message: "Le commentaire est requis" });
            }

            const original = await DocumentGed.findByPk(req.params.id);
            if (!original) {
                return res.status(404).json({ success: false, message: "Document original non trouvé" });
            }

            if (original.isLocked && original.lockedBy && original.lockedBy !== (req as any).utilisateurId) {
                return res.status(423).json({ success: false, message: "Document verrouillé par un autre utilisateur" });
            }

            const originalFilePath = path.resolve(process.cwd(), UPLOAD_DIR, original.fichier);
            if (!fs.existsSync(originalFilePath)) {
                return res.status(404).json({ success: false, message: "Fichier original introuvable" });
            }

            const versionsDir = path.resolve(process.cwd(), UPLOAD_DIR, 'versions');
            if (!fs.existsSync(versionsDir)) fs.mkdirSync(versionsDir, { recursive: true });

            const ext = path.extname(original.fichier);
            const versionFilename = `v${original.versionMajor}.${original.versionMinor}_${original.id}${ext}`;
            const versionFilePath = path.resolve(versionsDir, versionFilename);
            fs.copyFileSync(originalFilePath, versionFilePath);

            let newVersionMajor = original.versionMajor;
            let newVersionMinor = original.versionMinor;
            if (type === 'majeur') {
                newVersionMajor += 1;
                newVersionMinor = 0;
            } else {
                newVersionMinor += 1;
            }

            const newDocument = await DocumentGed.create({
                titre: original.titre,
                reference: original.reference,
                eleve: original.eleve,
                parcours: original.parcours,
                categorie: original.categorie,
                tags: original.tags,
                type: original.type,
                statut: original.statut,
                fichier: `versions/${versionFilename}`.replace(/\\/g, '/'),
                taille: original.taille,
                uploaderId: (req as any).utilisateurId,
                folderId: original.folderId,
                sessionId: original.sessionId,
                metadata: original.metadata,
                nbPages: original.nbPages,
                auteur: original.auteur,
                dateDocument: original.dateDocument,
                contenuTexte: original.contenuTexte,
                domainId: original.domainId,
                documentTypeId: original.documentTypeId,
                classificationPath: original.classificationPath,
                sourceType: original.sourceType,
                externalIssuer: original.externalIssuer,
                confidentialityLevel: original.confidentialityLevel,
                lifecycleStatus: original.lifecycleStatus,
                integrityHash: original.integrityHash,
                versionMajor: newVersionMajor,
                versionMinor: newVersionMinor,
                versionComment: comment,
                parentDocumentId: original.id,
                isCurrentVersion: true,
                isLocked: false,
                anneeAcademiqueId: original.anneeAcademiqueId,
                parcoursId: original.parcoursId,
                niveauEtudeId: original.niveauEtudeId
            });

            await original.update({ isCurrentVersion: false });

            await AuditService.log(newDocument.id, (req as any).utilisateurId, 'nouvelle_version', {
                type,
                comment,
                originalId: original.id
            });

            return res.status(201).json(newDocument);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async lock(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
            (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        try {
            const document = await DocumentGed.findByPk(req.params.id);
            if (!document) {
                return res.status(404).json({ success: false, message: "Document non trouvé" });
            }

            if (document.isLocked && document.lockedBy && document.lockedBy !== (req as any).utilisateurId) {
                return res.status(423).json({ success: false, message: "Document déjà verrouillé par un autre utilisateur" });
            }

            await document.update({
                isLocked: true,
                lockedBy: (req as any).utilisateurId,
                lockedAt: new Date()
            });

            await AuditService.log(document.id, (req as any).utilisateurId, 'verrouillage');

            return res.status(200).json(document);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async unlock(req: Request, res: Response): Promise<Response> {
        try {
            const document = await DocumentGed.findByPk(req.params.id);
            if (!document) {
                return res.status(404).json({ success: false, message: "Document non trouvé" });
            }

            const userId = (req as any).utilisateurId;
            const userRole = (req as any).utilisateurRole;
            const isOwner = document.lockedBy === userId;
            const isAuthorized = userRole === RolesUtilisateur.ADMIN || userRole === RolesUtilisateur.INSTITUTION || isOwner;

            if (!isAuthorized) {
                return res.status(403).json({ success: false, message: "Non autorisé à déverrouiller ce document" });
            }

            await document.update({
                isLocked: false,
                lockedBy: null,
                lockedAt: null
            });

            await AuditService.log(document.id, userId, 'deverrouillage');

            return res.status(200).json(document);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async markForDeletion(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'administrateur" });
        }

        try {
            const document = await DocumentGed.findByPk(req.params.id);
            if (!document) {
                return res.status(404).json({ success: false, message: "Document non trouvé" });
            }

            if (document.lifecycleStatus === 'definitif') {
                return res.status(400).json({
                    success: false,
                    message: "Les documents avec le statut 'definitif' ne peuvent pas être détruits"
                });
            }

            const reason = req.body.reason;
            if (!reason) {
                return res.status(400).json({ success: false, message: "La raison est requise" });
            }

            await document.update({ lifecycleStatus: 'a_detruire' });

            await DisposalRecord.create({
                documentId: document.id,
                reason,
                requestedBy: (req as any).utilisateurId,
                requestedAt: new Date(),
                status: 'en_attente'
            });

            await AuditService.log(document.id, (req as any).utilisateurId, 'marquage_destruction', { reason });

            return res.status(200).json({ success: true, message: "Document marqué pour destruction" });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async confirmDeletion(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'administrateur" });
        }

        try {
            const document = await DocumentGed.findByPk(req.params.id);
            if (!document) {
                return res.status(404).json({ success: false, message: "Document non trouvé" });
            }

            const disposalRecord = await DisposalRecord.findOne({
                where: { documentId: document.id, status: 'en_attente' }
            });
            if (!disposalRecord) {
                return res.status(404).json({
                    success: false,
                    message: "Aucune demande de destruction en attente pour ce document"
                });
            }

            const filePath = path.resolve(process.cwd(), UPLOAD_DIR, document.fichier);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            await document.destroy();

            await disposalRecord.update({
                status: 'validee',
                confirmedBy: (req as any).utilisateurId,
                confirmedAt: new Date()
            });

            await AuditService.log(document.id, (req as any).utilisateurId, 'suppression_effective', {
                reason: req.body.reason || undefined
            });

            return res.status(200).json({ success: true, message: "Document supprimé définitivement" });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async getAuditTrail(req: Request, res: Response): Promise<Response> {
        try {
            const logs = await DocumentAuditLog.findAll({
                where: { documentId: req.params.id },
                order: [['actionDate', 'DESC']]
            });

            const userIds = [...new Set(logs.map(l => l.userId))];
            const users = await Utilisateur.findAll({
                where: { id: userIds },
                attributes: ['id', 'nom', 'prenoms']
            });
            const userMap = Object.fromEntries(users.map(u => [u.id, { nom: u.nom, prenoms: u.prenoms }]));
            const enrichedLogs = logs.map(l => ({
                ...l.toJSON(),
                user: userMap[l.userId] || null
            }));

            return res.status(200).json(enrichedLogs);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'administrateur" });
        }

        try {
            const document = await DocumentGed.findByPk(req.params.id);
            if (!document) {
                return res.status(404).json({ success: false, message: "Document non trouvé" });
            }

            if (document.lifecycleStatus === 'definitif') {
                return res.status(400).json({
                    success: false,
                    message: "Les documents avec le statut 'definitif' ne peuvent pas être supprimés"
                });
            }

            // Supprimer le fichier physique
            const filePath = path.resolve(process.cwd(), UPLOAD_DIR, document.fichier);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            // Soft-delete en base
            await document.destroy();

            await AuditService.log(document.id, (req as any).utilisateurId, 'suppression_effective');

            return res.status(200).json({ success: true, message: "Document supprimé" });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async restore(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'administrateur" });
        }

        try {
            const document = await DocumentGed.findByPk(req.params.id, { paranoid: false });
            if (!document) {
                return res.status(404).json({ success: false, message: "Document non trouvé" });
            }

            if (!document.deletedAt) {
                return res.status(400).json({ success: false, message: "Le document n'est pas supprimé" });
            }

            await document.restore();
            await document.update({
                lifecycleStatus: 'courant',
                isCurrentVersion: true
            });

            await AuditService.log(document.id, (req as any).utilisateurId, 'restauration');

            return res.status(200).json(document);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }
}
