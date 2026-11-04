const jwt=require('jsonwebtoken');
const mysql=require('mysql2/promise');
const puppeteer=require('puppeteer');
const SECRET=process.env.JWT_SECRET||'dev_secret_easyecole_2024_change_in_production';
const FRONT='http://localhost:4200';
(async()=>{
 const c=await mysql.createConnection({host:'127.0.0.1',port:3307,user:'root',password:'',database:'easyecole'});
 const [rows]=await c.execute('SELECT id,identifiant,email,role,tokenVersion FROM aut_utilisateurs WHERE identifiant=?',['tepitechbuild']);
 const u=rows[0];await c.end();
 const tok=jwt.sign({exp:Math.floor(Date.now()/1000)+3600,id:u.id,email:u.email,identifiant:u.identifiant,role:u.role,tokenVersion:u.tokenVersion,etablissementId:1},SECRET);
 const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox','--disable-setuid-sandbox','--window-size=1582,848']});
 const page=await browser.newPage();await page.setViewport({width:1582,height:848});
 page.on('response',r=>{if(r.status()>=400)console.log('HTTP',r.status(),r.request().method(),r.url())});
 page.on('requestfailed',r=>console.log('FAILED',r.method(),r.url(),r.failure()?.errorText));
 await page.goto(FRONT+'/auth/connexion',{waitUntil:'networkidle2',timeout:60000});
 await page.evaluate(t=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('_token',t)},tok);
 await page.goto(FRONT+'/inscription/sessions',{waitUntil:'networkidle2',timeout:90000});
 for(const s of [3,10,20]){
  await new Promise(r=>setTimeout(r,s*1000));
  const info=await page.evaluate(()=>{
   const texts=[];
   const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
   while(walker.nextNode()){const n=walker.currentNode;if(n.textContent.includes('Chargement des données')){let el=n.parentElement;texts.push({text:n.textContent,html:el?.outerHTML?.slice(0,600),display:el?getComputedStyle(el).display:null});}}
   return {url:location.href,texts};
  });
  console.log('APRES '+s+'s',JSON.stringify(info,null,2));
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
