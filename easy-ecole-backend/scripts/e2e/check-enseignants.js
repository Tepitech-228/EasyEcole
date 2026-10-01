const m = require('mysql2/promise');
async function main() {
  const db = await m.createConnection({host:'localhost',port:3307,user:'root',password:'',database:'easyecole'});
  const [rows] = await db.query('SELECT e.id as enseignantId, u.id as userId, u.identifiant, u.email FROM aut_enseignants e JOIN aut_utilisateurs u ON e.utilisateurId = u.id WHERE u.id IN (3,4,5,6,33)');
  console.log(JSON.stringify(rows, null, 2));
  await db.end();
}
main().catch(console.error);