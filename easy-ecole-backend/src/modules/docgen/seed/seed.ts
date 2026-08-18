import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import "../models/_associations";
import { seedDocGenTypes } from "./seed-types";
import { seedDocGenTemplates } from "./seed-templates";

export async function seedDocGen(): Promise<void> {
  const db = DatabaseConnection.getInstance();
  await db.init();

  console.log("[docgen] Début du seed...");
  await seedDocGenTypes();
  await seedDocGenTemplates();
  console.log("[docgen] Seed terminé.");
}

if (require.main === module) {
  seedDocGen().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
