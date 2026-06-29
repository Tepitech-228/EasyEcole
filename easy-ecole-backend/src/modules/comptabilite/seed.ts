import { DatabaseConnection } from "../../core/helpers/DatabaseConnection";
import { Compte } from "./models/Compte";
import { JournalComptable } from "./models/JournalComptable";

export async function seedComptabilite(): Promise<void> {
  const db = DatabaseConnection.getInstance();
  await db.init();

  const journalCount = await JournalComptable.count();
  if (journalCount === 0) {
    await JournalComptable.create({ code: "VEN", libelle: "Ventes", type: "Vente", actif: true });
    console.log("Journal 'VEN' créé");
  }

  const compteCount = await Compte.count();
  if (compteCount === 0) {
    await Compte.create({ numero: "512", libelle: "Banque", classe: "5", nature: "Débit/Crédit", categorie: "Trésorerie", actif: true });
    await Compte.create({ numero: "701", libelle: "Ventes de scolarité", classe: "7", nature: "Crédit", categorie: "Revenus", actif: true });
    await Compte.create({ numero: "702", libelle: "Ventes d'inscription", classe: "7", nature: "Crédit", categorie: "Revenus", actif: true });
    console.log("Comptes 512, 701, 702 créés");
  }
}

if (require.main === module) {
  seedComptabilite().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
