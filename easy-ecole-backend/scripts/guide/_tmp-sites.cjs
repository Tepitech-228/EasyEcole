const mysql=require('mysql2/promise');
(async()=>{
 const c=await mysql.createConnection({host:'127.0.0.1',port:3307,user:'root',password:'',database:'easyecole'});
 const [tables]=await c.query("SHOW TABLES LIKE '%site%'");
 console.log('TABLES',tables);
 for(const t of tables){const name=Object.values(t)[0];console.log('\n== '+name);const [cols]=await c.query('SHOW COLUMNS FROM `'+name+'`');console.log(cols.map(x=>x.Field).join(', '));const [rows]=await c.query('SELECT * FROM `'+name+'` LIMIT 8');console.log(rows);}
 const [cols]=await c.query('SHOW COLUMNS FROM aut_utilisateurs');
 console.log('\naut_utilisateurs:',cols.map(x=>x.Field).join(', '));
 const [users]=await c.query("SELECT id,identifiant,role,etablissementId FROM aut_utilisateurs WHERE identifiant IN ('tepitechbuild','esa-compta','kakashitogo','secretaire1','direction','pers-admin1','etudiant-demo','prof-maths','parent1','surveillant1','caissier1','tepitechcorp','comite1','superviseur.general')");
 console.table(users);
 await c.end();
})().catch(e=>{console.error(e);process.exit(1)});
