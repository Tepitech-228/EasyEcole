import { DatabaseConnection } from "../../core/helpers/DatabaseConnection";
import { EchelleNote } from "./models/EchelleNote";

export async function seedBulletins(): Promise<void> {
  const db = DatabaseConnection.getInstance();
  await db.init();

  const echelleCount = await EchelleNote.count();
  if (echelleCount === 0) {
    await EchelleNote.bulkCreate([
      { libelle: "Très bien", noteMin: 16, noteMax: 20, mention: "Très bien", ordre: 1 },
      { libelle: "Bien", noteMin: 14, noteMax: 15.99, mention: "Bien", ordre: 2 },
      { libelle: "Assez bien", noteMin: 12, noteMax: 13.99, mention: "Assez bien", ordre: 3 },
      { libelle: "Passable", noteMin: 10, noteMax: 11.99, mention: "Passable", ordre: 4 },
      { libelle: "Insuffisant", noteMin: 0, noteMax: 9.99, mention: "Insuffisant", ordre: 5 },
    ]);
    console.log("ÉchelleNote créée");
  }
}

if (require.main === module) {
  seedBulletins().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
