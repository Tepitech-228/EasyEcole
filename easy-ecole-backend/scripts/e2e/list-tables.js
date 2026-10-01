const m = require('mysql2/promise');

async function main() {
  const db = await m.createConnection({host:'localhost',port:3307,user:'root',password:'',database:'easyecole'});
  const [tables] = await db.query('SHOW TABLES');
  const names = tables.map(t => t[Object.keys(t)[0]]);
  console.log('Tables (' + names.length + '):');
  names.forEach(n => console.log('  ' + n));
  await db.end();
}

main().catch(console.error);