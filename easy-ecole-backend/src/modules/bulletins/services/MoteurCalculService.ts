import { Op } from "sequelize";
import { Bulletin } from "../models/Bulletin";
import { LigneBulletin } from "../models/LigneBulletin";
import { UniteEnseignement } from "../../inscription/models/UniteEnseignement";
import { Mcc } from "../../inscription/models/Mcc";

export interface SuggestionDecision {
  decision: string
  motif: string
  ueEliminees: { ueCode: string; ueLibelle: string; moyenne: number; seuil: number }[]
  creditsValides: number
  totalCredits: number
}

export class MoteurCalculService {

  static async suggererDecision(
    cursusApprenantId: number,
    classeId: number,
    parcoursId: number,
    semestre: string,
    anneeAcademiqueId: number,
    bulletinId: number
  ): Promise<SuggestionDecision> {
    const bulletin = await Bulletin.findByPk(bulletinId, {
      include: [{ association: Bulletin.associations.lignesBulletins }]
    });

    if (!bulletin) {
      return { decision: 'ajourne', motif: 'Bulletin introuvable', ueEliminees: [], creditsValides: 0, totalCredits: 0 };
    }

    const ues = await UniteEnseignement.findAll({
      where: { parcoursId, semestre },
      include: [{
        model: Mcc,
        as: 'mccs',
        where: { session: 'session1' },
        required: false
      }]
    });

    const lignes = bulletin.lignesBulletins || [];
    let sommeMoyennesPonderees = 0;
    let sommeCoefficients = 0;
    let totalCredits = 0;
    let creditsValides = 0;
    const ueEliminees: SuggestionDecision['ueEliminees'] = [];

    for (const ue of ues) {
      const mccs = (ue as any).mccs || [];
      let sommeUe = 0;
      let sommeCoefUe = 0;

      for (const mcc of mccs) {
        const ligne = lignes.find((l: any) => String(l.coursId) === String(mcc.coursId));
        const moyenne = ligne ? ligne.moyenne : null;
        if (moyenne !== null) {
          sommeUe += moyenne * mcc.coefficient;
          sommeCoefUe += mcc.coefficient;
          sommeMoyennesPonderees += moyenne * mcc.coefficient;
          sommeCoefficients += mcc.coefficient;
        }
        if (mcc.estEliminatoire && mcc.seuilEliminatoire !== null && moyenne !== null && moyenne < mcc.seuilEliminatoire) {
          ueEliminees.push({
            ueCode: ue.code,
            ueLibelle: ue.libelle,
            moyenne,
            seuil: mcc.seuilEliminatoire
          });
        }
      }

      const moyenneUe = sommeCoefUe > 0 ? sommeUe / sommeCoefUe : 0;
      const estValidee = moyenneUe >= 10 && !ueEliminees.some(e => e.ueCode === ue.code);
      totalCredits += ue.creditEcts || 0;
      if (estValidee) creditsValides += ue.creditEcts || 0;
    }

    const moyenneGenerale = sommeCoefficients > 0 ? sommeMoyennesPonderees / sommeCoefficients : 0;

    if (ueEliminees.length > 0) {
      return { decision: 'ajourne', motif: `UE éliminatoire(s) non validée(s)`, ueEliminees, creditsValides, totalCredits };
    }
    if (moyenneGenerale >= 10 && creditsValides === totalCredits) {
      return { decision: 'admis', motif: 'Moyenne générale >= 10 et tous les crédits validés', ueEliminees, creditsValides, totalCredits };
    }
    if (moyenneGenerale >= 10 && creditsValides < totalCredits) {
      return { decision: 'admis_avec_dette', motif: `Moyenne >= 10 mais ${totalCredits - creditsValides} crédits en dette`, ueEliminees, creditsValides, totalCredits };
    }
    if (moyenneGenerale >= 8 && moyenneGenerale < 10) {
      return { decision: 'rattrapage', motif: `Moyenne ${moyenneGenerale.toFixed(2)}/20, session de rattrapage autorisée`, ueEliminees, creditsValides, totalCredits };
    }
    return { decision: 'ajourne', motif: `Moyenne ${moyenneGenerale.toFixed(2)}/20 insuffisante`, ueEliminees, creditsValides, totalCredits };
  }

  static async getSuggestionsMassives(
    deliberationId: number,
    resultats: { id: number; cursusApprenantId: number; bulletinId: number }[]
  ): Promise<{ resultatId: number; suggestion: SuggestionDecision }[]> {
    const bulletinIds = resultats.map(r => r.bulletinId);
    const bulletins = await Bulletin.findAll({
      where: { id: { [Op.in]: bulletinIds } },
      include: [{ association: Bulletin.associations.lignesBulletins }]
    });
    const bulletinMap = new Map(bulletins.map(b => [b.id, b]));

    const suggestions: { resultatId: number; suggestion: SuggestionDecision }[] = [];
    for (const r of resultats) {
      const bulletin = bulletinMap.get(r.bulletinId);
      if (!bulletin) continue;
      const suggestion = await MoteurCalculService.suggererDecision(
        r.cursusApprenantId,
        Number(bulletin.classeId),
        Number(bulletin.parcoursId),
        bulletin.semestre,
        Number(bulletin.anneeAcademiqueId),
        Number(bulletin.id)
      );
      suggestions.push({ resultatId: r.id, suggestion });
    }
    return suggestions;
  }
}
