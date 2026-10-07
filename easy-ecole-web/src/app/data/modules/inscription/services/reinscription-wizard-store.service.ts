import { Injectable } from '@angular/core';

/** Métadonnées d'un fichier, seul ce qui survit à un rechargement. */
export type FichierMeta = {
  nom: string;
  taille: number;
  type: string;
};

export type ReinscriptionInfos = {
  nom: string; prenoms: string; dateNaissance: string; lieuNaissance: string;
  nationalite: string; contact: string; email: string; adresse: string;
};

/** Forme sérialisée dans le sessionStorage. */
interface ReinscriptionEtatPersiste {
  ts: number;
  etape: number;
  sessionSelectionneeId?: number;
  montant?: number;
  referenceBancaire: string;
  modalite: string;
  infos: ReinscriptionInfos;
  documents: { [code: string]: FichierMeta | null };
  bordereau: FichierMeta | null;
  resultat: any | null;
}

export interface ReinscriptionEtat {
  etape: number;
  sessionSelectionneeId?: number;
  montant?: number;
  referenceBancaire: string;
  modalite: string;
  infos: ReinscriptionInfos;
  documents: { [code: string]: File | null };
  bordereau: File | null;
  resultat: any | null;
  /** Pièces à re-sélectionner après un rechargement (binaire non conservé). */
  documentsAReposer?: { [code: string]: FichierMeta };
  bordereauAReposer?: FichierMeta | null;
}

/**
 * Registre d'état persistant du wizard de réinscription.
 *
 * Même contrat que le store du wizard de 1ère inscription :
 * sessionStorage (cloisonné par onglet) + TTL 2 h. L'étape et les champs
 * texte survivent au rechargement ; les `File` sont réduits à leurs
 * métadonnées et doivent être re-sélectionnés (dossier incomplet tant que
 * ce n'est pas fait → soumission bloquée, pas de dossier vide envoyé).
 */
@Injectable({ providedIn: 'root' })
export class ReinscriptionWizardStoreService {

  private static readonly CLE = 'easyecole_reinscription_wizard';
  private static readonly TTL_MS = 2 * 60 * 60 * 1000; // 2 heures

  private etat: ReinscriptionEtat | null = null;

  constructor() {
    this.hydrater();
  }

  private get storage(): Storage | null {
    try {
      return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
    } catch {
      return null;
    }
  }

  private lire(): ReinscriptionEtat | null {
    const s = this.storage;
    if (!s) return null;
    try {
      const brut = s.getItem(ReinscriptionWizardStoreService.CLE);
      if (!brut) return null;
      const persistee = JSON.parse(brut) as ReinscriptionEtatPersiste;
      if (!persistee || typeof persistee.ts !== 'number') return null;
      if (Date.now() - persistee.ts > ReinscriptionWizardStoreService.TTL_MS) {
        s.removeItem(ReinscriptionWizardStoreService.CLE);
        return null;
      }
      return deserialiser(persistee);
    } catch {
      return null;
    }
  }

  private ecrire(etat: ReinscriptionEtat): void {
    const s = this.storage;
    if (!s) return;
    try {
      s.setItem(
        ReinscriptionWizardStoreService.CLE,
        JSON.stringify(serialiser(etat))
      );
    } catch {
      // Quota dépassé / stockage indisponible : on continue en mémoire.
    }
  }

  private hydrater(): void {
    const etat = this.lire();
    if (etat) this.etat = etat;
  }

  sauvegarderEtat(etat: ReinscriptionEtat): void {
    this.etat = etat;
    this.ecrire(etat);
  }

  reprendreEtat(): ReinscriptionEtat | null {
    if (this.etat) return this.etat;
    return this.lire();
  }

  effacer(): void {
    this.etat = null;
    const s = this.storage;
    if (!s) return;
    try {
      s.removeItem(ReinscriptionWizardStoreService.CLE);
    } catch {
      // no-op
    }
  }
}

function serialiser(etat: ReinscriptionEtat): ReinscriptionEtatPersiste {
  const documents: { [code: string]: FichierMeta | null } = {};
  for (const code of Object.keys(etat.documents || {})) {
    const fichier = etat.documents[code];
    documents[code] = fichier ? { nom: fichier.name, taille: fichier.size, type: fichier.type } : null;
  }
  return {
    ts: Date.now(),
    etape: etat.etape,
    sessionSelectionneeId: etat.sessionSelectionneeId,
    montant: etat.montant,
    referenceBancaire: etat.referenceBancaire || '',
    modalite: etat.modalite || '1x',
    infos: { ...(etat.infos || ({} as ReinscriptionInfos)) },
    documents,
    bordereau: etat.bordereau
      ? { nom: etat.bordereau.name, taille: etat.bordereau.size, type: etat.bordereau.type }
      : null,
    resultat: etat.resultat ?? null,
  };
}

function deserialiser(persistee: ReinscriptionEtatPersiste): ReinscriptionEtat {
  const documents: { [code: string]: File | null } = {};
  const documentsAReposer: { [code: string]: FichierMeta } = {};
  for (const code of Object.keys(persistee.documents || {})) {
    documents[code] = null;
    const meta = persistee.documents[code];
    if (meta) documentsAReposer[code] = meta;
  }
  return {
    etape: Math.min(5, Math.max(1, Number(persistee.etape) || 1)),
    sessionSelectionneeId: persistee.sessionSelectionneeId,
    montant: persistee.montant,
    referenceBancaire: persistee.referenceBancaire || '',
    modalite: persistee.modalite || '1x',
    infos: { ...(persistee.infos || ({} as ReinscriptionInfos)) },
    documents,
    bordereau: null,
    bordereauAReposer: persistee.bordereau || null,
    documentsAReposer,
    resultat: persistee.resultat ?? null,
  };
}
