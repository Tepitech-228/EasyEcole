// =============================================================================
// k6-stress.js — Stress Test (montée à 200 VUs pour trouver le point de rupture)
// Objectif : identifier à partir de combien d'utilisateurs simultanés le système
//            commence à dégrader ses performances ou à échouer.
//
// Seuils : p95<1000ms (plus large car on cherche le point de rupture),
//          http_req_failed < 5% (on tolère plus d'erreurs dans un stress test)
//
// Execution : k6 run k6-stress.js
// =============================================================================

import { check, sleep, group } from 'k6';
import http from 'k6/http';

// --- Configuration des options ---
// Ramp-up agressif vers 200 VUs pour trouver le point de rupture
export let options = {
  stages: [
    // Ramp-up rapide
    { duration: '30s', target: 50 },   // 50 VUs après 30s
    { duration: '30s', target: 100 },  // 100 VUs après 1 min
    { duration: '30s', target: 150 },  // 150 VUs après 1.5 min
    { duration: '30s', target: 200 },  // 200 VUs après 2 min (pic de charge)
    // Plateau à 200 VUs pour observer le comportement sous stress
    { duration: '2m',  target: 200 },  // maintien à 200 VUs pendant 2 min
    // Descente
    { duration: '1m',  target: 0 },    // retour à 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],     // 95% < 1s (seuil plus large)
    http_req_failed: ['rate<0.05'],        // taux d'erreur < 5%
    // Alerte si le taux d'erreur dépasse 5% → signe de surcharge
  },
};

// --- Constantes ---
const BASE_EASYECOLE = 'http://localhost:3000/api/v1';
const BASE_CATALOGUE = 'http://localhost:8081';

// --- Helper ---
function generateId() {
  return `stress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// --- Setup: Authentification ---
export function setup() {
  let token = null;

  const loginPayload = JSON.stringify({
    email: 'etudiant-demo@easyecole.local',
    motDePasse: 'demo123',
  });

  const loginRes = http.post(`${BASE_EASYECOLE}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status === 200) {
    try {
      const body = JSON.parse(loginRes.body);
      token = body.token || body.accessToken || body.data?.token || null;
    } catch (e) {
      console.log('Setup: Impossible de parser le token');
    }
  }

  return { token: token };
}

// --- Fonction principale ---
export default function (data) {
  const token = data && data.token ? data.token : null;
  const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

  // ================================================================
  // SCÉNARIO 1: Catalogue - GET /api/catalogue (charge maximale sur la liste)
  // ================================================================
  group('Stress - Catalogue GET /api/catalogue', function () {
    const res = http.get(`${BASE_CATALOGUE}/api/catalogue`);
    check(res, {
      'catalogue list status 200': (r) => r.status === 200,
      'catalogue list under stress': (r) => r.status === 200 || r.status === 503,
      // En stress test, on accepte 503 si le serveur est surchargé
      // Mais on compte le 503 comme échec dans les seuils
    });
  });

  // ================================================================
  // SCÉNARIO 2: Catalogue - GET /api/catalogue/1 (charge sur le détail)
  // ================================================================
  group('Stress - Catalogue GET /api/catalogue/1', function () {
    const res = http.get(`${BASE_CATALOGUE}/api/catalogue/1`);
    check(res, {
      'catalogue detail status 200 or 503': (r) => r.status === 200 || r.status === 503,
      'catalogue detail not 404': (r) => r.status !== 404,
    });
  });

  // ================================================================
  // SCÉNARIO 3: Catalogue - POST /api/catalogue (création sous stress)
  // ================================================================
  group('Stress - Catalogue POST /api/catalogue', function () {
    const categories = ['electronique', 'mobilier', 'fournitures'];
    const articleData = {
      nom: `Stress Article ${generateId()}`,
      prix: parseFloat((Math.random() * 500 + 10).toFixed(2)),
      stock: Math.floor(Math.random() * 100),
      categorie: categories[Math.floor(Math.random() * categories.length)],
    };

    const res = http.post(`${BASE_CATALOGUE}/api/catalogue`, JSON.stringify(articleData), {
      headers: { 'Content-Type': 'application/json' },
    });
    check(res, {
      'catalogue create 201 or 400': (r) => r.status === 201 || r.status === 400,
      // 400 = données invalides, 201 = succès
    });
  });

  // ================================================================
  // SCÉNARIO 4: EasyEcole - Health Check sous stress
  // ================================================================
  group('Stress - EasyEcole GET /health', function () {
    const res = http.get(`${BASE_EASYECOLE}/health`);
    check(res, {
      'easyecole health 200 or 503': (r) => r.status === 200 || r.status === 503,
      // 503 si la DB est surchargée (le health check vérifie la connexion DB)
    });
  });

  // ================================================================
  // SCÉNARIO 5: EasyEcole - Inscription cursus-apprenants sous stress
  // ================================================================
  group('Stress - EasyEcole GET /inscription/cursus-apprenants', function () {
    if (token) {
      const res = http.get(`${BASE_EASYECOLE}/inscription/cursus-apprenants`, {
        headers: { ...authHeader, 'Content-Type': 'application/json' },
      });
      check(res, {
        'cursus 200 or 401 or 503': (r) => [200, 401, 503].includes(r.status),
      });
    } else {
      const res = http.get(`${BASE_EASYECOLE}/inscription/cursus-apprenants`);
      check(res, {
        'cursus 401 without token': (r) => r.status === 401,
      });
    }
  });

  // ================================================================
  // SCÉNARIO 6: EasyEcole - Login sous stress (teste le rate limiter)
  // ================================================================
  group('Stress - EasyEcole POST /auth/login', function () {
    const loginPayload = JSON.stringify({
      email: `stress_${generateId()}@test.local`,
      motDePasse: 'wrongpassword', // Mot de passe faux → 401 attendu
    });
    const res = http.post(`${BASE_EASYECOLE}/auth/login`, loginPayload, {
      headers: { 'Content-Type': 'application/json' },
    });
    check(res, {
      'login responds 401 or 429': (r) => r.status === 401 || r.status === 429,
      // 429 = rate limité (le login a un rate limiter)
      'login not 500': (r) => r.status !== 500,
    });
  });

  sleep(1);
}
