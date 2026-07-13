import { Request, Response } from "express";
import { Op } from "sequelize";
import { Deliberation } from "../models/Deliberation";
import { ResultatDeliberation } from "../models/ResultatDeliberation";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";
import { Classe } from "../../inscription/models/Classe";
import { AnneeAcademique } from "../../inscription/models/AnneeAcademique";
import { NiveauEtude } from "../../inscription/models/NiveauEtude";
import { DecisionPassage } from "../../scolarite/models/DecisionPassage";

const DECISION_MAP: Record<string, 'admis' | 'rattrapage' | 'redoublement' | 'exclusion'> = {
  admis: 'admis',
  admis_avec_dette: 'admis',
  rattrapage: 'rattrapage',
  redouble: 'redoublement',
  ajourne: 'exclusion',
  exclu: 'exclusion',
  derogation: 'admis'
};

export default class PassationController {

  async declencher(req: Request, res: Response) {
    try {
      const { deliberationId } = req.body;
      if (!deliberationId) {
        return res.status(400).json({ message: 'deliberationId requis' });
      }

      const deliberation = await Deliberation.findByPk(deliberationId, {
        include: [
          { association: Deliberation.associations.classe },
          { association: Deliberation.associations.anneeAcademique },
          { association: Deliberation.associations.resultats }
        ]
      });
      if (!deliberation) {
        return res.status(404).json({ message: 'Délibération non trouvée' });
      }

      const nextAnnee = await AnneeAcademique.findOne({
        where: { id: { [Op.gt]: deliberation.anneeAcademiqueId as any } },
        order: [['id', 'ASC']]
      });
      if (!nextAnnee) {
        return res.status(400).json({ message: 'Aucune année académique supérieure trouvée' });
      }

      const classe = deliberation.classe as any;
      const nextNiveau = await NiveauEtude.findOne({
        where: { id: { [Op.gt]: classe.niveauEtudeId as any } },
        order: [['id', 'ASC']]
      });
      const nextClasse = nextNiveau ? await Classe.findOne({
        where: { niveauEtudeId: nextNiveau.id }
      }) : null;

      const resultats = deliberation.resultats || [];
      const eligibles = resultats.filter(r =>
        ['admis', 'admis_avec_dette', 'derogation'].includes(r.decision)
      );

      const created: any[] = [];
      for (const r of eligibles) {
        const existingDecision = await DecisionPassage.findOne({
          where: { cursusApprenantId: r.cursusApprenantId as any, anneeAcademiqueId: nextAnnee.id as any }
        });
        if (existingDecision) continue;

        const decision = await DecisionPassage.create({
          cursusApprenantId: r.cursusApprenantId as any,
          anneeAcademiqueId: nextAnnee.id as any,
          moyenneGenerale: r.moyenne || 0,
          creditsAcquis: r.creditsValides || 0,
          creditsRequis: r.totalCredits || 0,
          decision: DECISION_MAP[r.decision] || 'admis',
          dateDecision: new Date(),
          validePar: (req as any).user?.id || 0
        });

        if (nextClasse && nextAnnee) {
          const existingCursus = await CursusApprenant.findOne({
            where: {
              utilisateurId: (await CursusApprenant.findByPk(r.cursusApprenantId as any))?.utilisateurId,
              anneeAcademiqueId: nextAnnee.id as any
            }
          });
          if (!existingCursus) {
            const cursusActuel = await CursusApprenant.findByPk(r.cursusApprenantId as any, {
              include: [{ association: CursusApprenant.associations.classe }]
            });
            if (cursusActuel) {
              await CursusApprenant.create({
                externe: (cursusActuel as any).externe || false,
                etablissement: (cursusActuel as any).etablissement || '',
                intituleParcours: (cursusActuel as any).intituleParcours || '',
                parcoursId: (cursusActuel as any).parcoursId,
                niveauEtudeId: nextNiveau?.id || (cursusActuel as any).niveauEtudeId,
                classeId: nextClasse.id,
                anneeAcademiqueId: nextAnnee.id,
                demandeInscriptionId: (cursusActuel as any).demandeInscriptionId,
                utilisateurId: cursusActuel.utilisateurId
              });
            }
          }
        }

        created.push(decision);
      }

      return res.status(201).json({
        message: `Passation effectuée pour ${created.length} étudiant(s)`,
        total: eligibles.length,
        created: created.length,
        skipped: eligibles.length - created.length
      });
    } catch (error) {
      console.error('Erreur passation:', error);
      return res.status(500).json({ message: 'Erreur lors de la passation' });
    }
  }

  async lister(req: Request, res: Response) {
    try {
      const { deliberationId, anneeAcademiqueId, decision } = req.query;
      const where: any = {};
      if (deliberationId) where.deliberationId = deliberationId;
      if (anneeAcademiqueId) where.anneeAcademiqueId = anneeAcademiqueId;
      if (decision) where.decision = decision;

      const items = await DecisionPassage.findAll({
        where,
        include: [
          { association: DecisionPassage.associations.cursusApprenant },
          { association: DecisionPassage.associations.anneeAcademique },
        ],
        order: [['createdAt', 'DESC']]
      });

      return res.json(items);
    } catch (error) {
      console.error('Erreur liste passations:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
  }
}
