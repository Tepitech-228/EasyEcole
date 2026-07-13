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

  async mettreAJourDecision(req: Request, res: Response) {
    try {
      const { decision, commentaire, assiduite, situationFinanciere } = req.body;
      const decisionsValides = ['admis', 'rattrapage', 'redouble', 'admis_avec_dette', 'ajourne', 'exclu', 'derogation'];
      if (!decisionsValides.includes(decision)) {
        return res.status(400).json({ message: `Décision invalide. Valeurs autorisées: ${decisionsValides.join(', ')}` });
      }

      const resultat = await ResultatDeliberation.findByPk(req.params.resultatId);
      if (!resultat) {
        return res.status(404).json({ message: 'Résultat non trouvé' });
      }

      const deliberation = await Deliberation.findByPk(resultat.deliberationId);
      if (deliberation && deliberation.verrouille) {
        return res.status(403).json({ message: 'Délibération verrouillée, aucune modification autorisée' });
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
      console.error('Erreur mise à jour décision:', error);
      return res.status(500).json({ message: 'Erreur lors de la mise à jour' });
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
      console.error('Erreur chargement résultats:', error);
      return res.status(500).json({ message: 'Erreur lors du chargement' });
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

  async publier(req: Request, res: Response) {
    try {
      const deliberation = await Deliberation.findByPk(req.params.id);
      if (!deliberation) {
        return res.status(404).json({ message: 'Délibération non trouvée' });
      }
      if (deliberation.statut !== 'cloturee') {
        return res.status(400).json({ message: 'Seules les délibérations clôturées peuvent être publiées' });
      }
      await deliberation.update({ statut: 'publiee' });
      return res.json(deliberation);
    } catch (error) {
      console.error('Erreur publication:', error);
      return res.status(500).json({ message: 'Erreur lors de la publication' });
    }
  }

  async contester(req: Request, res: Response) {
    try {
      const deliberation = await Deliberation.findByPk(req.params.id);
      if (!deliberation) {
        return res.status(404).json({ message: 'Délibération non trouvée' });
      }
      if (deliberation.statut !== 'publiee') {
        return res.status(400).json({ message: 'Seules les délibérations publiées peuvent être contestées' });
      }
      await deliberation.update({ statut: 'contestee', verrouille: false });
      return res.json(deliberation);
    } catch (error) {
      console.error('Erreur contestation:', error);
      return res.status(500).json({ message: 'Erreur lors de la contestation' });
    }
  }

  async verrouiller(req: Request, res: Response) {
    try {
      const deliberation = await Deliberation.findByPk(req.params.id);
      if (!deliberation) {
        return res.status(404).json({ message: 'Délibération non trouvée' });
      }
      if (deliberation.statut !== 'cloturee' && deliberation.statut !== 'publiee') {
        return res.status(400).json({ message: 'Seules les délibérations clôturées ou publiées peuvent être verrouillées' });
      }
      await deliberation.update({ verrouille: true });
      return res.json(deliberation);
    } catch (error) {
      console.error('Erreur verrouillage:', error);
      return res.status(500).json({ message: 'Erreur lors du verrouillage' });
    }
  }

  async deverrouiller(req: Request, res: Response) {
    try {
      const deliberation = await Deliberation.findByPk(req.params.id);
      if (!deliberation) {
        return res.status(404).json({ message: 'Délibération non trouvée' });
      }
      await deliberation.update({ verrouille: false });
      return res.json(deliberation);
    } catch (error) {
      console.error('Erreur déverrouillage:', error);
      return res.status(500).json({ message: 'Erreur lors du déverrouillage' });
    }
  }

  async genererPV(req: Request, res: Response) {
    try {
      const filename = await GenerateurPVService.generer(Number(req.params.id));
      return res.json({ message: 'PV généré avec succès', filename });
    } catch (error) {
      console.error('Erreur génération PV:', error);
      return res.status(500).json({ message: 'Erreur lors de la génération du PV' });
    }
  }

  async telechargerPV(req: Request, res: Response) {
    try {
      const filename = req.params.filename;
      const filePath = path.join(process.cwd(), 'uploads', 'pv', filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Fichier non trouvé' });
      }
      res.download(filePath, filename);
    } catch (error) {
      return res.status(500).json({ message: 'Erreur lors du téléchargement' });
    }
  }

  async calculerSuggestions(req: Request, res: Response) {
    try {
      const deliberation = await Deliberation.findByPk(req.params.id, {
        include: [{ association: Deliberation.associations.resultats }]
      });
      if (!deliberation) {
        return res.status(404).json({ message: 'Délibération non trouvée' });
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
      console.error('Erreur calcul suggestions:', error);
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
      console.error('Erreur statistiques:', error);
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
      return res.status(500).json({ message: 'Erreur lors de la récupération' });
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
      return res.status(500).json({ message: 'Erreur lors de la récupération des dettes' });
    }
  }
}
