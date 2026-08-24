import { Request, Response } from "express";
import { DocGenDocument } from "../models/DocGenDocument";
import { DocGenSignature } from "../models/DocGenSignature";
import { Op } from "sequelize";

export default class SigningController {
  static async getPendingForTeacher(req: Request, res: Response): Promise<Response> {
    try {
      const documents = await DocGenDocument.findAll({
        where: { statut: 'en_attente_enseignant' },
        attributes: ['id', 'metadata']
      });
      const grouped: Record<string, number> = {};
      for (const doc of documents) {
        let meta: any = {};
        try { meta = JSON.parse(doc.metadata || '{}'); } catch { console.warn('[DOCGEN][signatures] metadata JSON invalide pour document #'+doc.id); }
        const classe = meta.classe || 'inconnue';
        grouped[classe] = (grouped[classe] || 0) + 1;
      }
      const result = Object.entries(grouped).map(([classe, count]) => ({ classe, count }));
      return res.status(200).json(result);
    } catch (error) {
      console.error('[DOCGEN][Signing]', error);
      return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: "Erreur interne" });
    }
  }

  static async getPendingForDirector(req: Request, res: Response): Promise<Response> {
    try {
      const documents = await DocGenDocument.findAll({
        where: { statut: 'en_attente_directeur' },
        attributes: ['id', 'metadata']
      });
      const grouped: Record<string, number> = {};
      for (const doc of documents) {
        let meta: any = {};
        try { meta = JSON.parse(doc.metadata || '{}'); } catch { console.warn('[DOCGEN][signatures] metadata JSON invalide pour document #'+doc.id); }
        const classe = meta.classe || 'inconnue';
        grouped[classe] = (grouped[classe] || 0) + 1;
      }
      const result = Object.entries(grouped).map(([classe, count]) => ({ classe, count }));
      return res.status(200).json(result);
    } catch (error) {
      console.error('[DOCGEN][Signing]', error);
      return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: "Erreur interne" });
    }
  }

  static async signBatch(req: Request, res: Response): Promise<Response> {
    try {
      const { documentIds, signataireId, signataireType } = req.body;
      if (!documentIds || !signataireId || !signataireType) {
        return res.status(400).json({ success: false, message: 'documentIds, signataireId et signataireType requis' });
      }
      const results: any[] = [];
      for (const documentId of documentIds) {
        const document = await DocGenDocument.findByPk(documentId);
        if (!document) {
          results.push({ documentId, success: false, message: 'Document non trouvé' });
          continue;
        }
        await DocGenSignature.create({
          documentId,
          signataireId,
          signataireType,
          type: signataireType === 'enseignant' ? 'validation_enseignant' : 'validation_directeur',
          statut: 'signé',
          signedAt: new Date()
        });
        const nextStatut = signataireType === 'enseignant' ? 'en_attente_directeur' : 'signé';
        await document.update({ statut: nextStatut });
        results.push({ documentId, success: true, statut: nextStatut });
      }
      return res.status(200).json({ results });
    } catch (error) {
      console.error('[DOCGEN][Signing]', error);
      return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: "Erreur interne" });
    }
  }

  static async getDocumentsByClasse(req: Request, res: Response): Promise<Response> {
    try {
      const { classe } = req.params;
      const { statut } = req.query;
      const where: any = {};
      if (statut) where.statut = String(statut);
      const documents = await DocGenDocument.findAll({ where });
      const filtered = documents.filter(doc => {
        let meta: any = {};
        try { meta = JSON.parse(doc.metadata || '{}'); } catch { console.warn('[DOCGEN][signatures] metadata JSON invalide pour document #'+doc.id); }
        return meta.classe === classe;
      });
      return res.status(200).json(filtered);
    } catch (error) {
      console.error('[DOCGEN][Signing]', error);
      return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: "Erreur interne" });
    }
  }
}
