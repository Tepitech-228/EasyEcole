const jwt = require('D:/EasyEcole/easy-ecole-backend/node_modules/jsonwebtoken');
const mysql = require('D:/EasyEcole/easy-ecole-backend/node_modules/mysql2/promise');
(async()=>{
  const c = await mysql.createConnection({host:'localhost',port:3307,user:'root',password:'',database:'easyecole'});
  const [rows] = await c.query('SELECT id, identifiant, email, role, tokenVersion, etablissementId FROM aut_utilisateurs WHERE identifiant="etudiant-demo" LIMIT 1');
  const u = rows[0];
  console.log('USER', JSON.stringify(u));
  if(!u){ process.exit(1); }
  const secret = 'dev_secret_easyecole_2024_change_in_production';
  const token = jwt.sign({ exp: Math.floor(Date.now()/1000)+7200, id: u.id, identifiant: u.identifiant, email: u.email, role: u.role, tokenVersion: u.tokenVersion ?? 0, etablissementId: u.etablissementId ?? null }, secret);
  console.log('TOKEN:'+token);
  await c.end();
})();
