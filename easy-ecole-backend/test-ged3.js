const { DatabaseConnection } = require('./lib/core/helpers/DatabaseConnection');
const jwt = require('jsonwebtoken');

async function main() {
  const db = DatabaseConnection.getInstance();
  const seq = db.sequelize;
  await seq.authenticate();

  const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_easyecole_2024_change_in_production';
  
  const [users] = await seq.query("SELECT id, email, identifiant, role, tokenVersion FROM aut_utilisateurs WHERE email='tepitechbuild@gmail.com' LIMIT 1");
  if (!users.length) { console.log('User not found'); return; }
  
  const user = users[0];
  console.log('User found:', user.email, 'ID:', user.id);
  
  const token = jwt.sign({
    exp: Math.floor(Date.now() / 1000) + 3600,
    id: user.id,
    email: user.email,
    identifiant: user.identifiant,
    role: user.role,
    tokenVersion: user.tokenVersion || 1,
  }, JWT_SECRET);
  
  console.log('TOKEN:' + token);
  
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
      const slice = data.slice(0, 3000);
      console.log('BODY:' + slice);
      seq.close();
    });
  });
  req.on('error', (e) => { console.log('REQ_ERROR:' + e.message); seq.close(); });
  req.end();
}
main().catch(e => { console.log('ERROR:' + e.message + ' ' + (e.stack || '').slice(0, 500)); process.exit(1); });
