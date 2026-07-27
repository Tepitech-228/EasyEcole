import { LigneBulletin } from "../models/LigneBulletin";
import { Mcc } from "../../inscription/models/Mcc";

export interface MccCalculResult {
  mcc: Mcc
  moyenne: number | null
  estValide: boolean
}

export interface UeMoyenneResult {
  coursId: number
  moyenneUe: number
  sommeCoefUe: number
  aDesCoursActifs: boolean
  details: MccCalculResult[]
}

export class CalculMoyenneUeService {

  static calculerMoyennesUe(
    ues: any[],
    lignes: LigneBulletin[],
    coursInscritsIds: Set<string>,
    noteMinimale: number,
    seuilEliminatoire?: number
  ): UeMoyenneResult[] {
    const results: UeMoyenneResult[] = [];

    for (const ue of ues) {
      const mccs = (ue as any).mccs || [];
      let sommeUe = 0;
      let sommeCoefUe = 0;
      let aDesCoursActifs = false;
      const details: MccCalculResult[] = [];

      for (const mcc of mccs) {
        const cours = (mcc as any).cours;
        if (cours && !cours.estObligatoire && !coursInscritsIds.has(String(mcc.coursId))) {
          continue;
        }
        aDesCoursActifs = true;
        const ligne = lignes.find((l: any) => String(l.coursId) === String(mcc.coursId));
        const moyenne = ligne ? ligne.moyenne : null;
        details.push({ mcc, moyenne, estValide: moyenne !== null && moyenne >= noteMinimale });
        if (moyenne !== null) {
          sommeUe += moyenne * mcc.coefficient;
          sommeCoefUe += mcc.coefficient;
        }
      }

      if (aDesCoursActifs) {
        const moyenneUe = sommeCoefUe > 0 ? sommeUe / sommeCoefUe : 0;
        results.push({ coursId: Number(ue.id), moyenneUe, sommeCoefUe, aDesCoursActifs, details });
      }
    }

    return results;
  }

  static calculerMoyennesUeSimple(
    ues: any[],
    lignes: LigneBulletin[]
  ): UeMoyenneResult[] {
    return this.calculerMoyennesUe(ues, lignes, new Set(), 10);
  }

  static verifierUeEliminatoires(
    results: UeMoyenneResult[],
    seuilEliminatoire: number
  ): { ueCode: string; ueLibelle: string; moyenne: number; seuil: number }[] {
    const eliminees: { ueCode: string; ueLibelle: string; moyenne: number; seuil: number }[] = [];
    for (const r of results) {
      for (const d of r.details) {
        if (d.mcc.estEliminatoire && d.moyenne !== null && d.moyenne < seuilEliminatoire) {
          eliminees.push({
            ueCode: (d.mcc as any).cours?.code || '',
            ueLibelle: (d.mcc as any).cours?.intitule || '',
            moyenne: d.moyenne,
            seuil: seuilEliminatoire
          });
        }
      }
    }
    return eliminees;
  }
}
