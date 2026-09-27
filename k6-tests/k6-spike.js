// =============================================================================
// k6-spike.js — Spike Test (10→200 VUs en 10s, puis redescend)
// Objectif : simuler un pic de trafic soudain (ex: launch d'une campagne,
//            ouverture des inscriptions) pour vérifier la résilience du système.
//
// Execution : k6 run k6-spike.js
// =============================================================================

import { check, sleep, group } from 'k6';
import http from 'k6/http';

// --- Configuration des options ---
// Le spike test utilise des "scenarios" pour un contrôle précis du trafic
export let options = {
  // Scenario 1: Spike montant
  scenarios: {
    spike_up: {
      executor: 'ramping-vus',
      startVUs: 10,         // Départ à 10 VUs
      stages: [
        { duration: '10s', target: 200 }, // Montée à 200 VUs en 10s (pic)
      ],
      tags: { scenario: 'spike_up' },
    },
    // Scenario 2: Spike descendant (retour à la normale)
    spike_down: {
      executor: 'ramping-vus',
      startVUs: 200,        // Départ à 200 VUs (hérité du pic)
      stages: [
        { duration: '10s', target: 10 },   // Redescente à 10 VUs en 10s
        { duration: '10s', target: 0 },    // Puis retour à 0
      ],
      tags: { scenario: 'spike_down' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'], // En spike, on tolère plus de latence
    http_req_failed: ['rate<0.10'],    // Jusqu'à 10% d'erreurs tolérés pendant le pic
    // BUT: observer combien de requêtes échouent pendant le pic
  },
};

// --- Constantes ---
const BASE_EASYECOLE = 'http://localhost:3000/api/v1';
const BASE_CATALOGUE = 'http://localhost:8081';

// --- Helper ---
function generateId() {
  return `spike_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
  // PHASE 1: PICS SUR LE CATALOGUE
  // ================================================================

  // --- GET /api/catalogue pendant le spike montant ---
  group('Spike - Catalogue GET /api/catalogue', function () {
    const res = http.get(`${BASE_CATALOGUE}/api/catalogue`);
    check(res, {
      'catalogue list responds': (r) => [200, 503].includes(r.status),
      'catalogue list not 404': (r) => r.status !== 404,
    });
  });

  // --- GET /api/catalogue/1 pendant le spike ---
  group('Spike - Catalogue GET /api/catalogue/1', function () {
    const res = http.get(`${BASE_CATALOGUE}/api/catalogue/1`);
    check(res, {
      'catalogue detail responds': (r) => [200, 503].includes(r.status),
    });
  });

  // --- POST /api/catalogue pendant le spike ---
  group('Spike - Catalogue POST /api/catalogue', function () {
    const categories = ['electronique', 'mobilier', 'fournitures', 'informatique'];
    const articleData = {
      nom: `Spike Article ${generateId()}`,
      prix: parseFloat((Math.random() * 1000 + 5).toFixed(2)),
      stock: Math.floor(Math.random() * 500),
      categorie: categories[Math.floor(Math.random() * categories.length)],
    };

    const res = http.post(`${BASE_CATALOGUE}/api/catalogue`, JSON.stringify(articleData), {
      headers: { 'Content-Type': 'application/json' },
    });
    check(res, {
      'catalogue create responds': (r) => [201, 400, 429].includes(r.status),
      // 429 = trop de requêtes (rate limit)
    });
  });

  // ================================================================
  // PHASE 2: PICS SUR EASYECOLE
  // ================================================================

  // --- GET /health pendant le spike ---
  group('Spike - EasyEcole GET /health', function () {
    const res = http.get(`${BASE_EASYECOLE}/health`);
    check(res, {
      'easyecole health responds': (r) => [200, 503].includes(r.status),
    });
  });

  // --- GET /inscription/cursus-apprenants pendant le spike ---
  group('Spike - EasyEcole GET /inscription/cursus-apprenants', function () {
    if (token) {
      const res = http.get(`${BASE_EASYECOLE}/inscription/cursus-apprenants`, {
        headers: { ...authHeader, 'Content-Type': 'application/json' },
      });
      check(res, {
        'cursus responds 200 or 401 or 503': (r) => [200, 401, 503].includes(r.status),
      });
    } else {
      const res = http.get(`${BASE_EASYECOLE}/inscription/cursus-apprenants`);
      check(res, {
        'cursus 401 without token': (r) => r.status === 401,
      });
    }
  });

  // --- GET /auth/utilisateurs pendant le spike ---
  group('Spike - EasyEcole GET /auth/utilisateurs', function () {
    if (token) {
      const res = http.get(`${BASE_EASYECOLE}/auth/utilisateurs`, {
        headers: { ...authHeader, 'Content-Type': 'application/json' },
      });
      check(res, {
        'utilisateurs responds': (r) => [200, 401, 503].includes(r.status),
      });
    } else {
      const res = http.get(`${BASE_EASYECOLE}/auth/utilisateurs`);
      check(res, {
        'utilisateurs 401 without token': (r) => r.status === 401,
      });
    }
  });

  // --- POST /auth/login pendant le spike (teste le comportement sous charge extrême) ---
  group('Spike - EasyEcole POST /auth/login', function () {
    const loginPayload = JSON.stringify({
      email: `spike_${generateId()}@test.local`,
      motDePasse: 'test123',
    });
    const res = http.post(`${BASE_EASYECOLE}/auth/login`, loginPayload, {
      headers: { 'Content-Type': 'application/json' },
    });
    check(res, {
      'login responds 200 or 401 or 429': (r) => [200, 401, 429].includes(r.status),
      // 429 = rate limit atteint pendant le spike
    });
  });

  sleep(1);
}
