import { Request, Response } from 'express';
import { SemestreAcademique } from '../models/SemestreAcademique';
import { SemestreAcademiqueService } from '../services/SemestreAcademiqueService';

export default class SemestreAcademiqueController {
  static async list(req: Request, res: Response): Promise<Response> {
    try {
      const items = await SemestreAcademique.findAll({
        order: [['anneeAcademiqueId', 'ASC'], ['codeSemestre', 'ASC']],
        include: [{ association: SemestreAcademique.associations.parcours }, { association: SemestreAcademique.associations.anneeAcademique }]
      });
      return res.json(items);
    } catch (error) {
      return res.status(500).json({ message: 'Erreur lors de la récupération des semestres' });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const payload = await SemestreAcademique.create({
        parcoursId: req.body.parcoursId,
        anneeAcademiqueId: req.body.anneeAcademiqueId,
        codeSemestre: req.body.codeSemestre,
        libelle: req.body.libelle || `Semestre ${req.body.codeSemestre}`,
        statut: req.body.statut || 'planifie',
        dateDebut: req.body.dateDebut ? new Date(req.body.dateDebut) : null,
        dateFin: req.body.dateFin ? new Date(req.body.dateFin) : null,
      });
      return res.status(201).json(payload);
    } catch (error) {
      return res.status(400).json({ message: 'Impossible de créer le semestre', error });
    }
  }

  static async activate(req: Request, res: Response): Promise<Response> {
    try {
      const semestre = await SemestreAcademique.findByPk(req.params.id);
      if (!semestre) return res.status(404).json({ message: 'Semestre introuvable' });

      const allSemestres = await SemestreAcademique.findAll({
        where: { parcoursId: semestre.parcoursId, anneeAcademiqueId: semestre.anneeAcademiqueId }
      });

      const plan = SemestreAcademiqueService.planActivation({
        id: semestre.id,
        parcoursId: Number(semestre.parcoursId),
        anneeAcademiqueId: Number(semestre.anneeAcademiqueId),
        statut: 'en_cours'
      }, allSemestres.map(s => ({
        id: s.id,
        parcoursId: Number(s.parcoursId),
        anneeAcademiqueId: Number(s.anneeAcademiqueId),
        statut: s.statut
      })));

      if (!plan.valid) {
        return res.status(409).json({ message: plan.reason });
      }

      await semestre.update({ statut: 'en_cours', dateDebut: semestre.dateDebut || new Date() });
      return res.json({ success: true, semestre });
    } catch (error) {
      return res.status(500).json({ message: 'Erreur lors de l’activation du semestre' });
    }
  }

  static async close(req: Request, res: Response): Promise<Response> {
    try {
      const semestre = await SemestreAcademique.findByPk(req.params.id);
      if (!semestre) return res.status(404).json({ message: 'Semestre introuvable' });

      const plan = SemestreAcademiqueService.planClosure((semestre as any).statut);
      if (!plan.valid) {
        return res.status(409).json({ message: plan.reason });
      }

      const result = await SemestreAcademiqueService.appliquerCloture(semestre as any);

      await semestre.update({
        statut: 'cloture',
        dateCloture: new Date(),
        cloturePar: (req as any).utilisateurId || null,
        commentaire: req.body.commentaire || 'Clôture manuelle du semestre'
      });

      return res.json({ success: true, semestre, closure: result });
    } catch (error) {
      return res.status(500).json({ message: 'Erreur lors de la clôture du semestre' });
    }
  }
}
