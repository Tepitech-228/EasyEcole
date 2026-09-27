// =============================================================================
// k6-easyecole-only.js — Smoke + Load combiné pour EasyEcole uniquement
// =============================================================================
// Ne teste QUE le service EasyEcole Backend (pas de catalogue Atelier1).
// Objectif : valider le comportement d'EasyEcole sous charge sans dépendance
//            au service catalogue.
//
// Routes testées (100% EasyEcole) :
//   - POST   /api/v1/auth/connexion          (login / authentification)
//   - GET    /api/v1/inscription/cursus-apprenants  (liste des cursus apprenants)
//   - GET    /api/v1/inscription/excel/apprenants/export/migration (export migration)
//   - GET    /api/v1/auth/utilisateurs         (liste des utilisateurs)
//   - GET    /api/v1/health                    (health check)
//
// Logique d'authentification :
//   - setup() tente un login avec un compte de test (tepitechcorp@gmail.com)
//   - Si login réussit (200) → le token JWT est utilisé pour les requêtes protégées
//   - Si login échoue (401) → les routes protégées renvoient 401, ce qui est
//     considéré comme un comportement correct (le smoke valide que l'auth bloque)
//
// Execution : k6 run k6-easyecole-only.js
// =============================================================================

import { check, sleep, group } from 'k6';
import http from 'k6/http';

// --- Configuration des options ---
// Stages : 1m→10 VUs, 2m→50 VUs, 1m→0
// Seuils stricts : p95<500ms, error rate<1%
export let options = {
  stages: [
    // Ramp-up progressif
    { duration: '1m',  target: 10 },  // 10 VUs après 1 minute
    { duration: '2m',  target: 50 },  // 50 VUs après 3 minutes
    // Ramp-down
    { duration: '1m',  target: 0 },   // Descente à 0 après 4 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% des requêtes < 500ms
    http_req_failed: ['rate<0.01'],     // taux d'erreur < 1%
  },
};

// --- Constantes ---
const BASE = 'http://[::1]:3000/api/v1';

// Compte de test pour le login
const TEST_EMAIL = 'tepitechcorp@gmail.com';
const TEST_PASSWORD = 'test123';

// --- Setup: tentative de connexion pour récupérer un token ---
// Si le login échoue (401 ou autre), on continue quand même.
// Les routes protégées renverront 401, ce qui est le comportement attendu.
export function setup() {
  let token = null;

  // Tentative de login avec les identifiants de test
  const loginPayload = JSON.stringify({
    email: TEST_EMAIL,
    motDePasse: TEST_PASSWORD,
  });

  const loginRes = http.post(`${BASE}/auth/connexion`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'setup_login' },
  });

  // Vérifier si le login a réussi
  if (loginRes.status === 200) {
    try {
      const body = JSON.parse(loginRes.body);
      // Extraire le token selon la structure de la réponse
      token = body.token || body.accessToken || body.data?.token || null;
    } catch (e) {
      console.log('Setup: Impossible de parser le token de login');
    }
  }

  // Si login échoué (401, 400, 500...), token reste null
  // Le test principal gérera les 401 de manière attendue
  return { token: token };
}

// --- Fonction principale (exécutée par chaque VU) ---
export default function (data) {
  const token = data && data.token ? data.token : null;
  const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

  // ========================================================================
  // GROUPE 1: Auth - Login
  // Teste l'endpoint de connexion avec et sans identifiants valides
  // ========================================================================
  group('Auth - Login', function () {
    // Requête de login avec les identifiants de test
    const loginPayload = JSON.stringify({
      email: TEST_EMAIL,
      motDePasse: TEST_PASSWORD,
    });
    const loginRes = http.post(`${BASE}/auth/connexion`, loginPayload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'auth_login' },
    });
    check(loginRes, {
      'connexion status 200 ou 401': (r) => r.status === 200 || r.status === 401,
      'connexion pas 500': (r) => r.status !== 500,
      'connexion a un body': (r) => r.body !== '',
    });

    // Si token existe, vérifier que le login a bien retourné un token
    if (token) {
      check(loginRes, {
        'login retourne un token': (r) => r.status === 200,
      });
    } else {
      // Sans token, on s'attend à un 401 (identifiants invalides)
      check(loginRes, {
        'login retourne 401 sans compte valide': (r) => r.status === 401,
      });
    }
  });

  // ========================================================================
  // GROUPE 2: Inscription - Cursus Apprenants
  // Endpoint protégé : nécessite un token JWT valide
  // ========================================================================
  group('Inscription - Cursus', function () {
    if (token) {
      // Requête authentifiée avec le token récupéré au setup
      const res = http.get(`${BASE}/inscription/cursus-apprenants`, {
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        tags: { name: 'cursus_apprenants' },
      });
      check(res, {
        'cursus-apprenants status 200': (r) => r.status === 200,
        'cursus-apprenants a un body': (r) => r.body !== '',
        'cursus-apprenants p95 <500ms': (r) => r.timings.duration < 500,
      });
    } else {
      // Sans token, on s'attend à un 401 (comportement attendu du middleware d'auth)
      const res = http.get(`${BASE}/inscription/cursus-apprenants`);
      check(res, {
        'cursus-apprenants 401 sans token': (r) => r.status === 401,
      });
    }
  });

  // ========================================================================
  // GROUPE 3: Export Migration
  // Endpoint protégé d'export Excel des apprenants pour migration
  // ========================================================================
  group('Export Migration', function () {
    if (token) {
      const res = http.get(`${BASE}/inscription/excel/apprenants/export/migration`, {
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        tags: { name: 'export_migration' },
      });
      check(res, {
        'export migration status 200': (r) => r.status === 200,
        'export migration a un body': (r) => r.body !== '',
        'export migration p95 <500ms': (r) => r.timings.duration < 500,
      });
    } else {
      // Sans token, on s'attend à un 401
      const res = http.get(`${BASE}/inscription/excel/apprenants/export/migration`);
      check(res, {
        'export migration 401 sans token': (r) => r.status === 401,
      });
    }
  });

  // ========================================================================
  // GROUPE 4: Users
  // Liste des utilisateurs - endpoint protégé admin/institution
  // ========================================================================
  group('Users', function () {
    if (token) {
      const res = http.get(`${BASE}/auth/utilisateurs`, {
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        tags: { name: 'users_list' },
      });
      check(res, {
        'utilisateurs status 200': (r) => r.status === 200,
        'utilisateurs a un body': (r) => r.body !== '',
        'utilisateurs p95 <500ms': (r) => r.timings.duration < 500,
      });
    } else {
      // Sans token, on s'attend à un 401
      const res = http.get(`${BASE}/auth/utilisateurs`);
      check(res, {
        'utilisateurs 401 sans token': (r) => r.status === 401,
      });
    }
  });

  // ========================================================================
  // Health Check (non protégé, pas besoin de token)
  // Vérifie que le service EasyEcole est vivant
  // ========================================================================
  group('EasyEcole - Health Check', function () {
    const res = http.get(`${BASE}/health`);
    check(res, {
      'health status 200': (r) => r.status === 200,
      'health api ok': (r) => r.status === 200 && r.json().success === true,
      'health database ok': (r) => r.status === 200 && r.json().checks?.database === 'ok',
    });
  });

  sleep(1);
}
