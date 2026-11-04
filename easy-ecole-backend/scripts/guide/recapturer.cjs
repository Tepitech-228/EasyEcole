/**
 * Recapture écran par écran du guide EasyEcole.
 *
 * Source : scripts/guide/plan-captures.json (mapping des 614 images existantes
 * vers une route du front, produit par le rapprochement slug <-> menu).
 * Sortie : docs/guide/images-nouveau/<dossier>/<fichier>.png
 *          + scripts/guide/recapture-report.json
 *
 * Aucune image de docs/guide/images/ n'est modifiée ni supprimée.
 *
 * Prérequis : front http://localhost:4200, API http://localhost:3000,
 * MySQL 3307, compte root sans mot de passe, base easyecole.
 *
 * Options :
 *   --dossier=admin      ne traiter qu'un dossier
 *   --limit=5            ne traiter que les N premières entrées
 *   --resume             sauter les fichiers déjà présents (> 5 Ko)
 *   --force              recapturer même si le fichier existe
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const puppeteer = require('puppeteer');

const FRONT = process.env.GUIDE_FRONT_URL || 'http://localhost:4200';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_easyecole_2024_change_in_production';
const PLAN_PATH = path.join(__dirname, 'plan-captures.json');
const OUT_DIR = path.resolve(__dirname, '..', '..', '..', 'docs', 'guide', 'images-nouveau');
const REPORT_PATH = path.join(__dirname, 'recapture-report.json');

/**
 * Compte utilisé pour chaque dossier, et site actif à placer dans le JWT.
 * - site: 1 pour les comptes réellement affectés au site 1, et pour l'admin
 *   (l'admin est dispensé du contrôle d'affectation dans Authenticate).
 * - site: null pour les comptes non affectés : les pages de leur périmètre
 *   fonctionnent sans site actif (vérifié par le smoke test).
 * - ressources-humaines : aucun compte dédié en base, on utilise l'admin.
 * - commun : page publique, aucun token.
 */
const COMPTES = {
  admin: { identifiant: 'tepitechbuild', site: 1 },
  institution: { identifiant: 'direction', site: null },
  secretaire: { identifiant: 'secretaire1', site: null },
  // pers-admin1 n'est pas affecté en base, mais ses écrans finance exigent un
  // site actif : on force le site 1 dans le JWT de capture.
  'personnel-administratif': { identifiant: 'pers-admin1', site: 1 },
  apprenant: { identifiant: 'etudiant-demo', site: null },
  enseignant: { identifiant: 'prof-maths', site: null },
  parent: { identifiant: 'parent1', site: null },
  surveillant: { identifiant: 'surveillant1', site: null },
  'caissier-banque': { identifiant: 'caissier1', site: null },
  'cabinet-comptable': { identifiant: 'tepitechcorp', site: 1 },
  'comite-orientation': { identifiant: 'comite1', site: 1 },
  'esa-compta': { identifiant: 'kakashitogo', site: 1 },
  'superviseur-general': { identifiant: 'superviseur.general', site: null },
  'ressources-humaines': { identifiant: 'tepitechbuild', site: 1 },
  commun: { identifiant: null, site: null },
};

/** Textes qui signalent une capture inutilisable pour le guide. */
const BAD_TEXTS = [
  'Serveur injoignable',
  'Erreur 0',
  'Erreur lors du chargement',
  'Impossible de charger',
  'Accès refusé',
  'Non autorisé',
  '403 Forbidden',
  'Page introuvable',
  'not-found-page works',
  'Une erreur est survenue',
  'Aucun site actif sélectionné',
  "Vous n'êtes pas affecté",
];

const args = process.argv.slice(2);
function option(name, fallback = null) {
  const prefix = `--${name}=`;
  const found = args.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}
const LIMIT = Math.max(0, parseInt(option('limit', '0'), 10) || 0);
const DOSSIER = option('dossier', '');
const RESUME = args.includes('--resume');
const FORCE = args.includes('--force');
const RETRY_FAILED = args.includes('--retry-failed');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function chargerPlan() {
  let plan = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf8'));
  if (RETRY_FAILED && fs.existsSync(REPORT_PATH)) {
    plan = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8')).entries
      .filter((entry) => !entry.ok)
      .map(({ ok, skipped, copied, warnings, url, file, error, taille, ms, ...entry }) => entry);
  }
  if (DOSSIER) plan = plan.filter((e) => e.dossier === DOSSIER);
  if (LIMIT) plan = plan.slice(0, LIMIT);
  return plan;
}

async function construireTokens(plan, connexion) {
  const cache = new Map();
  const tokens = {};
  for (const dossier of [...new Set(plan.map((e) => e.dossier))]) {
    const cfg = COMPTES[dossier];
    if (!cfg) throw new Error(`Dossier sans compte configuré : ${dossier}`);
    if (!cfg.identifiant) {
      tokens[dossier] = null;
      continue;
    }
    let utilisateur = cache.get(cfg.identifiant);
    if (!utilisateur) {
      const [rows] = await connexion.execute(
        'SELECT id, identifiant, email, role, tokenVersion FROM aut_utilisateurs WHERE identifiant = ? AND deletedAt IS NULL LIMIT 1',
        [cfg.identifiant]
      );
      if (!rows.length) throw new Error(`Compte introuvable en base : ${cfg.identifiant}`);
      utilisateur = rows[0];
      cache.set(cfg.identifiant, utilisateur);
    }
    tokens[dossier] = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 12 * 3600,
        id: utilisateur.id,
        email: utilisateur.email,
        identifiant: utilisateur.identifiant,
        role: utilisateur.role,
        tokenVersion: utilisateur.tokenVersion,
        etablissementId: cfg.site ?? null,
      },
      JWT_SECRET
    );
  }
  return tokens;
}

async function main() {
  const plan = chargerPlan();
  const rapportPrecedent = RETRY_FAILED && fs.existsSync(REPORT_PATH)
    ? JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'))
    : null;
  if (!plan.length) {
    console.log('Aucune entrée à capturer (vérifier --dossier / --limit).');
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const connexion = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'easyecole',
  });

  let tokens;
  try {
    tokens = await construireTokens(plan, connexion);
  } finally {
    await connexion.end();
  }

  console.log(`Recapture : ${plan.length} écran(s) vers ${OUT_DIR}`);
  console.log(`Comptes    : ${[...new Set(plan.map((e) => e.dossier + ' -> ' + COMPTES[e.dossier].identifiant))].join(', ')}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1582,848'],
    defaultViewport: { width: 1582, height: 848 },
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1582, height: 848 });
  page.setDefaultNavigationTimeout(90000);
  page.setDefaultTimeout(30000);

  const resultats = [];
  let dossierCourant = null;
  // Plusieurs entrées du plan pointent vers la même route : on capture une
  // seule fois puis on copie le PNG pour les doublons du même dossier.
  let cacheRoute = new Map();

  async function setSession(token) {
    await page
      .goto(FRONT + '/auth/connexion', { waitUntil: 'domcontentloaded', timeout: 60000 })
      .catch(() => {});
    await page.evaluate(
      (tok) => {
        localStorage.clear();
        sessionStorage.clear();
        if (tok) localStorage.setItem('_token', tok);
      },
      token
    );
    await sleep(800);
  }

  async function allerRoute(route) {
    const url = FRONT + route;
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
    } catch {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await sleep(6000);
    }
    await page.evaluate(() => (document.fonts ? document.fonts.ready.then(() => true) : true)).catch(() => {});
    await sleep(2000);
    try {
      // Ne pas attendre « Chargement des données... » : ce texte est un
      // placeholder statique sur plusieurs écrans et ne disparaît jamais.
      await page.waitForFunction(
        () => !/Chargement en cours|Veuillez patienter/.test(document.body.innerText),
        { timeout: 2000 }
      );
    } catch {
      /* certains écrans gardent un indicateur de fond : on capture quand même */
    }
    await sleep(500);
  }

  function sauvegarderRapport() {
    const entreesParCle = new Map(
      (rapportPrecedent?.entries || []).map((entry) => [`${entry.dossier}/${entry.fichier}`, entry])
    );
    resultats.forEach((entry) => entreesParCle.set(`${entry.dossier}/${entry.fichier}`, entry));
    const entreesRapport = [...entreesParCle.values()];
    const ok = entreesRapport.filter((r) => r.ok && !r.skipped && !r.copied).length;
    const skipped = entreesRapport.filter((r) => r.skipped).length;
    const copied = entreesRapport.filter((r) => r.copied).length;
    const failed = entreesRapport.filter((r) => !r.ok).length;
    const warnings = entreesRapport.filter((r) => r.ok && r.warnings && r.warnings.length).length;
    const parDossier = {};
    for (const r of entreesRapport) {
      const d = (parDossier[r.dossier] ||= { ok: 0, warn: 0, fail: 0, skip: 0 });
      if (r.skipped) d.skip += 1;
      else if (!r.ok) d.fail += 1;
      else if (r.warnings && r.warnings.length) d.warn += 1;
      else d.ok += 1;
    }
    fs.writeFileSync(
      REPORT_PATH,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          front: FRONT,
          outDir: OUT_DIR,
          total: rapportPrecedent?.total || plan.length,
          summary: { ok, copied, skipped, failed, warnings, parDossier },
          entries: entreesRapport,
        },
        null,
        2
      )
    );
  }

  for (let index = 0; index < plan.length; index++) {
    const entry = plan[index];
    const outFile = path.join(OUT_DIR, entry.dossier, entry.fichier);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });

    if (dossierCourant !== entry.dossier) {
      await setSession(tokens[entry.dossier]);
      dossierCourant = entry.dossier;
      cacheRoute = new Map();
    }

    if (RESUME && !FORCE && fs.existsSync(outFile) && fs.statSync(outFile).size > 5000) {
      const resultat = { ...entry, ok: true, skipped: true, file: outFile };
      resultats.push(resultat);
      console.log(`[${String(index + 1).padStart(3, ' ')}/${plan.length}] SKIP ${entry.dossier}/${entry.fichier}`);
      continue;
    }

    const routeEnCache = cacheRoute.get(entry.route);
    if (routeEnCache && fs.existsSync(routeEnCache.file) && fs.statSync(routeEnCache.file).size > 5000) {
      fs.copyFileSync(routeEnCache.file, outFile);
      resultats.push({ ...entry, ok: true, copied: true, url: routeEnCache.url, file: outFile });
      console.log(`[${String(index + 1).padStart(3, ' ')}/${plan.length}] COPIE ${entry.dossier}/${entry.fichier} ${entry.route}`);
      continue;
    }

    const debut = Date.now();
    let url = '';
    let warnings = [];
    try {
      await allerRoute(entry.route);
      url = page.url();
      if (url.includes('/auth/connexion')) {
        await setSession(tokens[entry.dossier]);
        await allerRoute(entry.route);
        url = page.url();
      }
      if (url.includes('/auth/connexion')) warnings.push('redirection vers la connexion');
      const body = await page.evaluate(() => document.body.innerText || '');
      warnings = warnings.concat(BAD_TEXTS.filter((texte) => body.includes(texte)));
      await page.screenshot({ path: outFile });
      const taille = fs.statSync(outFile).size;
      const ok = taille > 5000 && warnings.length === 0;
      if (ok) cacheRoute.set(entry.route, { file: outFile, url });
      const resultat = {
        ...entry,
        ok,
        warnings,
        url,
        file: outFile,
        taille,
        ms: Date.now() - debut,
      };
      resultats.push(resultat);
      const tag = ok ? 'OK  ' : 'WARN';
      console.log(
        `[${String(index + 1).padStart(3, ' ')}/${plan.length}] ${tag} ${entry.dossier}/${entry.fichier} ${entry.route}` +
          (warnings.length ? ` | ${warnings.join(', ')}` : '')
      );
    } catch (e) {
      const resultat = {
        ...entry,
        ok: false,
        warnings,
        url,
        file: outFile,
        error: e.message.split('\n')[0],
        ms: Date.now() - debut,
      };
      resultats.push(resultat);
      console.log(
        `[${String(index + 1).padStart(3, ' ')}/${plan.length}] FAIL ${entry.dossier}/${entry.fichier} ${entry.route} | ${resultat.error}`
      );
    }

    if ((index + 1) % 5 === 0) sauvegarderRapport();
  }

  sauvegarderRapport();
  await browser.close();

  const ok = resultats.filter((r) => r.ok && !r.skipped).length;
  const skipped = resultats.filter((r) => r.skipped).length;
  const failed = resultats.filter((r) => !r.ok).length;
  const warnings = resultats.filter((r) => r.ok && r.warnings && r.warnings.length).length;
  console.log(`\nTERMINÉ : ${resultats.length}/${plan.length} traités — ${ok} OK, ${warnings} avec avertissement, ${failed} échec(s), ${skipped} ignoré(s).`);
  console.log(`Rapport : ${REPORT_PATH}`);
  if (failed || warnings) {
    console.log('Relire recapture-report.json puis corriger les routes concernées avant de remplacer images/.');
  }
}

main().catch((e) => {
  console.error('ERREUR FATALE :', e);
  process.exit(1);
});
