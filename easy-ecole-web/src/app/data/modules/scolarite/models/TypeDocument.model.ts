export interface TypeDocument {
  id?: string;
  libelle: string;
  frais: number;
  format?: string;
  categorie?: string;
  delaiTraitement?: number;
  paiementObligatoire?: boolean;
  generationAuto?: boolean;
  actif?: boolean;
}
