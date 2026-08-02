import { CursusApprenant } from '../models/CursusApprenant';
import { Bulletin } from '../../bulletins/models/Bulletin';
import { LigneBulletin } from '../../bulletins/models/LigneBulletin';
import { Cours } from '../models/Cours';
import { DetteAcademique } from '../../bulletins/models/DetteAcademique';

export type CoursStatutType = 'validee' | 'non_validee' | 'en_cours' | 'non_entamee' | 'dette_active' | 'resorbee';

export interface CoursStatutResult {
  coursId: number;
  coursIntitule: string;
  statut: CoursStatutType;
  moyenne?: number;
  creditEcts?: number;
}

export class CoursStatutService {

  static async getStatutsCours(cursusApprenantId: number): Promise<CoursStatutResult[]> {
    const cursus = await CursusApprenant.findByPk(cursusApprenantId, {
      include: [
        { association: 'parcours' },
        { association: 'niveauEtude' },
        { association: 'classe' }
      ]
    });

    if (!cursus) return [];

    const coursList = await Cours.findAll({
      where: {
        classeId: cursus.classeId,
        parcoursId: cursus.parcoursId
      }
    });

    const bulletins = await Bulletin.findAll({
      where: {
        cursusApprenantId,
        statut: 'publie'
      },
      include: [{ association: 'lignesBulletins' }]
    });

    const dettes = await DetteAcademique.findAll({
      where: { cursusApprenantId, statut: 'active' }
    });

    const detteCoursIds = dettes.map(d => d.coursId);

    const coursMoyennes: Record<number, number> = {};
    for (const bulletin of bulletins) {
      for (const ligne of (bulletin as any).lignesBulletins || []) {
        if (ligne.moyenne != null) {
          coursMoyennes[ligne.coursId] = ligne.moyenne;
        }
      }
    }

    const resultats: CoursStatutResult[] = coursList.map(cours => {
      let statut: CoursStatutType = 'non_entamee';
      const moyenne = coursMoyennes[cours.id];

      if (detteCoursIds.includes(cours.id)) {
        statut = 'dette_active';
      } else if (moyenne != null) {
        statut = 'validee';
      } else if (bulletins.length > 0) {
        statut = 'en_cours';
      }

      return {
        coursId: cours.id,
        coursIntitule: cours.intitule,
        statut,
        moyenne: moyenne ?? undefined,
        creditEcts: cours.creditEcts ?? undefined
      };
    });

    return resultats;
  }
}
