import path from "path";
import fs from "fs";
import crypto from "crypto";
import { Sequelize } from "sequelize";
import { DocumentGed } from "../src/modules/ged/models/DocumentGed";
import Domain from "../src/modules/ged/models/Domain";
import { AuditService } from "../src/core/services/AuditService";
import { ReferenceService } from "../src/core/services/ReferenceService";
import "../src/modules/ged/models/_associations";

const SRC = "../docs/fichier GED/Planning - Intégrations et Tests Scolarité - Easy Ecole V3.pdf";
const DEST_DIR = "public/ged";

async function main() {
  const srcPath = path.resolve(process.cwd(), SRC);
  if (!fs.existsSync(srcPath)) {
    console.error("Fichier source introuvable :", srcPath);
    process.exit(1);
  }

  const domains = await Domain.findAll();
  if (domains.length === 0) {
    console.error("Aucun domaine trouvé en base. Lance d'abord le seed GED.");
    process.exit(1);
  }

  console.log(`Domaine(s) trouvé(s) : ${domains.length}`);
  for (const d of domains) {
    console.log(`  - ${d.code} (${d.label})`);
  }

  const created: { id: number; code: string; reference: string }[] = [];
  const srcBuffer = fs.readFileSync(srcPath);

  for (const domain of domains) {
    const year = new Date().getFullYear();
    const reference = `${domain.code}-DEMO-${year}-${String(Date.now()).slice(-5)}`;
    const destFilename = `demo_${domain.code}_${Date.now()}_${Math.round(Math.random() * 1000)}.pdf`;
    const destPath = path.resolve(process.cwd(), DEST_DIR, destFilename);

    fs.copyFileSync(srcPath, destPath);

    const integrityHash = crypto.createHash('sha256').update(srcBuffer).digest('hex');
    const stats = fs.statSync(destPath);

    const doc = await DocumentGed.create({
      titre: `[TEST] Planning Intégrations - ${domain.label}`,
      reference,
      type: 'PDF',
      statut: 'Disponible',
      fichier: destFilename,
      taille: `${(stats.size / 1024).toFixed(1)} Ko`,
      uploaderId: 1,
      domainId: domain.id,
      sourceType: 'recu_externe',
      receptionDate: new Date(),
      confidentialityLevel: 'public',
      lifecycleStatus: 'courant',
      integrityHash,
      versionMajor: 1,
      versionMinor: 0,
      isCurrentVersion: true,
      isLocked: false,
      metadata: undefined
    });

    await AuditService.log(doc.id, 1, 'creation', { source: 'import_demo', domain: domain.code });

    created.push({ id: doc.id, code: domain.code, reference: doc.reference });
    console.log(`✓ ${domain.code.padEnd(4)} → Document #${doc.id} (${reference})`);
  }

  console.log("\nImport terminé !");
  console.log(`Total : ${created.length} document(s) créé(s) dans la GED.`);
}

main().catch((err) => {
  console.error("Erreur :", err);
  process.exit(1);
});
