import { Bulletin } from '../../bulletins/models/Bulletin';
import { CalculMoyenneUeService } from '../../bulletins/services/CalculMoyenneUeService';
import { DetteAcademique } from '../../bulletins/models/DetteAcademique';
import { Cours } from '../models/Cours';
import { CoursParticipant } from '../models/CoursParticipant';
import { Mcc } from '../models/Mcc';
import { RegleEvaluation } from '../models/RegleEvaluation';
import { CursusApprenant } from '../models/CursusApprenant';
import { SemestreAcademique } from '../models/SemestreAcademique';

export interface SemestreAcademiquePayload {
  id?: number;
  parcoursId: number;
  anneeAcademiqueId: number;
  statut?: string;
  codeSemestre?: string;
  dateDebut?: Date | null;
  dateFin?: Date | null;
}

export interface ActivationCheckResult {
  valid: boolean;
  reason?: string;
  updates: SemestreAcademiquePayload[];
}

export class SemestreAcademiqueService {
  static planActivation(target: SemestreAcademiquePayload, existingSemestres: SemestreAcademiquePayload[]): ActivationCheckResult {
    const active = existingSemestres.filter(s => s.parcoursId === target.parcoursId && s.anneeAcademiqueId === target.anneeAcademiqueId && s.statut === 'en_cours');

    if (active.length > 0 && Number(target.id) !== Number(active[0].id)) {
      return {
        valid: false,
        reason: 'Un semestre est déjà actif pour ce parcours et cette année académique',
        updates: []
      };
    }

    return {
      valid: true,
      updates: [{
        ...target,
        statut: 'en_cours'
      }]
    };
  }

  static canWriteNotes(statut?: string | null): { allowed: boolean; reason?: string } {
    if (statut === 'cloture') {
      return {
        allowed: false,
        reason: 'Le semestre est clôturé : les notes sont désormais en lecture seule.'
      };
    }

    return { allowed: true };
  }

  static planClosure(statut?: string | null): { valid: boolean; reason?: string; updates: SemestreAcademiquePayload[] } {
    if (statut === 'cloture') {
      return {
        valid: false,
        reason: 'Le semestre est déjà clôturé.',
        updates: []
      };
    }

    return {
      valid: true,
      updates: [{
        statut: 'cloture',
        parcoursId: 0,
        anneeAcademiqueId: 0
      }]
    };
  }

  static async appliquerCloture(semestre: SemestreAcademique): Promise<{ bulletinsTraites: number; dettesCrees: number }> {
    const parcoursId = Number(semestre.parcoursId);
    const anneeAcademiqueId = Number(semestre.anneeAcademiqueId);
    const codeSemestre = semestre.codeSemestre;

    const bulletins = await Bulletin.findAll({
      where: {
        parcoursId,
        anneeAcademiqueId,
        semestre: codeSemestre,
        statut: 'publie'
      },
      include: [{ association: Bulletin.associations.lignesBulletins }],
      order: [['id', 'ASC']]
    });

    const regles = await RegleEvaluation.findAll({
      where: { parcoursId, semestre: codeSemestre, actif: true }
    });
    const reglesMap = new Map(regles.map(r => [r.type, r.valeur]));
    const noteMinimale = parseFloat(reglesMap.get('note_minimale') || '10');
    const seuilEliminatoire = parseFloat(reglesMap.get('seuil_eliminatoire') || '7');

    let bulletinsTraites = 0;
    let dettesCrees = 0;

    for (const bulletin of bulletins) {
      const cursusApprenantId = Number((bulletin as any).cursusApprenantId);
      const cursus = await CursusApprenant.findByPk(cursusApprenantId);
      if (!cursus) continue;

      bulletinsTraites += 1;

      const coursParticipants = await CoursParticipant.findAll({
        where: { cursusApprenantId },
        attributes: ['coursId']
      });
      const coursInscritsIds = new Set(coursParticipants.map(cp => String(cp.coursId)));

      const ues = await Cours.findAll({
        where: { parcoursId, semestre: codeSemestre },
        include: [{
          model: Mcc,
          as: 'mccs',
          where: { session: 'session1' },
          required: false,
          include: [{ model: Cours, as: 'cours' }]
        }]
      });

      const lignes = (bulletin as any).lignesBulletins || [];
      const ueMoyennes = CalculMoyenneUeService.calculerMoyennesUe(ues, lignes, coursInscritsIds, noteMinimale, seuilEliminatoire);

      for (const result of ueMoyennes) {
        if (result.sommeCoefUe > 0 && result.moyenneUe < noteMinimale) {
          const existing = await DetteAcademique.findOne({
            where: { cursusApprenantId, coursId: result.coursId, statut: 'active' }
          });
          if (!existing) {
            const ue = ues.find((u: any) => Number(u.id) === result.coursId);
            await DetteAcademique.create({
              cursusApprenantId,
              coursId: result.coursId,
              anneeOrigineId: anneeAcademiqueId,
              anneeAttacheeId: anneeAcademiqueId,
              deliberationId: null,
              creditEcts: ue?.creditEcts || 0,
              nbTentatives: 1,
              statut: 'active'
            });
            dettesCrees += 1;
          }
        }
      }
    }

    return { bulletinsTraites, dettesCrees };
  }
}
