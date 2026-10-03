const mysql=require('D:/EasyEcole/easy-ecole-backend/node_modules/mysql2/promise');
(async()=>{
  const c=await mysql.createConnection({host:'localhost',port:3307,user:'root',password:'',database:'easyecole'});
  const [cursus]=await c.query('SELECT id, utilisateurId, classeId, parcoursId, anneeAcademiqueId FROM ins_cursus_apprenants LIMIT 10');
  console.log('cursus sample',cursus);
  const [count]=await c.query('SELECT COUNT(*) as cnt FROM ins_cursus_apprenants');
  console.log('total cursus',count);
  const [cours]=await c.query('SELECT id, code, intitule, classeId FROM ins_cours WHERE id IN (9,10,11,12,13,14) LIMIT 6');
  console.log('cours 9-14',cours);
  const [parts]=await c.query('SELECT cursusApprenantId, COUNT(*) as nb FROM ins_cours_participants GROUP BY cursusApprenantId LIMIT 10');
  console.log('parts group',parts);
  const [users]=await c.query('SELECT id, identifiant, email, role FROM aut_utilisateurs WHERE role="apprenant" LIMIT 5');
  console.log('apprenants',users);
  const [cursus24]=await c.query('SELECT * FROM ins_cursus_apprenants WHERE id=24');
  console.log('cursus24',cursus24);
  await c.end();
})();
