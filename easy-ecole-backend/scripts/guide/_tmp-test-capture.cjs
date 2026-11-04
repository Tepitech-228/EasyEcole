const jwt = require('jsonwebtoken');
const puppeteer = require('puppeteer');

(async () => {
  const token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 3600,
      id: 1,
      email: 'tepitechbuild@gmail.com',
      identifiant: 'tepitechbuild',
      role: 'admin',
      tokenVersion: 66,
      etablissementId: null,
    },
    'dev_secret_easyecole_2024_change_in_production'
  );

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,900'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900 });
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('[console]', msg.text().slice(0, 300));
  });
  page.on('requestfailed', (req) => console.log('[failed]', req.method(), req.url(), req.failure()?.errorText));
  page.on('response', (res) => {
    if (res.status() >= 400) console.log('[http]', res.status(), res.url());
  });

  await page.goto('http://localhost:4200/auth/connexion', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate((tok) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('_token', tok);
  }, token);
  await page.goto('http://localhost:4200/inscription/sessions', { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 5000));
  const body = await page.evaluate(() => document.body.innerText);
  console.log('URL', page.url());
  console.log('Serveur injoignable:', body.includes('Serveur injoignable'));
  console.log('Erreur 0:', body.includes('Erreur 0'));
  console.log('Extrait:', body.slice(0, 500).replace(/\n+/g, ' | '));
  await page.screenshot({ path: 'C:/Users/User/AppData/Local/Temp/opencode/test-sessions.png' });
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
