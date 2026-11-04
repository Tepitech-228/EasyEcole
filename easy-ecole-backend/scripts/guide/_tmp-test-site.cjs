const jwt=require('jsonwebtoken');
const mysql=require('mysql2/promise');
const puppeteer=require('puppeteer');
const path=require('path');
const SECRET=process.env.JWT_SECRET||'dev_secret_easyecole_2024_change_in_production';
const FRONT='http://localhost:4200';
const OUT='C:/Users/User/AppData/Local/Temp/opencode/tests-roles';
const tests=[
 ['kakashitogo','/inscription/finance/bordereaux','bordereaux-esa-site1',1],
 ['tepitechcorp','/inscription/validation-bordereaux','valid-bordereaux-cabinet-site1',1],
 ['comite1','/inscription/comite-orientation','preinscriptions-comite-site1',1],
 ['tepitechbuild','/administration/configuration','config-admin-site1',1],
 ['tepitechbuild','/rh/categories-professionnelles','rh-admin-site1',1],
 ['tepitechbuild','/inscription/finance/bordereaux','bordereaux-admin-site1',1],
];
(async()=>{
 const c=await mysql.createConnection({host:'127.0.0.1',port:3307,user:'root',password:'',database:'easyecole'});
 const tokens={};
 for(const [ident,,,site] of tests){const key=ident+'|'+site;if(tokens[key])continue;const [rows]=await c.execute('SELECT id,identifiant,email,role,tokenVersion FROM aut_utilisateurs WHERE identifiant=?',[ident]);if(!rows.length)throw new Error('compte absent '+ident);const u=rows[0];tokens[key]=jwt.sign({exp:Math.floor(Date.now()/1000)+3600,id:u.id,email:u.email,identifiant:u.identifiant,role:u.role,tokenVersion:u.tokenVersion,etablissementId:site},SECRET);}
 await c.end();
 const fs=require('fs');fs.mkdirSync(OUT,{recursive:true});
 const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox','--disable-setuid-sandbox','--window-size=1600,900']});
 const page=await browser.newPage();await page.setViewport({width:1600,height:900});
 for(const [ident,route,name,site] of tests){
  try{
   await page.goto(FRONT+'/auth/connexion',{waitUntil:'networkidle2',timeout:45000});
   await page.evaluate(tok=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('_token',tok);},tokens[ident+'|'+site]);
   await page.goto(FRONT+route,{waitUntil:'networkidle2',timeout:90000});
   await new Promise(r=>setTimeout(r,4000));
   const body=await page.evaluate(()=>document.body.innerText);
   const bad=['Serveur injoignable','Erreur 0','Erreur lors du chargement','Impossible de charger','Accès refusé','Non autorisé','403 Forbidden','404','Une erreur est survenue'].filter(x=>body.includes(x));
   const redirect=page.url().includes('/auth/connexion');
   console.log((bad.length||redirect?'ECHEC':'OK   '),ident,'site='+site,route,'url='+page.url(),bad.length?('| '+bad.join(', ')):'');
   await page.screenshot({path:path.join(OUT,name+'.png')});
  }catch(e){console.log('ECHEC',ident,route,e.message.split('\n')[0]);}
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
