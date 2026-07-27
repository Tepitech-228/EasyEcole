import { Op, Transaction } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Bulletin } from "../models/Bulletin";
import { LigneBulletin } from "../models/LigneBulletin";
import { Cours } from "../../inscription/models/Cours";
import { Mcc } from "../../inscription/models/Mcc";
import { RegleEvaluation } from "../../inscription/models/RegleEvaluation";

export interface RetakeGrade {
  coursId: number
  newNote: number
}

export interface RattrapageResult {
  bulletin: Bulletin
  ues: {
    ueCode: string
    ueLibelle: string
    moyenneUe: number
    estValidee: boolean
  }[]
  moyenneGenerale: number
  creditsValides: number
  totalCredits: number
  decision: string
  motif: string
}

export class CalculRattrapageService {

  static async calculerRattrapage(
    bulletinId: number,
    retakeGrades: RetakeGrade[]
  ): Promise<RattrapageResult> {
    const t = await DatabaseConnection.getInstance().sequelize.transaction();

    try {
      const bulletin = await Bulletin.findByPk(bulletinId, {
        include: [{ association: Bulletin.associations.lignesBulletins }],
        transaction: t
      });

      if (!bulletin) {
        await t.rollback();
        throw new Error('Bulletin non trouvé');
      }

      const regles = await RegleEvaluation.findAll({
        where: { parcoursId: bulletin.parcoursId, actif: true },
        transaction: t
      });
      const reglesMap = new Map(regles.map(r => [r.type, r.valeur]));
      const noteMinimale = parseFloat(reglesMap.get('note_minimale') || '10');

      const ues = await Cours.findAll({
        where: { parcoursId: bulletin.parcoursId, semestre: bulletin.semestre },
        include: [{
          model: Mcc,
          as: 'mccs',
          where: { session: 'session1' },
          required: false
        }],
        transaction: t
      });

      const lignes = bulletin.lignesBulletins || [];
      const retakeMap = new Map(retakeGrades.map(rg => [rg.coursId, rg.newNote]));

      for (const ligne of lignes) {
        const newNote = retakeMap.get(Number(ligne.coursId));
        if (newNote !== undefined && ligne.moyenne !== null && ligne.moyenne < noteMinimale && newNote > ligne.moyenne) {
          await ligne.update({ moyenne: Math.round(newNote * 100) / 100 }, { transaction: t });
        }
      }

      const lignesActualisees = await LigneBulletin.findAll({
        where: { bulletinId },
        transaction: t
      });

      let sommeMoyennesPonderees = 0;
      let sommeCoefficients = 0;
      let totalCredits = 0;
      let creditsValides = 0;
      const ueResultats: RattrapageResult['ues'] = [];

      for (const ue of ues) {
        const mccs = (ue as any).mccs || [];
        let sommeUe = 0;
        let sommeCoefUe = 0;

        for (const mcc of mccs) {
          const ligne = lignesActualisees.find(l => String(l.coursId) === String(mcc.coursId));
          const moyenne = ligne ? ligne.moyenne : null;
          if (moyenne !== null) {
            sommeUe += moyenne * mcc.coefficient;
            sommeCoefUe += mcc.coefficient;
            sommeMoyennesPonderees += moyenne * mcc.coefficient;
            sommeCoefficients += mcc.coefficient;
          }
        }

        const moyenneUe = sommeCoefUe > 0 ? sommeUe / sommeCoefUe : 0;
        const estValidee = moyenneUe >= noteMinimale;
        totalCredits += ue.creditEcts || ue.credit || 0;
        if (estValidee) creditsValides += ue.creditEcts || ue.credit || 0;

        ueResultats.push({
          ueCode: ue.code,
          ueLibelle: ue.intitule,
          moyenneUe: Math.round(moyenneUe * 100) / 100,
          estValidee
        });
      }

      const moyenneGenerale = sommeCoefficients > 0
        ? Math.round((sommeMoyennesPonderees / sommeCoefficients) * 100) / 100
        : 0;

      let decision: string;
      let motif: string;

      if (moyenneGenerale >= noteMinimale && creditsValides === totalCredits) {
        decision = 'admis';
        motif = `Moyenne générale >= ${noteMinimale} et tous les crédits validés`;
      } else if (moyenneGenerale >= noteMinimale && creditsValides < totalCredits) {
        decision = 'admis_avec_dette';
        motif = `Moyenne >= ${noteMinimale} mais ${totalCredits - creditsValides} crédits en dette`;
      } else {
        decision = 'ajourne';
        motif = `Moyenne ${moyenneGenerale.toFixed(2)}/20 insuffisante`;
      }

      await bulletin.update({
        moyenneGenerale,
        totalCredits,
        creditsValides
      }, { transaction: t });

      await t.commit();

      const bulletinFinal = await Bulletin.findByPk(bulletinId, {
        include: [{ association: Bulletin.associations.lignesBulletins }]
      });

      return {
        bulletin: bulletinFinal!,
        ues: ueResultats,
        moyenneGenerale,
        creditsValides,
        totalCredits,
        decision,
        motif
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}
