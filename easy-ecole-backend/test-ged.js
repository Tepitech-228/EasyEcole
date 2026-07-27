const http = require('http');

// Get a JWT by generating one ourselves with the same secret
const jwt = require('jsonwebtoken');
const { DatabaseConnection } = require('./lib/core/helpers/DatabaseConnection');

async function main() {
  const db = DatabaseConnection.getInstance();
  await db.sequelize.authenticate();
  
  const AutU = db.sequelize.model('AutUtilisateur');
  const user = await AutU.findOne({ where: { email: 'tepitechbuild@gmail.com' } });
  
  if (!user) {
    console.log('Admin user not found');
    return;
  }
  
  const JWT_SECRET = require('./lib/core/config/jwt').JWT_SECRET || 'dev_secret_easyecole_2024_change_in_production';
  
  const token = jwt.sign({
    exp: Math.floor(Date.now() / 1000) + 3600,
    id: user.id,
    email: user.email,
    identifiant: user.identifiant,
    role: user.role,
    tokenVersion: user.tokenVersion || 1,
  }, JWT_SECRET);
  
  console.log('Token obtained for:', user.email);
  
  // Now call the GED endpoint
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/ged/documents',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      try {
        const parsed = JSON.parse(data);
        if (parsed.error) {
          console.log('Error:', JSON.stringify(parsed.error, null, 2).slice(0, 1000));
        } else {
          console.log('Success:', JSON.stringify(parsed).slice(0, 500));
        }
      } catch(e) {
        console.log('Raw response:', data.slice(0, 500));
      }
      db.sequelize.close();
    });
  });
  
  req.on('error', (e) => {
    console.error('Request error:', e.message);
    db.sequelize.close();
  });
  
  req.end();
}
main().catch(e => { console.error(e); process.exit(1); });
