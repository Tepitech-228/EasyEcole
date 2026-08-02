import { Request, Response } from "express";
import { Op, fn, col } from "sequelize";
import * as path from "path";
import * as fs from "fs";
import { Deliberation } from "../models/Deliberation";
import { ResultatDeliberation } from "../models/ResultatDeliberation";
import { HistoriqueDecision } from "../models/HistoriqueDecision";
import { DetteAcademique } from "../models/DetteAcademique";
import { Classe } from "../../inscription/models/Classe";
import { AnneeAcademique } from "../../inscription/models/AnneeAcademique";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";
import { Bulletin } from "../models/Bulletin";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { MoteurCalculService } from "../services/MoteurCalculService";
import { GenerateurPVService } from "../services/GenerateurPVService";
import { ArchiveGedService } from "../../../core/services/ArchiveGedService";
import { DecisionType } from "../enums/DecisionType";
import { logger } from "../../../core/helpers/Logger";

export default class DeliberationController {

  async getAll(req: Request, res: Response) {
    try {
      const { classeId, anneeAcademiqueId, periode, statut, niveauEtudeId, page, limit } = req.query;
      const where: any = {};

      if (classeId) where.classeId = classeId;
      if (anneeAcademiqueId) where.anneeAcademiqueId = anneeAcademiqueId;
      if (periode) where.periode = periode;
      if (statut) where.statut = statut;
      if (niveauEtudeId) where['$classe.niveauEtudeId$'] = niveauEtudeId;

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
      logger.error('Erreur liste dÃ©libÃ©rations:', error);
      return res.status(500).json({ message: 'Erreur lors de la rÃ©cupÃ©ration' });
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
        return res.status(404).json({ message: 'DÃ©libÃ©ration non trouvÃ©e' });
      }

      return res.json(deliberation);
    } catch (error) {
      logger.error('Erreur dÃ©tail dÃ©libÃ©ration:', error);
      return res.status(500).json({ message: 'Erreur lors de la rÃ©cupÃ©ration' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { libelle, classeId, anneeAcademiqueId, periode, date, sessionType } = req.body;

      if (!libelle || !classeId || !anneeAcademiqueId || !periode || !date) {
        return res.status(400).json({ message: 'libelle, classeId, anneeAcademiqueId, periode et date sont requis' });
      }

      const deliberation = await Deliberation.create({
        libelle,
        classeId,
        anneeAcademiqueId,
        periode,
        date: new Date(date),
        sessionType: sessionType || 'initiale',
        statut: 'planifiee',
        effectif: 0,
        admis: 0
      });

      return res.status(201).json(deliberation);
    } catch (error) {
      logger.error('Erreur crÃ©ation dÃ©libÃ©ration:', error);
      return res.status(500).json({ message: 'Erreur lors de la crÃ©ation' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const deliberation = await Deliberation.findByPk(req.params.id);
      if (!deliberation) {
        return res.status(404).json({ message: 'DÃ©libÃ©ration non trouvÃ©e' });
      }

      const { libelle, classeId, anneeAcademiqueId, periode, date, statut, sessionType, commentaire, verrouille } = req.body;
      const updateData: any = {};

      if (libelle !== undefined) updateData.libelle = libelle;
      if (classeId !== undefined) updateData.classeId = classeId;
      if (anneeAcademiqueId !== undefined) updateData.anneeAcademiqueId = anneeAcademiqueId;
      if (periode !== undefined) updateData.periode = periode;
      if (date !== undefined) updateData.date = new Date(date);
      if (statut !== undefined) updateData.statut = statut;
      if (sessionType !== undefined) updateData.sessionType = sessionType;
      if (commentaire !== undefined) updateData.commentaire = commentaire;
      if (verrouille !== undefined) updateData.verrouille = verrouille;

      await deliberation.update(updateData);
      return res.json(deliberation);
    } catch (error) {
      logger.error('Erreur mise Ã  jour dÃ©libÃ©ration:', error);
      return res.status(500).json({ message: 'Erreur lors de la mise Ã  jour' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const deliberation = await Deliberation.findByPk(req.params.id);
      if (!deliberation) {
        return res.status(404).json({ message: 'DÃ©libÃ©ration non trouvÃ©e' });
      }

      await deliberation.destroy();
      return res.status(204).end();
    } catch (error) {
      logger.error('Erreur suppression dÃ©libÃ©ration:', error);
      return res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
  }

  async mettreAJourDecision(req: Request, res: Response) {
    try {
      const { decision, commentaire, assiduite, situationFinanciere } = req.body;
      const decisionsValides = Object.values(DecisionType);
      if (!decisionsValides.includes(decision)) {
        return res.status(400).json({ message: `DÃ©cision invalide. Valeurs autorisÃ©es: ${decisionsValides.join(', ')}` });
      }

      const resultat = await ResultatDeliberation.findByPk(req.params.resultatId);
      if (!resultat) {
        return res.status(404).json({ message: 'RÃ©sultat non trouvÃ©' });
      }

      const deliberation = await Deliberation.findByPk(resultat.deliberationId);
      if (deliberation && deliberation.verrouille) {
        return res.status(403).json({ message: 'DÃ©libÃ©ration verrouillÃ©e, aucune modification autorisÃ©e' });
      }

      const ancienneDecision = resultat.decision;
      const updateData: any = { decision };
      if (commentaire !== undefined) updateData.commentaire = commentaire;
      if (assiduite !== undefined) updateData.assiduite = assiduite;
      if (situationFinanciere !== undefined) updateData.situationFinanciere = situationFinanciere;
      await resultat.update(updateData);

      if (ancienneDecision !== decision) {
        await HistoriqueDecision.create({
          deliberationId: resultat.deliberationId,
          resultatId: resultat.id,
          ancienneDecision,
          nouvelleDecision: decision,
          auteurId: (req as any).user?.id || 0,
          motif: req.body.motif || null
        });
      }

      if (deliberation) {
        const resultats = await ResultatDeliberation.findAll({ where: { deliberationId: deliberation.id } });
        const nbAdmis = resultats.filter(r => r.decision === 'admis').length;
        const nbRattrapage = resultats.filter(r => r.decision === 'rattrapage').length;
        const nbAjourne = resultats.filter(r => r.decision === 'ajourne').length;
        const nbExclu = resultats.filter(r => r.decision === 'exclu').length;
        const nbAdmisAvecDette = resultats.filter(r => r.decision === 'admis_avec_dette').length;
        const nbDerogation = resultats.filter(r => r.decision === 'derogation').length;
        await deliberation.update({
          effectif: resultats.length,
          admis: nbAdmis,
          nbAdmis, nbRattrapage, nbAjourne, nbExclu, nbAdmisAvecDette, nbDerogation
        });
      }

      return res.json(resultat);
    } catch (error) {
      logger.error('Erreur mise Ã  jour dÃ©cision:', error);
      return res.status(500).json({ message: 'Erreur lors de la mise Ã  jour' });
    }
  }

  async chargerResultats(req: Request, res: Response) {
    try {
      const deliberation = await Deliberation.findByPk(req.params.id);
      if (!deliberation) {
        return res.status(404).json({ message: 'DÃ©libÃ©ration non trouvÃ©e' });
      }

      const existing = await ResultatDeliberation.count({ where: { deliberationId: deliberation.id } });
      if (existing > 0) {
        return res.status(400).json({ message: 'Les rÃ©sultats ont dÃ©jÃ  Ã©tÃ© chargÃ©s' });
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
        return res.status(404).json({ message: 'Aucun bulletin trouvÃ© pour cette classe et pÃ©riode' });
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
        totalCredits: b.totalCredits,
        creditsValides: b.creditsValides,
        decision: 'admis'
      }));

      const resultats = await ResultatDeliberation.bulkCreate(resultatsData);

      const suggestions = await MoteurCalculService.getSuggestionsMassives(
        deliberation.id,
        resultats.map(r => ({
          id: r.id,
          cursusApprenantId: Number(r.cursusApprenantId),
          bulletinId: (bulletins.find(b => Number(b.cursusApprenantId) === Number(r.cursusApprenantId)) as any)?.id
        }))
      );

      for (const s of suggestions) {
        await ResultatDeliberation.update({ decision: s.suggestion.decision }, { where: { id: s.resultatId } });
      }

      const updated = await ResultatDeliberation.findAll({ where: { deliberationId: deliberation.id } });
      const nbAdmis = updated.filter(r => r.decision === 'admis' || r.decision === 'admis_avec_dette').length;
      await deliberation.update({ effectif: updated.length, admis: nbAdmis, statut: 'en_cours' });

      return res.status(201).json(resultats);
    } catch (error) {
      logger.error('Erreur chargement rÃ©sultats:', error);
      return res.status(500).json({ message: 'Erreur lors du chargement' });
    }
  }

  async cloturer(req: Request, res: Response) {
    try {
      const deliberation = await Deliberation.findByPk(req.params.id);
      if (!deliberation) {
        return res.status(404).json({ message: 'DÃ©libÃ©ration non trouvÃ©e' });
      }

      if (deliberation.statut === 'cloturee') {
        return res.status(400).json({ message: 'DÃ©libÃ©ration dÃ©jÃ  clÃ´turÃ©e' });
      }

      await deliberation.update({ statut: 'cloturee' });
      return res.json(deliberation);
    } catch (error) {
      logger.error('Erreur clÃ´ture dÃ©libÃ©ration:', error);
      return res.status(500).json({ message: 'Erreur lors de la clÃ´ture' });
    }
  }

  async publier(req: Request, res: Response) {
    try {
      const deliberation = await Deliberation.findByPk(req.params.id);
      if (!deliberation) {
        return res.status(404).json({ message: 'DÃ©libÃ©ration non trouvÃ©e' });
      }
      if (deliberation.statut !== 'cloturee') {
        return res.status(400).json({ message: 'Seules les dÃ©libÃ©rations clÃ´turÃ©es peuvent Ãªtre publiÃ©es' });
      }
      await deliberation.update({ statut: 'publiee' });
      return res.json(deliberation);
    } catch (error) {
      logger.error('Erreur publication:', error);
      return res.status(500).json({ message: 'Erreur lors de la publication' });
    }
  }

  async contester(req: Request, res: Response) {
    try {
      const deliberation = await Deliberation.findByPk(req.params.id);
      if (!deliberation) {
        return res.status(404).json({ message: 'DÃ©libÃ©ration non trouvÃ©e' });
      }
      if (deliberation.statut !== 'publiee') {
        return res.status(400).json({ message: 'Seules les dÃ©libÃ©rations publiÃ©es peuvent Ãªtre contestÃ©es' });
      }
      await deliberation.update({ statut: 'contestee', verrouille: false });
      return res.json(deliberation);
    } catch (error) {
      logger.error('Erreur contestation:', error);
      return res.status(500).json({ message: 'Erreur lors de la contestation' });
    }
  }

  async verrouiller(req: Request, res: Response) {
    try {
      const deliberation = await Deliberation.findByPk(req.params.id);
      if (!deliberation) {
        return res.status(404).json({ message: 'DÃ©libÃ©ration non trouvÃ©e' });
      }
      if (deliberation.statut !== 'cloturee' && deliberation.statut !== 'publiee') {
        return res.status(400).json({ message: 'Seules les dÃ©libÃ©rations clÃ´turÃ©es ou publiÃ©es peuvent Ãªtre verrouillÃ©es' });
      }
      await deliberation.update({ verrouille: true });
      return res.json(deliberation);
    } catch (error) {
      logger.error('Erreur verrouillage:', error);
      return res.status(500).json({ message: 'Erreur lors du verrouillage' });
    }
  }

  async deverrouiller(req: Request, res: Response) {
    try {
      const deliberation = await Deliberation.findByPk(req.params.id);
      if (!deliberation) {
        return res.status(404).json({ message: 'DÃ©libÃ©ration non trouvÃ©e' });
      }
      await deliberation.update({ verrouille: false });
      return res.json(deliberation);
    } catch (error) {
      logger.error('Erreur dÃ©verrouillage:', error);
      return res.status(500).json({ message: 'Erreur lors du dÃ©verrouillage' });
    }
  }

  async genererPV(req: Request, res: Response) {
    try {
      const deliberationId = Number(req.params.id);
      const deliberation = await Deliberation.findByPk(deliberationId, {
        include: [{ association: Deliberation.associations.classe }]
      });
      if (!deliberation) {
        return res.status(404).json({ message: 'DÃ©libÃ©ration non trouvÃ©e' });
      }

      const filename = await GenerateurPVService.generer(deliberationId);

      const classe = deliberation.classe as any;
      // Archivage automatique dans la GED
      await ArchiveGedService.archiverDocumentDeliberation({
        titre: `PV DÃ©libÃ©ration - ${classe?.libelle || ''} - ${deliberation.periode} - ${deliberation.date?.toLocaleDateString('fr-FR') || ''}`,
        fichier: filename,
        anneeAcademiqueId: deliberation.anneeAcademiqueId,
        parcoursId: classe?.parcoursId || undefined,
        niveauEtudeId: classe?.niveauEtudeId || undefined,
        classeId: deliberation.classeId,
        semestre: deliberation.periode,
        uploaderId: (req as any).utilisateurId || 1
      });

      return res.json({ message: 'PV gÃ©nÃ©rÃ© et archivÃ© avec succÃ¨s', filename });
    } catch (error) {
      logger.error('Erreur gÃ©nÃ©ration PV:', error);
      return res.status(500).json({ message: 'Erreur lors de la gÃ©nÃ©ration du PV' });
    }
  }

  async telechargerPV(req: Request, res: Response) {
    try {
      const filename = req.params.filename;
      const filePath = path.join(process.cwd(), 'uploads', 'pv', filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Fichier non trouvÃ©' });
      }
      res.download(filePath, filename);
    } catch (error) {
      return res.status(500).json({ message: 'Erreur lors du tÃ©lÃ©chargement' });
    }
  }

  async calculerSuggestions(req: Request, res: Response) {
    try {
      const deliberation = await Deliberation.findByPk(req.params.id, {
        include: [{ association: Deliberation.associations.resultats }]
      });
      if (!deliberation) {
        return res.status(404).json({ message: 'DÃ©libÃ©ration non trouvÃ©e' });
      }

      const resultats = deliberation.resultats || [];
      const bulletins = await Bulletin.findAll({
        where: { classeId: deliberation.classeId, anneeAcademiqueId: deliberation.anneeAcademiqueId, semestre: deliberation.periode }
      });
      const bulletinMap = new Map(bulletins.map(b => [b.cursusApprenantId, b]));

      const suggestions = await MoteurCalculService.getSuggestionsMassives(
        deliberation.id,
        resultats.map(r => ({
          id: r.id,
          cursusApprenantId: Number(r.cursusApprenantId),
          bulletinId: (bulletinMap.get(r.cursusApprenantId) as any)?.id
        }))
      );

      return res.json(suggestions);
    } catch (error) {
      logger.error('Erreur calcul suggestions:', error);
      return res.status(500).json({ message: 'Erreur lors du calcul' });
    }
  }

  async getStatistiques(req: Request, res: Response) {
    try {
      const { classeId, anneeAcademiqueId, periode } = req.query;
      const where: any = {};
      if (classeId) where.classeId = classeId;
      if (anneeAcademiqueId) where.anneeAcademiqueId = anneeAcademiqueId;
      if (periode) where.periode = periode;

      const stats = await Deliberation.findAll({
        where,
        attributes: [
          'statut',
          [fn('COUNT', col('Deliberation.id')), 'total']
        ],
        group: ['statut'],
        raw: true
      });

      const totalResultats = await ResultatDeliberation.count({
        include: [{
          association: ResultatDeliberation.associations.deliberation,
          where,
          required: true
        }]
      });

      return res.json({ parStatut: stats, totalResultats });
    } catch (error) {
      logger.error('Erreur statistiques:', error);
      return res.status(500).json({ message: 'Erreur lors du calcul des statistiques' });
    }
  }

  async getHistorique(req: Request, res: Response) {
    try {
      const historique = await HistoriqueDecision.findAll({
        where: { deliberationId: req.params.id },
        order: [['createdAt', 'DESC']],
        limit: 100
      });
      return res.json(historique);
    } catch (error) {
      return res.status(500).json({ message: 'Erreur lors de la rÃ©cupÃ©ration' });
    }
  }

  async getDettes(req: Request, res: Response) {
    try {
      const { deliberationId } = req.params;
      const resultats = await ResultatDeliberation.findAll({
        where: { deliberationId, decision: 'admis_avec_dette' },
        include: [{ model: DetteAcademique, as: 'dettes', required: false }]
      });
      return res.json(resultats);
    } catch (error) {
      return res.status(500).json({ message: 'Erreur lors de la rÃ©cupÃ©ration des dettes' });
    }
  }
}

