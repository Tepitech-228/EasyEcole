/**
 * Capture les écrans du wizard étudiant avec des réponses de démonstration.
 *
 * Les lectures ordinaires du front sont conservées. Les deux demandes de
 * démonstration sont servies en mémoire et toute écriture réseau est bloquée :
 * aucun brouillon, mail, paiement ou enrôlement n'est créé.
 *
 * Usage : node scripts/guide/capturer-wizard-etudiant.cjs
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const puppeteer = require('puppeteer');

const FRONT = process.env.GUIDE_FRONT_URL || 'http://localhost:4200';
const API_ORIGIN = new URL(process.env.API_URL || 'http://localhost:3000').origin;
const OUT_DIR = path.resolve(__dirname, '..', '..', '..', 'docs', 'guide', 'images-nouveau', 'apprenant');
const DEMO_BANNER = 'CAPTURE DE DÉMONSTRATION — AUCUNE DEMANDE TRANSMISE';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function lireUtilisateurDemo() {
  const connexion = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'easyecole',
  });
  try {
    const [rows] = await connexion.execute(
      'SELECT id, identifiant, email, role, tokenVersion FROM aut_utilisateurs WHERE identifiant = ? AND deletedAt IS NULL LIMIT 1',
      ['etudiant-demo'],
    );
    if (!rows.length || rows[0].role !== 'apprenant') {
      throw new Error('Le compte local etudiant-demo doit exister avec le rôle apprenant.');
    }
    return rows[0];
  } finally {
    await connexion.end();
  }
}

function creerBanniere() {
  const banniere = document.createElement('div');
  banniere.id = 'capture-demo-banner';
  banniere.textContent = 'CAPTURE DE DÉMONSTRATION — AUCUNE DEMANDE TRANSMISE';
  Object.assign(banniere.style, {
    position: 'fixed',
    zIndex: '2147483647',
    top: '8px',
    right: '8px',
    padding: '7px 10px',
    border: '1px solid #d97706',
    borderRadius: '6px',
    background: '#fffbeb',
    color: '#92400e',
    font: '600 11px/1.2 Arial, sans-serif',
    boxShadow: '0 1px 5px rgba(0,0,0,.15)',
  });
  document.body.appendChild(banniere);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const utilisateur = await lireUtilisateurDemo();
  const token = jwt.sign({
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
    id: utilisateur.id,
    email: utilisateur.email,
    identifiant: utilisateur.identifiant,
    role: utilisateur.role,
    tokenVersion: utilisateur.tokenVersion,
    etablissementId: 1,
  }, process.env.JWT_SECRET || 'dev_secret_easyecole_2024_change_in_production');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1582,1000'],
    defaultViewport: { width: 1582, height: 1000 },
  });
  let blockedWrites = 0;

  try {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', async request => {
      const url = new URL(request.url());
      if (url.origin !== new URL(FRONT).origin && url.origin !== API_ORIGIN) {
        await request.abort('blockedbyclient');
        return;
      }

      if (request.method() === 'GET' && url.pathname.endsWith('/demandesInscription/0')) {
        await request.respond({
          status: 200,
          headers: {
            'access-control-allow-origin': new URL(FRONT).origin,
            'access-control-allow-credentials': 'true',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            id: 0,
            utilisateurId: utilisateur.id,
            modeFormation: 'presentiel',
            statutPipeline: null,
            sessionId: null,
            parcoursChoisis: [],
            dossiersDemande: [],
            session: { dossiersInscription: [] },
          }),
        });
        return;
      }

      if (request.method() === 'GET' && url.pathname.endsWith('/demandesDocument/0')) {
        await request.respond({
          status: 200,
          headers: {
            'access-control-allow-origin': new URL(FRONT).origin,
            'access-control-allow-credentials': 'true',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            id: '0',
            numeroDemande: 'DEMO-DOC',
            date: '2026-11-08T12:00:00.000Z',
            statut: 'brouillon',
            etapeWizard: 1,
            montant: 0,
            typeDocument: {
              libelle: 'Attestation de scolarité',
              piecesRequises: [{
                cle: 'piece-identite',
                libelle: 'Copie de la pièce d’identité',
                obligatoire: true,
              }],
            },
            pieces: [],
          }),
        });
        return;
      }

      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        blockedWrites += 1;
        await request.abort('blockedbyclient');
        return;
      }
      await request.continue();
    });

    await page.goto(`${FRONT}/auth/connexion`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(tok => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('_token', tok);
    }, token);

    async function marquerDemo() {
      await page.evaluate(creerBanniere);
    }

    async function capturer(fichier, selector, textAttendu) {
      await page.waitForSelector(selector, { timeout: 30000 });
      await page.waitForFunction(
        texte => document.body.innerText.includes(texte),
        { timeout: 30000 },
        textAttendu,
      );
      await page.evaluate(() => document.fonts?.ready);
      await marquerDemo();
      await page.screenshot({
        path: path.join(OUT_DIR, fichier),
        fullPage: true,
      });
      console.log(`Capture : ${fichier}`);
    }

    await page.goto(`${FRONT}/inscription/demandes/0`, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForFunction(
      () => typeof ng !== 'undefined'
        && document.querySelectorAll('#filiereSelect option').length > 1,
      { timeout: 60000 },
    );
    const filiereId = await page.$eval('#filiereSelect', select =>
      Array.from(select.options).find(option => option.value)?.value,
    );
    if (!filiereId) throw new Error('Aucune filière publiée n’est disponible pour la capture.');
    await page.select('#filiereSelect', filiereId);
    await capturer(
      '40_inscription-wizard-filiere.png',
      'app-inscription-wizard-page .wizard-step',
      'Mode de formation',
    );

    await page.click('app-inscription-wizard-page .wizard-step button.btn-primary');
    await page.waitForFunction(
      () => document.querySelector('app-inscription-wizard-page .wizard-step h2')?.textContent?.includes('provisoire'),
      { timeout: 30000 },
    );

    const sessionId = await page.evaluate(() => {
      const component = ng.getComponent(document.querySelector('app-inscription-wizard-page'));
      component.infos.etablissementId = '1';
      ng.applyChanges(component);
      const session = component.sessions.find(item => Number(item.etablissementId) === 1);
      return session?.id || component.sessions[0]?.id;
    });
    if (!sessionId) throw new Error('Aucune session disponible pour la capture.');
    await page.select('app-inscription-wizard-page .wizard-step select.form-control.native-select', String(sessionId));
    await page.waitForFunction(() => {
      const component = ng.getComponent(document.querySelector('app-inscription-wizard-page'));
      return component.documentsRequis?.length > 0;
    }, { timeout: 30000 });
    await page.evaluate(() => {
      const component = ng.getComponent(document.querySelector('app-inscription-wizard-page'));
      component.documentsRequis = [
        { id: 'demo-identite', titre: 'Pièce d’identité (exemple)', obligatoire: true },
        { id: 'demo-diplome', titre: 'Diplôme antérieur (exemple)', obligatoire: true },
        { id: 'demo-bordereau', titre: 'Bordereau de paiement (exemple)', obligatoire: true },
      ];
      component.documents = {};
      component.bordereau = null;
      component.documentsAReposer = {};
      component.bordereauAReposer = null;
      component.piecesServeur = new Map();
      ng.applyChanges(component);
    });
    await capturer(
      '41_inscription-wizard-documents.png',
      'app-inscription-wizard-page .wizard-step',
      'documents liés au parcours',
    ).catch(async () => {
      await capturer(
        '41_inscription-wizard-documents.png',
        'app-inscription-wizard-page .wizard-step',
        "Session d'inscription",
      );
    });

    await page.evaluate(() => {
      const component = ng.getComponent(document.querySelector('app-inscription-wizard-page'));
      component.documents = {
        'demo-identite': new File([''], 'piece-identite-demo.pdf', { type: 'application/pdf' }),
        'demo-diplome': new File([''], 'diplome-demo.pdf', { type: 'application/pdf' }),
        'demo-bordereau': new File([''], 'bordereau-demo.pdf', { type: 'application/pdf' }),
      };
      component.bordereau = component.documents['demo-bordereau'];
      ng.applyChanges(component);
    });

    await page.evaluate(() => {
      const component = ng.getComponent(document.querySelector('app-inscription-wizard-page'));
      component.infos = {
        nom: 'Démo',
        prenoms: 'Guide étudiant',
        dateNaissance: '2000-01-01',
        lieuNaissance: 'Lomé',
        nationalite: 'Togolaise',
        contact: '+228 90 00 00 00',
        email: 'capture@example.test',
        adresse: 'Adresse de démonstration',
        numeroPiece: 'DEMO-0001',
        sexe: 'M',
        typePieceIdentite: 'CNI',
        matriculeEtudiant: 'DEMO-INSCRIPTION',
        etablissementId: '1',
      };
      component.sessionSelectionneeId = Number(component.sessionSelectionneeId);
      component.photoEnregistree = false;
      component.photoSelectionnee = null;
      component.photoApercu = '';
      component.photoFichier = '';
      component.errorMessage = '';
      component.successMessage = '';
      component.etape = 3;
      ng.applyChanges(component);
    });
    await capturer(
      '42_inscription-wizard-informations.png',
      'app-inscription-wizard-page .wizard-step',
      'Informations personnelles',
    );

    await page.evaluate(() => {
      const component = ng.getComponent(document.querySelector('app-inscription-wizard-page'));
      component.photoEnregistree = true;
      component.photoFichier = 'photo-demonstration.jpg';
      component.etape = 4;
      ng.applyChanges(component);
    });
    await capturer(
      '43_inscription-wizard-recapitulatif.png',
      'app-inscription-wizard-page .wizard-step',
      'Récapitulatif',
    );

    await page.evaluate(() => {
      const component = ng.getComponent(document.querySelector('app-inscription-wizard-page'));
      component.resultat = { statutPipeline: 'soumis' };
      component.successMessage = 'Aperçu de démonstration : aucune demande n’a été soumise.';
      component.etape = 5;
      ng.applyChanges(component);
    });
    await capturer(
      '44_inscription-wizard-statut.png',
      'app-inscription-wizard-page .wizard-step',
      'Statut de votre inscription',
    );

    await page.goto(`${FRONT}/scolarite/demandes-documents/0`, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForFunction(
      () => typeof ng !== 'undefined'
        && !!ng.getComponent(document.querySelector('app-demande-document-wizard-page'))?.demande,
      { timeout: 30000 },
    );
    await capturer(
      '45_demande-document-wizard-pieces.png',
      'app-demande-document-wizard-page nav[aria-label="Étapes de la demande"]',
      'Pièces justificatives',
    );

    await page.evaluate(() => {
      const component = ng.getComponent(document.querySelector('app-demande-document-wizard-page'));
      component.demande = {
        ...component.demande,
        pieces: [{
          id: 1,
          cle: 'piece-identite',
          libelle: 'Copie de la pièce d’identité',
          nomOriginal: 'piece-identite-demo.pdf',
          version: 1,
          statutAudit: 'en_attente',
        }],
      };
      component.etape = 2;
      ng.applyChanges(component);
    });
    await capturer(
      '46_demande-document-wizard-verification.png',
      'app-demande-document-wizard-page nav[aria-label="Étapes de la demande"]',
      'Vérification des pièces',
    );

    await page.evaluate(() => {
      const component = ng.getComponent(document.querySelector('app-demande-document-wizard-page'));
      component.etape = 3;
      ng.applyChanges(component);
    });
    await capturer(
      '47_demande-document-wizard-soumission.png',
      'app-demande-document-wizard-page nav[aria-label="Étapes de la demande"]',
      'Soumettre la demande',
    );

    if (blockedWrites !== 0) {
      throw new Error(`${blockedWrites} tentative(s) d’écriture réseau bloquée(s) pendant la capture.`);
    }
    console.log('Terminé : 8 captures illustratives créées, aucune demande réelle transmise.');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
