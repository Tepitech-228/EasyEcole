import { Op, Transaction } from "sequelize";
import { DetteAcademique } from "../models/DetteAcademique";
import { Bulletin } from "../models/Bulletin";
import { LigneBulletin } from "../models/LigneBulletin";
import { Mcc } from "../../inscription/models/Mcc";
import { Cours } from "../../inscription/models/Cours";
import { CoursParticipant } from "../../inscription/models/CoursParticipant";
import { RegleEvaluation } from "../../inscription/models/RegleEvaluation";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";
import { AnneeAcademique } from "../../inscription/models/AnneeAcademique";
import { CalculMoyenneUeService } from "./CalculMoyenneUeService";

export interface UeStats {
  coursId: number
  code: string
  libelle: string
  creditEcts: number
  semestre: string
  statut: 'validee' | 'dette_active' | 'resorbee' | 'echeance' | 'en_cours' | 'non_entamee'
  moyenne: number | null
  anneeOrigine?: string
  anneeValidation?: string
  detteId?: number
  nbTentatives?: number
  bulletinId?: number
}

export interface SuiviUeResult {
  cursusApprenantId: number
  parcours: string
  anneeActuelle: string
  ues: UeStats[]
  stats: {
    totalEcts: number
    ectsValides: number
    ectsEnDette: number
    ectsRestants: number
    tauxValidation: number
  }
}

export class GestionDetteService {

  static async creerDettesApresPassation(
    cursusActuelId: number,
    nouveauCursusId: number,
    deliberationId: number,
    bulletinId: number,
    anneeOrigineId: number,
    anneeAttacheeId: number,
    noteMinimale: number,
    t?: Transaction
  ): Promise<DetteAcademique[]> {
    const bulletin = await Bulletin.findByPk(bulletinId, {
      include: [{ association: Bulletin.associations.lignesBulletins }],
      transaction: t
    });
    if (!bulletin) return [];

    const dettes: DetteAcademique[] = [];

    const ues = await Cours.findAll({
      where: { parcoursId: bulletin.parcoursId, semestre: bulletin.semestre },
      include: [{
        model: Mcc,
        as: 'mccs',
        where: { session: 'session1' },
        required: false,
        include: [{ model: Cours, as: 'cours' }]
      }],
      transaction: t
    });

    const coursParticipants = await CoursParticipant.findAll({
      where: { cursusApprenantId: cursusActuelId },
      attributes: ['coursId'],
      transaction: t
    });
    const coursInscritsIds = new Set(coursParticipants.map(cp => String(cp.coursId)));
    const lignes = bulletin.lignesBulletins || [];

    const ueMoyennes = CalculMoyenneUeService.calculerMoyennesUe(ues, lignes, coursInscritsIds, noteMinimale);

    for (const r of ueMoyennes) {
      if (r.sommeCoefUe > 0) {
        if (r.moyenneUe < noteMinimale) {
          const existing = await DetteAcademique.findOne({
            where: { cursusApprenantId: nouveauCursusId, coursId: r.coursId, statut: 'active' },
            transaction: t
          });
          if (!existing) {
            const ue = ues.find((u: any) => Number(u.id) === r.coursId);
            const dette = await DetteAcademique.create({
              cursusApprenantId: nouveauCursusId,
              coursId: r.coursId,
              anneeOrigineId,
              anneeAttacheeId,
              deliberationId,
              creditEcts: ue?.creditEcts || 0,
              nbTentatives: 1,
              statut: 'active'
            }, { transaction: t });
            dettes.push(dette);
          }
        }
      }
    }

    return dettes;
  }

  static async resorberDette(detteId: number, bulletinId: number, t?: Transaction): Promise<DetteAcademique | null> {
    const dette = await DetteAcademique.findByPk(detteId, { transaction: t });
    if (!dette || dette.statut !== 'active') return null;

    await dette.update({ statut: 'resorbee', nbTentatives: dette.nbTentatives + 1 }, { transaction: t });
    return dette;
  }

  static async getDettesByCursus(cursusApprenantId: number): Promise<DetteAcademique[]> {
    return DetteAcademique.findAll({
      where: { cursusApprenantId },
      order: [['createdAt', 'DESC']]
    });
  }

  static async getDettesActivesByCursus(cursusApprenantId: number): Promise<DetteAcademique[]> {
    return DetteAcademique.findAll({
      where: { cursusApprenantId, statut: 'active' },
      order: [['createdAt', 'DESC']]
    });
  }

  static async verifierEligibiliteProgression(
    cursusApprenantId: number,
    prochainNiveauLibelle?: string
  ): Promise<{ eligible: boolean; dettesActives: DetteAcademique[]; message: string }> {
    const dettesActives = await DetteAcademique.findAll({
      where: { cursusApprenantId, statut: 'active' }
    });

    if (dettesActives.length === 0) {
      return { eligible: true, dettesActives: [], message: 'Aucune dette active' };
    }

    const totalEctsDette = dettesActives.reduce((s, d) => s + (d.creditEcts || 0), 0);
    const message = `Impossible de passer au niveau supérieur : ${dettesActives.length} UE en dette non résorbées (${totalEctsDette} ECTS)`;

    return { eligible: false, dettesActives, message };
  }

  static async getSuiviUe(cursusApprenantId: number): Promise<SuiviUeResult> {
    const cursus = await CursusApprenant.findByPk(cursusApprenantId, {
      include: [
        { association: CursusApprenant.associations.parcours },
        { association: CursusApprenant.associations.niveauEtude },
        { association: CursusApprenant.associations.anneeAcademique }
      ]
    });
    if (!cursus) throw new Error('Cursus non trouvé');

    const parcoursId = Number((cursus as any).parcoursId);
    const semestresParcours = (cursus as any).parcours?.semestres || [];

    const [tousCours, tousBulletins, regles, dettes, annees, coursParticipants, tousMccs] = await Promise.all([
      Cours.findAll({ where: { parcoursId }, order: [['semestre', 'ASC']] }),
      Bulletin.findAll({
        where: { cursusApprenantId },
        include: [{ association: Bulletin.associations.lignesBulletins }]
      }),
      RegleEvaluation.findAll({ where: { parcoursId, actif: true } }),
      DetteAcademique.findAll({ where: { cursusApprenantId } }),
      AnneeAcademique.findAll(),
      CoursParticipant.findAll({
        where: { cursusApprenantId },
        attributes: ['coursId']
      }),
      Mcc.findAll({
        where: { session: 'session1' },
        include: [{ model: Cours, as: 'cours' }]
      })
    ]);

    const reglesMap = new Map(regles.map(r => [r.type, r.valeur]));
    const noteMinimale = parseFloat(reglesMap.get('note_minimale') || '10');

    const anneeMap = new Map<number, string>();
    for (const a of annees) {
      anneeMap.set(Number(a.id), (a as any).libelle || '');
    }

    const coursInscritsIds = new Set(coursParticipants.map(cp => String(cp.coursId)));

    const mccsParCours = new Map<number, any[]>();
    for (const mcc of tousMccs) {
      const coursId = Number(mcc.coursId);
      if (!mccsParCours.has(coursId)) mccsParCours.set(coursId, []);
      mccsParCours.get(coursId)!.push(mcc);
    }

    const semestresDisponibles = new Set(tousBulletins.map(b => b.semestre));

    const ueStatuts = new Map<number, UeStats>();

    for (const cours of tousCours) {
      const cId = Number(cours.id);
      ueStatuts.set(cId, {
        coursId: cId,
        code: cours.code,
        libelle: cours.intitule,
        creditEcts: cours.creditEcts || 0,
        semestre: cours.semestre,
        statut: 'non_entamee',
        moyenne: null
      });
    }

    for (const bulletin of tousBulletins) {
      const lignes = (bulletin as any).lignesBulletins || [];
      const coursDuBulletin = tousCours.filter(c => c.semestre === bulletin.semestre);

      for (const cours of coursDuBulletin) {
        const coursId = Number(cours.id);
        const mccsCours = mccsParCours.get(coursId) || [];
        let sommeUe = 0;
        let sommeCoefUe = 0;
        let aDesCoursActifs = false;

        for (const mcc of mccsCours) {
          const mccCours = (mcc as any).cours;
          if (mccCours && !mccCours.estObligatoire && !coursInscritsIds.has(String(mcc.coursId))) continue;
          aDesCoursActifs = true;
          const ligne = lignes.find((l: any) => String(l.coursId) === String(mcc.coursId));
          const moyenne = ligne ? ligne.moyenne : null;
          if (moyenne !== null) {
            sommeUe += moyenne * mcc.coefficient;
            sommeCoefUe += mcc.coefficient;
          }
        }

        if (aDesCoursActifs && sommeCoefUe > 0) {
          const moyenneUe = sommeUe / sommeCoefUe;
          const current = ueStatuts.get(coursId);
          if (current && (current.statut === 'non_entamee' || (moyenneUe >= noteMinimale && current.statut !== 'validee'))) {
            current.moyenne = Math.round(moyenneUe * 100) / 100;
            current.statut = moyenneUe >= noteMinimale ? 'validee' : 'non_entamee';
            current.bulletinId = Number(bulletin.id);
          }
        }
      }
    }

    for (const dette of dettes) {
      const coursId = Number(dette.coursId);
      const current = ueStatuts.get(coursId);
      if (current) {
        const s = String(dette.statut);
        current.statut = s === 'active' ? 'dette_active' : s === 'resorbee' ? 'resorbee' : 'echeance';
        current.detteId = Number(dette.id);
        current.nbTentatives = dette.nbTentatives || 0;
        current.anneeOrigine = anneeMap.get(Number(dette.anneeOrigineId)) || '';
      }
    }

    const totalEcts = Array.from(ueStatuts.values()).reduce((s, u) => s + u.creditEcts, 0);
    const ectsValides = Array.from(ueStatuts.values())
      .filter(u => u.statut === 'validee' || u.statut === 'resorbee')
      .reduce((s, u) => s + u.creditEcts, 0);
    const ectsEnDette = Array.from(ueStatuts.values())
      .filter(u => u.statut === 'dette_active')
      .reduce((s, u) => s + u.creditEcts, 0);
    const ectsRestants = totalEcts - ectsValides - ectsEnDette;

    return {
      cursusApprenantId,
      parcours: (cursus as any).parcours?.titre || '',
      anneeActuelle: (cursus as any).niveauEtude?.libelle || '',
      ues: Array.from(ueStatuts.values()),
      stats: {
        totalEcts,
        ectsValides,
        ectsEnDette,
        ectsRestants,
        tauxValidation: totalEcts > 0 ? Math.round((ectsValides / totalEcts) * 100 * 100) / 100 : 0
      }
    };
  }
}
