import { Request, Response } from "express";
import { Op, Transaction } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Deliberation } from "../models/Deliberation";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";
import { Classe } from "../../inscription/models/Classe";
import { AnneeAcademique } from "../../inscription/models/AnneeAcademique";
import { NiveauEtude } from "../../inscription/models/NiveauEtude";
import { DecisionPassage } from "../../scolarite/models/DecisionPassage";
import { Bulletin } from "../models/Bulletin";
import { GestionDetteService } from "../services/GestionDetteService";
import { RegleEvaluation } from "../../inscription/models/RegleEvaluation";
import { PASSAGE_DECISION_MAP } from "../enums/DecisionType";
import { logger } from "../../../core/helpers/Logger";

export default class PassationController {

  async declencher(req: Request, res: Response) {
    const t = await DatabaseConnection.getInstance().sequelize.transaction();

    try {
      const { deliberationId, force } = req.body;
      if (!deliberationId) {
        await t.rollback();
        return res.status(400).json({ message: 'deliberationId requis' });
      }

      const deliberation = await Deliberation.findByPk(deliberationId, {
        include: [
          { association: Deliberation.associations.classe },
          { association: Deliberation.associations.anneeAcademique },
          { association: Deliberation.associations.resultats }
        ],
        transaction: t
      });
      if (!deliberation) {
        await t.rollback();
        return res.status(404).json({ message: 'DÃ©libÃ©ration non trouvÃ©e' });
      }

      const nextAnnee = await AnneeAcademique.findOne({
        where: { id: { [Op.gt]: deliberation.anneeAcademiqueId as any } },
        order: [['id', 'ASC']],
        transaction: t
      });
      if (!nextAnnee) {
        await t.rollback();
        return res.status(400).json({ message: 'Aucune annÃ©e acadÃ©mique supÃ©rieure trouvÃ©e' });
      }

      const classe = deliberation.classe as any;
      const nextNiveau = await NiveauEtude.findOne({
        where: { id: { [Op.gt]: classe.niveauEtudeId as any } },
        order: [['id', 'ASC']],
        transaction: t
      });
      const nextClasse = nextNiveau ? await Classe.findOne({
        where: { niveauEtudeId: nextNiveau.id },
        transaction: t
      }) : null;

      const resultats = deliberation.resultats || [];
      const eligibles = resultats.filter(r =>
        ['admis', 'admis_avec_dette', 'derogation'].includes(r.decision)
      );

      const regles = await RegleEvaluation.findAll({
        where: { parcoursId: (classe as any).parcoursId, actif: true },
        transaction: t
      });
      const reglesMap = new Map(regles.map(r => [r.type, r.valeur]));
      const noteMinimale = parseFloat(reglesMap.get('note_minimale') || '10');

      const created: any[] = [];
      const blocked: any[] = [];
      const errors: string[] = [];

      for (const r of eligibles) {
        const existingDecision = await DecisionPassage.findOne({
          where: { cursusApprenantId: Number(r.cursusApprenantId), anneeAcademiqueId: Number(nextAnnee.id) },
          transaction: t
        });
        if (existingDecision) continue;

        const cursusActuel = await CursusApprenant.findByPk(Number(r.cursusApprenantId), {
          include: [{ association: CursusApprenant.associations.classe }],
          transaction: t
        });
        if (!cursusActuel) continue;

        const isDerniereAnnee = nextNiveau == null;
        if (isDerniereAnnee && !force) {
          const { eligible, dettesActives } = await GestionDetteService.verifierEligibiliteProgression(
            Number(r.cursusApprenantId)
          );
          if (!eligible) {
            blocked.push({
              cursusApprenantId: r.cursusApprenantId,
              nom: r.nom,
              prenoms: r.prenoms,
              nbDettes: dettesActives.length,
              message: `Ã‰tudiant en derniÃ¨re annÃ©e avec ${dettesActives.length} dette(s) active(s)`
            });
            continue;
          }
        }

        const decision = await DecisionPassage.create({
          cursusApprenantId: Number(r.cursusApprenantId),
          anneeAcademiqueId: Number(nextAnnee.id),
          moyenneGenerale: r.moyenne || 0,
          creditsAcquis: r.creditsValides || 0,
          creditsRequis: r.totalCredits || 0,
          decision: PASSAGE_DECISION_MAP[r.decision as keyof typeof PASSAGE_DECISION_MAP] || 'admis',
          dateDecision: new Date(),
          validePar: (req as any).user?.id || 0
        }, { transaction: t });

        let nouveauCursusId = null;
        if (nextClasse && nextAnnee) {
          const [nouveau, created] = await CursusApprenant.findOrCreate({
            where: {
              utilisateurId: cursusActuel.utilisateurId,
              anneeAcademiqueId: nextAnnee.id
            },
            defaults: {
              externe: (cursusActuel as any).externe || false,
              etablissementId: (cursusActuel as any).etablissementId || null,
              intituleParcours: (cursusActuel as any).intituleParcours || '',
              parcoursId: (cursusActuel as any).parcoursId,
              niveauEtudeId: nextNiveau?.id || (cursusActuel as any).niveauEtudeId,
              classeId: nextClasse.id,
              anneeAcademiqueId: nextAnnee.id,
              demandeInscriptionId: (cursusActuel as any).demandeInscriptionId,
              utilisateurId: cursusActuel.utilisateurId
            },
            transaction: t
          });
          if (created) nouveauCursusId = Number(nouveau.id);
        }

        if (r.decision === 'admis_avec_dette' && nouveauCursusId) {
          const bulletin = await Bulletin.findOne({
            where: {
              cursusApprenantId: Number(r.cursusApprenantId),
              semestre: deliberation.periode,
              anneeAcademiqueId: Number(deliberation.anneeAcademiqueId)
            },
            transaction: t
          });

          if (bulletin) {
            try {
              const dettes = await GestionDetteService.creerDettesApresPassation(
                Number(r.cursusApprenantId),
                nouveauCursusId,
                Number(deliberation.id),
                Number(bulletin.id),
                Number(deliberation.anneeAcademiqueId),
                Number(nextAnnee.id),
                noteMinimale,
                t
              );
              (decision as any).dettesCrees = dettes.length;
            } catch (err) {
              errors.push(`Erreur crÃ©ation dettes pour ${r.nom} ${r.prenoms}: ${err}`);
            }
          }
        }

        created.push(decision);
      }

      await t.commit();

      return res.status(201).json({
        message: `Passation effectuÃ©e pour ${created.length} Ã©tudiant(s)`,
        total: eligibles.length,
        created: created.length,
        skipped: eligibles.length - created.length,
        blocked: blocked.length > 0 ? blocked : undefined,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      await t.rollback();
      logger.error('Erreur passation:', error);
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
      logger.error('Erreur liste passations:', error);
      return res.status(500).json({ message: 'Erreur lors de la rÃ©cupÃ©ration' });
    }
  }
}

