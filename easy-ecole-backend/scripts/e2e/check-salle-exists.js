const m = require('mysql2/promise');
async function main() {
  const db = await m.createConnection({host:'localhost',port:3307,user:'root',password:'',database:'easyecole'});
  try {
    const [r] = await db.query('SELECT 1 FROM ins_salle LIMIT 1');
    console.log('ins_salle exists');
  } catch (e) {
    console.log('ins_salle does not exist:', e.message);
  }
  
  try {
    const [r] = await db.query('SELECT 1 FROM ins_salles LIMIT 1');
    console.log('ins_salles exists');
  } catch (e) {
    console.log('ins_salles does not exist:', e.message);
  }
  
  try {
    const [r] = await db.query('SELECT 1 FROM ins_salles_de_classes LIMIT 1');
    console.log('ins_salles_de_classes exists');
  } catch (e) {
    console.log('ins_salles_de_classes does not exist:', e.message);
  }
  
  await db.end();
}
main().catch(console.error);