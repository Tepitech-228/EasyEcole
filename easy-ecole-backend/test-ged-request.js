const { DatabaseConnection } = require('./lib/core/helpers/DatabaseConnection');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

async function main() {
  const db = DatabaseConnection.getInstance();
  const seq = db.sequelize;
  await seq.authenticate();

  const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_easyecole_2024_change_in_production';

  const [users] = await seq.query("SELECT id, email, identifiant, role, tokenVersion FROM aut_utilisateurs WHERE email='tepitechbuild@gmail.com' LIMIT 1");
  if (!users.length) { console.log('User not found'); return; }

  const user = users[0];
  const token = jwt.sign({
    exp: Math.floor(Date.now() / 1000) + 3600,
    id: user.id,
    email: user.email,
    identifiant: user.identifiant,
    role: user.role,
    tokenVersion: user.tokenVersion || 1,
  }, JWT_SECRET);

  // Use Node's built-in http module with proper multipart
  const http = require('http');
  const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
  
  // Create a minimal valid PDF
  const pdfBuffer = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF'
  );

  const header = 
    '--' + boundary + '\r\n' +
    'Content-Disposition: form-data; name="fichier"; filename="test.pdf"\r\n' +
    'Content-Type: application/pdf\r\n' +
    'Content-Transfer-Encoding: binary\r\n\r\n';

  const footer = '\r\n--' + boundary + '--\r\n';

  const headerBuf = Buffer.from(header, 'utf-8');
  const footerBuf = Buffer.from(footer, 'utf-8');
  const body = Buffer.concat([headerBuf, pdfBuffer, footerBuf]);

  const options = {
    hostname: 'localhost', port: 3000, path: '/api/v1/ged/documents', method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': body.length
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('STATUS:' + res.statusCode);
      console.log('BODY:', data.slice(0, 2000));
      seq.close();
    });
  });
  req.on('error', (e) => { console.log('REQ_ERROR:' + e.message); seq.close(); });
  req.write(body);
  req.end();
}
main().catch(e => { console.log('ERROR:' + e.message + ' ' + (e.stack || '').slice(0, 500)); process.exit(1); });
