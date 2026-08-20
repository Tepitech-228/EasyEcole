/**
 * Réconciliation : sync({ alter: true }) ciblé sur le modèle Apprenant
 * après consolidation des index. Script jetable (.cjs) — aucun TS modifié.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('ts-node').register({ transpileOnly: true, project: path.join(__dirname, '..', 'tsconfig.json') });

const { DatabaseConnection } = require('../src/core/helpers/DatabaseConnection');

async function main() {
  const db = DatabaseConnection.getInstance();
  const sequelize = db.sequelize;

  try {
    await sequelize.authenticate();
    console.log('DB connected:', sequelize.config.database, sequelize.config.host, sequelize.config.port);
  } catch (e) {
    console.error('AUTH FAIL', e.message);
    process.exit(1);
  }

  // Charge le modèle Apprenant (et Utilisateur, etc. transitivement)
  const { Apprenant } = require('../src/modules/auth/models/Apprenant');
  console.log('Modèle Apprenant chargé (table:', Apprenant.tableName + ')');

  // État AVANT (index aut_apprenants)
  const [beforeStats] = await sequelize.query(
    `SELECT COUNT(DISTINCT INDEX_NAME) c FROM information_schema.statistics WHERE TABLE_SCHEMA=? AND TABLE_NAME='aut_apprenants'`,
    { replacements: [sequelize.config.database] }
  );
  console.log('Index aut_apprenants AVANT sync :', beforeStats[0].c);

  let syncOk = false;
  let syncDetail = '';
  try {
    await Apprenant.sync({ alter: true });
    syncOk = true;
    console.log('Apprenant.sync({ alter: true }) => SUCCÈS');
  } catch (err) {
    const code = err && (err.parent?.code || err.original?.code);
    syncDetail = `${code || ''} ${err?.message || err}`;
    console.log('Apprenant.sync({ alter: true }) => ÉCHEC');
    console.log('  code:', code, '|| message:', err?.message);
    if (code === 'ER_TOO_MANY_KEYS') {
      console.log('  ⚠ ENCORE ER_TOO_MANY_KEYS');
    }
  }

  // Vérification colonnes manquantes du modèle
  const [cols] = await sequelize.query('SHOW COLUMNS FROM aut_apprenants');
  const names = cols.map((c) => c.Field);
  console.log('\nColonnes aut_apprenants :', names.join(', '));
  const expected = ['adresseId', 'identiteId', 'informationsSalarieId', 'informationsParentsId', 'personnePrevenirId'];
  for (const c of expected) {
    console.log(`   ${c.padEnd(24)} -> ${names.includes(c) ? 'PRÉSENTE' : 'ABSENTE'}`);
  }

  // État APRÈS (index aut_apprenants)
  const [afterStats] = await sequelize.query(
    `SELECT INDEX_NAME, NON_UNIQUE FROM information_schema.statistics WHERE TABLE_SCHEMA=? AND TABLE_NAME='aut_apprenants' GROUP BY INDEX_NAME, NON_UNIQUE`,
    { replacements: [sequelize.config.database] }
  );
  console.log('\nIndex aut_apprenants APRÈS sync :', afterStats.length, '->', afterStats.map((i) => i.INDEX_NAME).join(', '));
  console.log('\nRésultat réconciliation :', { syncOk, detail: syncDetail });

  await sequelize.close();
}

main().catch((e) => {
  console.error('ERREUR', e);
  process.exit(1);
});