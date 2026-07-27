require('./lib/modules/auth/models/_associations');
require('./lib/modules/ged/GedRoutes');
const { DatabaseConnection } = require('./lib/core/helpers/DatabaseConnection');

async function main() {
  const db = DatabaseConnection.getInstance();
  await db.sequelize.authenticate();
  await db.sequelize.sync();

  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_easyecole_2024_change_in_production';
  
  const AutU = db.sequelize.model('AutUtilisateur');
  const user = await AutU.findOne({ where: { email: 'tepitechbuild@gmail.com' } });
  
  if (!user) { console.log('User not found'); return; }
  
  const token = jwt.sign({
    exp: Math.floor(Date.now() / 1000) + 3600,
    id: user.id,
    email: user.email,
    identifiant: user.identifiant,
    role: user.role,
    tokenVersion: user.tokenVersion || 1,
  }, JWT_SECRET);
  
  console.log('TOKEN:' + token);
  console.log('TOKEN_LENGTH:' + token.length);
  
  const http = require('http');
  const options = {
    hostname: 'localhost', port: 3000, path: '/api/v1/ged/documents', method: 'GET',
    headers: { 'Authorization': 'Bearer ' + token }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('STATUS:' + res.statusCode);
      console.log('BODY:' + data.slice(0, 2000));
      db.sequelize.close();
    });
  });
  req.on('error', (e) => { console.log('REQ_ERROR:' + e.message); db.sequelize.close(); });
  req.end();
}
main().catch(e => { console.log('ERROR:' + e.message + ' ' + e.stack?.slice(0, 500)); process.exit(1); });
