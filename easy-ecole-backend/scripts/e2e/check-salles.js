const m = require('mysql2/promise');
async function main() {
  const db = await m.createConnection({host:'localhost',port:3307,user:'root',password:'',database:'easyecole'});
  const [r] = await db.query('SELECT id, libelle FROM ins_salles_de_classes LIMIT 10');
  console.log(JSON.stringify(r, null, 2));
  await db.end();
}
main().catch(console.error);