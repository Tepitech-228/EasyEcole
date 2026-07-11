export interface DemandeVAE {
  id?: string;
  utilisateurId: number;
  type: 'vae' | 'vap' | 'equivalence';
  parcoursCibleId: number;
  justificatifs?: any;
  statut?: 'soumise' | 'instruction' | 'acceptee' | 'rejetee';
}
