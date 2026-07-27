import { CursusApprenant } from '../../inscription/models/CursusApprenant';
import { Enseignant } from '../../auth/models/Enseignant';
import { EchelleNote } from '../../bulletins/models/EchelleNote';
import { Etablissement } from '../../etablissement/models/Etablissement';

interface GenerateParams {
  typeCode: string;
  classeId?: number;
  semestre?: string;
  anneeAcademiqueId?: number;
  etudiantId?: number;
  cursusApprenantId?: number;
}

interface ResolvedData {
  etablissement: Record<string, any>;
  etudiants: Array<Record<string, any>>;
  statistiques?: Record<string, any>;
  classe?: string;
  session?: string;
  date?: string;
  president?: string;
  secretaire?: string;
}

type ResolverFn = (params: GenerateParams) => Promise<ResolvedData>;

const registry = new Map<string, ResolverFn>();

function register(typeCodes: string[], fn: ResolverFn): void {
  for (const code of typeCodes) {
    registry.set(code, fn);
  }
}

export class DataResolverService {
  static async resolve(typeCode: string, params: GenerateParams): Promise<ResolvedData> {
    const resolver = registry.get(typeCode);
    if (!resolver) {
      return resolveDefault();
    }
    return resolver(params);
  }

  static getResolver(typeCode: string): ResolverFn | undefined {
    return registry.get(typeCode);
  }
}

async function getEtablissementInfo(): Promise<Record<string, any>> {
  const etab = await Etablissement.findOne();
  if (etab) {
    return {
      nom: (etab as any).nomCommercial || (etab as any).raisonSociale || 'ESA',
      adresse: (etab as any).adresse || '',
      logo: (etab as any).logo || '',
      telephone: (etab as any).telephone || '',
      email: (etab as any).email || '',
    };
  }
  return { nom: 'ESA', adresse: '', logo: '', telephone: '', email: '' };
}

async function getEnseignantNom(enseignantId: number): Promise<string> {
  try {
    const ens = await Enseignant.findByPk(enseignantId, { include: [{ association: 'utilisateur' }] });
    const user = (ens as any)?.utilisateur;
    return user ? `${user.nom} ${user.prenoms}` : '';
  } catch { return ''; }
}

function getMention(moyenne: number, echelles: any[]): string {
  for (const e of echelles) {
    if (moyenne >= e.noteMin && moyenne <= (e.noteMax || 20)) return e.mention || '';
  }
  if (moyenne >= 16) return 'Très bien';
  if (moyenne >= 14) return 'Bien';
  if (moyenne >= 12) return 'Assez bien';
  if (moyenne >= 10) return 'Passable';
  return 'Insuffisant';
}

function getAppreciation(moyenne: number): string {
  if (moyenne >= 16) return 'Excellent trimestre. Félicitations pour votre travail et votre régularité.';
  if (moyenne >= 14) return 'Très bon trimestre. Continuez sur cette lancée.';
  if (moyenne >= 12) return 'Bon trimestre. Des progrès constants et appréciables.';
  if (moyenne >= 10) return 'Trimestre satisfaisant. Des efforts encore nécessaires pour progresser.';
  return 'Trimestre insuffisant. Un travail plus soutenu est nécessaire.';
}

async function resolveReleveNotes(params: GenerateParams): Promise<ResolvedData> {
  const etablissement = await getEtablissementInfo();
  const echelles = await EchelleNote.findAll({ where: { estActive: true }, order: [['noteMin', 'DESC']] });

  const where: any = {};
  if (params.classeId) where.classeId = params.classeId;
  if (params.anneeAcademiqueId) where.anneeAcademiqueId = params.anneeAcademiqueId;
  if (params.cursusApprenantId) where.id = params.cursusApprenantId;
  if (params.etudiantId) where.utilisateurId = params.etudiantId;

  const cursusList = await CursusApprenant.findAll({
    where,
    include: [
      { association: 'utilisateur' },
      { association: 'classe' },
      { association: 'parcours' },
      { association: 'niveauEtude' },
      { association: 'anneeAcademique' },
      { association: 'coursParticipants', include: [
        { association: 'cours' },
        { association: 'notesEvaluation', include: [{ association: 'listeNoteEvaluation' }] }
      ]}
    ]
  });

  const etudiants = await Promise.all(cursusList.map(async (cursus: any) => {
    const coursParticipants = cursus.coursParticipants || [];
    const unitesMap = new Map<string, any>();

    for (const cp of coursParticipants) {
      if (!cp.cours) continue;
      const semestre = cp.cours.semestre || params.semestre || '';
      if (params.semestre && semestre !== params.semestre) continue;

      const coursKey = String(cp.coursId);
      if (!unitesMap.has(coursKey)) {
        unitesMap.set(coursKey, {
          code: cp.cours.code || '',
          intitule: cp.cours.intitule || '',
          creditEcts: cp.cours.creditEcts || 0,
          coefficient: cp.cours.coefficient || 1,
          matieres: [],
          notes: [],
        });
      }
      const unite = unitesMap.get(coursKey)!;

      const notes = (cp.notesEvaluation || []).filter((n: any) => n.note != null);
      for (const note of notes) {
        unite.notes.push(note.note);
        const enseignantNom = note.listeNoteEvaluation?.enseignantId
          ? await getEnseignantNom(note.listeNoteEvaluation.enseignantId)
          : '';
        unite.matieres.push({
          nom: note.listeNoteEvaluation?.cours?.intitule || cp.cours.intitule,
          coefficient: cp.cours.coefficient || 1,
          note: note.note,
          enseignant: enseignantNom,
          type: note.listeNoteEvaluation?.typeNoteEvaluation?.libelle || '',
        });
      }
    }

    const unites = Array.from(unitesMap.values()).map(u => {
      const notes = u.notes.filter((n: number) => n != null);
      const moyenneUe = notes.length > 0 ? (notes.reduce((a: number, b: number) => a + b, 0) / notes.length) : 0;
      return { ...u, moyenneUe: moyenneUe.toFixed(2), notes: undefined };
    });

    const toutesNotes = unites.flatMap((u: any) => u.matieres.map((m: any) => m.note).filter((n: number) => n != null));
    const moyenneGenerale = toutesNotes.length > 0
      ? (toutesNotes.reduce((a: number, b: number) => a + b, 0) / toutesNotes.length)
      : 0;

    const creditsTotal = unites.reduce((sum: number, u: any) => sum + (u.creditEcts || 0), 0);
    const creditsValides = moyenneGenerale >= 10 ? creditsTotal : 0;
    const mention = getMention(moyenneGenerale, echelles);

    const apprenant = cursus.utilisateur;
    return {
      nom: apprenant?.nom || '',
      prenom: apprenant?.prenoms || '',
      matricule: apprenant?.identifiant || '',
      filiere: cursus.parcours?.titre || '',
      niveau: cursus.niveauEtude?.libelle || '',
      classe: cursus.classe?.libelle || '',
      dateNaissance: '',
      unites,
      moyenneGenerale: moyenneGenerale.toFixed(2),
      creditsTotal,
      creditsValides,
      mention,
      appreciation: getAppreciation(moyenneGenerale),
      rang: 0,
      effectif: cursusList.length,
      semestre: params.semestre || '',
    };
  }));

  return { etablissement, etudiants };
}

async function resolveAttestation(params: GenerateParams): Promise<ResolvedData> {
  const etablissement = await getEtablissementInfo();
  const where: any = {};
  if (params.cursusApprenantId) where.id = params.cursusApprenantId;

  const cursus = await CursusApprenant.findOne({
    where,
    include: [
      { association: 'utilisateur' },
      { association: 'classe' },
      { association: 'parcours' },
      { association: 'anneeAcademique' },
    ]
  });

  const user = cursus?.utilisateur as any;
  const etudiants = [{
    nom: user?.nom || '',
    prenom: user?.prenoms || '',
    matricule: user?.identifiant || '',
    filiere: (cursus as any)?.parcours?.titre || '',
    classe: (cursus as any)?.classe?.libelle || '',
    anneeAcademique: (cursus as any)?.anneeAcademique?.libelle || '',
  }];

  return { etablissement, etudiants };
}

async function resolveDiplome(params: GenerateParams): Promise<ResolvedData> {
  return resolveReleveNotes(params);
}

async function resolvePvDeliberation(params: GenerateParams): Promise<ResolvedData> {
  const resolved = await resolveReleveNotes(params);
  const etudiants = (resolved.etudiants || []).map((etudiant: any) => ({
    ...etudiant,
    index: (etudiant.rang || 0),
    decision: etudiant.moyenneGenerale >= 10 ? 'Admis' : (etudiant.moyenneGenerale >= 7 ? 'Rattrapage' : 'Ajourné'),
  }));

  return {
    ...resolved,
    etudiants,
    statistiques: {
      admis: etudiants.filter((e: any) => e.decision === 'Admis').length,
      rattrapage: etudiants.filter((e: any) => e.decision === 'Rattrapage').length,
      ajourne: etudiants.filter((e: any) => e.decision === 'Ajourné').length,
      total: etudiants.length,
    },
    classe: params.classeId ? String(params.classeId) : '',
    session: params.semestre ? `Semestre ${params.semestre}` : '',
    date: new Date().toISOString().split('T')[0],
    president: 'Le Président du Jury',
    secretaire: 'Le Secrétaire',
  };
}

async function resolveDecision(params: GenerateParams): Promise<ResolvedData> {
  return resolveDefault();
}

async function resolveDefault(): Promise<ResolvedData> {
  const etablissement = await getEtablissementInfo();
  return { etablissement, etudiants: [] };
}

register(['NOT001', 'NOT002', 'NOT003', 'NOT004', 'NOT005', 'NOT006', 'BUL001', 'BUL002', 'BUL003'], resolveReleveNotes);
register(['SCO001', 'SCO002', 'INS003', 'INS005', 'CER001', 'CER002', 'CER003', 'CER004', 'CER005'], resolveAttestation);
register(['DIP001', 'DIP002', 'DIP003', 'DIP004'], resolveDiplome);
register(['DEL001', 'DEL002', 'DEL003', 'DEL004', 'DEL005', 'DEL006', 'DEL007', 'DEL008'], resolvePvDeliberation);
register(['ADM009', 'ADM014', 'ADM015', 'DSC005', 'DSC006', 'RH005'], resolveDecision);
