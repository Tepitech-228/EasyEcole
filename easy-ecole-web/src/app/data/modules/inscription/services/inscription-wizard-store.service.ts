import { Injectable } from '@angular/core';

/**
 * Registre d'état partagé du wizard d'inscription (singleton, providedIn root).
 *
 * Pourquoi : l'étape 3 redirige l'étudiant vers la page de profil
 * (`/parametres/profil`) qui est une route INDÉPENDANTE. Naviguer vers une autre
 * route détruit le composant du wizard et, avec lui, tout son état en mémoire
 * (filière choisie, session, documents téléversés, bordereau, pré-remplissage
 * OCR). Ce service conserve cet état pendant la navigation et permet de le
 * restaurer au retour sur l'étape 4 (récapitulatif).
 *
 * Attention : il conserve des références en mémoire (y compris des objets File).
 * Il ne doit JAMAIS être sérialisé (pas de localStorage), par sécurité des PII.
 */
@Injectable({ providedIn: 'root' })
export class InscriptionWizardStoreService {

  private etat: WizardEtat | null = null;

  /**
   * Pré-remplissage OCR (champs d'infos personnelles consolidées) transmis à la
   * page de profil lors de la redirection. Séparé de l'état du wizard pour que
   * la page profil puisse le consommer sans restaurer tout le wizard.
   */
  ocrPreRemplissage: {
    nom: string; prenoms: string; dateNaissance: string; lieuNaissance: string;
    nationalite: string; contact: string; email: string; adresse: string;
    numeroPiece: string;
  } | null = null;

  /**
   * Enregistre l'état courant du wizard juste avant la redirection vers le profil.
   */
  sauvegarderEtat(etat: WizardEtat): void {
    this.etat = etat;
  }

  /**
   * Restaure (et consomme) l'état sauvegardé, ou null s'il n'y en a pas.
   */
  reprendreEtat(): WizardEtat | null {
    const etat = this.etat;
    return etat;
  }

  /**
   * Récupère sans consommer l'état courant.
   */
  getEtat(): WizardEtat | null {
    return this.etat;
  }

  /**
   * Conserve l'état (au retour du profil, pour la suite du wizard).
   */
  conserverEtat(): void {
    // no-op : l'état reste stocké tant qu'on ne l'a pas effacé.
  }

  /**
   * Efface l'état une fois le dossier soumis / abandonné.
   */
  effacer(): void {
    this.etat = null;
  }
}

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
  infos: {
    nom: string; prenoms: string; dateNaissance: string; lieuNaissance: string;
    nationalite: string; contact: string; email: string; adresse: string; numeroPiece: string;
    sexe: string; typePieceIdentite: string;
  };
}
