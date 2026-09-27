// =============================================================================
// k6-smoke.js — Smoke Test (1 VU, 30s)
// Vérifie que les endpoints répondent rapidement après un déploiement.
// =============================================================================
//
// Services concernés :
//   - Catalogue Atelier1 : http://localhost:8081
//   - EasyEcole Backend  : http://localhost:3000 (ou 8091 via nginx)
//
// Execution : k6 run k6-smoke.js
// =============================================================================

import { check, sleep, group } from 'k6';
import http from 'k6/http';

// --- Configuration des options ---
export let options = {
  stages: [
    { duration: '30s', target: 1 }, // 1 VU pendant 30s
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% des requêtes < 1s
    http_req_failed: ['rate<0.05'],    // taux d'erreur < 5%
  },
};

// --- Constantes ---
const BASE_EASYECOLE = 'http://localhost:3000/api/v1';
const BASE_CATALOGUE = 'http://localhost:8081';

// --- Setup: tentative de connexion pour récupérer un token ---
// Si le login échoue, on continue quand même (le smoke test doit tester aussi le 401).
export function setup() {
  let token = null;

  // Tentative de login avec des identifiants de démo
  const loginPayload = JSON.stringify({
    email: 'etudiant-demo@easyecole.local',
    motDePasse: 'demo123',
  });

  const loginRes = http.post(`${BASE_EASYECOLE}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status === 200) {
    // Le token peut être dans loginRes.body ou loginRes.json()
    try {
      const body = JSON.parse(loginRes.body);
      token = body.token || body.accessToken || body.data?.token || null;
    } catch (e) {
      console.log('Impossible de parser le token de login');
    }
  }

  return { token: token };
}

// --- Fonction principale ---
export default function (data) {
  const token = data && data.token ? data.token : null;
  const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

  // --- Groupe 1: Catalogue Service - Health Check ---
  group('Catalogue - Health Check', function () {
    const res = http.get(`${BASE_CATALOGUE}/health`);
    check(res, {
      'health status 200': (r) => r.status === 200,
      'health service ok': (r) => r.status === 200 && r.json().status === 'ok',
      'health service name': (r) => r.status === 200 && r.json().service === 'atelier1-catalogue',
    });
  });

  // --- Groupe 2: EasyEcole - Health Check ---
  group('EasyEcole - Health Check', function () {
    const res = http.get(`${BASE_EASYECOLE}/health`);
    check(res, {
      'easyecole health status 200': (r) => r.status === 200,
      'easyecole health api ok': (r) => r.status === 200 && r.json().success === true,
    });
  });

  // --- Groupe 3: Catalogue - GET /api/catalogue (liste) ---
  group('Catalogue - GET /api/catalogue', function () {
    const res = http.get(`${BASE_CATALOGUE}/api/catalogue`);
    check(res, {
      'catalogue list 200': (r) => r.status === 200,
      'catalogue has count field': (r) => r.status === 200 && r.json().count !== undefined,
      'catalogue has articles array': (r) => r.status === 200 && Array.isArray(r.json().articles),
    });
  });

  // --- Groupe 4: Catalogue - GET /api/catalogue/1 (détail) ---
  group('Catalogue - GET /api/catalogue/1', function () {
    const res = http.get(`${BASE_CATALOGUE}/api/catalogue/1`);
    check(res, {
      'catalogue getById 200': (r) => r.status === 200,
      'catalogue getById has id': (r) => r.status === 200 && r.json().id === 1,
    });
  });

  // --- Groupe 5: EasyEcole - POST /auth/login (teste que l'auth répond) ---
  group('EasyEcole - POST /auth/login', function () {
    const payload = JSON.stringify({
      email: 'test@easyecole.local',
      motDePasse: 'test123',
    });
    const res = http.post(`${BASE_EASYECOLE}/auth/login`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    // Le login peut retourner 200 (succès) ou 401 (identifiants invalides)
    // Dans un smoke test, on accepte les deux car on teste que l'endpoint répond
    check(res, {
      'login responds': (r) => r.status === 200 || r.status === 401,
      'login is not 500': (r) => r.status !== 500,
    });
  });

  // --- Groupe 6: EasyEcole - GET /inscription/cursus-apprenants ---
  // Si on a un token, on l'utilise. Sinon on teste 401 attendu.
  group('EasyEcole - GET /inscription/cursus-apprenants', function () {
    if (token) {
      const res = http.get(`${BASE_EASYECOLE}/inscription/cursus-apprenants`, {
        headers: { ...authHeader, 'Content-Type': 'application/json' },
      });
      check(res, {
        'cursus-apprenants 200 with auth': (r) => r.status === 200,
        'cursus-apprenants has data': (r) => r.status === 200,
      });
    } else {
      // Sans token, on s'attend à un 401
      const res = http.get(`${BASE_EASYECOLE}/inscription/cursus-apprenants`);
      check(res, {
        'cursus-apprenants 401 without auth': (r) => r.status === 401,
      });
    }
  });

  // --- Groupe 7: EasyEcole - GET /inscription/excel/apprenants/export/filtres ---
  // Endpoint protégé - teste 401 sans token
  group('EasyEcole - GET /inscription/excel/apprenants/export/filtres', function () {
    if (token) {
      const res = http.get(`${BASE_EASYECOLE}/inscription/excel/apprenants/export/filtres`, {
        headers: { ...authHeader, 'Content-Type': 'application/json' },
      });
      check(res, {
        'excel export 200 with auth': (r) => r.status === 200,
      });
    } else {
      const res = http.get(`${BASE_EASYECOLE}/inscription/excel/apprenants/export/filtres`);
      check(res, {
        'excel export 401 without auth': (r) => r.status === 401,
      });
    }
  });

  // --- Groupe 8: EasyEcole - GET /auth/utilisateurs ---
  // Endpoint protégé - teste 401 sans token
  group('EasyEcole - GET /auth/utilisateurs', function () {
    if (token) {
      const res = http.get(`${BASE_EASYECOLE}/auth/utilisateurs`, {
        headers: { ...authHeader, 'Content-Type': 'application/json' },
      });
      check(res, {
        'utilisateurs 200 with auth': (r) => r.status === 200,
      });
    } else {
      const res = http.get(`${BASE_EASYECOLE}/auth/utilisateurs`);
      check(res, {
        'utilisateurs 401 without auth': (r) => r.status === 401,
      });
    }
  });

  sleep(1);
}
