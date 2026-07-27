import { CursusApprenant } from "../../modules/inscription/models/CursusApprenant";
import { Cours } from "../../modules/inscription/models/Cours";
import { Bulletin } from "../../modules/bulletins/models/Bulletin";
import { Op } from "sequelize";

export interface AnneeParcoursInfo {
  annee: string
  libelle: string
  semestres: string[]
  ordre: number
}

export interface SemestreProgression {
  semestre: string
  libelle: string
  totalEcts: number
  ectsValides: number
  ectsEnDette: number
  statut: 'non_entame' | 'en_cours' | 'termine' | 'bloque'
  ueCount: number
  ueValidees: number
}

export interface ProgressionSemestrielleResult {
  anneeActuelle: string
  semestreEnCours: string | null
  annees: AnneeParcoursInfo[]
  semestres: SemestreProgression[]
}

const MAPPING_NIVEAU_SEMESTRES: Record<string, { annee: string; libelle: string; semestres: string[]; ordre: number }[]> = {
  'L1': [
    { annee: 'ANNEE1', libelle: 'L1 - Licence 1', semestres: ['semestre1', 'semestre2'], ordre: 1 }
  ],
  'LICENCE1': [
    { annee: 'ANNEE1', libelle: 'L1 - Licence 1', semestres: ['semestre1', 'semestre2'], ordre: 1 }
  ],
  'LICENCE 1': [
    { annee: 'ANNEE1', libelle: 'L1 - Licence 1', semestres: ['semestre1', 'semestre2'], ordre: 1 }
  ],
  'L2': [
    { annee: 'ANNEE2', libelle: 'L2 - Licence 2', semestres: ['semestre3', 'semestre4'], ordre: 2 }
  ],
  'LICENCE2': [
    { annee: 'ANNEE2', libelle: 'L2 - Licence 2', semestres: ['semestre3', 'semestre4'], ordre: 2 }
  ],
  'LICENCE 2': [
    { annee: 'ANNEE2', libelle: 'L2 - Licence 2', semestres: ['semestre3', 'semestre4'], ordre: 2 }
  ],
  'L3': [
    { annee: 'ANNEE3', libelle: 'L3 - Licence 3', semestres: ['semestre5', 'semestre6'], ordre: 3 }
  ],
  'LICENCE3': [
    { annee: 'ANNEE3', libelle: 'L3 - Licence 3', semestres: ['semestre5', 'semestre6'], ordre: 3 }
  ],
  'LICENCE 3': [
    { annee: 'ANNEE3', libelle: 'L3 - Licence 3', semestres: ['semestre5', 'semestre6'], ordre: 3 }
  ],
  'M1': [
    { annee: 'ANNEE1', libelle: 'M1 - Master 1', semestres: ['semestre1', 'semestre2'], ordre: 1 }
  ],
  'MASTER1': [
    { annee: 'ANNEE1', libelle: 'M1 - Master 1', semestres: ['semestre1', 'semestre2'], ordre: 1 }
  ],
  'M2': [
    { annee: 'ANNEE2', libelle: 'M2 - Master 2', semestres: ['semestre3', 'semestre4'], ordre: 2 }
  ],
  'MASTER2': [
    { annee: 'ANNEE2', libelle: 'M2 - Master 2', semestres: ['semestre3', 'semestre4'], ordre: 2 }
  ]
};

const SEMESTRE_LABELS: Record<string, string> = {
  semestre1: 'Semestre 1',
  semestre2: 'Semestre 2',
  semestre3: 'Semestre 3',
  semestre4: 'Semestre 4',
  semestre5: 'Semestre 5',
  semestre6: 'Semestre 6'
};

export class SemestreProgressionService {

  static getAnneesParcours(niveauLibelle: string): AnneeParcoursInfo[] {
    const key = niveauLibelle.trim().toUpperCase().replace(/\s+/g, '');
    const mapping = MAPPING_NIVEAU_SEMESTRES[niveauLibelle.toUpperCase()] ||
                    MAPPING_NIVEAU_SEMESTRES[key] || [];
    return mapping;
  }

  static getSemestreEnCours(): string {
    const now = new Date();
    const mois = now.getMonth() + 1;
    const jour = now.getDate();

    if (mois >= 10 || mois <= 2) return 'semestre1';
    if (mois >= 3 && mois <= 6) return 'semestre2';

    if (mois >= 10) return 'semestre1';
    return 'semestre2';
  }

  static async getProgression(
    cursusApprenantId: number
  ): Promise<ProgressionSemestrielleResult | null> {
    const cursus = await CursusApprenant.findByPk(cursusApprenantId, {
      include: [
        { association: CursusApprenant.associations.niveauEtude },
        { association: CursusApprenant.associations.parcours }
      ]
    });

    if (!cursus) return null;

    const niveauLibelle = (cursus as any).niveauEtude?.libelle || '';
    const parcoursId = Number((cursus as any).parcoursId);

    const annees = this.getAnneesParcours(niveauLibelle);
    const semestreEnCours = this.getSemestreEnCours();

    const toutesUes = await Cours.findAll({
      where: { parcoursId },
      order: [['semestre', 'ASC']]
    });

    const bulletins = await Bulletin.findAll({
      where: { cursusApprenantId },
      attributes: ['semestre', 'moyenneGenerale', 'creditsValides', 'totalCredits', 'statut']
    });

    const bulletinsParSemestre = new Map<string, Bulletin[]>();
    for (const b of bulletins) {
      const sem = b.semestre;
      if (!bulletinsParSemestre.has(sem)) bulletinsParSemestre.set(sem, []);
      bulletinsParSemestre.get(sem)!.push(b);
    }

    const uesParSemestre = new Map<string, typeof toutesUes>();
    for (const ue of toutesUes) {
      const sem = ue.semestre;
      if (!uesParSemestre.has(sem)) uesParSemestre.set(sem, []);
      uesParSemestre.get(sem)!.push(ue);
    }

    const semestresDeLAnnee = new Set<string>();
    for (const annee of annees) {
      for (const sem of annee.semestres) {
        semestresDeLAnnee.add(sem);
      }
    }

    const semestres: SemestreProgression[] = [];
    const semestresInclus = semestresDeLAnnee.size > 0
      ? Array.from(semestresDeLAnnee)
      : Array.from(new Set(toutesUes.map(u => u.semestre))).sort();

    for (const sem of semestresInclus) {
      const uesDuSemestre = uesParSemestre.get(sem) || [];
      const bulletinsDuSemestre = bulletinsParSemestre.get(sem) || [];

      const totalEcts = uesDuSemestre.reduce((s, u) => s + (u.creditEcts || 0), 0);
      const ectsValides = bulletinsDuSemestre
        .filter(b => b.creditsValides)
        .reduce((s, b) => s + (b.creditsValides || 0), 0);
      const ectsEnDette = 0;

      const bulletinPublie = bulletinsDuSemestre.find(b => b.statut === 'publie');

      let statut: SemestreProgression['statut'] = 'non_entame';
      if (bulletinsDuSemestre.length > 0 && bulletinPublie) {
        statut = 'termine';
      } else if (bulletinsDuSemestre.length > 0) {
        statut = 'en_cours';
      }

      const ueCount = uesDuSemestre.length;
      const ueValidees = bulletinsDuSemestre.length > 0
        ? bulletinsDuSemestre[0]?.creditsValides
          ? Math.round(ectsValides / (totalEcts / ueCount || 1))
          : 0
        : 0;

      semestres.push({
        semestre: sem,
        libelle: SEMESTRE_LABELS[sem] || sem,
        totalEcts,
        ectsValides,
        ectsEnDette,
        statut,
        ueCount,
        ueValidees
      });
    }

    return {
      anneeActuelle: niveauLibelle,
      semestreEnCours: semestresInclus.includes(semestreEnCours) ? semestreEnCours : semestresInclus[0] || null,
      annees,
      semestres
    };
  }

  static getSemestresParAnnee(annees: AnneeParcoursInfo[]): Map<string, string[]> {
    const map = new Map<string, string[]>();
    for (const a of annees) {
      map.set(a.annee, a.semestres);
    }
    return map;
  }
}
