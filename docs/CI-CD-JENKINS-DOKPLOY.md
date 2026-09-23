# EASY-ÉCOLE — CI/CD Jenkins → Dokploy (3 serveurs)

> **Objectif :** `git push` → Jenkins (CI) → Registry → Dokploy (CD) → 3 serveurs, sans recréer l'existant, sans `latest` seul, sans secrets dans Git.

---

## 1. Architecture retenue (intégrée à l'existant)

```
GitHub (main/staging/develop)
   │ push / PR
   ▼
Jenkins (agent any, Node 22, Docker)
   │ Checkout → Install (npm ci backend/frontend) → Lint/Types (tsc) → Tests (jest/karma) → Build (babel/ng build)
   │ Tests Workers (import BullMQ) → Docker Build (backend+frontend+worker) → Security (Trivy) → Push Registry (SHA)
   ▼
Docker Registry (registry.entreprise.tg / Docker Hub)
   │ imageTag = git rev-parse --short HEAD (ex: 8f31a92)
   ▼
Dokploy API (POST /api/application.deploy, Bearer token)
   │ Dokploy gère : compose, réseau bridge, volumes, proxy nginx, secrets, rollout
   ▼
3 serveurs Ubuntu (déjà configurés dans Dokploy)
   │ easyecole stack : db, mysql-backup, backend, worker, redis, frontend (80:80)
   └─► Health Check → Rollback si KO → Notification
```

**Conservation :** `Dockerfile` backend (multi-stage Debian + Chromium/ffmpeg) et `Dockerfile` frontend (node22 + nginx) **inchangés**. `docker-compose.yml` **inchangé** (4 services + 2 annexes). `nginx.conf` inchangé. `docker-entrypoint.sh` conserve `apply-migrations.cjs` + `seed-comptes`.

---

## 2. Analyse de l'existant (ne pas recréer)

| Service | Image / Build | Ports (compose) | Réseau | Volumes (persistants) | Dépendances |
|---|---|---|---|---|---|
| **db** | `mysql:8.0` | *non exposé* (3306 interne, 3307 si debug) | bridge `easyecole` | `mysql_data:/var/lib/mysql` | healthcheck `mysqladmin ping` |
| **mysql-backup** | `mysql:8.0` + `mysql-backup.sh` | — | bridge | `mysql_backups:/backups`, `uploads:ro`, `storage:ro`, `./scripts/mysql-backup.sh:ro` | `db` healthy |
| **backend** | `build: ./easy-ecole-backend` (Babel → lib) | 3000 interne (non exposé, via nginx) | bridge | `./migrations:ro`, `./scripts/apply-migrations.cjs:ro`, `uploads:/app/public`, `storage:/app/storage` | `db` healthy, env `REDIS_URL` |
| **worker** | **même build backend** `entrypoint: node lib/core/workers/index.js` (BullMQ OCR/Pdf/ExcelImport) | — | bridge | `uploads`, `storage` | `db` + `redis` healthy |
| **redis** | `redis:7-alpine` `--appendonly --maxmemory 256mb --allkeys-lru` | — | bridge | `redis_data:/data` | — |
| **frontend** | `build: ./easy-ecole-web` (ng build → nginx:1.27-alpine) | **80:80** (prod), 8091:80 en local (`docker-compose.local.yml`) | bridge | — | `backend` |

**Points clés :**
- **Pas de RabbitMQ dans le compose actuel** : les workers sont **BullMQ sur Redis** (`ioredis`, `REDIS_URL=redis://redis:6379`). Si RabbitMQ est souhaité, il s'ajoute en service `rabbitmq:3-management` à côté de Redis, sans remplacer Redis.
- **Env** : plus de `env_file: .env` en prod. Toutes les variables sont injectées par **Dokploy > Environment** (`JWT_SECRET`, `DB_*`, `MYSQL_ROOT_PASSWORD`, `CORS_ORIGIN`, `REDIS_URL`, etc.). `.env` n'existe qu'en `docker-compose.local.yml` (`env_file: .env`).
- **Migrations** : `migrations/001_*.sql` → `024_*.sql` appliquées par `scripts/apply-migrations.cjs` **au startup du backend** (volume mount), suivi `schema_migrations`, idempotent, fail-fast.
- **Workers** : `lib/core/workers/index.js` (3 workers BullMQ) — même image que backend, pas de Dockerfile séparé.

---

## 3. Jenkinsfile — déjà créé à la racine `Jenkinsfile`

Adapté aux **scripts réels** :
- Backend : `npm ci`, `npm run types` (tsc), `npm test -- --runInBand`, `npm run build` (Babel)
- Frontend : `npm ci`, `npx tsc --noEmit --skipLibCheck`, `npm test -- --watch=false --browsers=ChromeHeadless`, `npm run build` (ng build, `NODE_OPTIONS=--openssl-legacy-provider`)
- Workers : vérification `node -e "require('./lib/core/workers')"` + `npm test -- --testPathPattern=worker`
- Docker : `docker build -t registry/easyecole/backend:<SHA>` + `frontend:<SHA>` + `worker:<SHA>` (tag alias backend)
- Push : uniquement sur `main`/`staging`/`develop`, `latest` uniquement sur `main`
- Deploy : `curl POST $DOKPLOY_URL/api/application.deploy` avec `Authorization: Bearer $TOKEN` et fallback `x-api-key`
- Health Check : 60s d'attente puis `curl $FRONTEND_URL` (200), `curl $FRONTEND_URL/api/v1/health` (200), vérif MySQL/Redis via backend, workers via Dokploy API

**Branches :**
- `develop` → CI seul (pas de push/deploy si souhaité, modifiable via `when`)
- `staging` → CI + push + deploy Dokploy staging
- `main` → CI + push + deploy Dokploy production + latest

---

## 4. Credentials Jenkins à créer

`Manage Jenkins > Credentials > System > Global credentials (unrestricted) > Add Credentials`

| ID Jenkins (`credentials('...')`) | Kind | Valeur | Usage |
|---|---|---|---|
| `github-cred` | Username with password ou SSH | PAT GitHub `ghp_...` / SSH `git@github.com:...` | Checkout |
| `docker-registry-cred` | Username with password | `username` + `DOCKER_PASSWORD` / token Harbor | `docker.withRegistry` |
| `dokploy-url` | Secret text | `https://dokploy.entreprise.tg` | `DOKPLOY_URL` |
| `dokploy-api-token` | Secret text | `dok_...` (Dokploy > Settings > API) | `Authorization: Bearer` |
| `dokploy-compose-id` | Secret text | `cmX...` (Dokploy > Applications > easyecole > Settings > ID) | `applicationId` du compose |
| `dokploy-app-id-backend` | Secret text (si 2 apps séparées) | `app_...` | Alternative compose en 2 apps |
| `dokploy-app-id-frontend` | Secret text | `app_...` | Alternative |
| `ssh-private-key` | SSH Username with private key | `jenkins` + clé | *Seulement si besoin SSH direct (déconseillé, préférer API)* |

**Ne jamais** mettre ces valeurs dans `Jenkinsfile`, `Dockerfile`, `docker-compose.yml`, `GitHub`.

---

## 5. Docker Registry

**Choix :** `registry.entreprise.tg` (Harbor privé) ou `docker.io` (Docker Hub).

**Configuration Jenkins :** `REGISTRY` et `DOCKERHUB_NAMESPACE` en `environment` du Jenkinsfile.

**Versioning :**
```
easyecole/backend:8f31a92  + easyecole/backend:latest (main uniquement)
easyecole/frontend:8f31a92 + easyecole/frontend:latest
easyecole/worker:8f31a92    (= alias backend:8f31a92)
```
- `latest` **n'est pas** la seule version : chaque SHA reste disponible pour rollback.
- Prune : `docker system prune -f` en `post { always }` pour ne pas remplir l'agent.

**Commande manuelle (hors Jenkins) :**
```bash
docker build -t registry.entreprise.tg/easyecole/backend:$(git rev-parse --short HEAD) -f easy-ecole-backend/Dockerfile ./easy-ecole-backend
docker push registry.entreprise.tg/easyecole/backend:$(git rev-parse --short HEAD)
```

---

## 6. Jenkins → Dokploy (API officielle)

**Endpoint vérifié (Dokploy ≥0.15) :** `POST /api/application.deploy`
- Header : `Authorization: Bearer $DOKPLOY_API_TOKEN` (ou `x-api-key` sur anciennes versions)
- Body : `{"applicationId":"$DOKPLOY_COMPOSE_ID","imageTag":"8f31a92"}`

**Vérification sur votre instance :**
```bash
# Sur le serveur Dokploy
dokploy --version
curl -s http://localhost:3000/api/openapi.json | grep -A2 "application.deploy"
# ou docs : https://docs.dokploy.com/docs/core/api
```

**Jenkinsfile gère les 2 variantes :** `Authorization: Bearer` puis fallback `x-api-key` + `/api/deploy`.

**Variables Dokploy (Environment) — ne pas dupliquer dans Jenkins :**
```
NODE_ENV=production
PORT=3000
JWT_SECRET=<64+ chars>
CORS_ORIGIN=https://ecole.entreprise.tg
DB_HOST=db
DB_PORT=3306
DB_NAME=easyecole
DB_USER=root
DB_PASS=<MYSQL_ROOT_PASSWORD>
MYSQL_ROOT_PASSWORD=<...>
REDIS_URL=redis://redis:6379
SMTP_*, CINETPAY_*, ENCRYPTION_MASTER_KEY, FRONTEND_URL, TZ=UTC
DB_SYNC_ON_BOOT=false # passer à false après premier import dump
```

---

## 7. Variables d'environnement — sécurité

- **Jenkins** : `DOKPLOY_*`, `REGISTRY_CRED` en **Credentials** uniquement.
- **Dokploy** : toutes les valeurs `DB_*`, `JWT_SECRET`, etc. dans **Dokploy > Project > Environment** (chiffrées, non versionnées).
- **Git** : `.env` et `docker-compose.local.yml` sont dans `.gitignore` — ne jamais committer `.env`.
- **Docker** : pas de `ENV JWT_SECRET` dans `Dockerfile`.

---

## 8. Health Checks (post-déploiement)

Jenkins attend 60s (rollout Dokploy) puis :

```bash
APP_URL=https://ecole.entreprise.tg # ou FRONTEND_URL
curl -sS -o /dev/null -w "%{http_code}" "$APP_URL" | grep -E "200|304" # Frontend nginx
curl -sS "$APP_URL/api/v1/health" | grep -q "ok" # Backend Express (healthcheck compose : GET /api/v1/health)
# MySQL : déjà vérifié via backend health (DB ping dans /health)
# Redis : backend health inclut Redis si REDIS_URL présent
# Workers : curl $DOKPLOY_URL/api/application.one?applicationId=$COMPOSE_ID -H "Authorization: Bearer $TOKEN" | grep -q "running"
```

**Échec = pipeline FAILED → proposition rollback (voir §9).** Le déploiement n'est PAS considéré réussi si Dokploy a seulement accepté la requête.

**Healthchecks Compose conservés :**
- `db` : `mysqladmin ping`
- `redis` : `redis-cli ping`
- `backend` : `node -e "http.get('http://localhost:3000/api/v1/health')"` (15s interval)

---

## 9. Rollback

**Principe :** chaque SHA reste dans le Registry → redéployer l'ancien tag.

**Via Dokploy UI (manuel, le plus sûr) :**
1. Dokploy > Applications > easyecole > Deployments > choisir `8f31a90` précédent > Redeploy

**Via API (automatique) :**
```bash
PREVIOUS_TAG=$(git rev-parse --short HEAD~1)
curl -X POST "$DOKPLOY_URL/api/application.deploy" \
  -H "Authorization: Bearer $DOKPLOY_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"applicationId\":\"$DOKPLOY_COMPOSE_ID\",\"imageTag\":\"$PREVIOUS_TAG\"}"
```

**Jenkinsfile** : en `post { failure }` sur `main`, affiche la commande de rollback. Pour un rollback automatique, ajouter dans le stage `Health Check` un `catchError` qui déclenche l'API avec le tag précédent.

**Rétention :** ne jamais `docker rmi` le tag `latest` + 5 derniers SHA côté Registry (Harbor : Tag Retention).

---

## 10. MySQL — persistance et migrations

- **Volumes :** `mysql_data:/var/lib/mysql` + `mysql_backups:/backups/mysql` — **jamais** `docker compose down -v` en prod.
- **Ne jamais** : `DROP DATABASE`, `DB_SYNC_ON_BOOT=true` en continu, `docker volume rm`.
- **Migrations :** `migrations/*.sql` idempotentes, suivies par `schema_migrations`. Le `docker-entrypoint.sh` du backend exécute `node /app/scripts/apply-migrations.cjs` **avant** `node index.js`. En cas d'échec d'une migration, le conteneur ne démarre pas → Dokploy marque le déploiement en échec.
- **Séquence :** `Nouvelle version → Dokploy pull → backend entrypoint : migrations → seed → API up → Health Check`. Pas de migration manuelle côté Jenkins (sauf `--dry-run` en CI pour prévisualiser).
- **Backup** : service `mysql-backup` (cron `BACKUP_INTERVAL_SECONDS=86400`, rétention 14j) sur volume `mysql_backups` — monter ce volume vers S3 externe en prod.

**Commande locale de vérification :**
```bash
node scripts/apply-migrations.cjs --dry-run
node scripts/apply-migrations.cjs
```

---

## 11. RabbitMQ vs Redis — clarification

- **Actuel :** **Redis 7** + **BullMQ** (workers `OcrWorker`, `PdfWorker`, `ExcelImportWorker`). Pas de RabbitMQ dans `docker-compose.yml`.
- **Si RabbitMQ est requis** (demande initiale) : ajouter dans `docker-compose.yml` :
```yaml
  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: easyecole-rabbitmq
    restart: unless-stopped
    mem_limit: 512m
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER:-easyecole}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASS}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
```
  Et déclarer `rabbitmq: AMQP_URL=amqp://rabbitmq:5672` dans `backend`/`worker`. **Ne pas** supprimer les queues au déploiement (`rabbitmq_data` persistant, comme `mysql_data`).

- **Vérification :** `curl` RabbitMQ Management `http://rabbitmq:15672/api/queues` + `worker` logs `BullMQ démarrés` (ou `RabbitMQ connecté`).

---

## 12. Workers — service indépendant

- **Image :** même que `backend:<SHA>` (pas de Dockerfile séparé), `entrypoint: ["node", "lib/core/workers/index.js"]`.
- **Env :** `REDIS_URL`, `DB_HOST=db`, `DB_PORT=3306`, `DB_NAME`, `DB_USER`, `DB_PASS` (injectés par Dokploy, comme backend).
- **CI :** stage `Tests Workers` du Jenkinsfile : vérifie `require('./lib/core/workers')` et lance les tests `worker`.
- **CD :** Dokploy redémarre le service `worker` en même temps que `backend` (même image, tag identique). Health : `worker` logs `3 workers BullMQ démarrés` + Dokploy `application.one` → `running`.
- **Ne jamais** : `docker compose down` sans recréer, ni vider Redis (`FLUSHALL`) au déploiement.

---

## 13. 3 serveurs — répartition Dokploy

**Ne pas imposer** `Serveur1=frontend` etc. La répartition est **celle déjà configurée dans Dokploy** :

- Vérifier : `Dokploy > Projects > easyecole > Settings > Servers` (ou `docker swarm`/`traefik` selon installation).
- Par défaut `docker-compose.yml` est **monolithique** (tous les services sur **un seul serveur** Dokploy). Pour 3 serveurs, Dokploy déploie **3 réplicas du même compose** derrière le proxy, ou **un compose par serveur** selon le mode Swarm choisi. **Ne pas** modifier `docker-compose.yml` pour forcer une répartition — laisser Dokploy distribuer.

**Jenkins** ne connaît pas les 3 serveurs : il **déclenche un seul déploiement** (`POST /api/application.deploy` avec `composeId`), **Dokploy distribue** sur les 3.

**Vérification :**
```bash
# Sur chaque serveur
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
curl http://localhost/api/v1/health # via le proxy Dokploy/Traefik
```

---

## 14. Sécurité

- **Aucun secret dans Git** : `DB_PASSWORD`, `JWT_SECRET`, `DOKPLOY_API_TOKEN`, `DOCKER_PASSWORD`, `SSH_PRIVATE_KEY`, `CINETPAY_*` uniquement en **Jenkins Credentials** + **Dokploy Environment**.
- **Registry** : `docker.withRegistry("https://${REGISTRY}", "docker-registry-cred")` — pas de `docker login -u admin -p 1234` en clair.
- **Jenkinsfile** : `credentials('...')` — pas de `sh 'curl -H "x-api-key: dok_123"...'`.
- **Dokploy** : `Environment` chiffré, non versionné.
- **Docker** : pas de `ENV` secret dans `Dockerfile`.

---

## 15. Procédure de test (avant prod)

```bash
# 1. Lint/Types
cd easy-ecole-backend && npm run types
cd easy-ecole-web && npx tsc --noEmit --skipLibCheck

# 2. Tests
cd easy-ecole-backend && npm test -- --runInBand
cd easy-ecole-web && npm test -- --watch=false --browsers=ChromeHeadless
# E2E backend (nécessite backend sur 3000)
node scripts/e2e-flux-inscription.cjs
node easy-ecole-backend/e2e-notes-releve.cjs
# E2E frontend (nécessite backend 3000 + frontend 4200)
cd easy-ecole-web && npx cypress run --env APPRENANT_TOKEN=$(node ../gen-token.cjs | grep TOKEN | cut -d: -f2)

# 3. Build
cd easy-ecole-backend && npm run build
cd easy-ecole-web && npm run build

# 4. Docker local
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
curl http://localhost:8091/api/v1/health # 200

# 5. Jenkins sur branche feature
git push origin feature/test-ci # → Jenkins CI seul, pas de deploy
```

---

## 16. Procédure de mise en production

```bash
# Sur develop → PR → staging
git checkout staging && git merge develop && git push origin staging
# → Jenkins : CI + push registry:staging-8f31a92 + deploy Dokploy staging → Health Check staging

# Validation staging (recette)

# Sur main
git checkout main && git merge staging && git push origin main
# → Jenkins : CI + push registry:8f31a92+latest + deploy Dokploy production → Health Check prod → SUCCESS
# Vérifier Dokploy : Applications > easyecole > Deployments > 8f31a92 running
# Vérifier prod : https://ecole.entreprise.tg + https://ecole.entreprise.tg/api/v1/health
```

**Jenkins :** `Build Now` avec `Branch: main` + `Tag: 8f31a92` visible dans `docker images`.

---

## 17. Procédure de rollback

```bash
# Si Health Check FAILED sur main
# Option 1 — Dokploy UI (recommandé)
Dokploy > easyecole > Deployments > cliquer sur le déploiement précédent (ex: 8f31a90) > Redeploy

# Option 2 — API
PREV=8f31a90
curl -X POST "$DOKPLOY_URL/api/application.deploy" \
  -H "Authorization: Bearer $DOKPLOY_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"applicationId\":\"$DOKPLOY_COMPOSE_ID\",\"imageTag\":\"$PREV\"}"

# Vérifier
curl https://ecole.entreprise.tg/api/v1/health # 200
# Notifier
# Jenkins post { failure } affiche déjà la commande
```

**Rétention Registry :** conserver les 10 derniers SHA + `latest` (Harbor > Tag Retention).

---

## 18. Logs — lisibilité Jenkins

Chaque stage loggue `[CI]` ou `[CD]` + `service` + `commit` :
```
[CI] Checkout 8f31a92 sur main
[CI] Install Backend
[CI] Tests
[CI] Docker Build tag=8f31a92
[SECURITY] Scan backend:8f31a92
[CI] Docker Push registry.entreprise.tg/easyecole/backend:8f31a92
[CD] Dokploy Deploy 8f31a92
[CD] Health Check Frontend 200 / Backend 200 / MySQL OK / Workers running
[CD] SUCCESS ou [CD] Rollback 8f31a90
```
En cas d'échec : message `service / étape / commande / erreur / version / commit` dans `post { failure }`.

---

## 19. Fichiers à ne pas modifier

- `Dockerfile` (backend/frontend) — déjà multi-stage optimisé, non-root, Chromium/ffmpeg
- `docker-compose.yml` — volumes persistants, healthchecks, réseau bridge, `apply-migrations` au startup
- `nginx.conf` — proxy `/api/`, `/media/`, `/socket.io/` avec resolver `127.0.0.11`
- `docker-entrypoint.sh` — migrations + seed + `node index.js`
- `.env` (modèle) — reste dans `.gitignore`, injecté via Dokploy

**Seul nouveau fichier :** `Jenkinsfile` à la racine (ci-joint). Aucun secret dedans.

---

## 20. Checklist de mise en route (1h)

1. Jenkins > Manage > Tools > ajouter `node22` (22.x) et Docker
2. Installer `Trivy` sur l'agent Jenkins (`apt-get install trivy`)
3. Créer les 6 Credentials Jenkins (table §4)
4. Créer le Registry `registry.entreprise.tg` (Harbor) + namespace `easyecole`
5. Vérifier l'API Dokploy (`curl $DOKPLOY_URL/api/openapi.json`)
6. Pousser le `Jenkinsfile` sur `develop` → vérifier CI passe
7. Pousser sur `staging` → vérifier push + deploy staging + health check
8. Merger sur `main` → déploiement prod + health check + notification

