import { Request, Response } from "express";
import path from "path";
import { Op } from "sequelize";
import { Devoir } from "../models/Devoir";
import { SoumissionDevoir } from "../models/SoumissionDevoir";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";

const UPLOAD_DIR = "public/elearning/devoirs";

export default class DevoirController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const coursId = req.query.coursId as string | undefined;
      const where: any = {};
      if (coursId) where.coursId = coursId;

      const role = (req as any).utilisateurRole;
      if (role === RolesUtilisateur.APPRENANT) {
        const devoirs = await Devoir.findAll({
          where,
          include: [{ association: Devoir.associations.cours }],
          order: [['dateLimite', 'ASC']]
        });
        const userId = (req as any).utilisateurId;
        const result = [];
        for (const d of devoirs) {
          const soumission = await SoumissionDevoir.findOne({
            where: { devoirId: d.id, apprenantId: userId }
          });
          result.push({ ...d.toJSON(), soumission: soumission || null });
        }
        return res.status(200).send(result);
      }

      const devoirs = await Devoir.findAll({
        where,
        include: [
          { association: Devoir.associations.cours },
          { association: Devoir.associations.enseignant, attributes: ['id', 'nom', 'prenoms'] }
        ],
        order: [['dateLimite', 'ASC']]
      });
      return res.status(200).send(devoirs);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const devoir = await Devoir.findByPk(req.params.id, {
        include: [
          { association: Devoir.associations.cours },
          { association: Devoir.associations.enseignant, attributes: ['id', 'nom', 'prenoms'] }
        ]
      });
      if (!devoir) return res.status(404).json({ success: false, message: "Devoir non trouvé" });

      const role = (req as any).utilisateurRole;
      let soumissions: any[] = [];
      if (role === RolesUtilisateur.APPRENANT) {
        soumissions = await SoumissionDevoir.findAll({
          where: { devoirId: devoir.id, apprenantId: (req as any).utilisateurId },
          include: [{ association: SoumissionDevoir.associations.apprenant, attributes: ['id', 'nom', 'prenoms'] }]
        });
      } else {
        soumissions = await SoumissionDevoir.findAll({
          where: { devoirId: devoir.id },
          include: [{ association: SoumissionDevoir.associations.apprenant, attributes: ['id', 'nom', 'prenoms'] }]
        });
      }

      return res.status(200).send({ ...devoir.toJSON(), soumissions });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    if ((req as any).utilisateurRole === RolesUtilisateur.APPRENANT) {
      return res.status(403).json({ success: false, message: "Réservé aux enseignants et à l'institution" });
    }
    try {
      const devoir = await Devoir.create({
        titre: req.body.titre,
        description: req.body.description,
        dateLimite: req.body.dateLimite,
        coursId: req.body.coursId,
        enseignantId: (req as any).utilisateurId,
      });
      return res.status(201).send(devoir);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async soumettre(req: Request, res: Response): Promise<Response> {
    try {
      const devoir = await Devoir.findByPk(req.params.id);
      if (!devoir) return res.status(404).json({ success: false, message: "Devoir non trouvé" });
      const file = req.file;
      if (!file) return res.status(400).json({ success: false, message: "Aucun fichier fourni" });

      const soumission = await SoumissionDevoir.create({
        devoirId: req.params.id as any,
        apprenantId: (req as any).utilisateurId,
        fichier: file.filename,
      });
      return res.status(201).send(soumission);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async noter(req: Request, res: Response): Promise<Response> {
    if ((req as any).utilisateurRole === RolesUtilisateur.APPRENANT) {
      return res.status(403).json({ success: false, message: "Réservé aux enseignants" });
    }
    try {
      const soumission = await SoumissionDevoir.findByPk(req.params.soumissionId);
      if (!soumission) return res.status(404).json({ success: false, message: "Soumission non trouvée" });
      await soumission.update({ note: req.body.note, commentaire: req.body.commentaire });
      return res.status(200).send(soumission);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async downloadSoumission(req: Request, res: Response): Promise<void> {
    try {
      const soumission = await SoumissionDevoir.findByPk(req.params.soumissionId);
      if (!soumission) { res.status(404).json({ success: false }); return; }
      const filePath = path.resolve(process.cwd(), UPLOAD_DIR, soumission.fichier);
      const fs = require('fs');
      if (!fs.existsSync(filePath)) { res.status(404).json({ success: false }); return; }
      res.download(filePath);
    } catch { res.status(500).json({ success: false }); }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    if ((req as any).utilisateurRole === RolesUtilisateur.APPRENANT) {
      return res.status(403).json({ success: false });
    }
    try {
      const devoir = await Devoir.findByPk(req.params.id);
      if (!devoir) return res.status(404).json({ success: false });
      await SoumissionDevoir.destroy({ where: { devoirId: devoir.id } });
      await devoir.destroy();
      return res.status(200).json({ success: true });
    } catch { return res.status(500).json({ success: false }); }
  }
}
