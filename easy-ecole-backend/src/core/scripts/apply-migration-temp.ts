const { DatabaseConnection } = require('../helpers/DatabaseConnection');
const fs = require('fs');
const path = require('path');

if (process.env.ALLOW_DEV_SCRIPTS !== 'true') {
    console.error('Ce script de développement est désactivé en production.');
    process.exit(1);
}

const fichier = process.argv[2] || '007_pipeline_inscription.sql';

(async () => {
  const db = DatabaseConnection.getInstance();
  await db.init();
  const seq = db.sequelize;
  await seq.authenticate();

  const sqlPath = path.resolve(process.cwd(), '..', 'migrations', fichier);
  const contenu: string = fs.readFileSync(sqlPath, 'utf8');

  const instructions: string[] = contenu
    .split(';')
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0 && s.replace(/^(--.*)?[\s\-–—%]*/gm, '').trim() !== '');

  let ok = 0;
  for (const instruction of instructions) {
    try {
      await seq.query(instruction);
      ok++;
    } catch (e: any) {
      console.error('ECHEC:', instruction.substring(0, 80).replace(/\n/g, ' '), '->', e?.message);
      process.exit(1);
    }
  }
  console.log(`OK: ${ok} instructions executees (${fichier})`);

  const [cols]: any[] = await seq.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_demandes_inscription' AND COLUMN_NAME IN ('statutPipeline','motifPipeline')");
  console.log('Colonnes demande:', JSON.stringify(cols.map((c: any) => c.COLUMN_NAME)));

  process.exit(0);
})().catch((e: any) => { console.error('ERR:', e?.message); process.exit(1); });

export {}
