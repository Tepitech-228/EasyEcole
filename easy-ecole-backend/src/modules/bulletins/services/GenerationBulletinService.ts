import { Transaction } from "sequelize";
import { Bulletin } from "../models/Bulletin";
import { LigneBulletin } from "../models/LigneBulletin";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";
import { Cours } from "../../inscription/models/Cours";
import { CoursParticipant } from "../../inscription/models/CoursParticipant";
import { ListeNoteEvaluation } from "../../inscription/models/ListeNoteEvaluation";
import { Mcc } from "../../inscription/models/Mcc";
import { RegleEvaluation } from "../../inscription/models/RegleEvaluation";

export interface LigneBulletinCalcul {
  coursId: number
  moyenneCC: number | null
  noteDevoir: number | null
  noteExamen: number | null
  moyenne: number
  coefficient: number | null
}

export interface UeBulletinResult {
  ueId: number
  ueCode: string
  ueLibelle: string
  moyenneUe: number
  creditEcts: number
  estValidee: boolean
  lignes: LigneBulletinCalcul[]
}

export interface BulletinGenerationResult {
  bulletin: Bulletin
  ues: UeBulletinResult[]
}

export class GenerationBulletinService {

  static async generer(
    classeId: number,
    semestre: string,
    anneeAcademiqueId: number,
    transaction?: Transaction
  ): Promise<BulletinGenerationResult[]> {
    const results: BulletinGenerationResult[] = [];

    const cursusList = await CursusApprenant.findAll({
      where: { classeId, anneeAcademiqueId },
      include: [{ association: CursusApprenant.associations.utilisateur }]
    });

    if (!cursusList.length) return results;

    const parcoursId = cursusList[0].parcoursId;

    const ues = await Cours.findAll({
      where: { parcoursId, semestre },
      include: [{
        model: Mcc,
        as: 'mccs',
        where: { session: 'session1' },
        required: false,
        include: [{
          model: Cours,
          as: 'cours'
        }]
      }]
    });

    if (!ues.length) return results;

    const regles = await RegleEvaluation.findAll({
      where: { parcoursId, semestre, actif: true }
    });
    const reglesMap = new Map(regles.map(r => [r.type, r.valeur]));
    const noteMinimale = parseFloat(reglesMap.get('note_minimale') || '10');

    for (const cursus of cursusList) {
      const existant = await Bulletin.findOne({
        where: { cursusApprenantId: cursus.id, semestre, anneeAcademiqueId }
      });
      if (existant) continue;

      const coursParticipants = await CoursParticipant.findAll({
        where: { cursusApprenantId: cursus.id },
        attributes: ['id', 'coursId']
      });
      const coursParticipantMap = new Map(coursParticipants.map(cp => [String(cp.coursId), Number(cp.id)]));

      const resultatsUe: UeBulletinResult[] = [];
      let sommeProduitECTS = 0;
      let sommeECTS = 0;
      let creditsValides = 0;
      let totalCredits = 0;

      for (const ue of ues) {
        const mccs = (ue as any).mccs || [];
        const lignesBulletin: LigneBulletinCalcul[] = [];
        let sommeNotesCoefUe = 0;
        let sommeCoefUe = 0;

        for (const mcc of mccs) {
          const cours = (mcc as any).cours;
          if (!cours) continue;

          if (!cours.estObligatoire && !coursParticipantMap.has(String(mcc.coursId))) {
            continue;
          }

          const coursParticipantId = coursParticipantMap.get(String(mcc.coursId)) as number | undefined;
          if (!coursParticipantId) continue;

          const coursIdNum = Number(String(cours.id));
          const moyenne = await GenerationBulletinService.calculerMoyenneCours(
            coursIdNum, anneeAcademiqueId, coursParticipantId
          );

          const moyenneCC = await GenerationBulletinService.calculerMoyenneCC(
            coursIdNum, anneeAcademiqueId, coursParticipantId
          );

          const { noteDevoir, noteExamen } = await GenerationBulletinService.calculerNotesDevoirExamen(
            coursIdNum, anneeAcademiqueId, coursParticipantId
          );

          lignesBulletin.push({
            coursId: cours.id,
            moyenneCC,
            noteDevoir,
            noteExamen,
            moyenne,
            coefficient: mcc.coefficient
          });

          sommeNotesCoefUe += moyenne * mcc.coefficient;
          sommeCoefUe += mcc.coefficient;
        }

        if (sommeCoefUe === 0) continue;

        const moyenneUe = Math.round((sommeNotesCoefUe / sommeCoefUe) * 100) / 100;
        const creditEcts = ue.creditEcts || ue.credit || 0;
        totalCredits += creditEcts;

        const estValidee = moyenneUe >= noteMinimale;
        if (estValidee) creditsValides += creditEcts;

        sommeProduitECTS += moyenneUe * creditEcts;
        sommeECTS += creditEcts;

        resultatsUe.push({
          ueId: Number(ue.id),
          ueCode: ue.code,
          ueLibelle: ue.intitule,
          moyenneUe,
          creditEcts,
          estValidee,
          lignes: lignesBulletin
        });
      }

      const moyenneGenerale = sommeECTS > 0
        ? Math.round((sommeProduitECTS / sommeECTS) * 100) / 100
        : null;

      const bulletin = await Bulletin.create({
        anneeAcademiqueId: anneeAcademiqueId as any,
        semestre,
        cursusApprenantId: cursus.id as any,
        utilisateurId: cursus.utilisateurId as any,
        classeId: classeId as any,
        parcoursId: cursus.parcoursId as any,
        niveauEtudeId: cursus.niveauEtudeId as any,
        moyenneGenerale,
        totalCredits,
        creditsValides,
        statut: 'brouillon' as const,
        dateGeneration: new Date(),
      }, { transaction });

      for (const ueResult of resultatsUe) {
        for (const l of ueResult.lignes) {
          await LigneBulletin.create({
            bulletinId: bulletin.id,
            coursId: l.coursId,
            moyenneCC: l.moyenneCC,
            noteDevoir: l.noteDevoir,
            noteExamen: l.noteExamen,
            moyenne: l.moyenne,
            coefficient: l.coefficient,
          }, { transaction });
        }
      }

      results.push({ bulletin, ues: resultatsUe });
    }

    return results;
  }

  private static async calculerMoyenneCours(
    coursId: number,
    anneeAcademiqueId: number,
    coursParticipantId: number
  ): Promise<number> {
    const listesEval = await ListeNoteEvaluation.findAll({
      where: { coursId, anneeAcademiqueId },
      include: [
        { association: ListeNoteEvaluation.associations.typeNoteEvaluation },
        {
          association: ListeNoteEvaluation.associations.notesEvaluation,
          where: { coursParticipantId },
          required: false
        }
      ]
    });

    let sommePonderee = 0;
    let sommePoids = 0;

    for (const evalList of listesEval) {
      if (evalList.notesEvaluation?.length) {
        const note = Number(evalList.notesEvaluation[0].note);
        if (note == null) continue;
        const poids = Number(evalList.poidsTypeNoteEvaluation) || 0;
        if (poids > 0) {
          sommePonderee += note * poids;
          sommePoids += poids;
        }
      }
    }

    return sommePoids > 0
      ? Math.round((sommePonderee / sommePoids) * 100) / 100
      : 0;
  }

  private static async calculerMoyenneCC(
    coursId: number,
    anneeAcademiqueId: number,
    coursParticipantId: number
  ): Promise<number | null> {
    const listesEval = await ListeNoteEvaluation.findAll({
      where: { coursId, anneeAcademiqueId },
      include: [
        { association: ListeNoteEvaluation.associations.typeNoteEvaluation },
        {
          association: ListeNoteEvaluation.associations.notesEvaluation,
          where: { coursParticipantId },
          required: false
        }
      ]
    });

    const notesPonderees: { note: number; poids: number }[] = [];

    for (const evalList of listesEval) {
      if (evalList.notesEvaluation?.length) {
        const note = Number(evalList.notesEvaluation[0].note);
        if (note == null) continue;
        const poids = Number(evalList.poidsTypeNoteEvaluation) || 0;
        const categorie = (evalList as any).typeNoteEvaluation?.categorie;

        if (categorie === 'controle_continu' && poids > 0) {
          notesPonderees.push({ note, poids });
        }
      }
    }

    if (!notesPonderees.length) return null;

    const somme = notesPonderees.reduce((a, n) => a + n.note * n.poids, 0);
    const sommeP = notesPonderees.reduce((a, n) => a + n.poids, 0);
    return Math.round((somme / sommeP) * 100) / 100;
  }

  private static async calculerNotesDevoirExamen(
    coursId: number,
    anneeAcademiqueId: number,
    coursParticipantId: number
  ): Promise<{ noteDevoir: number | null; noteExamen: number | null }> {
    const listesEval = await ListeNoteEvaluation.findAll({
      where: { coursId, anneeAcademiqueId },
      include: [
        { association: ListeNoteEvaluation.associations.typeNoteEvaluation },
        {
          association: ListeNoteEvaluation.associations.notesEvaluation,
          where: { coursParticipantId },
          required: false
        }
      ]
    });

    let noteDevoir: number | null = null;
    let noteExamen: number | null = null;

    for (const evalList of listesEval) {
      if (evalList.notesEvaluation?.length) {
        const note = Number(evalList.notesEvaluation[0].note);
        if (note == null) continue;
        const categorie = (evalList as any).typeNoteEvaluation?.categorie;

        if (categorie === 'devoir') {
          noteDevoir = note;
        } else if (categorie === 'examen') {
          noteExamen = note;
        }
      }
    }

    return { noteDevoir, noteExamen };
  }
}
