import { Request, Response } from "express";
import { AbsenceAggregationService } from "../services/AbsenceAggregationService";

export default class AbsenceCoursController {

  async getAbsencesByEtudiant(req: Request, res: Response) {
    try {
      const cursusApprenantId = parseInt(req.params.cursusApprenantId);
      const coursId = req.query.coursId ? parseInt(req.query.coursId as string) : undefined;
      const absences = await AbsenceAggregationService.getAbsencesByCursus(cursusApprenantId, coursId);
      return res.json(absences);
    } catch (error) {
      console.error('Erreur récupération absences:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
  }

  async getStatsByEtudiant(req: Request, res: Response) {
    try {
      const cursusApprenantId = parseInt(req.params.cursusApprenantId);
      const stats = await AbsenceAggregationService.getAggregateByCursus(cursusApprenantId);
      if (!stats) return res.status(404).json({ message: 'Étudiant non trouvé' });
      return res.json(stats);
    } catch (error) {
      console.error('Erreur récupération stats:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
  }

  async getAbsencesByClasse(req: Request, res: Response) {
    try {
      const classeId = parseInt(req.params.classeId);
      const anneeAcademiqueId = parseInt(req.params.anneeAcademiqueId);
      const data = await AbsenceAggregationService.getAggregateByClasse(classeId, anneeAcademiqueId);
      return res.json(data);
    } catch (error) {
      console.error('Erreur récupération absences classe:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
  }
}
