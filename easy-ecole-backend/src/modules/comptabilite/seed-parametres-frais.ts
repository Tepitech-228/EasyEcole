import { DatabaseConnection } from "../../core/helpers/DatabaseConnection";
import { ParametreFrais } from "./models/ParametreFrais";

interface ParametreFraisSeed {
  cle: string;
  libelle: string;
  valeur: number;
  description: string;
  type: 'montant' | 'compte_comptable' | 'pourcentage' | 'texte';
  module: string;
}

const parametresSeed: ParametreFraisSeed[] = [
  {
    cle: "frais_rattrapage",
    libelle: "Frais de rattrapage",
    valeur: 5000,
    description: "Montant facturé à l'étudiant pour une épreuve de rattrapage",
    type: "montant",
    module: "evaluations"
  },
  {
    cle: "frais_demande_document",
    libelle: "Frais de demande de document (0 = gratuit si génération normale)",
    valeur: 0,
    description: "Frais appliqués lors d'une demande de document",
    type: "montant",
    module: "scolarite"
  },
  {
    cle: "compte_produit_rattrapage",
    libelle: "Compte produit frais de rattrapage",
    valeur: 704,
    description: "Compte comptable produit (classe 7) utilisé pour les frais de rattrapage",
    type: "compte_comptable",
    module: "evaluations"
  },
  {
    cle: "compte_produit_document",
    libelle: "Compte produit frais de demande de document",
    valeur: 704,
    description: "Compte comptable produit (classe 7) utilisé pour les frais de documents",
    type: "compte_comptable",
    module: "scolarite"
  }
];

export async function seedParametresFrais(): Promise<void> {
  const db = DatabaseConnection.getInstance();
  await db.init();

  const parametresCount = await ParametreFrais.count();
  if (parametresCount === 0) {
    await ParametreFrais.bulkCreate(parametresSeed);
    console.log("Paramètres de frais par défaut créés");
  } else {
    console.log("Paramètres de frais déjà présents, seed ignoré");
  }
}

if (require.main === module) {
  seedParametresFrais().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
