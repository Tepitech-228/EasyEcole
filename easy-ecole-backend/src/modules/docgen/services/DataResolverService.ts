import { CursusApprenant } from '../../inscription/models/CursusApprenant';
import { Enseignant } from '../../auth/models/Enseignant';
import { EchelleNote } from '../../bulletins/models/EchelleNote';
import { Etablissement } from '../../etablissement/models/Etablissement';
import { DemandeInscription } from '../../inscription/models/DemandeInscription';
import { DesignationMemoire } from '../../inscription/models/DesignationMemoire';
import { PaiementInscription } from '../../inscription/models/PaiementInscription';
import { TypesPaiement } from '../../../core/enums/TypesPaiement';
import { EcritureComptable } from '../../comptabilite/models/EcritureComptable';
import { JournalComptable } from '../../comptabilite/models/JournalComptable';
import { LigneFraisEtudiant } from '../../comptabilite/models/LigneFraisEtudiant';
import { RhEmploye } from '../../rh/models/RhEmploye';
import { RhBulletinPaie } from '../../rh/models/RhBulletinPaie';
import { RhDemandeConge } from '../../rh/models/RhDemandeConge';
import { RhContratEnseignant } from '../../rh/models/RhContratEnseignant';
import { RhFicheEvaluation } from '../../rh/models/RhFicheEvaluation';
import { RhPrestationEnseignant } from '../../rh/models/RhPrestationEnseignant';
import { Bordereau } from '../../inscription/models/Bordereau';

interface GenerateParams {
  typeCode: string;
  sourceId?: number | string;
  classeId?: number;
  semestre?: string;
  anneeAcademiqueId?: number;
  etudiantId?: number;
  cursusApprenantId?: number;
  journalId?: number;
  exerciceId?: number;
  employeId?: number;
  periodeId?: number;
  enseignantId?: number;
  mois?: number;
  annee?: number;
  dateDebut?: string;
  dateFin?: string;
}

interface ResolvedData {
  etablissement: Record<string, any>;
  etudiants: Array<Record<string, any>>;
  sujet?: Record<string, any>;
  statistiques?: Record<string, any>;
  classe?: string;
  session?: string;
  date?: string;
  president?: string;
  secretaire?: string;
  anneeAcademique?: string;
  paiement?: Record<string, any>;
  paiements?: Array<Record<string, any>>;
  ecriture?: Record<string, any>;
  ecritures?: Array<Record<string, any>>;
  journal?: Record<string, any>;
  exercice?: Record<string, any>;
  echeancier?: Array<Record<string, any>>;
  employe?: Record<string, any>;
  bulletin?: Record<string, any>;
  contrat?: Record<string, any>;
  conge?: Record<string, any>;
  evaluation?: Record<string, any>;
  prestations?: Array<Record<string, any>>;
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

const UNITES = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const DIZAINES = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

function chiffreEnLettres(n: number): string {
  if (n < 20) return UNITES[n];
  const d = Math.floor(n / 10);
  const u = n % 10;
  if (u === 0) return DIZAINES[d];
  if (d === 7 || d === 9) return DIZAINES[d - 1] + '-' + chiffreEnLettres(10 + u);
  return DIZAINES[d] + '-' + UNITES[u];
}

function centaineEnLettres(n: number): string {
  const c = Math.floor(n / 100);
  const reste = n % 100;
  const base = c === 1 ? 'cent' : chiffreEnLettres(c) + ' cent';
  if (reste === 0) return base;
  return base + ' ' + chiffreEnLettres(reste);
}

function nombreEnLettres(n: number): string {
  n = Math.floor(n);
  if (n === 0) return 'zéro';
  let resultat = '';
  const milliards = Math.floor(n / 1000000000);
  const millions = Math.floor((n % 1000000000) / 1000000);
  const milliers = Math.floor((n % 1000000) / 1000);
  const reste = n % 1000;
  if (milliards > 0) {
    resultat += (milliards > 1 ? nombreEnLettres(milliards) + ' milliards' : 'un milliard');
  }
  if (millions > 0) {
    if (resultat) resultat += ' ';
    resultat += (millions > 1 ? nombreEnLettres(millions) + ' millions' : 'un million');
  }
  if (milliers > 0) {
    if (resultat) resultat += ' ';
    resultat += (milliers > 1 ? nombreEnLettres(milliers) + ' mille' : 'mille');
  }
  if (reste > 0) {
    if (resultat) resultat += ' ';
    resultat += reste >= 100 ? centaineEnLettres(reste) : chiffreEnLettres(reste);
  }
  return resultat;
}

function numeroEnLettres(montant: number): string {
  const entier = Math.floor(montant);
  const centimes = Math.round((montant - entier) * 100);
  let resultat = nombreEnLettres(entier) + ' francs CFA';
  if (centimes > 0) {
    resultat += ' et ' + chiffreEnLettres(centimes) + ' centimes';
  }
  return resultat;
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
          creditEcts: cp.cours.creditEcts || 0,
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
    const moyenneGeneraleNum = moyenneGenerale;
    return {
      nom: apprenant?.nom || '',
      prenom: apprenant?.prenoms || '',
      matricule: apprenant?.identifiant || '',
      filiere: cursus.parcours?.titre || '',
      niveau: cursus.niveauEtude?.libelle || '',
      classe: cursus.classe?.libelle || '',
      dateNaissance: '',
      anneeAcademique: cursus.anneeAcademique?.libelle || '',
      unites,
      moyenneGenerale: moyenneGeneraleNum.toFixed(2),
      creditsTotal,
      creditsValides,
      mention,
      appreciation: getAppreciation(moyenneGeneraleNum),
      decision: moyenneGeneraleNum >= 10 ? 'Admis(e)' : (moyenneGeneraleNum >= 7 ? 'Rattrapage' : 'Ajourné(e)'),
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
  const parcours = (cursus as any)?.parcours;
  const etudiants = [{
    nom: user?.nom || '',
    prenom: user?.prenoms || '',
    matricule: user?.identifiant || '',
    filiere: parcours?.titre || '',
    typeParcours: parcours?.type || '',
    option: (parcours as any)?.option || '',
    diplomeVise: parcours?.type === 'LICENCE' ? 'Licence' : parcours?.type === 'MASTER' ? 'Master' : parcours?.type || '',
    creditsValides: '',
    creditsTotaux: '',
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

async function resolveBulletin(params: GenerateParams): Promise<ResolvedData> {
  return resolveReleveNotes(params);
}

async function resolveDecision(params: GenerateParams): Promise<ResolvedData> {
  return resolveDefault();
}

async function resolveAutorisationProvisoire(params: GenerateParams): Promise<ResolvedData> {
  const etablissement = await getEtablissementInfo();
  const demandeId = params.sourceId || params.cursusApprenantId;
  if (!demandeId) return { etablissement, etudiants: [] };

  const demande = await DemandeInscription.findByPk(demandeId, {
    include: [
      { association: 'utilisateur', include: [{ association: 'apprenant' }] },
      { association: 'parcoursChoisis', include: [{ association: 'parcours' }] },
      { association: 'session', include: [{ association: 'anneeAcademique' }] },
    ]
  });

  if (!demande) return { etablissement, etudiants: [] };

  const utilisateur = demande.utilisateur as any;
  const apprenant = utilisateur?.apprenant;
  const parcoursChoisi = demande.parcoursChoisis?.[0];
  const parcours = parcoursChoisi?.parcours;
  const anneeAcademique = (demande.session as any)?.anneeAcademique;

  const etudiant = {
    nom: utilisateur?.nom || '',
    prenom: utilisateur?.prenoms || '',
    matricule: demande.matricule || utilisateur?.identifiant || '',
    dateNaissance: apprenant?.dateNaissance ? new Date(apprenant.dateNaissance).toLocaleDateString('fr-FR') : '',
    lieuNaissance: apprenant?.lieuNaissance || '',
    nationalite: apprenant?.nationalite || '',
    filiere: parcours?.titre || '',
    niveau: parcours?.niveauEtude?.libelle || '',
    diplomeVise: parcours?.type === 'LICENCE' ? 'Licence' : parcours?.type === 'MASTER' ? 'Master' : parcours?.type || '',
    anneeAcademique: anneeAcademique?.libelle || '',
    classe: '',
  };

  return {
    etablissement,
    etudiants: [etudiant],
    anneeAcademique: etudiant.anneeAcademique,
  };
}

async function resolveDefault(): Promise<ResolvedData> {
  const etablissement = await getEtablissementInfo();
  return { etablissement, etudiants: [] };
}

async function resolveAutorisationSoutenance(params: GenerateParams): Promise<ResolvedData> {
  const etablissement = await getEtablissementInfo();
  const cursusId = params.cursusApprenantId || params.sourceId;
  if (!cursusId) return { etablissement, etudiants: [] };

  const cursus = await CursusApprenant.findOne({
    where: { id: cursusId },
    include: [
      { association: 'utilisateur' },
      { association: 'parcours', include: [{ association: 'niveauEtude' }] },
      { association: 'anneeAcademique' },
    ]
  });

  const user = cursus?.utilisateur as any;
  const parcours = (cursus as any)?.parcours;
  const estLicence = parcours?.type === 'LICENCE';
  const estMaster = parcours?.type === 'MASTER';
  const etudiant = {
    nom: user?.nom || '',
    prenom: user?.prenoms || '',
    matricule: user?.identifiant || '',
    parcours: parcours?.titre || '',
    filiere: (parcours as any)?.niveauEtude?.libelle || '',
    promotion: (cursus as any)?.anneeAcademique?.libelle || '',
    diplomeVise: estLicence ? 'Licence' : estMaster ? 'Master' : parcours?.type || '',
    estLicence,
    estMaster,
    creditsValides: '',
    creditsTotaux: '',
    anneeAcademique: (cursus as any)?.anneeAcademique?.libelle || '',
  };

  return { etablissement, etudiants: [etudiant] };
}

async function resolveDesignationMemoire(params: GenerateParams): Promise<ResolvedData> {
  const etablissement = await getEtablissementInfo();
  const cursusId = params.cursusApprenantId || params.sourceId;
  if (!cursusId) return { etablissement, etudiants: [] };

  const designation = await DesignationMemoire.findOne({
    where: { cursusApprenantId: cursusId },
    include: [
      { association: 'cursusApprenant', include: [
        { association: 'utilisateur' },
        { association: 'parcours' },
        { association: 'niveauEtude' },
        { association: 'etablissement' },
        { association: 'anneeAcademique' },
      ]},
      { association: 'superviseur' },
    ]
  });

  if (!designation) return { etablissement, etudiants: [] };

  const cursus = designation.cursusApprenant as any;
  const utilisateur = cursus?.utilisateur;
  const superviseur = designation.superviseur as any;
  const parcours = cursus?.parcours;
  const estLicence = parcours?.type === 'LICENCE';
  const estMaster = parcours?.type === 'MASTER';

  const etudiant = {
    nom: utilisateur?.nom || '',
    prenom: utilisateur?.prenoms || '',
    matricule: utilisateur?.identifiant || '',
    niveau: cursus?.niveauEtude?.libelle || '',
    filiere: parcours?.titre || '',
    parcours: parcours?.titre || '',
    promotion: cursus?.anneeAcademique?.libelle || '',
    diplomeVise: estLicence ? 'Licence' : estMaster ? 'Master' : parcours?.type || '',
    estLicence,
    estMaster,
    sujet: designation.sujet || '',
    superviseurNom: superviseur ? `${superviseur.nom} ${superviseur.prenoms}` : '',
    superviseurGrade: designation.gradeSuperviseur || '',
    superviseurContact: [designation.emailSuperviseur, designation.telephoneSuperviseur].filter(Boolean).join(' / ') || '',
  };

  return { etablissement, etudiants: [etudiant] };
}

async function resolveRecuPaiement(params: GenerateParams): Promise<ResolvedData> {
  const etablissement = await getEtablissementInfo();
  const data = await chargerPaiement(params.sourceId);
  if (!data) return { etablissement, etudiants: [] };
  return { etablissement, etudiants: [data.etudiant], paiement: data.paiement };
}

function formatDate(uneDate: Date | string | null | undefined): string {
  if (!uneDate) return '';
  const d = new Date(uneDate);
  return d.toLocaleDateString('fr-FR');
}

async function chargerPaiement(sourceId: number | string | undefined): Promise<{ etudiant: Record<string, any>; paiement: Record<string, any> } | null> {
  if (!sourceId) return null;
  const paiement = await PaiementInscription.findByPk(sourceId, {
    include: [
      { association: PaiementInscription.associations.demandeInscription, include: [
        { association: DemandeInscription.associations.utilisateur, include: [{ association: 'apprenant' }] },
        { association: DemandeInscription.associations.parcoursChoisis, include: [{ association: 'parcours', include: [{ association: 'niveauEtude' }] }] },
        { association: DemandeInscription.associations.session, include: [{ association: 'anneeAcademique' }] },
      ]},
    ]
  }) as any;
  if (!paiement) return null;

  const demande = paiement.demandeInscription;
  const utilisateur = demande?.utilisateur;
  const apprenant = utilisateur?.apprenant;
  const parcoursChoisi = demande?.parcoursChoisis?.[0];
  const parcours = parcoursChoisi?.parcours;
  const anneeAcademique = demande?.session?.anneeAcademique;

  const type = paiement.type as TypesPaiement;
  const typeLibelle = {
    [TypesPaiement.ESPECE]: 'Espèces',
    [TypesPaiement.EN_LIGNE]: 'Virement/Banque',
    [TypesPaiement.MOBILE_MONEY]: 'T-Money/Flooz',
  }[type] || '';

  const etudiant = {
    nom: utilisateur?.nom || '',
    prenom: utilisateur?.prenoms || '',
    matricule: demande?.matricule || utilisateur?.identifiant || '',
    dateNaissance: apprenant?.dateNaissance ? new Date(apprenant.dateNaissance).toLocaleDateString('fr-FR') : '',
    filiere: parcours?.titre || '',
    parcours: parcours?.titre || '',
    niveau: (parcours as any)?.niveauEtude?.libelle || '',
    classe: '',
    anneeAcademique: anneeAcademique?.libelle || '',
    promotion: anneeAcademique?.libelle || '',
  };

  const montant = paiement.montant || 0;
  const paiementInfo = {
    numero: paiement.numero || '',
    montant,
    montantFormate: montant.toLocaleString('fr-FR'),
    montantEnLettres: numeroEnLettres(montant),
    datePaiement: formatDate(paiement.datePaiement),
    type: typeLibelle,
    typeCode: paiement.type || '',
    description: paiement.description || '',
    matriculeInscription: paiement.matriculeInscription || '',
    transactionId: paiement.transactionId || '',
    dateValidation: formatDate(paiement.dateValidation) || '—',
    estEspece: type === TypesPaiement.ESPECE,
    estCheque: false,
    estVirement: type === TypesPaiement.EN_LIGNE,
    estMobileMoney: type === TypesPaiement.MOBILE_MONEY,
  };

  return { etudiant, paiement: paiementInfo };
}

async function resolveRecuBordereau(params: GenerateParams): Promise<ResolvedData> {
  const etablissement = await getEtablissementInfo();
  if (!params.sourceId) return { etablissement, etudiants: [] };

  // Les associations de Bordereau sont disponibles grâce au chargement
  // de `./models/_associations` du module inscription (InscriptionRoutes).
  const bordereau = await Bordereau.findByPk(params.sourceId, {
    include: [
      { association: 'utilisateur', include: [{ association: 'apprenant' }] },
      { association: 'echeance', include: [{ association: 'dossierEtudiant' }] },
      { association: 'validePar' },
    ],
  }) as any;

  if (!bordereau) return { etablissement, etudiants: [] };

  const utilisateur = bordereau.utilisateur || {};
  const apprenant = utilisateur.apprenant;
  const echeance = bordereau.echeance;
  const dossierEtudiant = echeance?.dossierEtudiant;

  // Filière / niveau / classe / année académique : CursusApprenant en priorité,
  // puis repli sur DemandeInscription.
  let filiere = '';
  let parcours = '';
  let niveau = '';
  let classe = '';
  let anneeAcademique = '';

  const cursus = await CursusApprenant.findOne({
    where: { utilisateurId: bordereau.utilisateurId },
    order: [['createdAt', 'DESC']],
    include: [
      { association: 'parcours', include: [{ association: 'niveauEtude' }] },
      { association: 'classe' },
      { association: 'anneeAcademique' },
    ],
  }) as any;

  if (cursus) {
    parcours = cursus.parcours?.titre || '';
    niveau = (cursus.parcours as any)?.niveauEtude?.libelle || '';
    classe = cursus.classe?.libelle || '';
    anneeAcademique = cursus.anneeAcademique?.libelle || '';
  }

  // Repli : demande d'inscription liée au dossier (matricule) ou à l'utilisateur
  const matriculeDossier = dossierEtudiant?.matricule;
  if (!anneeAcademique || !parcours) {
    const demande = await DemandeInscription.findOne({
      where: matriculeDossier ? { matricule: matriculeDossier } : { utilisateurId: bordereau.utilisateurId },
      order: [['createdAt', 'DESC']],
      include: [
        { association: 'session', include: [{ association: 'anneeAcademique' }] },
        { association: 'parcoursChoisis', include: [{ association: 'parcours', include: [{ association: 'niveauEtude' }] }] },
      ],
    }) as any;

    if (demande) {
      const parcoursChoisi = demande.parcoursChoisis?.[0];
      parcours = parcours || parcoursChoisi?.parcours?.titre || '';
      niveau = niveau || (parcoursChoisi?.parcours as any)?.niveauEtude?.libelle || '';
      anneeAcademique = anneeAcademique || demande.session?.anneeAcademique?.libelle || '';
    }
  }

  // Dernier repli : année derivée de l'échéance (moisConcerne: '2025-09') ou de la date du bordereau
  if (!anneeAcademique) {
    const anneeEcheance = echeance?.moisConcerne
      ? String(echeance.moisConcerne).substring(0, 4)
      : echeance?.dateLimite
        ? String(new Date(echeance.dateLimite).getFullYear())
        : '';
    anneeAcademique = anneeEcheance || String(new Date(bordereau.dateSoumission || new Date()).getFullYear());
  }

  filiere = parcours;

  const matriculeEtudiant = matriculeDossier || utilisateur.identifiant || '';
  const montant = Number(bordereau.montant) || 0;

  const dateValidation = bordereau.dateValidation || bordereau.dateSoumission || new Date();
  const anneeRecu = String(new Date(dateValidation).getFullYear());
  // Numéro de reçu au format attendu : RCU-2026-0842 (séquentiel sur le bordereau)
  const numero = `RCU-${anneeRecu}-${String(bordereau.id).padStart(4, '0')}`;

  const libelleEcheance = echeance?.moisConcerne
    ? `Scolarité ${echeance.moisConcerne}`
    : echeance
      ? `Échéance n°${echeance.numeroEcheance}`
      : `Scolarité - ${anneeAcademique}`;

  const etudiant = {
    nom: utilisateur.nom || '',
    prenom: utilisateur.prenoms || '',
    prenoms: utilisateur.prenoms || '',
    email: utilisateur.email || '',
    telephone: utilisateur.contact || '',
    matricule: matriculeEtudiant,
    filiere,
    parcours,
    niveau,
    classe,
    anneeAcademique,
    dateNaissance: apprenant?.dateNaissance ? new Date(apprenant.dateNaissance).toLocaleDateString('fr-FR') : '',
  };

  const paiement = {
    numero,
    montant,
    montantFormate: montant.toLocaleString('fr-FR'),
    montantEnLettres: numeroEnLettres(montant),
    datePaiement: formatDate(dateValidation),
    description: libelleEcheance,
    modePaiement: 'Virement / Banque',
    type: 'scolarite',
    reference: bordereau.referenceBancaire || String(bordereau.id),
    referencePaiement: bordereau.referenceBancaire || String(bordereau.id),
    dateValidation: formatDate(dateValidation),
  };

  return { etablissement, etudiants: [etudiant], paiement };
}

async function chargerEcriture(sourceId: number | string | undefined): Promise<Record<string, any> | null> {
  if (!sourceId) return null;
  const ecriture = await EcritureComptable.findByPk(sourceId, {
    include: [
      { association: 'compteDebit' },
      { association: 'compteCredit' },
      { association: 'journal' },
      { association: 'exercice' },
      { association: 'utilisateurSaisie' },
      { association: 'utilisateurValidation' },
    ],
  }) as any;
  if (!ecriture) return null;

  const montant = ecriture.montant || 0;
  return {
    id: ecriture.id,
    numeroEcriture: ecriture.numeroEcriture || '',
    dateEcriture: formatDate(ecriture.dateEcriture),
    dateComptable: formatDate(ecriture.dateComptable),
    montant,
    montantFormate: montant.toLocaleString('fr-FR'),
    montantEnLettres: numeroEnLettres(montant),
    libelle: ecriture.libelle || '',
    reference: ecriture.reference || '',
    moduleSource: ecriture.moduleSource || '',
    referenceModuleId: ecriture.referenceModuleId || '',
    validee: ecriture.validee,
    observations: ecriture.observations || '',
    dateValidation: formatDate(ecriture.dateValidation),
    compteDebit: {
      numero: ecriture.compteDebit?.numero || '',
      libelle: ecriture.compteDebit?.libelle || '',
    },
    compteCredit: {
      numero: ecriture.compteCredit?.numero || '',
      libelle: ecriture.compteCredit?.libelle || '',
    },
    journal: {
      id: ecriture.journal?.id,
      code: ecriture.journal?.code || '',
      libelle: ecriture.journal?.libelle || '',
      type: ecriture.journal?.type || '',
    },
    exercice: {
      id: ecriture.exercice?.id,
      libelle: ecriture.exercice?.libelle || '',
      dateDebut: formatDate(ecriture.exercice?.dateDebut),
      dateFin: formatDate(ecriture.exercice?.dateFin),
      statut: ecriture.exercice?.statut || '',
    },
    utilisateurSaisie: ecriture.utilisateurSaisie ? `${ecriture.utilisateurSaisie.nom} ${ecriture.utilisateurSaisie.prenoms}` : '',
    utilisateurValidation: ecriture.utilisateurValidation ? `${ecriture.utilisateurValidation.nom} ${ecriture.utilisateurValidation.prenoms}` : '',
  };
}

async function resolveDocumentFinance(params: GenerateParams): Promise<ResolvedData> {
  const etablissement = await getEtablissementInfo();

  let paiementData: { etudiant: Record<string, any>; paiement: Record<string, any> } | null = null;
  try {
    paiementData = await chargerPaiement(params.sourceId);
  } catch (e) {
    console.warn(`[docgen] chargerPaiement a échoué pour sourceId=${params.sourceId}:`, (e as any)?.message || e);
    paiementData = null;
  }
  if (paiementData) {
    return { etablissement, etudiants: [paiementData.etudiant], paiement: paiementData.paiement };
  }

  const ecriture = await chargerEcriture(params.sourceId);
  if (ecriture) {
    return {
      etablissement,
      etudiants: [{ nom: '', prenom: '', matricule: '', filiere: '', parcours: '', niveau: '', classe: '', anneeAcademique: ecriture.exercice?.libelle || '', promotion: '' }],
      ecriture,
    };
  }

  return { etablissement, etudiants: [] };
}

async function resolveEtatPaiements(params: GenerateParams): Promise<ResolvedData> {
  const etablissement = await getEtablissementInfo();
  const where: any = {};
  if (params.anneeAcademiqueId) where.anneeAcademiqueId = params.anneeAcademiqueId;
  if (params.sourceId) where.id = params.sourceId;
  if (params.dateDebut || params.dateFin) {
    where.datePaiement = {};
    if (params.dateDebut) where.datePaiement.gte = params.dateDebut;
    if (params.dateFin) where.datePaiement.lte = params.dateFin;
  }

  const paiements = await PaiementInscription.findAll({
    where,
    order: [['datePaiement', 'DESC']],
    limit: params.sourceId ? undefined : 500,
    include: [
      { association: PaiementInscription.associations.demandeInscription, include: [
        { association: DemandeInscription.associations.utilisateur, include: [{ association: 'apprenant' }] },
        { association: DemandeInscription.associations.parcoursChoisis, include: [{ association: 'parcours' }] },
      ]},
    ],
  }) as any;

  const lignes = (paiements || []).map((p: any) => {
    const utilisateur = p.demandeInscription?.utilisateur;
    const parcours = p.demandeInscription?.parcoursChoisis?.[0]?.parcours;
    return {
      numero: p.numero || '',
      nom: utilisateur?.nom || '',
      prenom: utilisateur?.prenoms || '',
      matricule: p.demandeInscription?.matricule || utilisateur?.identifiant || '',
      filiere: parcours?.titre || '',
      montant: p.montant || 0,
      montantFormate: (p.montant || 0).toLocaleString('fr-FR'),
      datePaiement: formatDate(p.datePaiement),
      mode: p.type || '',
      statut: p.dateValidation ? 'Validé' : 'En attente',
    };
  });

  const total = lignes.reduce((somme: number, l: any) => somme + l.montant, 0);
  return {
    etablissement,
    etudiants: [],
    sujet: { nom: '', prenom: '', matricule: '' },
    paiements: lignes,
    statistiques: {
      totalPaiements: lignes.length,
      montantTotal: total,
      montantTotalFormate: total.toLocaleString('fr-FR'),
      montantTotalEnLettres: numeroEnLettres(total),
      dateDebut: params.dateDebut || '',
      dateFin: params.dateFin || '',
    },
  };
}

async function resolveEcheancier(params: GenerateParams): Promise<ResolvedData> {
  const etablissement = await getEtablissementInfo();
  const where: any = {};
  if (params.etudiantId) where.dossierEtudiantId = params.etudiantId;
  if (params.sourceId) where.id = params.sourceId;

  const lignes = await LigneFraisEtudiant.findAll({ where, order: [['type', 'ASC']] });
  const echeancier = (lignes || []).map((l: any) => {
    const restant = l.solde || 0;
    return {
      type: l.type || '',
      montant: l.montant || 0,
      montantFormate: (l.montant || 0).toLocaleString('fr-FR'),
      paye: l.paye,
      solde: restant,
      soldeFormate: restant.toLocaleString('fr-FR'),
    };
  });

  const total = echeancier.reduce((somme: number, e: any) => somme + e.montant, 0);
  const totalRestant = echeancier.reduce((somme: number, e: any) => somme + e.solde, 0);
  return {
    etablissement,
    etudiants: [],
    sujet: { nom: '', prenom: '', matricule: '' },
    echeancier,
    statistiques: {
      total: total.toLocaleString('fr-FR'),
      totalRestant: totalRestant.toLocaleString('fr-FR'),
    },
  };
}

async function resolveJournalCaisse(params: GenerateParams): Promise<ResolvedData> {
  const etablissement = await getEtablissementInfo();
  const where: any = {};
  if (params.journalId) where.journalId = params.journalId;
  if (params.exerciceId) where.exerciceId = params.exerciceId;
  if (params.dateDebut || params.dateFin) {
    where.dateEcriture = {};
    if (params.dateDebut) where.dateEcriture.gte = params.dateDebut;
    if (params.dateFin) where.dateEcriture.lte = params.dateFin;
  }

  const ecritures = await EcritureComptable.findAll({
    where,
    order: [['dateEcriture', 'ASC']],
    limit: 500,
    include: [
      { association: 'compteDebit' },
      { association: 'compteCredit' },
      { association: 'journal' },
      { association: 'exercice' },
    ],
  }) as any;

  const lignes = (ecritures || []).map((e: any) => ({
    numeroEcriture: e.numeroEcriture || '',
    dateEcriture: formatDate(e.dateEcriture),
    libelle: e.libelle || '',
    compteDebit: e.compteDebit ? `${e.compteDebit.numero} ${e.compteDebit.libelle}` : '',
    compteCredit: e.compteCredit ? `${e.compteCredit.numero} ${e.compteCredit.libelle}` : '',
    montant: e.montant || 0,
    montantFormate: (e.montant || 0).toLocaleString('fr-FR'),
    validee: e.validee,
  }));

  const total = lignes.reduce((somme: number, l: any) => somme + l.montant, 0);
  const journal = ecritures?.[0]?.journal;
  const exercice = ecritures?.[0]?.exercice;
  return {
    etablissement,
    etudiants: [],
    sujet: { nom: '', prenom: '', matricule: '' },
    ecritures: lignes,
    journal: journal ? { code: journal.code || '', libelle: journal.libelle || '', type: journal.type || '' } : {},
    exercice: exercice ? { libelle: exercice.libelle || '', dateDebut: formatDate(exercice.dateDebut), dateFin: formatDate(exercice.dateFin) } : {},
    statistiques: {
      nombreEcritures: lignes.length,
      totalDebit: total.toLocaleString('fr-FR'),
      totalCredit: total.toLocaleString('fr-FR'),
    },
  };
}

async function resolveRapportFinancier(params: GenerateParams): Promise<ResolvedData> {
  const etablissement = await getEtablissementInfo();
  const where: any = {};
  if (params.exerciceId) where.exerciceId = params.exerciceId;
  if (params.dateDebut || params.dateFin) {
    where.dateEcriture = {};
    if (params.dateDebut) where.dateEcriture.gte = params.dateDebut;
    if (params.dateFin) where.dateEcriture.lte = params.dateFin;
  }

  const ecritures = await EcritureComptable.findAll({
    where,
    limit: 1000,
    include: [{ association: 'compteCredit' }, { association: 'exercice' }],
  }) as any;

  const totalEncaisse = (ecritures || []).filter((e: any) => e.compteCredit?.classe === '5').reduce((s: number, e: any) => s + (e.montant || 0), 0);
  const totalDepense = (ecritures || []).filter((e: any) => e.compteDebit?.classe === '6' || e.compteDebit?.classe === '2').reduce((s: number, e: any) => s + (e.montant || 0), 0);

  const parJournal: Record<string, number> = {};
  for (const e of ecritures || []) {
    const code = e.journal?.code || 'Autres';
    parJournal[code] = (parJournal[code] || 0) + (e.montant || 0);
  }

  return {
    etablissement,
    etudiants: [],
    sujet: { nom: '', prenom: '', matricule: '' },
    exercice: ecritures?.[0]?.exercice ? { libelle: ecritures[0].exercice.libelle || '' } : {},
    statistiques: {
      nombreEcritures: (ecritures || []).length,
      totalEncaisse: totalEncaisse.toLocaleString('fr-FR'),
      totalDepense: totalDepense.toLocaleString('fr-FR'),
      solde: (totalEncaisse - totalDepense).toLocaleString('fr-FR'),
      parJournal,
    },
  };
}

async function chargerEmploye(sourceId: number | string | undefined): Promise<Record<string, any> | null> {
  if (!sourceId) return null;
  const employe = await RhEmploye.findByPk(sourceId, {
    include: [
      { association: 'poste' },
      { association: 'departement' },
      { association: 'typeContrat' },
    ],
  }) as any;
  if (!employe) return null;

  return {
    id: employe.id,
    matricule: employe.matricule || '',
    nom: employe.nom || '',
    prenoms: employe.prenoms || '',
    nomComplet: `${employe.nom || ''} ${employe.prenoms || ''}`.trim(),
    poste: employe.poste?.libelle || '',
    departement: employe.departement?.libelle || '',
    typeContrat: employe.typeContrat?.libelle || employe.typeContrat?.code || '',
    dateEmbauche: formatDate(employe.dateEmbauche),
    salaireBase: employe.salaireBase || 0,
    salaireBaseFormate: (employe.salaireBase || 0).toLocaleString('fr-FR'),
    statut: employe.statut || '',
    utilisateurId: employe.utilisateurId,
  };
}

async function chargerBulletinPaie(sourceId: number | string | undefined): Promise<Record<string, any> | null> {
  if (!sourceId) return null;
  const bulletin = await RhBulletinPaie.findByPk(sourceId, {
    include: [
      { association: 'employe', include: [{ association: 'poste' }, { association: 'departement' }, { association: 'typeContrat' }] },
      { association: 'periode' },
      { association: 'lignesBulletin' },
    ],
  }) as any;
  if (!bulletin) return null;

  const employe = bulletin.employe;
  return {
    id: bulletin.id,
    netAPayer: bulletin.netAPayer || 0,
    netAPayerFormate: (bulletin.netAPayer || 0).toLocaleString('fr-FR'),
    netAPayerEnLettres: numeroEnLettres(bulletin.netAPayer || 0),
    totalGains: bulletin.totalGains || 0,
    totalGainsFormate: (bulletin.totalGains || 0).toLocaleString('fr-FR'),
    totalRetenues: bulletin.totalRetenues || 0,
    totalRetenuesFormate: (bulletin.totalRetenues || 0).toLocaleString('fr-FR'),
    statut: bulletin.statut || '',
    periode: {
      libelle: bulletin.periode?.libelle || `${bulletin.periode?.mois || ''}/${bulletin.periode?.annee || ''}`,
      mois: bulletin.periode?.mois || '',
      annee: bulletin.periode?.annee || '',
      dateDebut: formatDate(bulletin.periode?.dateDebut),
      dateFin: formatDate(bulletin.periode?.dateFin),
    },
    employe: employe ? {
      matricule: employe.matricule || '',
      nom: employe.nom || '',
      prenoms: employe.prenoms || '',
      nomComplet: `${employe.nom || ''} ${employe.prenoms || ''}`.trim(),
      poste: employe.poste?.libelle || '',
      departement: employe.departement?.libelle || '',
      dateEmbauche: formatDate(employe.dateEmbauche),
      salaireBase: employe.salaireBase || 0,
      salaireBaseFormate: (employe.salaireBase || 0).toLocaleString('fr-FR'),
      typeContrat: employe.typeContrat?.libelle || employe.typeContrat?.code || '',
    } : {},
    lignes: (bulletin.lignesBulletin || []).map((l: any) => ({
      rubrique: l.rubrique?.libelle || l.libelle || '',
      libelle: l.libelle || '',
      base: l.base || 0,
      taux: l.taux || 0,
      montant: l.montant || 0,
      montantFormate: (l.montant || 0).toLocaleString('fr-FR'),
      type: l.rubrique?.type || l.type || '',
    })),
  };
}

async function chargerContratEnseignant(sourceId: number | string | undefined): Promise<Record<string, any> | null> {
  if (!sourceId) return null;
  const contrat = await RhContratEnseignant.findByPk(sourceId, {
    include: [
      { association: 'employe', include: [{ association: 'poste' }, { association: 'departement' }, { association: 'typeContrat' }] },
    ],
  }) as any;
  if (!contrat) return null;

  const employe = contrat.employe;
  const typeContrat = ({
    cdi: 'Contrat à durée indéterminée (CDI)',
    cdd: 'Contrat à durée déterminée (CDD)',
    vacataire: 'Contrat de vacataire',
  } as Record<string, string>)[contrat.typeContrat as string] || contrat.typeContrat || '';

  return {
    id: contrat.id,
    typeContrat: contrat.typeContrat || '',
    typeContratLibelle: typeContrat,
    dateDebut: formatDate(contrat.dateDebut),
    dateFin: formatDate(contrat.dateFin),
    statut: contrat.statut || '',
    montantMensuel: contrat.montantMensuel || 0,
    montantMensuelFormate: (contrat.montantMensuel || 0).toLocaleString('fr-FR'),
    montantMensuelEnLettres: numeroEnLettres(contrat.montantMensuel || 0),
    tauxHoraire: contrat.tauxHoraire || 0,
    tauxHoraireFormate: (contrat.tauxHoraire || 0).toLocaleString('fr-FR'),
    volumeHoraireMensuel: contrat.volumeHoraireMensuel || 0,
    description: contrat.description || '',
    employe: employe ? {
      matricule: employe.matricule || '',
      nom: employe.nom || '',
      prenoms: employe.prenoms || '',
      nomComplet: `${employe.nom || ''} ${employe.prenoms || ''}`.trim(),
      poste: employe.poste?.libelle || '',
      departement: employe.departement?.libelle || '',
      dateEmbauche: formatDate(employe.dateEmbauche),
      salaireBase: employe.salaireBase || 0,
      salaireBaseFormate: (employe.salaireBase || 0).toLocaleString('fr-FR'),
    } : {},
  };
}

async function chargerDemandeConge(sourceId: number | string | undefined): Promise<Record<string, any> | null> {
  if (!sourceId) return null;
  const conge = await RhDemandeConge.findByPk(sourceId, {
    include: [{ association: 'employe', include: [{ association: 'poste' }, { association: 'departement' }] }],
  }) as any;
  if (!conge) return null;

  const employe = conge.employe;
  const typeConge = ({
    annuel: 'Congé annuel',
    maladie: 'Congé de maladie',
    maternite: 'Congé de maternité',
    sansSolde: 'Congé sans solde',
    special: 'Congé spécial',
  } as Record<string, string>)[conge.typeConge as string] || conge.typeConge || '';

  return {
    id: conge.id,
    typeConge: conge.typeConge || '',
    typeCongeLibelle: typeConge,
    dateDebut: formatDate(conge.dateDebut),
    dateFin: formatDate(conge.dateFin),
    duree: conge.duree || '',
    motif: conge.motif || '',
    statut: conge.statut || '',
    employe: employe ? {
      matricule: employe.matricule || '',
      nom: employe.nom || '',
      prenoms: employe.prenoms || '',
      nomComplet: `${employe.nom || ''} ${employe.prenoms || ''}`.trim(),
      poste: employe.poste?.libelle || '',
      departement: employe.departement?.libelle || '',
    } : {},
  };
}

async function chargerEvaluation(sourceId: number | string | undefined): Promise<Record<string, any> | null> {
  if (!sourceId) return null;
  const fiche = await RhFicheEvaluation.findByPk(sourceId, {
    include: [
      { association: 'employe', include: [{ association: 'poste' }, { association: 'departement' }] },
      { association: 'evaluationsCriteres' },
    ],
  }) as any;
  if (!fiche) return null;

  const employe = fiche.employe;
  return {
    id: fiche.id,
    dateEvaluation: formatDate(fiche.dateEvaluation),
    noteGlobale: fiche.noteGlobale,
    noteGlobaleFormate: fiche.noteGlobale != null ? fiche.noteGlobale.toLocaleString('fr-FR') : '—',
    commentaire: fiche.commentaire || '',
    evaluateurId: fiche.evaluateurId || '',
    employe: employe ? {
      matricule: employe.matricule || '',
      nom: employe.nom || '',
      prenoms: employe.prenoms || '',
      nomComplet: `${employe.nom || ''} ${employe.prenoms || ''}`.trim(),
      poste: employe.poste?.libelle || '',
      departement: employe.departement?.libelle || '',
    } : {},
    criteres: (fiche.evaluationsCriteres || []).map((c: any) => ({
      critere: c.critere || '',
      note: c.note || 0,
      noteFormate: (c.note || 0).toLocaleString('fr-FR'),
      commentaire: c.commentaire || '',
    })),
  };
}

async function chargerPrestationsEnseignant(params: GenerateParams): Promise<{ prestations: Record<string, any>[]; totalHeures: number; totalMontant: number }> {
  const where: any = {};
  if (params.enseignantId) where.enseignantId = params.enseignantId;
  if (params.sourceId) where.id = params.sourceId;
  if (params.mois) where.mois = params.mois;
  if (params.annee) where.annee = params.annee;

  const prestations = await RhPrestationEnseignant.findAll({
    where,
    order: [['annee', 'DESC'], ['mois', 'DESC']],
    include: [{ association: 'enseignant', include: [{ association: 'poste' }, { association: 'departement' }] }],
  }) as any;

  const lignes = (prestations || []).map((p: any) => ({
    id: p.id,
    coursId: p.coursId || '',
    mois: p.mois || 0,
    moisLibelle: (['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][(p.mois || 1) - 1]) || '',
    annee: p.annee || 0,
    nombreHeures: p.nombreHeures || 0,
    tauxHoraire: p.tauxHoraire || 0,
    tauxHoraireFormate: (p.tauxHoraire || 0).toLocaleString('fr-FR'),
    montant: p.montant || 0,
    montantFormate: (p.montant || 0).toLocaleString('fr-FR'),
    statut: p.statut || '',
    enseignant: p.enseignant ? {
      matricule: p.enseignant.matricule || '',
      nom: p.enseignant.nom || '',
      prenoms: p.enseignant.prenoms || '',
      nomComplet: `${p.enseignant.nom || ''} ${p.enseignant.prenoms || ''}`.trim(),
      poste: p.enseignant.poste?.libelle || '',
      departement: p.enseignant.departement?.libelle || '',
    } : {},
  }));

  const totalHeures = lignes.reduce((s: number, l: any) => s + (l.nombreHeures || 0), 0);
  const totalMontant = lignes.reduce((s: number, l: any) => s + (l.montant || 0), 0);
  return { prestations: lignes, totalHeures, totalMontant };
}

async function resolveDocumentRh(params: GenerateParams): Promise<ResolvedData> {
  const etablissement = await getEtablissementInfo();
  const { typeCode } = params;

  if (typeCode === 'RH002') {
    const bulletin = await chargerBulletinPaie(params.sourceId);
    if (bulletin) {
      const employe = bulletin.employe || {};
      return {
        etablissement,
        etudiants: [{ nom: employe.nom || '', prenom: employe.prenoms || '', matricule: employe.matricule || '', poste: employe.poste || '', departement: employe.departement || '', classe: '', anneeAcademique: bulletin.periode?.libelle || '' }],
        bulletin,
        employe,
      };
    }
    return { etablissement, etudiants: [] };
  }

  if (typeCode === 'RH005') {
    const conge = await chargerDemandeConge(params.sourceId);
    if (conge) {
      const employe = conge.employe || {};
      return {
        etablissement,
        etudiants: [{ nom: employe.nom || '', prenom: employe.prenoms || '', matricule: employe.matricule || '', poste: employe.poste || '', departement: employe.departement || '', classe: '', anneeAcademique: '' }],
        conge,
        employe,
      };
    }
    return { etablissement, etudiants: [] };
  }

  if (typeCode === 'RH006') {
    const evaluation = await chargerEvaluation(params.sourceId);
    if (evaluation) {
      const employe = evaluation.employe || {};
      return {
        etablissement,
        etudiants: [{ nom: employe.nom || '', prenom: employe.prenoms || '', matricule: employe.matricule || '', poste: employe.poste || '', departement: employe.departement || '', classe: '', anneeAcademique: '' }],
        evaluation,
        employe,
      };
    }
    return { etablissement, etudiants: [] };
  }

  if (typeCode === 'ENS001' || typeCode === 'RH001') {
    const contrat = await chargerContratEnseignant(params.sourceId);
    if (contrat) {
      const employe = contrat.employe || {};
      return {
        etablissement,
        etudiants: [{ nom: employe.nom || '', prenom: employe.prenoms || '', matricule: employe.matricule || '', poste: employe.poste || '', departement: employe.departement || '', classe: '', anneeAcademique: '' }],
        contrat,
        employe,
      };
    }
  }

  if (typeCode === 'ENS006' || typeCode === 'ENS004') {
    const { prestations, totalHeures, totalMontant } = await chargerPrestationsEnseignant(params);
    const premier = prestations[0];
    const employe = premier?.enseignant || {};
    return {
      etablissement,
      etudiants: [{ nom: employe.nom || '', prenom: employe.prenoms || '', matricule: employe.matricule || '', poste: employe.poste || '', departement: employe.departement || '', classe: '', anneeAcademique: '' }],
      prestations,
      employe,
      statistiques: {
        totalHeures: totalHeures.toLocaleString('fr-FR'),
        totalMontant: totalMontant.toLocaleString('fr-FR'),
        totalMontantEnLettres: numeroEnLettres(totalMontant),
      },
    };
  }

  if (typeCode === 'ENS007') {
    const { prestations, totalHeures, totalMontant } = await chargerPrestationsEnseignant(params);
    const premier = prestations[0];
    const employe = premier?.enseignant || {};
    return {
      etablissement,
      etudiants: [{ nom: employe.nom || '', prenom: employe.prenoms || '', matricule: employe.matricule || '', poste: employe.poste || '', departement: employe.departement || '', classe: '', anneeAcademique: '' }],
      prestations,
      employe,
      statistiques: {
        totalHeures: totalHeures.toLocaleString('fr-FR'),
        totalMontant: totalMontant.toLocaleString('fr-FR'),
        totalMontantEnLettres: numeroEnLettres(totalMontant),
      },
    };
  }

  const employe = await chargerEmploye(params.sourceId);
  if (employe) {
    return {
      etablissement,
      etudiants: [{ nom: employe.nom || '', prenom: employe.prenoms || '', matricule: employe.matricule || '', poste: employe.poste || '', departement: employe.departement || '', classe: '', anneeAcademique: '' }],
      employe,
    };
  }

  return { etablissement, etudiants: [] };
}

register(['NOT001', 'NOT002', 'NOT003', 'NOT004', 'NOT005', 'NOT006'], resolveReleveNotes);
register(['BUL001', 'BUL002', 'BUL003'], resolveBulletin);
register(['SCO001', 'SCO002', 'INS003', 'INS005', 'CER001', 'CER002', 'CER003', 'CER004', 'CER005', 'PRE001', 'ADM020'], resolveAttestation);
register(['DIP001', 'DIP002', 'DIP003', 'DIP004'], resolveDiplome);
register(['DEL001', 'DEL002', 'DEL003', 'DEL004', 'DEL005', 'DEL006', 'DEL007', 'DEL008'], resolvePvDeliberation);
register(['ADM009', 'ADM014', 'ADM015', 'DSC005', 'DSC006', 'RH005'], resolveDecision);
register(['API001'], resolveAutorisationProvisoire);
register(['MEM001'], resolveDesignationMemoire);
register(['SOU001', 'SOU002', 'SOU003', 'ENG001'], resolveAutorisationSoutenance);
register(['SOU004', 'SOU005'], resolveDesignationMemoire);
register(['INS011', 'INS012', 'INS013', 'INS014', 'INS015', 'INS016', 'INS017'], resolveAutorisationSoutenance);
register(['INS007', 'FIN002', 'FIN003'], resolveRecuPaiement);
  register(['REC001'], resolveRecuBordereau);
register(['FIN001', 'FIN004', 'FIN005'], resolveDocumentFinance);
register(['FIN006'], resolveEtatPaiements);
register(['FIN007'], resolveEcheancier);
register(['FIN008'], resolveJournalCaisse);
register(['FIN009'], resolveRapportFinancier);
register(['RH001', 'RH002', 'RH003', 'RH004', 'RH005', 'RH006', 'RH007', 'ENS001', 'ENS002', 'ENS003', 'ENS004', 'ENS006', 'ENS007'], resolveDocumentRh);
register(['EXM001', 'EXM002', 'EXM003', 'EXM004', 'EXM005', 'ENS005'], resolveDefault);
