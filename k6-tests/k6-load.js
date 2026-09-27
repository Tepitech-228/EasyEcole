// =============================================================================
// k6-load.js — Load Test réaliste (ramp-up 10→50→100 VUs sur 5 min)
// Seuils : p95<500ms, error rate <1%
//
// Scénarios :
//   - Catalogue : GET /api/catalogue, GET /api/catalogue/1, POST /api/catalogue
//   - EasyEcole  : setup() login → GET /inscription/cursus-apprenants, GET /health
//
// Execution : k6 run k6-load.js
// =============================================================================

import { check, sleep, group } from 'k6';
import http from 'k6/http';

// --- Configuration des options ---
export let options = {
  stages: [
    // Ramp-up progressif
    { duration: '1m',  target: 10 },  // 10 VUs après 1 min
    { duration: '2m',  target: 50 },  // 50 VUs après 3 min
    { duration: '2m',  target: 100 }, // 100 VUs après 5 min
    // Plateau
    { duration: '1m',  target: 100 }, // maintien à 100 VUs pendant 1 min
    // Ramp-down
    { duration: '1m',  target: 0 },   // descente à 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],     // 95% des requêtes < 500ms
    http_req_failed: ['rate<0.01'],       // taux d'erreur < 1%
  },
};

// --- Constantes ---
const BASE_EASYECOLE = 'http://localhost:3000/api/v1';
const BASE_CATALOGUE = 'http://localhost:8081';
const JWT_SECRET = 'dev_secret_easyecole_2024_change_in_production';

// --- Helper: Générer un identifiant unique ---
function generateId() {
  return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// --- Setup: Authentification et récupération du token ---
// Ce code s'exécute une seule fois par VU au début du test.
export function setup() {
  let token = null;
  let userId = null;

  // Tentative de login avec les identifiants de démo
  const loginPayload = JSON.stringify({
    email: 'etudiant-demo@easyecole.local',
    motDePasse: 'demo123',
  });

  const loginRes = http.post(`${BASE_EASYECOLE}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'setup_login' },
  });

  if (loginRes.status === 200) {
    try {
      const body = JSON.parse(loginRes.body);
      token = body.token || body.accessToken || body.data?.token || null;
      userId = body.data?.id || body.id || null;
    } catch (e) {
      console.log('Setup: Impossible de parser le token de login');
    }
  }

  // Si le login échoue, on enregistre quand même pour que le test continue
  // avec des requêtes non authentifiées (401 attendus).
  return { token: token, userId: userId };
}

// --- Fonction principale ---
export default function (data) {
  const token = data && data.token ? data.token : null;
  const userId = data && data.userId ? data.userId : null;
  const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

  // ================================================================
  // SCÉNARIO 1: Catalogue Service
  // ================================================================

  // --- Sous-scénario 1a: GET /api/catalogue (liste complète) ---
  group('Catalogue - GET /api/catalogue (liste)', function () {
    const params = { tags: { name: 'catalogue_list' } };
    const res = http.get(`${BASE_CATALOGUE}/api/catalogue`, params);
    check(res, {
      'catalogue list status 200': (r) => r.status === 200,
      'catalogue list has count': (r) => r.status === 200 && r.json().count !== undefined,
      'catalogue list has articles': (r) => r.status === 200 && Array.isArray(r.json().articles),
      'catalogue list p95 <500ms': (r) => r.timings.duration < 500,
    });
  });

  // --- Sous-scénario 1b: GET /api/catalogue/1 (détail) ---
  group('Catalogue - GET /api/catalogue/1', function () {
    const params = { tags: { name: 'catalogue_detail' } };
    const res = http.get(`${BASE_CATALOGUE}/api/catalogue/1`, params);
    check(res, {
      'catalogue detail status 200': (r) => r.status === 200,
      'catalogue detail id=1': (r) => r.status === 200 && r.json().id === 1,
      'catalogue detail has nom': (r) => r.status === 200 && r.json().nom !== undefined,
    });
  });

  // --- Sous-scénario 1c: POST /api/catalogue (création) ---
  // Données aléatoires pour chaque itération
  group('Catalogue - POST /api/catalogue (création)', function () {
    const categories = ['electronique', 'mobilier', 'fournitures', 'informatique', 'bureau'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const articleData = {
      nom: `Article Test ${generateId()}`,
      prix: parseFloat((Math.random() * 1000 + 1).toFixed(2)),
      stock: Math.floor(Math.random() * 200),
      categorie: randomCategory,
    };

    const params = {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'catalogue_create' },
    };
    const res = http.post(`${BASE_CATALOGUE}/api/catalogue`, JSON.stringify(articleData), params);
    check(res, {
      'catalogue create status 201': (r) => r.status === 201,
      'catalogue create has id': (r) => r.status === 201 && r.json().id !== undefined,
      'catalogue create has nom': (r) => r.status === 201 && r.json().nom === articleData.nom,
      'catalogue create p95 <500ms': (r) => r.timings.duration < 500,
    });
  });

  // ================================================================
  // SCÉNARIO 2: EasyEcole Backend (nécessite authentification)
  // ================================================================

  // --- Sous-scénario 2a: GET /health (pas d'auth requise) ---
  group('EasyEcole - GET /health', function () {
    const res = http.get(`${BASE_EASYECOLE}/health`);
    check(res, {
      'easyecole health 200': (r) => r.status === 200,
      'easyecole health api ok': (r) => r.status === 200 && r.json().success === true,
    });
  });

  // --- Sous-scénario 2b: GET /inscription/cursus-apprenants (avec token) ---
  group('EasyEcole - GET /inscription/cursus-apprenants', function () {
    if (token) {
      const res = http.get(`${BASE_EASYECOLE}/inscription/cursus-apprenants`, {
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        tags: { name: 'cursus_apprenants' },
      });
      check(res, {
        'cursus-apprenants 200': (r) => r.status === 200,
        'cursus-apprenants has data': (r) => r.status === 200 && r.body !== '',
      });
    } else {
      // Pas de token disponible: teste que 401 est retourné (comportement attendu)
      const res = http.get(`${BASE_EASYECOLE}/inscription/cursus-apprenants`);
      check(res, {
        'cursus-apprenants 401 without token': (r) => r.status === 401,
      });
    }
  });

  // --- Sous-scénario 2c: GET /auth/utilisateurs (avec token) ---
  group('EasyEcole - GET /auth/utilisateurs', function () {
    if (token) {
      const res = http.get(`${BASE_EASYECOLE}/auth/utilisateurs`, {
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        tags: { name: 'utilisateurs' },
      });
      check(res, {
        'utilisateurs 200': (r) => r.status === 200,
        'utilisateurs has data': (r) => r.status === 200 && r.body !== '',
      });
    } else {
      const res = http.get(`${BASE_EASYECOLE}/auth/utilisateurs`);
      check(res, {
        'utilisateurs 401 without token': (r) => r.status === 401,
      });
    }
  });

  sleep(1);
}
