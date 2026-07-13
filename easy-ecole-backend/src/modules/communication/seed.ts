import { DatabaseConnection } from "../../core/helpers/DatabaseConnection";
import { Communication } from "./models/Communication";
import { Actualite } from "./models/Actualite";

export async function seedCommunication(): Promise<void> {
  const db = DatabaseConnection.getInstance();
  await db.init();

  const comCount = await Communication.count();
  if (comCount === 0) {
    await Communication.bulkCreate([
      { titre: "Bienvenue à l'UST", contenu: "Nous vous souhaitons la bienvenue à l'Université des Sciences et Technologies pour cette nouvelle année académique.", datePublication: new Date(), statut: "publiee", cible: "tous" },
      { titre: "Information rentrée", contenu: "La rentrée académique est prévue le 1er octobre. Veuillez vous inscrire avant cette date.", datePublication: new Date(), statut: "publiee", cible: "apprenants" },
    ]);
    console.log("2 Communications créées");
  }

  const actuCount = await Actualite.count();
  if (actuCount === 0) {
    await Actualite.bulkCreate([
      { titre: "Journée portes ouvertes", contenu: "L'UST organise une journée portes ouvertes le 15 mars.", date: new Date(), categorie: "Événement" },
      { titre: "Partenariat international", contenu: "Signature d'un accord de partenariat avec une université canadienne.", date: new Date(), categorie: "Partenariat" },
    ]);
    console.log("2 Actualités créées");
  }
}

if (require.main === module) {
  seedCommunication().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
