const jwt=require('jsonwebtoken');
const mysql=require('mysql2/promise');
const puppeteer=require('puppeteer');
const path=require('path');
const SECRET=process.env.JWT_SECRET||'dev_secret_easyecole_2024_change_in_production';
const FRONT='http://localhost:4200';
const OUT='C:/Users/User/AppData/Local/Temp/opencode/tests-roles';
const tests=[
 ['secretaire1','/scolarite/secretariat/encaissement','encaissement-secretaire'],
 ['secretaire1','/inscription/demandes','demandes-secretaire'],
 ['etudiant-demo','/inscription/demandes','demandes-etudiant'],
 ['prof-maths','/cours/notes','notes-prof'],
 ['surveillant1','/pointage','pointage-surveillant'],
 ['direction','/inscription/sessions','sessions-direction'],
 ['superviseur.general','/cours/supervision-generale','supervision-sg'],
 ['parent1','/parent','parent-dashboard'],
 ['caissier1','/inscription/paiements','paiements-caissier'],
 ['tepitechcorp','/inscription/validation-bordereaux','valid-bordereaux-cabinet'],
 ['comite1','/inscription/comite-orientation','preinscriptions-comite'],
 ['esa-compta','/inscription/finance/bordereaux','bordereaux-esa'],
 ['pers-admin1','/scolarite/secretariat/encaissement','encaissement-persadmin'],
];
(async()=>{
 const c=await mysql.createConnection({host:'127.0.0.1',port:3307,user:'root',password:'',database:'easyecole'});
 const tokens={};
 for(const [ident] of tests){if(tokens[ident])continue;const [rows]=await c.execute('SELECT id,identifiant,email,role,tokenVersion FROM aut_utilisateurs WHERE identifiant=?',[ident]);if(!rows.length)throw new Error('compte absent '+ident);const u=rows[0];tokens[ident]=jwt.sign({exp:Math.floor(Date.now()/1000)+3600,id:u.id,email:u.email,identifiant:u.identifiant,role:u.role,tokenVersion:u.tokenVersion,etablissementId:null},SECRET);}
 await c.end();
 const fs=require('fs');fs.mkdirSync(OUT,{recursive:true});
 const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox','--disable-setuid-sandbox','--window-size=1600,900']});
 const page=await browser.newPage();await page.setViewport({width:1600,height:900});
 for(const [ident,route,name] of tests){
  try{
   await page.goto(FRONT+'/auth/connexion',{waitUntil:'networkidle2',timeout:45000});
   await page.evaluate(tok=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('_token',tok);},tokens[ident]);
   await page.goto(FRONT+route,{waitUntil:'networkidle2',timeout:90000});
   await new Promise(r=>setTimeout(r,4000));
   const body=await page.evaluate(()=>document.body.innerText);
   const bad=['Serveur injoignable','Erreur 0','Erreur lors du chargement','Impossible de charger','Accès refusé','Non autorisé','403 Forbidden','404','Une erreur est survenue'].filter(x=>body.includes(x));
   const redirect=page.url().includes('/auth/connexion');
   console.log((bad.length||redirect?'ECHEC':'OK   '),ident,route,'url='+page.url(),bad.length?('| '+bad.join(', ')):'');
   await page.screenshot({path:path.join(OUT,name+'.png')});
  }catch(e){console.log('ECHEC',ident,route,e.message.split('\n')[0]);}
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
