import { Request, Response } from "express";
import { AutoSanctionService } from "../services/AutoSanctionService";
import { SanctionAcademique } from "../models/SanctionAcademique";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";

export default class AutoSanctionController {

  async declencher(req: Request, res: Response) {
    try {
      const result = await AutoSanctionService.verifierTous();
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: 'Erreur lors du déclenchement' });
    }
  }

  async verifierEtudiant(req: Request, res: Response) {
    try {
      const cursusApprenantId = parseInt(req.params.cursusApprenantId);
      const sanction = await AutoSanctionService.verifierEtSanctionner(cursusApprenantId);
      if (sanction) {
        return res.status(201).json({ message: 'Sanction créée', sanction });
      }
      return res.json({ message: 'Aucune sanction nécessaire' });
    } catch (error) {
      return res.status(500).json({ message: 'Erreur' });
    }
  }

  async getSanctionsParEtudiant(req: Request, res: Response) {
    try {
      const cursusApprenantId = parseInt(req.params.cursusApprenantId);
      const sanctions = await SanctionAcademique.findAll({
        where: { cursusApprenantId },
        include: [{ association: 'decideParUtilisateur', attributes: ['nom', 'prenoms'] }],
        order: [['createdAt', 'DESC']]
      });
      return res.json(sanctions);
    } catch (error) {
      return res.status(500).json({ message: 'Erreur' });
    }
  }
}
