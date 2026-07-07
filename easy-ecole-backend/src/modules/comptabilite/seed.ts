import { DatabaseConnection } from "../../core/helpers/DatabaseConnection";
import { Compte } from "./models/Compte";
import { JournalComptable } from "./models/JournalComptable";

export async function seedComptabilite(): Promise<void> {
  const db = DatabaseConnection.getInstance();
  await db.init();

  // === JOURNAUX ===
  const journalCount = await JournalComptable.count();
  if (journalCount === 0) {
    await JournalComptable.bulkCreate([
      { code: "VEN", libelle: "Ventes / Prestations", type: "Vente", actif: true },
      { code: "ACH", libelle: "Achats", type: "Achat", actif: true },
      { code: "BQ", libelle: "Banque", type: "Banque", actif: true },
      { code: "CAI", libelle: "Caisse", type: "Caisse", actif: true },
      { code: "PAI", libelle: "Paie et Charges sociales", type: "Paie", actif: true },
      { code: "OD", libelle: "Opérations Diverses", type: "OD", actif: true },
    ]);
    console.log("Journaux VEN, ACH, BQ, CAI, PAI, OD créés");
  }

  // === PLAN COMPTABLE OHADA ===
  const compteCount = await Compte.count();
  if (compteCount === 0) {
    await Compte.bulkCreate([
      // === CLASSE 1 — Financement permanent ===
      { numero: "101", libelle: "Capital social", classe: "1", nature: "Crédit", categorie: "Capitaux", actif: true },
      { numero: "106", libelle: "Report à nouveau", classe: "1", nature: "Crédit", categorie: "Capitaux", actif: true },
      { numero: "12", libelle: "Résultat net", classe: "1", nature: "Crédit", categorie: "Capitaux", actif: true },

      // === CLASSE 2 — Actif immobilisé ===
      { numero: "211", libelle: "Terrains", classe: "2", nature: "Débit", categorie: "Immobilisations", actif: true },
      { numero: "213", libelle: "Constructions", classe: "2", nature: "Débit", categorie: "Immobilisations", actif: true },
      { numero: "215", libelle: "Matériel informatique", classe: "2", nature: "Débit", categorie: "Immobilisations", actif: true },
      { numero: "216", libelle: "Autres immobilisations corporelles", classe: "2", nature: "Débit", categorie: "Immobilisations", actif: true },
      { numero: "218", libelle: "Aménagements et agencements", classe: "2", nature: "Débit", categorie: "Immobilisations", actif: true },
      { numero: "28", libelle: "Amortissements", classe: "2", nature: "Crédit", categorie: "Immobilisations", actif: true },

      // === CLASSE 3 — Actif circulant ===
      { numero: "301", libelle: "Stocks de fournitures", classe: "3", nature: "Débit", categorie: "Stocks", actif: true },
      { numero: "302", libelle: "Stocks de fournitures informatiques", classe: "3", nature: "Débit", categorie: "Stocks", actif: true },
      { numero: "31", libelle: "Marchandises", classe: "3", nature: "Débit", categorie: "Stocks", actif: true },

      // === CLASSE 4 — Passif circulant / Tiers ===
      { numero: "401", libelle: "Fournisseurs", classe: "4", nature: "Crédit", categorie: "Dettes", actif: true },
      { numero: "411", libelle: "Créances élèves / étudiants", classe: "4", nature: "Débit", categorie: "Créances", actif: true },
      { numero: "421", libelle: "Personnel, rémunérations dues", classe: "4", nature: "Crédit", categorie: "Dettes", actif: true },
      { numero: "431", libelle: "Sécurité sociale (CNPS)", classe: "4", nature: "Crédit", categorie: "Dettes", actif: true },
      { numero: "447", libelle: "État, impôts et taxes", classe: "4", nature: "Crédit", categorie: "Dettes", actif: true },

      // === CLASSE 5 — Trésorerie ===
      { numero: "512", libelle: "Banque", classe: "5", nature: "Débit/Crédit", categorie: "Trésorerie", actif: true },
      { numero: "521", libelle: "Caisse", classe: "5", nature: "Débit/Crédit", categorie: "Trésorerie", actif: true },

      // === CLASSE 6 — Charges ===
      { numero: "601", libelle: "Achats de marchandises", classe: "6", nature: "Débit", categorie: "Charges", actif: true },
      { numero: "611", libelle: "Achats non stockés", classe: "6", nature: "Débit", categorie: "Charges", actif: true },
      { numero: "641", libelle: "Rémunérations du personnel", classe: "6", nature: "Débit", categorie: "Charges", actif: true },
      { numero: "641100", libelle: "Salaires personnel administratif", classe: "6", nature: "Débit", categorie: "Charges", actif: true, sousClasse: "641" },
      { numero: "641200", libelle: "Prestations enseignants vacataires", classe: "6", nature: "Débit", categorie: "Charges", actif: true, sousClasse: "641" },
      { numero: "646", libelle: "Charges sociales", classe: "6", nature: "Débit", categorie: "Charges", actif: true },
      { numero: "661", libelle: "Frais financiers", classe: "6", nature: "Débit", categorie: "Charges", actif: true },

      // === CLASSE 7 — Revenus / Produits ===
      { numero: "701", libelle: "Ventes de produits", classe: "7", nature: "Crédit", categorie: "Revenus", actif: true },
      { numero: "702", libelle: "Prestations de services", classe: "7", nature: "Crédit", categorie: "Revenus", actif: true },
      { numero: "702100", libelle: "Frais d'inscription", classe: "7", nature: "Crédit", categorie: "Revenus", actif: true, sousClasse: "702" },
      { numero: "702200", libelle: "Frais de scolarité", classe: "7", nature: "Crédit", categorie: "Revenus", actif: true, sousClasse: "702" },
      { numero: "702300", libelle: "Frais de dossier", classe: "7", nature: "Crédit", categorie: "Revenus", actif: true, sousClasse: "702" },
      { numero: "702400", libelle: "Frais de documents (relevés, diplômes)", classe: "7", nature: "Crédit", categorie: "Revenus", actif: true, sousClasse: "702" },
    ]);
    console.log("Plan comptable OHADA universitaire créé");
  }
}

if (require.main === module) {
  seedComptabilite().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
