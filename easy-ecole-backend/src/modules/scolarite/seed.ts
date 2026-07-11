import { DatabaseConnection } from "../../core/helpers/DatabaseConnection";
import { TypeDocument } from "./models/TypeDocument";

export async function seedScolarite(): Promise<void> {
  const db = DatabaseConnection.getInstance();
  await db.init();

  const typeDocCount = await TypeDocument.count();
  if (typeDocCount === 0) {
    await TypeDocument.bulkCreate([
      { libelle: "Relevé de notes", frais: 3000, format: "PDF" },
      { libelle: "Attestation de scolarité", frais: 5000, format: "PDF" },
      { libelle: "Diplôme", frais: 15000, format: "PDF" },
      { libelle: "Certificat de scolarité", frais: 2000, format: "PDF" },
      { libelle: "Bulletin", frais: 0, format: "PDF" },
    ]);
    console.log("5 Types de document créés");
  }
}

if (require.main === module) {
  seedScolarite().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
