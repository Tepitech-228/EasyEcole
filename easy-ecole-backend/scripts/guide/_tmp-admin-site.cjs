const jwt=require('jsonwebtoken');
const mysql=require('mysql2/promise');
const puppeteer=require('puppeteer');
const SECRET=process.env.JWT_SECRET||'dev_secret_easyecole_2024_change_in_production';
const FRONT='http://localhost:4200';
(async()=>{
 const c=await mysql.createConnection({host:'127.0.0.1',port:3307,user:'root',password:'',database:'easyecole'});
 const [rows]=await c.execute('SELECT id,identifiant,email,role,tokenVersion FROM aut_utilisateurs WHERE identifiant=?',['tepitechbuild']);
 const u=rows[0];await c.end();
 const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox','--disable-setuid-sandbox','--window-size=1582,848']});
 const page=await browser.newPage();await page.setViewport({width:1582,height:848});
 for(const site of [null,1]){
  const tok=jwt.sign({exp:Math.floor(Date.now()/1000)+3600,id:u.id,email:u.email,identifiant:u.identifiant,role:u.role,tokenVersion:u.tokenVersion,etablissementId:site},SECRET);
  for(const route of ['/inscription/sessions','/inscription/finance/bordereaux']){
   await page.goto(FRONT+'/auth/connexion',{waitUntil:'networkidle2',timeout:60000});
   await page.evaluate(t=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('_token',t)},tok);
   await page.goto(FRONT+route,{waitUntil:'networkidle2',timeout:90000});
   await new Promise(r=>setTimeout(r,3500));
   const info=await page.evaluate(()=>({url:location.href,body:document.body.innerText.slice(0,4000)}));
   const m=info.body.match(/RÉSULTATS\s*\n\s*(\d+)/);
   const bad=['Serveur injoignable','Erreur 0','Erreur lors du chargement','Impossible de charger','Accès refusé','Non autorisé','Aucun site actif','Page introuvable','not-found-page works'].filter(x=>info.body.includes(x));
   console.log('site='+site,route,'url='+info.url,'resultats='+(m?m[1]:'?'),'bad='+JSON.stringify(bad));
  }
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
