import { Request, Response } from "express";
import { Certificat } from "../models/Certificat";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";


export default class CertificatController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const role = (req as any).utilisateurRole;
      const where: any = {};
      if (role === RolesUtilisateur.APPRENANT) {
        where.apprenantId = (req as any).utilisateurId;
      }
      const certificats = await Certificat.findAll({
        where,
        include: [
          { association: Certificat.associations.cours, attributes: ['titre'] },
          { association: Certificat.associations.apprenant, attributes: ['nom', 'prenoms'] }
        ],
        order: [['dateObtention', 'DESC']]
      });
      return res.status(200).send(certificats);
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
      const certificat = await Certificat.create({
        titre: req.body.titre,
        description: req.body.description,
        code: 'CERT-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
        coursId: req.body.coursId,
        apprenantId: req.body.apprenantId,
      });
      return res.status(201).send(certificat);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION) {
      return res.status(403).json({ success: false });
    }
    try {
      const cert = await Certificat.findByPk(req.params.id);
      if (!cert) return res.status(404).json({ success: false });
      await cert.destroy();
      return res.status(200).json({ success: true });
    } catch { return res.status(500).json({ success: false }); }
  }
}
