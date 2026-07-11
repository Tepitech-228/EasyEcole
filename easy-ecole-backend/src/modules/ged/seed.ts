import { DatabaseConnection } from "../../core/helpers/DatabaseConnection";
import Folder from "./models/Folder";

export async function seedGed(): Promise<void> {
  const db = DatabaseConnection.getInstance();
  await db.init();

  const folderCount = await Folder.count();
  if (folderCount === 0) {
    const admin = await db.sequelize.model('AutUtilisateur').findOne({ where: { identifiant: 'admin' } }) as { id: number } | null;
    const adminId = admin?.id ?? 1;
    await Folder.bulkCreate([
      { nom: "Documents administratifs", description: "Registres, procès-verbaux et documents officiels", createdBy: adminId },
      { nom: "Archives", description: "Archives des années précédentes", createdBy: adminId },
    ]);
    console.log("2 Folders créés");
  }
}

if (require.main === module) {
  seedGed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
