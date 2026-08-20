const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3306, user: 'root', password: '', database: 'easyecole' });
  const tables = ['aut_utilisateurs', 'aut_apprenants', 'aut_enseignants', 'eta_etablissements', 'cpt_exercices'];
  console.log('=== INDEX FINAL PAR TABLE ===');
  for (const t of tables) {
    const [i] = await c.query(
      "SELECT INDEX_NAME FROM information_schema.statistics WHERE TABLE_SCHEMA='easyecole' AND TABLE_NAME=? GROUP BY INDEX_NAME ORDER BY INDEX_NAME",
      [t]
    );
    const names = i.map((r) => r.INDEX_NAME);
    console.log(`${t} (${names.length})`);
    for (const n of names) console.log(`   - ${n}`);
  }

  // Vérification que les uniques restantes sont opérationnelles (aucun INSERT n'est fait, juste un SELECT COUNT sur doublons potentiels)
  console.log('\n=== CONTRÔLE UNICITÉ RESTANTE ===');
  const ctrl = [
    ['aut_utilisateurs', 'email'],
    ['aut_utilisateurs', 'identifiant'],
    ['aut_apprenants', 'photo'],
    ['aut_apprenants', 'qrCode'],
    ['aut_apprenants', 'cni'],
    ['aut_enseignants', 'photo'],
    ['aut_enseignants', 'qrCode'],
    ['aut_enseignants', 'matricule'],
    ['aut_enseignants', 'cni'],
    ['eta_etablissements', 'code'],
    ['cpt_exercices', 'code'],
  ];
  for (const [t, col] of ctrl) {
    const [r] = await c.query(
      `SELECT COUNT(*) AS d FROM (SELECT ${col} FROM \`${t}\` WHERE ${col} IS NOT NULL GROUP BY ${col} HAVING COUNT(*) > 1) x`
    );
    const [tot] = await c.query(`SELECT COUNT(*) AS n FROM \`${t}\` WHERE ${col} IS NOT NULL`);
    console.log(`   ${t}.${col}: ${r[0].d} doublons / ${tot[0].n} valeurs non nulles`);
  }

  // FK restantes sur les 5 tables
  console.log('\n=== CONTRAINTES FK SUR LES 5 TABLES ===');
  for (const t of tables) {
    const [f] = await c.query(
      "SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA='easyecole' AND TABLE_NAME=? AND REFERENCED_TABLE_NAME IS NOT NULL",
      [t]
    );
    console.log(`   ${t}: ${f.length ? f.map((x) => `${x.CONSTRAINT_NAME}(${x.COLUMN_NAME}->${x.REFERENCED_TABLE_NAME})`).join(', ') : '(aucune FK)'}`);
  }
  await c.end();
})().catch((e) => { console.error('ERR', e); process.exit(1); });