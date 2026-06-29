import { Request, Response } from "express";
import { Op } from "sequelize";
import { Deliberation } from "../models/Deliberation";
import { ResultatDeliberation } from "../models/ResultatDeliberation";
import { Classe } from "../../inscription/models/Classe";
import { AnneeAcademique } from "../../inscription/models/AnneeAcademique";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";
import { Bulletin } from "../models/Bulletin";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";

export default class DeliberationController {

  async getAll(req: Request, res: Response) {
    try {
      const { classeId, anneeAcademiqueId, periode, statut, page, limit } = req.query;
      const where: any = {};

      if (classeId) where.classeId = classeId;
      if (anneeAcademiqueId) where.anneeAcademiqueId = anneeAcademiqueId;
      if (periode) where.periode = periode;
      if (statut) where.statut = statut;

      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 50));
      const offset = (pageNum - 1) * limitNum;

      const { count, rows: deliberations } = await Deliberation.findAndCountAll({
        where,
        include: [
          { association: Deliberation.associations.classe },
          { association: Deliberation.associations.anneeAcademique },
          { association: Deliberation.associations.resultats }
        ],
        order: [['date', 'DESC']],
        limit: limitNum,
        offset
      });

      return res.json({
        data: deliberations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count,
          totalPages: Math.ceil(count / limitNum)
        }
      });
    } catch (error) {
      console.error('Erreur liste délibérations:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const deliberation = await Deliberation.findByPk(req.params.id, {
        include: [
          { association: Deliberation.associations.classe },
          { association: Deliberation.associations.anneeAcademique },
          {
            association: Deliberation.associations.resultats,
            order: [['rang', 'ASC']]
          }
        ]
      });

      if (!deliberation) {
        return res.status(404).json({ message: 'Délibération non trouvée' });
      }

      return res.json(deliberation);
    } catch (error) {
      console.error('Erreur détail délibération:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { libelle, classeId, anneeAcademiqueId, periode, date } = req.body;

      if (!libelle || !classeId || !anneeAcademiqueId || !periode || !date) {
        return res.status(400).json({ message: 'libelle, classeId, anneeAcademiqueId, periode et date sont requis' });
      }

      const deliberation = await Deliberation.create({
        libelle,
        classeId,
        anneeAcademiqueId,
        periode,
        date: new Date(date),
        statut: 'planifiee',
        effectif: 0,
        admis: 0
      });

      return res.status(201).json(deliberation);
    } catch (error) {
      console.error('Erreur création délibération:', error);
      return res.status(500).json({ message: 'Erreur lors de la création' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const deliberation = await Deliberation.findByPk(req.params.id);
      if (!deliberation) {
        return res.status(404).json({ message: 'Délibération non trouvée' });
      }

      const { libelle, classeId, anneeAcademiqueId, periode, date, statut } = req.body;
      const updateData: any = {};

      if (libelle !== undefined) updateData.libelle = libelle;
      if (classeId !== undefined) updateData.classeId = classeId;
      if (anneeAcademiqueId !== undefined) updateData.anneeAcademiqueId = anneeAcademiqueId;
      if (periode !== undefined) updateData.periode = periode;
      if (date !== undefined) updateData.date = new Date(date);
      if (statut !== undefined) updateData.statut = statut;

      await deliberation.update(updateData);
      return res.json(deliberation);
    } catch (error) {
      console.error('Erreur mise à jour délibération:', error);
      return res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const deliberation = await Deliberation.findByPk(req.params.id);
      if (!deliberation) {
        return res.status(404).json({ message: 'Délibération non trouvée' });
      }

      await ResultatDeliberation.destroy({ where: { deliberationId: deliberation.id } });
      await deliberation.destroy();
      return res.status(204).end();
    } catch (error) {
      console.error('Erreur suppression délibération:', error);
      return res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
  }

  async chargerResultats(req: Request, res: Response) {
    try {
      const deliberation = await Deliberation.findByPk(req.params.id);
      if (!deliberation) {
        return res.status(404).json({ message: 'Délibération non trouvée' });
      }

      const existing = await ResultatDeliberation.count({ where: { deliberationId: deliberation.id } });
      if (existing > 0) {
        return res.status(400).json({ message: 'Les résultats ont déjà été chargés' });
      }

      const bulletins = await Bulletin.findAll({
        where: { classeId: deliberation.classeId, anneeAcademiqueId: deliberation.anneeAcademiqueId, semestre: deliberation.periode },
        include: [
          { association: Bulletin.associations.utilisateur },
          { association: Bulletin.associations.cursusApprenant }
        ],
        order: [['moyenneGenerale', 'DESC']]
      });

      if (!bulletins.length) {
        return res.status(404).json({ message: 'Aucun bulletin trouvé pour cette classe et période' });
      }

      const resultatsData = bulletins.map((b, index) => ({
        deliberationId: deliberation.id,
        cursusApprenantId: b.cursusApprenantId,
        nom: (b as any).utilisateur?.nom || '',
        prenoms: (b as any).utilisateur?.prenoms || '',
        matricule: (b as any).utilisateur?.matricule || '',
        moyenne: b.moyenneGenerale,
        mention: b.mention,
        rang: index + 1,
        decision: b.moyenneGenerale != null && b.moyenneGenerale >= 10 ? 'admis' : 'rattrapage'
      }));

      const resultats = await ResultatDeliberation.bulkCreate(resultatsData);

      const effectif = resultats.length;
      const admis = resultats.filter(r => r.decision === 'admis').length;
      await deliberation.update({ effectif, admis, statut: 'en_cours' });

      return res.status(201).json(resultats);
    } catch (error) {
      console.error('Erreur chargement résultats:', error);
      return res.status(500).json({ message: 'Erreur lors du chargement' });
    }
  }

  async mettreAJourDecision(req: Request, res: Response) {
    try {
      const { decision } = req.body;
      if (!['admis', 'rattrapage', 'redouble'].includes(decision)) {
        return res.status(400).json({ message: 'Décision invalide. Valeurs autorisées: admis, rattrapage, redouble' });
      }

      const resultat = await ResultatDeliberation.findByPk(req.params.resultatId);
      if (!resultat) {
        return res.status(404).json({ message: 'Résultat non trouvé' });
      }

      await resultat.update({ decision });

      const deliberation = await Deliberation.findByPk(resultat.deliberationId);
      if (deliberation) {
        const resultats = await ResultatDeliberation.findAll({ where: { deliberationId: deliberation.id } });
        const admis = resultats.filter(r => r.decision === 'admis').length;
        await deliberation.update({ effectif: resultats.length, admis });
      }

      return res.json(resultat);
    } catch (error) {
      console.error('Erreur mise à jour décision:', error);
      return res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
  }

  async cloturer(req: Request, res: Response) {
    try {
      const deliberation = await Deliberation.findByPk(req.params.id);
      if (!deliberation) {
        return res.status(404).json({ message: 'Délibération non trouvée' });
      }

      if (deliberation.statut === 'cloturee') {
        return res.status(400).json({ message: 'Délibération déjà clôturée' });
      }

      await deliberation.update({ statut: 'cloturee' });
      return res.json(deliberation);
    } catch (error) {
      console.error('Erreur clôture délibération:', error);
      return res.status(500).json({ message: 'Erreur lors de la clôture' });
    }
  }
}
