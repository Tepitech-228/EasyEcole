import { Request, Response } from "express";
import { Op } from "sequelize";
import RegistreCourrier from "../models/RegistreCourrier";
import { DocumentGed } from "../models/DocumentGed";

export default class CourrierController {

  static async list(req: Request, res: Response): Promise<Response> {
    try {
      const { sens, annee, q, page = '1', pageSize = '50' } = req.query;
      const where: any = {};
      if (sens) where.sens = sens;
      if (annee) where.annee = Number(annee);
      if (q) where.objet = { [Op.like]: `%${q}%` };

      const offset = (Number(page) - 1) * Number(pageSize);
      const { rows, count } = await RegistreCourrier.findAndCountAll({
        where,
        include: [
          { association: 'document', attributes: ['id', 'titre', 'reference', 'fichier'] },
          { association: 'utilisateur', attributes: ['id', 'nom', 'prenoms'] }
        ],
        order: [['annee', 'DESC'], ['numeroOrdre', 'DESC']],
        limit: Number(pageSize),
        offset
      });

      return res.json({ data: rows, total: count, page: Number(page), pageSize: Number(pageSize) });
    } catch (error: any) {
      console.error('Erreur', error);
      return res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const record = await RegistreCourrier.findByPk(req.params.id, {
        include: [
          { association: 'document', attributes: ['id', 'titre', 'reference', 'fichier'] },
          { association: 'utilisateur', attributes: ['id', 'nom', 'prenoms'] }
        ]
      });
      if (!record) return res.status(404).json({ success: false, message: 'Entree non trouvee' });
      return res.json(record);
    } catch (error: any) {
      console.error('Erreur', error);
      return res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const { sens, objet, expediteur, destinataire, dateCourrier, modeEnvoi, accuseReception, documentId, annotations } = req.body;
      if (!sens || !objet) return res.status(400).json({ success: false, message: 'sens et objet requis' });

      const annee = new Date().getFullYear();
      const lastRecord = await RegistreCourrier.findOne({
        where: { sens, annee },
        order: [['numeroOrdre', 'DESC']]
      });
      const numeroOrdre = lastRecord ? lastRecord.numeroOrdre + 1 : 1;

      const record = await RegistreCourrier.create({
        sens, numeroOrdre, annee, objet,
        expediteur: expediteur || null,
        destinataire: destinataire || null,
        dateCourrier: dateCourrier || new Date(),
        modeEnvoi: modeEnvoi || null,
        accuseReception: accuseReception || false,
        documentId: documentId || null,
        annotations: annotations || null,
        utilisateurId: (req as any).utilisateurId
      });

      return res.status(201).json(record);
    } catch (error: any) {
      console.error('Erreur', error);
      return res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const record = await RegistreCourrier.findByPk(req.params.id);
      if (!record) return res.status(404).json({ success: false, message: 'Entree non trouvee' });

      const updatableFields = ['objet', 'expediteur', 'destinataire', 'dateCourrier', 'modeEnvoi', 'accuseReception', 'documentId', 'annotations'];
      for (const field of updatableFields) {
        if (req.body[field] !== undefined) (record as any)[field] = req.body[field];
      }
      await record.save();
      return res.json(record);
    } catch (error: any) {
      console.error('Erreur', error);
      return res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  static async remove(req: Request, res: Response): Promise<Response> {
    try {
      const record = await RegistreCourrier.findByPk(req.params.id);
      if (!record) return res.status(404).json({ success: false, message: 'Entree non trouvee' });
      await record.destroy();
      return res.json({ success: true });
    } catch (error: any) {
      console.error('Erreur', error);
      return res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  static async getNextNumero(req: Request, res: Response): Promise<Response> {
    try {
      const { sens } = req.query;
      if (!sens) return res.status(400).json({ success: false, message: 'sens requis' });
      const annee = new Date().getFullYear();
      const lastRecord = await RegistreCourrier.findOne({
        where: { sens: String(sens), annee },
        order: [['numeroOrdre', 'DESC']]
      });
      const nextNum = lastRecord ? lastRecord.numeroOrdre + 1 : 1;
      return res.json({ annee, nextNumero: nextNum });
    } catch (error: any) {
      console.error('Erreur', error);
      return res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  static async exportCsv(req: Request, res: Response): Promise<Response> {
    try {
      const { sens, annee } = req.query;
      const where: any = {};
      if (sens) where.sens = sens;
      if (annee) where.annee = Number(annee);

      const records = await RegistreCourrier.findAll({
        where,
        include: [{ association: 'document', attributes: ['id', 'titre', 'reference'] }],
        order: [['annee', 'DESC'], ['numeroOrdre', 'ASC']]
      });

      const headers = ['Numero', 'Annee', 'Sens', 'Date', 'Expediteur', 'Destinataire', 'Objet', 'Mode', 'Accuse', 'Document lie', 'Annotations'];
      const rows = records.map(r => [
        r.numeroOrdre, r.annee, r.sens === 'entrant' ? 'Entrant' : 'Sortant',
        r.dateCourrier ? new Date(r.dateCourrier).toLocaleDateString('fr-FR') : '',
        r.expediteur || '', r.destinataire || '', r.objet, r.modeEnvoi || '',
        r.accuseReception ? 'Oui' : 'Non',
        (r as any).document?.reference || (r as any).document?.titre || '',
        r.annotations || ''
      ]);
      const csv = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=registre-courrier-${annee || 'complet'}.csv`);
      return res.send(csv);
    } catch (error: any) {
      console.error('Erreur', error);
      return res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }
}
