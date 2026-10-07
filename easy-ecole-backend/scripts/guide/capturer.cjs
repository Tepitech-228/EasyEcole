/**
 * Capture automatisée des pages du guide (puppeteer).
 * Usage: node scripts/guide/capturer.cjs
 * Prérequis: front http://localhost:4200 + API http://localhost:3000 + MySQL 3307.
 * Sortie: scripts/guide/captures/*.png + rezultat.json
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const puppeteer = require('puppeteer');
const { PAGES } = require('./manifest.cjs');

const FRONT = 'http://localhost:4200';
const DIR = path.join(__dirname, 'captures');

function coderNom(titre, i) {
  const base = String(i + 1).padStart(2, '0') + '-' + titre.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  return base + '.png';
}

(async () => {
  fs.mkdirSync(DIR, { recursive: true });
  const conn = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'easyecole' });
  const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_easyecole_2024_change_in_production';

  // Tokens par compte du manifest
  const identifiants = [...new Set(PAGES.map(p => p.compte).filter(Boolean))];
  const tokens = {};
  for (const ident of identifiants) {
    const [rows] = await conn.execute(
      'SELECT id, identifiant, email, role, tokenVersion FROM aut_utilisateurs WHERE identifiant=?', [ident]);
    if (!rows.length) { console.log('COMPTE INTROUVABLE:', ident); continue; }
    const u = rows[0];
    tokens[ident] = jwt.sign(
      { id: u.id, identifiant: u.identifiant, email: u.email, role: u.role, tokenVersion: u.tokenVersion },
      JWT_SECRET);
  }
  await conn.end();

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const resultats = [];

  for (let i = 0; i < PAGES.length; i++) {
    const p = PAGES[i];
    const fichier = coderNom(p.titre, i);
    try {
      await page.goto(FRONT + '/auth/connexion', { waitUntil: 'networkidle2', timeout: 30000 });
      await page.evaluate((tok) => {
        localStorage.clear();
        sessionStorage.clear();
        if (tok) localStorage.setItem('_token', tok);
      }, p.compte ? tokens[p.compte] : null);
      await page.goto(FRONT + p.route, { waitUntil: 'networkidle2', timeout: 45000 });
      await new Promise(r => setTimeout(r, 3000));
      await page.screenshot({ path: path.join(DIR, fichier) });
      console.log('OK', p.route, '->', fichier);
      resultats.push({ ...p, fichier, ok: true });
    } catch (e) {
      console.log('ECHEC', p.route, '-', e.message.split('\n')[0]);
      resultats.push({ ...p, fichier: null, ok: false, erreur: e.message.split('\n')[0] });
    }
  }
  fs.writeFileSync(path.join(DIR, 'resultat.json'), JSON.stringify(resultats, null, 2));
  await browser.close();
  const ok = resultats.filter(r => r.ok).length;
  console.log(`CAPTURES: ${ok}/${resultats.length}`);
})();
