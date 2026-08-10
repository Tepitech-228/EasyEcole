/**
 * Type d'un paramètre de frais (cf. backend cpt_parametres_frais)
 */
export type TypeParametreFrais = 'montant' | 'compte_comptable' | 'pourcentage' | 'texte';

/**
 * Paramètre de frais centralisé (frais de rattrapage, frais de demande de document,
 * compte produit associé...). La valeur est toujours stockée numériquement côté backend.
 */
export interface ParametreFrais {
  id?: number;
  cle: string;
  libelle: string;
  valeur: number;
  description?: string | null;
  type: TypeParametreFrais;
  module?: string | null;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
  readonly deletedAt?: Date | null;
}
