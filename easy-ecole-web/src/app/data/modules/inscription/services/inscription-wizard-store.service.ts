import { Injectable } from '@angular/core';

/**
 * Métadonnées d'une pièce jointe, seul ce qui survit à un rechargement.
 *
 * Déclaré en `type` et non en `interface` : les alias de type littéral
 * bénéficient de l'index signature implicite, ce qui les rend assignables aux
 * dictionnaires (`{ [cle: string]: string }`) utilisés par la page profil.
 * Une `interface` ne l'aurait pas.
 */
export type FichierMeta = {
  nom: string;
  taille: number;
  type: string;
};

/** Pré-remplissage OCR transmis à la page de profil. */
export type OcrPreRemplissage = {
  nom: string; prenoms: string; dateNaissance: string; lieuNaissance: string;
  nationalite: string; contact: string; email: string; adresse: string;
  numeroPiece: string;
};

/** Forme de l'état telle qu'elle est écrite dans le sessionStorage. */
interface WizardEtatPersiste {
  ts: number;
  etape: number;
  sessionIdFromRoute?: string;
  niveauEtudeIdFromRoute?: string;
  typeChoisi: string;
  gradeChoisi: string;
  filiereChoisie: { id: string; titre: string; type?: string; grade?: string } | null;
  filiereSelectionId: string;
  sessionSelectionneeId?: number;
  sessions: any[];
  documentsRequis: Array<{ id: string; titre: string; description?: string; obligatoire?: boolean }>;
  documents: { [cle: string]: FichierMeta | null };
  bordereau: FichierMeta | null;
  infos: WizardInfos;
  ocrPreRemplissage: OcrPreRemplissage | null;
}

export type WizardInfos = {
  nom: string; prenoms: string; dateNaissance: string; lieuNaissance: string;
  nationalite: string; contact: string; email: string; adresse: string;
  numeroPiece: string; sexe: string; typePieceIdentite: string;
};

export interface WizardEtat {
  etape: number;
  sessionIdFromRoute?: string;
  niveauEtudeIdFromRoute?: string;
  typeChoisi: string;
  gradeChoisi: string;
  filiereChoisie?: { id: string; titre: string; type?: string; grade?: string } | null;
  filiereSelectionId: string;
  sessionSelectionneeId?: number;
  sessions: any[];
  documentsRequis: Array<{ id: string; titre: string; description?: string; obligatoire?: boolean }>;
  documents: { [cle: string]: File | null };
  bordereau: File | null;
  infos: WizardInfos;

  /**
   * Pièces qui AVAIENT été sélectionnées avant un rechargement du navigateur et
   * qui doivent être re-sélectionnées. Le contenu binaire n'est pas conservé :
   * `documents[cle]` vaut alors `null` (dossier incomplet → soumission bloquée,
   * ce qui évite d'envoyer un dossier prétendument complet mais sans fichier).
   */
  documentsAReposer?: { [cle: string]: FichierMeta };
  bordereauAReposer?: FichierMeta | null;
}

/**
 * Registre d'état partagé ET PERSISTANT du wizard d'inscription.
 *
 * ── Pourquoi un store ───────────────────────────────────────────────────────
 * L'étape 3 redirige l'étudiant vers la page de profil (`/parametres/profil`),
 * une route INDÉPENDANTE. Naviguer vers une autre route détruit le composant du
 * wizard et, avec lui, son état. Ce service conserve l'état pendant la
 * navigation ET le rend résilient à un rechargement complet du navigateur.
 *
 * ── Persistance ─────────────────────────────────────────────────────────────
 * L'état est sérialisé dans `sessionStorage` à chaque modification. Un
 * rechargement (F5) ne détruit donc plus la saisie.
 *
 * Choix de `sessionStorage` plutôt que `localStorage` : il est cloisonné par
 * onglet et vidé à la fermeture de l'onglet, ce qui borne la durée de vie des
 * données dans le navigateur. Une expiration (TTL) de 2 h est en plus appliquée.
 *
 * ── Sécurité / PII ───────────────────────────────────────────────────────────
 * Les informations personnelles sont écrites dans le `sessionStorage` de
 * l'onglet de l'étudiant et y restent jusqu'à la fermeture de l'onglet ou
 * jusqu'à la soumission du dossier (effacement explicite via `effacer()`).
 * C'est un compromis assumé pour répondre au besoin « ne pas perdre la saisie
 * au rechargement ». Si une politique plus stricte est requise, la solution
 * robuste est de persister le brouillon côté SERVEUR (draft de demande).
 *
 * Les pièces jointes ne sont PAS persistées : un `File` n'est pas sérialisable
 * en JSON, et le passer en base64 ferait exploser le quota (~5 Mo) du
 * `sessionStorage` — sans compter le stockage de scans d'identité. Seules leurs
 * métadonnées (nom, taille, type) sont conservées, pour pouvoir informer
 * l'étudiant de ce qu'il doit re-sélectionner.
 */
@Injectable({ providedIn: 'root' })
export class InscriptionWizardStoreService {

  private static readonly CLE = 'easyecole_inscription_wizard';
  private static readonly TTL_MS = 2 * 60 * 60 * 1000; // 2 heures

  /** État en mémoire (navigation interne) — évite un aller-retour JSON. */
  private etat: WizardEtat | null = null;

  /**
   * Pré-remplissage OCR (champs d'infos personnelles consolidées) transmis à la
   * page de profil lors de la redirection. Séparé de l'état du wizard pour que la
   * page profil puisse le consommer sans restaurer tout le wizard.
   */
  ocrPreRemplissage: OcrPreRemplissage | null = null;

  constructor() {
    // Restaure l'état persisté (s'il existe et n'est pas périmé) : c'est ce qui
    // permet de survivre à un rechargement complet du navigateur.
    this.hydrater();
  }

  // ─── Accès au stockage, tolérant aux environnements sans DOM ────────────────

  private get storage(): Storage | null {
    try {
      return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
    } catch {
      // Navigateur en mode privé strict / contexte bloqué.
      return null;
    }
  }

  private lire(): WizardEtat | null {
    const s = this.storage;
    if (!s) return null;
    try {
      const brut = s.getItem(InscriptionWizardStoreService.CLE);
      if (!brut) return null;
      const persistee = JSON.parse(brut) as WizardEtatPersiste;
      if (!persistee || typeof persistee.ts !== 'number') return null;
      if (Date.now() - persistee.ts > InscriptionWizardStoreService.TTL_MS) {
        s.removeItem(InscriptionWizardStoreService.CLE);
        return null;
      }
      this.ocrPreRemplissage = persistee.ocrPreRemplissage || null;
      return deserialiser(persistee);
    } catch {
      // Données corrompues : on repart d'un wizard vierge plutôt que de casser.
      return null;
    }
  }

  private ecrire(etat: WizardEtat): void {
    const s = this.storage;
    if (!s) return;
    try {
      s.setItem(
        InscriptionWizardStoreService.CLE,
        JSON.stringify(serialiser(etat, this.ocrPreRemplissage))
      );
    } catch {
      // Quota dépassé / stockage indisponible : le wizard continue en mémoire
      // pour la session courante. Aucun plantage.
    }
  }

  private hydrater(): void {
    const etat = this.lire();
    if (etat) this.etat = etat;
  }

  // ─── API publique ───────────────────────────────────────────────────────────

  /** Enregistre et persiste l'état courant du wizard. */
  sauvegarderEtat(etat: WizardEtat): void {
    this.etat = etat;
    this.ecrire(etat);
  }

  /** Restaure l'état sauvegardé, ou null s'il n'y en a pas. */
  reprendreEtat(): WizardEtat | null {
    if (this.etat) return this.etat;
    return this.lire();
  }

  /** Récupère sans consommer l'état courant. */
  getEtat(): WizardEtat | null {
    return this.etat || this.lire();
  }

  /** Conserve l'état (au retour du profil, pour la suite du wizard). */
  conserverEtat(): void {
    if (this.etat) this.ecrire(this.etat);
  }

  /** Efface l'état une fois le dossier soumis / abandonné (mémoire + stockage). */
  effacer(): void {
    this.etat = null;
    this.ocrPreRemplissage = null;
    const s = this.storage;
    if (!s) return;
    try {
      s.removeItem(InscriptionWizardStoreService.CLE);
    } catch {
      // no-op
    }
  }
}

/** Ne conserve que les données sérialisables ; les File sont réduites à leurs métadonnées. */
function serialiser(etat: WizardEtat, ocrPreRemplissage: OcrPreRemplissage | null): WizardEtatPersiste {
  const documents: { [cle: string]: FichierMeta | null } = {};
  for (const cle of Object.keys(etat.documents || {})) {
    const fichier = etat.documents[cle];
    documents[cle] = fichier ? { nom: fichier.name, taille: fichier.size, type: fichier.type } : null;
  }
  return {
    ts: Date.now(),
    etape: etat.etape,
    sessionIdFromRoute: etat.sessionIdFromRoute,
    niveauEtudeIdFromRoute: etat.niveauEtudeIdFromRoute,
    typeChoisi: etat.typeChoisi,
    gradeChoisi: etat.gradeChoisi,
    filiereChoisie: etat.filiereChoisie ?? null,
    filiereSelectionId: etat.filiereSelectionId || '',
    sessionSelectionneeId: etat.sessionSelectionneeId,
    sessions: etat.sessions || [],
    documentsRequis: etat.documentsRequis || [],
    documents,
    bordereau: etat.bordereau ? { nom: etat.bordereau.name, taille: etat.bordereau.size, type: etat.bordereau.type } : null,
    infos: { ...(etat.infos || ({} as WizardInfos)) },
    ocrPreRemplissage
  };
}

/**
 * Reconstruit un état exploitable. Les pièces jointes ne sont pas recréables :
 * elles sont laissées à `null` et leur nom d'origine est reporté dans
 * `documentsAReposer` pour que l'interface puisse demander à l'étudiant de les
 * re-sélectionner. Conséquence volontaire : le dossier est considéré comme
 * incomplet tant que les fichiers n'ont pas été re-posés.
 */
function deserialiser(persistee: WizardEtatPersiste): WizardEtat {
  const documents: { [cle: string]: File | null } = {};
  const documentsAReposer: { [cle: string]: FichierMeta } = {};
  for (const cle of Object.keys(persistee.documents || {})) {
    documents[cle] = null;
    const meta = persistee.documents[cle];
    if (meta) documentsAReposer[cle] = meta;
  }
  return {
    etape: persistee.etape,
    sessionIdFromRoute: persistee.sessionIdFromRoute,
    niveauEtudeIdFromRoute: persistee.niveauEtudeIdFromRoute,
    typeChoisi: persistee.typeChoisi || '',
    gradeChoisi: persistee.gradeChoisi || '',
    filiereChoisie: persistee.filiereChoisie,
    filiereSelectionId: persistee.filiereSelectionId || '',
    sessionSelectionneeId: persistee.sessionSelectionneeId,
    sessions: persistee.sessions || [],
    documentsRequis: persistee.documentsRequis || [],
    documents,
    bordereau: null,
    bordereauAReposer: persistee.bordereau || null,
    documentsAReposer,
    infos: { ...(persistee.infos || ({} as WizardInfos)) }
  };
}
