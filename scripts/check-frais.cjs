const mysql=require('D:/EasyEcole/easy-ecole-backend/node_modules/mysql2/promise');
(async()=>{
  const c=await mysql.createConnection({host:'localhost',port:3307,user:'root',password:'',database:'easyecole'});
  const [sessions]=await c.query('SELECT * FROM ins_sessions WHERE id IN (2,4) LIMIT 2');
  console.log('sessions',sessions);
  const [frais]=await c.query('SELECT sessionId, montant FROM ins_frais_inscription WHERE sessionId IN (2,4)');
  console.log('frais',frais);
  const [users]=await c.query('SELECT id, identifiant, role FROM aut_utilisateurs WHERE role IN ("esa_compta","comite_orientation") LIMIT 10');
  console.log('users esa/comite',users);
  const [comite]=await c.query('SELECT id, identifiant, role, tokenVersion FROM aut_utilisateurs WHERE role="comite_orientation" AND deletedAt IS NULL');
  console.log('comite members',comite);
  await c.end();
})();
