import { Op } from "sequelize";
import { Bulletin } from "../models/Bulletin";
import { LigneBulletin } from "../models/LigneBulletin";
import { Mcc } from "../../inscription/models/Mcc";
import { Cours } from "../../inscription/models/Cours";
import { CoursParticipant } from "../../inscription/models/CoursParticipant";
import { RegleEvaluation } from "../../inscription/models/RegleEvaluation";
import { CalculMoyenneUeService } from "./CalculMoyenneUeService";

export interface SuggestionDecision {
  decision: string
  motif: string
  ueEliminees: { ueCode: string; ueLibelle: string; moyenne: number; seuil: number }[]
  creditsValides: number
  totalCredits: number
}

export class MoteurCalculService {

  static async getRegles(parcoursId: number, semestre: string): Promise<Map<string, string>> {
    const regles = await RegleEvaluation.findAll({
      where: { parcoursId, semestre, actif: true }
    });
    const map = new Map<string, string>();
    for (const r of regles) {
      map.set(r.type, r.valeur);
    }
    return map;
  }

  static async suggererDecision(
    cursusApprenantId: number,
    classeId: number,
    parcoursId: number,
    semestre: string,
    anneeAcademiqueId: number,
    bulletinId: number,
    session: string = 'session1'
  ): Promise<SuggestionDecision> {
    const regles = await MoteurCalculService.getRegles(parcoursId, semestre);
    const noteMinimale = parseFloat(regles.get('note_minimale') || '10');
    const seuilEliminatoire = parseFloat(regles.get('seuil_eliminatoire') || '7');
    const compensationActive = regles.get('compensation') === 'true';

    const bulletin = await Bulletin.findByPk(bulletinId, {
      include: [{ association: Bulletin.associations.lignesBulletins }]
    });

    if (!bulletin) {
      return { decision: 'ajourne', motif: 'Bulletin introuvable', ueEliminees: [], creditsValides: 0, totalCredits: 0 };
    }

    const coursParticipants = await CoursParticipant.findAll({
      where: { cursusApprenantId },
      attributes: ['coursId']
    });
    const coursInscritsIds = new Set(coursParticipants.map(cp => String(cp.coursId)));

    const ues = await Cours.findAll({
      where: { parcoursId, semestre },
      include: [{
        model: Mcc,
        as: 'mccs',
        where: { session },
        required: false,
        include: [{
          model: Cours,
          as: 'cours'
        }]
      }]
    });

    const lignes = bulletin.lignesBulletins || [];
    const ueEliminees: SuggestionDecision['ueEliminees'] = [];
    const ueMoyennes = CalculMoyenneUeService.calculerMoyennesUe(ues, lignes, coursInscritsIds, noteMinimale, seuilEliminatoire);

    for (const r of ueMoyennes) {
      for (const d of r.details) {
        if (d.mcc.estEliminatoire && d.moyenne !== null) {
          const seuil = d.mcc.seuilEliminatoire !== null ? d.mcc.seuilEliminatoire : seuilEliminatoire;
          if (d.moyenne < seuil) {
            const ue = ues.find((u: any) => Number(u.id) === r.coursId);
            ueEliminees.push({
              ueCode: ue?.code || '',
              ueLibelle: ue?.intitule || '',
              moyenne: d.moyenne,
              seuil
            });
          }
        }
      }
    }
    const ueResults: { ue: Cours; moyenneUe: number }[] = ueMoyennes
      .map(r => ({ ue: ues.find((u: any) => Number(u.id) === r.coursId) as Cours, moyenneUe: r.moyenneUe }))
      .filter(r => r.ue);

    if (ueEliminees.length > 0) {
      return { decision: 'ajourne', motif: `UE éliminatoire(s) non validée(s)`, ueEliminees, creditsValides: 0, totalCredits: 0 };
    }

    let sommeProduitECTS = 0;
    let sommeECTS = 0;
    for (const r of ueResults) {
      sommeProduitECTS += r.moyenneUe * (r.ue.creditEcts || 0);
      sommeECTS += r.ue.creditEcts || 0;
    }
    const moyenneGenerale = sommeECTS > 0 ? sommeProduitECTS / sommeECTS : 0;

    if (compensationActive && moyenneGenerale >= noteMinimale) {
      const totalCredits = ueResults.reduce((s, r) => s + (r.ue.creditEcts || 0), 0);
      return { decision: 'admis', motif: `Moyenne générale ${moyenneGenerale.toFixed(2)}/${noteMinimale}, compensation inter-UE appliquée`, ueEliminees, creditsValides: totalCredits, totalCredits };
    }

    let creditsValides = 0;
    let totalCredits = 0;
    for (const r of ueResults) {
      totalCredits += r.ue.creditEcts || 0;
      if (r.moyenneUe >= noteMinimale) {
        creditsValides += r.ue.creditEcts || 0;
      }
    }

    if (creditsValides === totalCredits) {
      return { decision: 'admis', motif: `Toutes les UE validées individuellement`, ueEliminees, creditsValides, totalCredits };
    }

    if (creditsValides > 0) {
      return { decision: 'admis_avec_dette', motif: `Moyenne ${moyenneGenerale.toFixed(2)}/${noteMinimale}, ${totalCredits - creditsValides} crédits en dette`, ueEliminees, creditsValides, totalCredits };
    }

    if (moyenneGenerale >= 8) {
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
