import { Request, Response } from "express";
import { SessionGed } from "../models/SessionGed";
import { DocumentGed } from "../models/DocumentGed";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import Folder from "../models/Folder";
import crypto from "crypto";
import { AuditService } from "../../../core/services/AuditService";

function parseJsonField(value: any): any {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export default class SessionGedController {
  static async list(req: Request, res: Response): Promise<Response> {
    try {
      const includeDocuments = String(req.query.includeDocuments || 'false') === 'true';

      const sessions = await SessionGed.findAll({
        include: [
          { association: SessionGed.associations.creator, attributes: ['id', 'nom', 'prenoms'] },
          ...(includeDocuments ? [{ association: SessionGed.associations.documents }] : [])
        ],
        order: [['createdAt', 'DESC']]
      });
      return res.status(200).json(sessions);

    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const includeDocuments = String(req.query.includeDocuments || 'false') === 'true';

      const session = await SessionGed.findByPk(req.params.id, {
        include: [
          { association: SessionGed.associations.creator, attributes: ['id', 'nom', 'prenoms'] },
          ...(includeDocuments ? [{ association: SessionGed.associations.documents }] : [])
        ]
      });
      if (!session) {
        return res.status(404).json({ success: false, message: 'Session non trouvée' });
      }
      return res.status(200).json(session);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
      (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
      return res.status(403).json({ success: false, message: "Réservé à l'institution" });
    }

    try {
      const session = await SessionGed.create({
        nom: req.body.nom,
        description: req.body.description || null,
        startDate: req.body.startDate || null,
        endDate: req.body.endDate || null,
        folderId: req.body.folderId || null,
        categorie: req.body.categorie || null,
        fields: parseJsonField(req.body.fields),
        participantIds: parseJsonField(req.body.participantIds),
        status: req.body.status || 'active',
        createdBy: (req as any).utilisateurId
      });
      return res.status(201).json(session);
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
      const session = await SessionGed.findByPk(req.params.id);
      if (!session) {
        return res.status(404).json({ success: false, message: 'Session non trouvée' });
      }

      session.nom = req.body.nom || session.nom;
      session.description = req.body.description || session.description;
      session.startDate = req.body.startDate || session.startDate;
      session.endDate = req.body.endDate || session.endDate;
      session.folderId = req.body.folderId || session.folderId;
      session.categorie = req.body.categorie || session.categorie;
      session.fields = parseJsonField(req.body.fields) || session.fields;
      session.participantIds = parseJsonField(req.body.participantIds) || session.participantIds;
      session.status = req.body.status || session.status;
      await session.save();

      return res.status(200).json(session);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async uploadBatch(req: Request, res: Response): Promise<Response> {
    if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
      (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
      return res.status(403).json({ success: false, message: "Réservé à l'institution" });
    }

    try {
      const sessionId = req.body.sessionId ? Number(req.body.sessionId) : null;
      if (!sessionId) {
        return res.status(400).json({ success: false, message: 'SessionId requis' });
      }

      const session = await SessionGed.findByPk(sessionId);
      if (!session) {
        return res.status(404).json({ success: false, message: 'Session introuvable' });
      }

      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });
      }

      const folderId = req.body.folderId ? Number(req.body.folderId) : null;
      const metadata = parseJsonField(req.body.metadata);
      const archivedUntil = req.body.archivedUntil || null;
      const isArchived = req.body.isArchived === 'true' || req.body.isArchived === true;
      const createdDocs = [];

      for (const file of files) {
        let finalFilename = file.filename;
        if (folderId) {
          const folderPath = `public/ged/${folderId}`;
          if (!require('fs').existsSync(folderPath)) require('fs').mkdirSync(folderPath, { recursive: true });
          const oldPath = `public/ged/${file.filename}`;
          const newPath = `${folderPath}/${file.filename}`;
          require('fs').renameSync(oldPath, newPath);
          finalFilename = `${folderId}/${file.filename}`;
        }

        const document = await DocumentGed.create({
          titre: metadata?.titre || file.originalname,
          reference: metadata?.reference || null,
          eleve: metadata?.eleve || null,
          parcours: metadata?.parcours || null,
          categorie: metadata?.categorie || null,
          tags: metadata?.tags || null,
          nommage: metadata?.nommage || null,
          type: metadata?.type || (file.mimetype.includes('tiff') ? 'TIFF' : 'PDF'),
          statut: metadata?.statut || 'Disponible',
          fichier: finalFilename,
          taille: `${(file.size / 1024).toFixed(1)} Ko`,
          uploaderId: (req as any).utilisateurId,
          folderId: folderId || undefined,
          sessionId,
          metadata: metadata || null,
          dureeConservation: metadata?.dureeConservation || null,
          archivedUntil,
          isArchived
        });

        createdDocs.push(document);
      }

      return res.status(201).json(createdDocs);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async generateShareLink(req: Request, res: Response): Promise<Response> {
    try {
      const session = await SessionGed.findByPk(req.params.id, {
        include: [{ association: SessionGed.associations.documents }]
      });
      if (!session) {
        return res.status(404).json({ success: false, message: 'Session non trouvée' });
      }

      const expiresInDays = parseInt(String(req.query.expiresInDays || '7'), 10);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const payload = {
        sessionId: session.id,
        documentIds: (session as any).documents?.map((d: any) => d.id) || [],
        expiresAt: expiresAt.toISOString(),
        createdBy: (req as any).utilisateurId
      };

      const secret = crypto.randomBytes(32).toString('hex');
      const data = JSON.stringify(payload);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secret.slice(0, 32), 'utf8'), iv);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const token = iv.toString('hex') + ':' + encrypted;

      for (const docId of payload.documentIds) {
        await AuditService.log(docId, (req as any).utilisateurId, 'consultation', { shared: true, sessionId: session.id });
      }

      return res.status(200).json({
        token,
        url: `/ged/shared/${token}`,
        expiresAt
      });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}
