# EasyEcole - Tests de Montée en Charge (K6)

Ce dossier contient les scripts K6 pour les tests de performance et de montée en charge des services EasyEcole.

## Services testés

| Service | URL | Port |
|---------|-----|------|
| EasyEcole Backend | `http://localhost:3000` | 3000 (ou 8091 via nginx) |
| Catalogue Atelier1 | `http://localhost:8081` | 8081 |

## Prérequis

- **K6** installé (`k6 version`)
- **Backend EasyEcole** en cours d'exécution (`npm run dev --prefix easy-ecole-backend`)
- **Service Catalogue** en cours d'exécution (`docker-compose up` dans `D:\app\atele1`)
- **Base de données MySQL** accessible

## Commandes de lancement

### Smoke Test (1 VU, 30s)
Vérifie que tous les endpoints répondent après un déploiement.
```powershell
k6 run k6-smoke.js
```

### Load Test (ramp-up 10→50→100 VUs, 5 min)
Test réaliste avec seuils stricts (p95<500ms, error rate <1%).
```powershell
k6 run k6-load.js
```

### Load Test avec export JSON
```powershell
k6 run --out json=result.json k6-load.js
```

### Stress Test (montée à 200 VUs)
Trouve le point de rupture du système.
```powershell
k6 run k6-stress.js
```

### Spike Test (10→200 VUs en 10s)
Simule un pic de trafic soudain.
```powershell
k6 run k6-spike.js
```

### Test EasyEcole seul

Script dédié 100% EasyEcole (sans catalogue Atelier1). Combine Smoke + Load avec les options suivantes :
- **Stages** : 1m→10 VUs, 2m→50 VUs, 1m→0
- **Seuils** : p95<500ms, error rate<1%
- **Routes** : Auth connexion, Cursus apprenants, Export migration, Utilisateurs, Health

```powershell
k6 run k6-easyecole-only.js
```

### Autres options utiles

```powershell
# Afficher les métriques en temps réel (default)
k6 run k6-load.js
```

# Exporter les résultats en format ligne
k6 run --out console k6-load.js

# Exporter en influxdb pour Grafana
k6 run --out influxdb=http://localhost:8086/k6 k6-load.js

# Exporter en datadog
k6 run --out datadog-api k6-load.js

# Lancer un scénario spécifique (avec des tags)
k6 run --tag scenario=spike_up k6-spike.js
```

## Description des scripts

### k6-smoke.js — Smoke Test
- **Objectif** : Vérifier que les endpoints critiques répondent après un déploiement
- **VUs** : 1
- **Durée** : 30s
- **Endpoints testés** :
  - `GET /health` (Catalogue + EasyEcole)
  - `GET /api/catalogue` (liste)
  - `GET /api/catalogue/1` (détail)
  - `POST /auth/login` (teste que l'endpoint répond)
  - `GET /inscription/cursus-apprenants` (401 attendu sans token)
  - `GET /inscription/excel/apprenants/export/filtres` (401 attendu sans token)
  - `GET /auth/utilisateurs` (401 attendu sans token)

### k6-load.js — Load Test
- **Objectif** : Simuler une charge réaliste croissante
- **Ramp-up** : 10 → 50 → 100 VUs sur 5 min
- **Seuils** : p95<500ms, error rate <1%
- **Scénarios** :
  - Catalogue : GET liste, GET détail, POST création (données aléatoires)
  - EasyEcole : GET /health, GET /inscription/cursus-apprenants, GET /auth/utilisateurs
  - Authentification : `setup()` récupère le JWT, utilisé pour les requêtes protégées

### k6-stress.js — Stress Test
- **Objectif** : Trouver le point de rupture
- **Ramp-up** : 10 → 50 → 100 → 150 → 200 VUs sur 2 min, puis plateau 2 min
- **Seuils** : p95<1000ms, error rate <5%
- **Scénarios** : Tous les endpoints avec une large tolérance (on cherche où ça casse)
- **Note** : Le health check retourne 503 si la base de données est surchargée

### k6-spike.js — Spike Test
- **Objectif** : Simuler un pic de trafic soudain
- **Scénario** : 10→200 VUs en 10s, puis retour à 0 en 20s
- **Seuils** : p95<2000ms, error rate <10%
- **Utilité** : Vérifie la résilience lors d'un lancement ou d'une ouverture d'inscriptions

### k6-easyecole-only.js — Smoke + Load EasyEcole uniquement
- **Objectif** : Tester 100% EasyEcole sans dépendance au catalogue Atelier1
- **Combinaison** : Smoke + Load combiné
- **Stages** : 1m→10 VUs, 2m→50 VUs, 1m→0
- **Seuils** : p95<500ms, error rate<1%
- **Endpoints testés** :
  - `POST /api/v1/auth/connexion` (login avec compte de test)
  - `GET /api/v1/inscription/cursus-apprenants` (cursus apprenants)
  - `GET /api/v1/inscription/excel/apprenants/export/migration` (export migration)
  - `GET /api/v1/auth/utilisateurs` (liste utilisateurs)
  - `GET /api/v1/health` (health check)
- **Logique d'auth** : `setup()` tente login avec `tepitechcorp@gmail.com`. Si 401, les routes protégées renvoient bien 401 (comportement attendu)

## Structure des fichiers

```
D:\EASYECOLE\k6-tests\
├── k6-smoke.js          # Smoke test
├── k6-load.js           # Load test
├── k6-stress.js         # Stress test
├── k6-spike.js          # Spike test
├── k6-easyecole-only.js # Smoke + Load EasyEcole uniquement
└── README.md            # Ce fichier

D:\app\atele1\k6-tests\  # Dossier optionnel pour les tests catalogue spécifiques
└── (à compléter si besoin)
```

## Notes importantes

1. **Authentification** : Les tests EasyEcole utilisent un `setup()` qui tente de se connecter avec les identifiants de démo (`etudiant-demo@easyecole.local` / `demo123`). Si le login échoue, les requêtes protégées retourneront 401.

2. **Token JWT** : Le secret de signature est `dev_secret_easyecole_2024_change_in_production`. Le token est extrait de la réponse du login.

3. **Données Catalogue** : Le service catalogue contient 6 articles en mémoire (Ordinateur Portable, Casque Sans Fil, Bureau Ergonomique, Chaise de Bureau, Clé USB 64Go, Notebook Carnet).

4. **Rate Limiter** : Le login a un rate limiter (1000 req/15min). Ne pas dépasser ce taux dans les tests de charge sur l'authentification.

5. **Base de données** : 45 apprenants et 26 cursus sont disponibles dans la base MySQL.

## Dépannage

- **`k6: command not found`** : Vérifier que K6 est installé et dans le PATH.
- **Connexion refusée** : Vérifier que le backend (port 3000) et le catalogue (port 8081) sont en cours d'exécution.
- **Erreurs 500** : Vérifier les logs du backend (`backend.log` dans `D:\EASYECOLE\easy-ecole-backend\`).
- **Erreurs 401** : Les identifiants de démo sont incorrects ou la base de données n'est pas synchronisée.
