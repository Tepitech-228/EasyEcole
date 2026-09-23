# Commandes E2E — EasyEcole

> Guide de lancement des tests de bout en bout (backend + frontend).  
> Date : 2026-09-22 — Backend : `easy-ecole-backend` (Express) — Frontend : `easy-ecole-web` (Angular)

---

## 0. Prérequis

| Élément | Valeur |
|---|---|
| Backend | `http://localhost:3000` (`PORT=3000` dans `easy-ecole-backend/.env`) |
| Base MySQL | `localhost:3307` (`DB_HOST=localhost`, `DB_PORT=3307`, `DB_NAME=easyecole`) |
| Node | `v22.23.2` |
| Comptes de test | Créés au boot (seed) — mot de passe : `TempDevChanger_9f3a2c1e` |

**Le backend doit répondre `200` avant tout test :**
```powershell
curl http://localhost:3000/api/v1/health
# attendu : {"success":true,"status":"healthy","checks":{"api":"ok","database":"ok"}}
```

---

## 1. Lancer le backend

```powershell
# Terminal 1 — laisse tourner
npm run dev --prefix easy-ecole-backend
# ou : npm run backend  (depuis la racine)
```
*   Lance `nodemon src/app.ts` avec `ts-node`
*   Seed automatique : permissions, rôles, comptes, crons, paramètres frais
*   Logs : `easy-ecole-backend/direct.log` et `backend.log`

---

## 2. Tests E2E métier — Backend (workflows réels)

> Chaque script est **idempotent** : crée ses données puis les supprime.  
> À lancer dans un **2ème terminal** à la racine `D:\EasyEcole`.

| Commande | Ce qu'elle fait | Résultat attendu |
|---|---|---|
| `node easy-ecole-backend/e2e-demandes-documents.cjs` | Flux demande de document : étudiant crée demande → établissement traite → document téléchargeable | `✅ demande #9 créée / traitée / disponible` |
| `node easy-ecole-backend/e2e-planning-volume-pointage.cjs` | Planning, volumes UE, suivi prestataires, conflits, pointage, publication EDT | `✅ volumes UE: 12 / 0 conflit / 4 enseignants notifiés` |
| `node easy-ecole-backend/e2e-rattrapage-workflow.cjs` | Sessions rattrapage, demandes étudiant, validation, paiement, bordereau | `✅ sessions ouvertes: 2 / demande #2 valide paye / bordereau déposé` |
| `node easy-ecole-backend/e2e-notes-releve.cjs` | MCC S1/S2, listes notes (36), saisie bulk, génération relevés S1/S2, publication, `mon-releve` | `✅ 36 listes prêtes / 216 notes / bulletins publiés / moyenne 11.72 Passable` |
| `node easy-ecole-backend/e2e-session-creation.cjs` | Création de session d'inscription (année, parcours, classe) | `✅ session créée` |
| `node easy-ecole-backend/e2e-reinscription-workflow.cjs` | Flux réinscription complet | `✅ réinscription validée` |

**Exemple :**
```powershell
node easy-ecole-backend/e2e-demandes-documents.cjs
node easy-ecole-backend/e2e-notes-releve.cjs
```

---

## 3. Test exhaustif des 408 endpoints — Vérification opérationnelle

### 3.1 Script principal (recommandé — situation réelle)
```powershell
node scripts/test-all-endpoints.cjs
```
*   Découvre les routes via `API_ENDPOINTS.md` (408 routes)
*   Pour chaque route teste 3 cas : `sans token → 401`, `mauvais rôle → 403`, `bon rôle → 200/201/400/404`
*   Remplace les `:id` par `1`
*   Génère `test-reports/test-all-endpoints-*.md` avec tableau PASS/FAIL
*   **Dernier résultat : 798 PASS / 19 FAIL / 1 SKIP (76s) — 97.6% OK**

**Filtrer par module :**
```powershell
E2E_BASE_URL=http://localhost:3000/api/v1 node scripts/test-all-endpoints.cjs --module=inscription
E2E_BASE_URL=http://localhost:3000/api/v1 node scripts/test-all-endpoints.cjs --module=docgen
```

### 3.2 Version backend exhaustive (scan réel des Router.ts)
```powershell
node easy-ecole-backend/scripts/test-all-endpoints.cjs
```
*   Scanne directement `src/modules/**/Router.ts` + `src/routes.ts`
*   Teste `401/403` puis tests fonctionnels avec token `admin`
*   Génère `test-reports/endpoints-report.json`

### 3.3 Scripts dev (ne pas utiliser en prod)
```powershell
# Protégés par ALLOW_DEV_SCRIPTS=true
npx ts-node src/core/scripts/endpoint-audit.ts
npx ts-node src/core/scripts/endpoint-audit-http.ts
npx ts-node src/core/scripts/test-all-endpoints.ts
```
*   Listes de routes en dur, obsolètes

---

## 4. Runner global — Tout en 1 + rapport

```powershell
npm run test:all
# équivaut à : node scripts/run-all-tests.cjs
```

**Enchaîne :**
1. `Backend types` (`npm run types` — `tsc --noEmit`)
2. `Backend build` (`npm run build` — Babel)
3. `Frontend build` (`npm run build` — Angular)
4. `Backend unit tests` (`jest --runInBand`)
5. `Frontend unit tests` (`ChromeHeadless`)
6. `Cypress E2E` (`npm run test:e2e` frontend)
7. Les 5 E2E backend ci-dessus

**Rapport :** `test-reports/rapport-tests-*.md` (tableau + logs complets)

---

## 5. Tests unitaires seuls

```powershell
# Backend
npm test --prefix easy-ecole-backend
npm run test:watch --prefix easy-ecole-backend  # watch
npm run test:coverage --prefix easy-ecole-backend

# Frontend
npm test --prefix easy-ecole-web -- --watch=false --browsers=ChromeHeadless
```

---

## 6. Frontend E2E — Cypress

```powershell
npm run test:e2e --prefix easy-ecole-web
# ou depuis easy-ecole-web : npm run test:e2e
```
*   Lance Cypress sur `http://localhost:4200`
*   Nécessite backend + frontend lancés (`npm run dev` à la racine = les 2)

---

## 7. Variables d'environnement utiles

| Variable | Usage | Exemple |
|---|---|---|
| `E2E_BASE_URL` | URL API pour les scripts E2E | `E2E_BASE_URL=http://localhost:3000/api/v1 node scripts/test-all-endpoints.cjs` |
| `PORT` | Port backend | `PORT=3000` |
| `DB_HOST` / `DB_PORT` | Connexion MySQL | `DB_HOST=localhost DB_PORT=3307` |

---

## 8. Comptes de test (seed)

| Rôle | Identifiant | Email | Usage E2E |
|---|---|---|---|
| `admin` | `tepitechbuild` | `tepitechbuild@gmail.com` | Validation globale, health |
| `comite_orientation` | `histoiregede` / `comite1` / `comite2` | `histoiregede@gmail.com` | Validation inscriptions comité |
| `institution` | `direction` | `direction@easyecole.tg` | Pré-validation |
| `apprenant` | `etudiant-demo` | `etudiant.demo@etu.ust.ci` | Flux étudiant |
| `enseignant` | `pacetamol362` | `pacetamol362@gmail.com` | Saisie notes, présences |
| `esa_compta` | `kakashitogo` | `kakashitogo@gmail.com` | Finance |
| `cabinet_comptable` | `tepitechcorp` | `tepitechcorp@gmail.com` | Bordereaux |

Mot de passe par défaut : `TempDevChanger_9f3a2c1e`

Générer un JWT manuellement :
```js
const jwt = require('./easy-ecole-backend/node_modules/jsonwebtoken');
const token = jwt.sign(
  { id: 1, identifiant: 'tepitechbuild', email: 'tepitechbuild@gmail.com', role: 'admin', tokenVersion: 42 },
  'dev_secret_easyecole_2024_change_in_production',
  { expiresIn: '1h' }
);
```

---

## 9. Dépannage rapide

| Symptôme | Cause | Fix |
|---|---|---|
| `ECONNREFUSED 127.0.0.1:3000` | Backend éteint | `npm run dev --prefix easy-ecole-backend` |
| `EADDRINUSE ::1:3000` | 2 processus sur le même port | `taskkill /F /IM node.exe` puis relancer |
| `TSError: Cannot find namespace 'cron'` | Import `node-cron` invalide | Corrigé : `import cron, { ScheduledTask } from 'node-cron'` |
| `500 WHERE parameter "code" has invalid undefined` | `typeCode` manquant | Corrigé : validation `400` si `!typeCode` |
| `500 Erreur lors de la récupération` (absences) | `IN ()` vide | Corrigé : `if (cpIds.length===0) return []` |
| `Token invalide (session expirée)` | `tokenVersion` désynchronisé | Régénérer le token avec le bon `tokenVersion` (42 pour `tepitechbuild`) |

---

**Généré automatiquement le 2026-09-22 après correction des 5 bugs 500 et validation 798/817 endpoints.**