import { DatePipe } from '@angular/common';

// ---------------------------------------------------------------------------
// Modèles API du module Achats (contrat vérifié côté backend : /api/v1/achats)
// ---------------------------------------------------------------------------

export interface Budget {
  id: number;
  departementId?: number | null;
  departement?: { id: number; nom: string } | null;
  periode: string;
  montantAlloue: number;
  montantUtilise: number;
  lignesBudget?: LigneBudget[];
  engagements?: Engagement[];
}

export interface LigneBudget {
  id?: number;
  budgetId?: number;
  categorieAchatId?: number | null;
  montantAlloue?: number;
}

export interface Engagement {
  id?: number;
  budgetId?: number;
  demandeId?: number;
  montant?: number;
}

export interface DemandeAchat {
  id: number;
  soumisParId?: number;
  soumisPar?: { id: number; prenom?: string; nom?: string } | null;
  description: string;
  statut: 'brouillon' | 'soumise' | 'validee' | 'rejetee' | 'commandee' | 'recue';
  dateSoumission?: string | null;
  validateurChoisiId?: number | null;
  lignesDemande?: LigneDemande[];
  validations?: ValidationAchat[];
}

export interface LigneDemande {
  id?: number;
  designation: string;
  quantite: number;
  prixEstime: number;
  unite?: string;
}

export interface ValidationAchat {
  id?: number;
  demandeId?: number;
  validateurId?: number;
  statut: 'approuve' | 'rejete';
  commentaire?: string | null;
  date?: string;
}

export interface Commande {
  id: number;
  demandeId?: number;
  demande?: DemandeAchat | null;
  fournisseurId?: number | null;
  fournisseur?: Fournisseur | null;
  dateCommande?: string;
  statut: 'en_cours' | 'livree' | 'annulee';
  lignesCommande?: LigneCommande[];
  receptions?: Reception[];
  facturesProforma?: unknown[];
}

export interface LigneCommande {
  id?: number;
  commandeId?: number;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  gereEnStock?: boolean;
  actifImmobilise?: boolean;
}

export interface Reception {
  id: number;
  commandeId: number;
  commande?: Commande | null;
  date?: string;
  statut: 'partielle' | 'totale';
  notes?: string | null;
  lignesReception?: LigneReception[];
}

export interface LigneReception {
  id?: number;
  receptionId?: number;
  ligneCommandeId?: number;
  quantiteRecue: number;
  ligneCommande?: LigneCommande | null;
}

export interface Fournisseur {
  id: number;
  nom: string;
  email?: string | null;
  telephone?: string | null;
}

export interface Validateur {
  id: number;
  utilisateurId?: number;
  utilisateur?: { id: number; prenom?: string; nom?: string } | null;
  niveau: number;
  montantMax: number;
  actif: boolean;
}

// ---------------------------------------------------------------------------
// Helpers d'affichage partagés (libellés, badges, montants calculés)
// ---------------------------------------------------------------------------

export const ACHATS_STATUTS_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  soumise: 'Soumise',
  validee: 'Validée',
  rejetee: 'Rejetée',
  commandee: 'Commandée',
  recue: 'Reçue',
  en_cours: 'En cours',
  livree: 'Livrée',
  annulee: 'Annulée',
  partielle: 'Partielle',
  totale: 'Totale',
};

export function getMontantDemande(demande: DemandeAchat): number {
  return (demande.lignesDemande || []).reduce(
    (somme, ligne) => somme + (Number(ligne.quantite) || 0) * (Number(ligne.prixEstime) || 0),
    0
  );
}

export function getMontantCommande(commande: Commande): number {
  return (commande.lignesCommande || []).reduce(
    (somme, ligne) => somme + (Number(ligne.quantite) || 0) * (Number(ligne.prixUnitaire) || 0),
    0
  );
}

export function getQuantiteRecue(reception: Reception): number {
  return (reception.lignesReception || []).reduce(
    (somme, ligne) => somme + (Number(ligne.quantiteRecue) || 0),
    0
  );
}

export function getNomUtilisateur(utilisateur: { prenom?: string; nom?: string } | null | undefined): string {
  if (!utilisateur) return '—';
  return [utilisateur.prenom, utilisateur.nom].filter(Boolean).join(' ') || '—';
}

export function getFournisseurLabel(fournisseur: Fournisseur | null | undefined): string {
  return fournisseur?.nom || '—';
}

const datePipe = new DatePipe('fr-FR');

export function formatDateFR(value?: string | Date | null): string {
  if (!value) return '—';
  return datePipe.transform(value, 'dd/MM/yyyy') || '—';
}
