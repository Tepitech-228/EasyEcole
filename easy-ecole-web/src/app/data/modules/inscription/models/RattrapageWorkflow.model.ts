import { Utilisateur } from "../../auth/models/Utilisateur.model";

/**
 * Statuts possibles d'une session de rattrapage (workflow officiel B-front).
 */
export type StatutRattrapageSession = 'preparation' | 'ouverte' | 'cloturee';

/**
 * Statuts possibles d'une demande de rattrapage soumise par l'apprenant.
 */
export type StatutDemandeRattrapage = 'en_attente' | 'valide' | 'rejete';

/**
 * Statuts de paiement du bordereau de rattrapage.
 */
export type StatutPaiementRattrapage = 'impaye' | 'paye';

/**
 * Pièce justificative requise pour une session de rattrapage.
 */
export class RattrapageDocumentRequis {
  declare id?: number;
  declare libelle?: string;
  declare obligatoire?: boolean;
  declare ordre?: number;
}

/**
 * Session de rattrapage (créée par ADMIN/INSTITUTION, ouverte puis clôturée).
 */
export class RattrapageSession {
  declare id?: number;
  declare libelle?: string;
  declare dateDebut?: string;
  declare dateFin?: string;
  declare statut?: StatutRattrapageSession;
  declare description?: string;
  declare anneeAcademiqueId?: number;
  declare anneeAcademique?: any;

  /** Classes / filières concernées, renvoyées par l'API sous forme `[{ classe: { id, libelle } }]`. */
  declare classes?: { classe: { id: number | string; libelle: string } }[];
  declare documentsRequis?: RattrapageDocumentRequis[];
}

/**
 * Document effectivement déposé par l'apprenant pour sa demande de rattrapage.
 */
export class RattrapageDocumentDepose {
  declare id?: number;
  declare demandeId?: number;
  declare documentRequisId?: number;
  declare documentRequis?: RattrapageDocumentRequis;
  declare fichier?: string;
  declare nomOriginal?: string;
  declare taille?: number;
  declare dateDepot?: string;
}

/**
 * Bordereau de paiement rattaché à une demande validée par le comité.
 * Type 'rattrapage' (sans modalité 1x/3x/10x).
 */
export class RattrapageBordereau {
  declare id?: number;
  declare demandeId?: number;
  declare fichier?: string;
  declare montant?: number;
  declare statut?: string;
  declare dateDepot?: string;
}

/**
 * Demande de rattrapage (workflow B-front : dépôt documents → validation comité → bordereau → paiement).
 */
export class RattrapageInscriptionWorkflow {
  declare id?: number;
  declare statutDemande?: StatutDemandeRattrapage | null;
  declare motifRejet?: string | null;
  declare motifEtudiant?: string | null;
  declare creneauSouhaite?: string | null;
  declare montant?: number | null;
  declare statutPaiement?: StatutPaiementRattrapage | null;
  declare statut?: string | null;
  declare dateValidationComite?: string | null;
  declare rattrapageSessionId?: number;
  declare demandePar?: number;
  declare bordereauDepose?: RattrapageBordereau | null;
  declare rattrapageSession?: RattrapageSession;
  declare utilisateur?: Utilisateur;
  declare documentsDeposes?: RattrapageDocumentDepose[];
  declare documentsRequis?: RattrapageDocumentRequis[];

  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}