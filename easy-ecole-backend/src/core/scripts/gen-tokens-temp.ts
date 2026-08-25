const jwt = require('jsonwebtoken');
const { DatabaseConnection } = require('../helpers/DatabaseConnection');

(async () => {
  require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
  const db = DatabaseConnection.getInstance();
  await db.init();
  await db.sequelize.authenticate();
  console.log('DB ->', db.sequelize.config.database, '@', db.sequelize.config.host + ':' + db.sequelize.config.port);
  const [rows]: any[] = await db.sequelize.query("SELECT id, email, role, identifiant, tokenVersion, etablissementId FROM aut_utilisateurs WHERE role IN ('admin','esa_compta','comite_orientation') ORDER BY id LIMIT 8");
  for (const u of rows) {
    const token = jwt.sign(
      { id: u.id, identifiant: u.identifiant, email: u.email, role: u.role, tokenVersion: u.tokenVersion || 0, etablissementId: u.etablissementId || null },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );
    console.log(`ROLE=${u.role} ID=${u.id} TV=${u.tokenVersion}`);
    console.log('TOKEN=' + token);
  }
  process.exit(0);
})().catch((e: any) => { console.error('ERR:', e.message); process.exit(1); });

export {}
