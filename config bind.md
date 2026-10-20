# Config binding — EasyEcole

**Nature du document** : procédure de déploiement et **plan de liaison** (binding) entre les machines, le réseau, les services applicatifs, les ports et les dossiers persistants.
**Périmètre** : Hyper-V → VM APP / VM DB → Dokploy → MySQL → pare-feu.
**Version** : 1.0 — 2026-10-12.
**Statut** : validé par test de configuration (voir §7).

> ⚠️ Ce document ne contient **aucun secret**. Les valeurs sensibles (`JWT_SECRET`, `DB_PASS`, `MYSQL_ROOT_PASSWORD`, clés AES…) sont saisies uniquement dans Dokploy ou dans le `.env` local (ignoré par Git).

---

## 1. Objet

Le « binding » désigne le **câblage exact** de l'application :

1. **Machines** : quelle VM héberge quoi.
2. **Réseau** : adresses, VLAN/switch, ports ouverts.
3. **Services** : quels conteneurs communiquent avec quels autres.
4. **Persistance (bind mounts)** : quels dossiers de l'hôte sont montés dans les conteneurs.
5. **Variables** : quelles variables sont injectées et où.

L'objectif est de garantir que **le même fichier `docker-compose.yml` produit le même comportement** en local (dev Windows) et en production (VM Ubuntu + Dokploy).

---

## 2. Vue d'ensemble

```
                        Réseau établissement  (externe : 192.168.83.171)
                                     │
                    ┌────────────────┴────────────────┐
                    │        Switch / pare-feu         │
                    └───────┬─────────────────┬────────┘
                            │                 │
              ┌─────────────┴──┐        ┌─────┴──────────────┐
              │  VM APP        │        │  VM DB             │
              │ 192.168.100.10 │        │ 192.168.100.20     │
              │ 4 vCPU/6 Go/1To│        │ 4 vCPU/6 Go/3 To   │
              │                │        │                    │
              │  Dokploy       │        │  MySQL 8.0         │
              │  ├ db (opt. A) │◄──────►│  (base : easy-db)  │
              │  ├ backend     │  3306  │                    │
              │  ├ worker      │        └────────────────────┘
              │  ├ redis       │
              │  ├ frontend(80)│
              │  └ mysql-backup│
              └────────────────┘
```

Deux modes d'hébergement de la base :

| Mode | Base de données | `DB_HOST` | Usage |
|---|---|---|---|
| **A — tout-en-un** (défaut) | conteneur `db` de la stack, sur la VM APP | `db` | évaluation / petite charge |
| **B — BDD séparée** | MySQL sur la VM DB | `192.168.100.20` | production (charge + sauvegardes) |

> Le fichier `docker-compose.yml` livré **active par défaut le mode A** (service `db`). Le mode B s'obtient en externalisant la base et en pointant `DB_HOST` vers la VM DB (voir §6.5). Les deux câblages sont décrits ; un seul est actif à la fois.

---

## 3. Machines et plan d'adressage

| Élément | Valeur | Rôle |
|---|---|---|
| Hyper-V — switch interne | `192.168.100.0/24` (passerelle à confirmer) | réseau entre VM APP et VM DB |
| Hyper-V — switch externe | `192.168.83.171` (à confirmer) | accès établissement / Internet |
| VM APP | `192.168.100.10` — 4 vCPU / 6 Go RAM / 1 To | Dokploy + stack applicative |
| VM DB | `192.168.100.20` — 4 vCPU / 6 Go RAM / 3 To | MySQL + sauvegardes |
| Nom de la base | `easy-db` (à confirmer avec le paramétrage `DB_NAME`) | base applicative |
| Compte MySQL applicatif | `easyecole_app` | accès du backend |

> Les adresses de switch et le nom de base proviennent des échanges de cadrage : **à confirmer** avant la mise en production. Le reste (IP VM, dimensionnement) est figé.

---

## 4. Réseau et pare-feu

### 4.1 Ports exposés sur l'hôte (VM APP)

| Port hôte | Service | Détail |
|---|---|---|
| `80` | `frontend` (nginx) | application web + proxy API. En local Windows : remappé sur `8091` (Apache/WAMP occupe 80). |
| `3000` | interface Dokploy | administration — **à restreindre** au réseau d'admin. |

À décommenter **uniquement pour du diagnostic** (non recommandé en prod) :
`3000:3000` (backend) et `3307:3306` (MySQL) — voir commentaires dans `docker-compose.yml`.

### 4.2 Flux internes (réseaux Docker)

| Réseau | Membres | Exposé à l'extérieur |
|---|---|---|
| `app` (bridge) | `frontend`, `backend`, `worker` | non |
| `data` (bridge, **internal: true**) | `db`, `redis`, `backend`, `worker`, `mysql-backup` | non |

→ `db` et `redis` **ne sont atteignables que par la stack** : aucun port MySQL/Redis publié sur l'hôte en mode A.

### 4.3 Règles pare-feu

```bash
# VM APP (Ubuntu)
sudo ufw allow 22/tcp      # SSH (administration)
sudo ufw allow 80/tcp      # application (frontend/nginx)
sudo ufw allow 443/tcp     # HTTPS (Let's Encrypt via Dokploy)
sudo ufw enable
sudo ufw status verbose
```

```bash
# VM DB — n'autoriser 3306 QUE depuis la VM APP
sudo ufw allow from 192.168.100.10 to any port 3306 proto tcp
sudo ufw enable
```

> En mode A (base conteneurisée), la règle 3306 de la VM DB est inutile.

---

## 5. Correspondance des bindings (services ↔ hôte ↔ volumes)

Tous les dossiers persistants sont des **bind mounts hôte** (visibles et sauvegardables directement sur le disque de la VM).

| Variable d'hôte | Chemin hôte (défaut) | Monté dans le conteneur | Contenu |
|---|---|---|---|
| `PUBLIC_HOST_PATH` | `/opt/mon-app/public` | `/app/public` | uploads, GED, dossiers, bordereaux |
| `UPLOADS_HOST_PATH` | `/opt/mon-app/uploads` | `/app/uploads` | PV de délibération |
| `STORAGE_HOST_PATH` | `/opt/mon-app/storage` | `/app/storage` | PDF, cartes étudiantes, QR codes |
| `CONFIG_HOST_PATH` | `/opt/mon-app/config` | `/app/config` | configuration de stockage |
| `KEYS_HOST_PATH` | `/opt/mon-app/keys` | `/app/.keys` | **clé maîtresse AES** — ne jamais perdre |
| `BACKUPS_HOST_PATH` | `/opt/mon-app/backups` | `/app/backups` | sauvegardes d'intégrité GED |

Volumes **nommés** (gérés par Docker) : `mysql_data` (données MySQL), `mysql_backups` (dumps), `redis_data` (cache AOF).

**Prérequis d'écriture (utilisateur `node`, uid 1000)** — à exécuter **avant** le premier déploiement, sur la VM APP :

```bash
sudo mkdir -p /opt/mon-app/{storage/pdfs,public,uploads,config,keys,backups}
sudo chown -R 1000:1000 /opt/mon-app
sudo chmod -R u+rwX,g+rwX /opt/mon-app
```

> Sans ces droits, l'entrypoint `docker-entrypoint.sh` **échoue volontairement** (fail-fast) et le déploiement est marqué en échec — c'est le comportement attendu.

---

## 6. Procédure de déploiement

### 6.1 Préparer la VM APP

```bash
sudo apt update && sudo apt upgrade -y
sudo timedatectl set-timezone Africa/Abidjan     # adapter au pays
# Installer Docker + Dokploy
curl -sSL https://dokploy.com/install.sh | sh
docker ps                                          # doit lister les conteneurs Dokploy
```

### 6.2 Préparer les dossiers hôte

Voir §5 (bloc `mkdir/chown/chmod`). **Ne pas sauter cette étape en mode bind mount.**

### 6.3 Créer le projet dans Dokploy

1. **Projects → Nouveau projet** (ex. `easyecole`) → **Nouveau service → Docker Compose**.
2. Source Git : dépôt, branche configurée (ex. `main`), chemin racine.
3. Dokploy détecte `docker-compose.yml` (6 services : `db`, `mysql-backup`, `backend`, `worker`, `redis`, `frontend`).
4. Activer **Auto Deploy**.

### 6.4 Variables d'environnement (Dokploy → Environment du projet)

| Variable | Valeur |
|---|---|
| `JWT_SECRET` | chaîne aléatoire forte (`openssl rand -hex 64`) |
| `DOCGEN_SECRET` | secret docgen / QR (à régénérer en prod) |
| `CORS_ORIGIN` | URL publique du frontend (ex. `https://app.easyecole.com`) |
| `DB_HOST` | `db` (mode A) **ou** `192.168.100.20` (mode B) |
| `DB_PORT` | `3306` |
| `DB_NAME` | `easyecole` (à confirmer vs `easy-db`) |
| `DB_USER` | `easyecole_app` |
| `DB_PASS` | mot de passe fort (compte applicatif) |
| `DB_SSL` | `off` (réseau Docker interne) ou `require` si TLS |
| `MYSQL_ROOT_PASSWORD` | mot de passe root MySQL (mode A) |
| `ENCRYPTION_MASTER_KEY` | 64 hex (AES-256), ou vide = auto-généré |
| `TZ` | fuseau de l'établissement |
| `SMTP_*`, `CINETPAY_*`, `REDIS_URL` | selon services souscrits |

> `REDIS_URL` par défaut : `redis://redis:6379`. `MIGRATIONS_ON_BOOT` par défaut : `true` (fail-fast). `DB_SYNC_ON_BOOT` : **à laisser `false` en production** (à retirer du `.env` après le premier import).

### 6.5 Base de données

- **Mode A** : rien à faire côté VM DB ; MySQL démarre dans la stack (volume `mysql_data`).
- **Mode B** : créer la base et le compte sur la VM DB, puis exporter/importer :

```bash
# VM DB
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS easyecole CHARACTER SET utf8mb4;
CREATE USER IF NOT EXISTS 'easyecole_app'@'192.168.100.10' IDENTIFIED BY '<mot_de_passe_fort>';
GRANT ALL PRIVILEGES ON easyecole.* TO 'easyecole_app'@'192.168.100.10';
FLUSH PRIVILEGES;"

# Poste de dev — exporter
mysqldump -u root -p easyecole --single-transaction --routines --triggers > easyecole_dump.sql

# VM APP — importer (ajuster le client selon le mode)
mysql -h 192.168.100.20 -u easyecole_app -p easyecole < easyecole_dump.sql
```

> Les migrations SQL versionnées (`migrations/*.sql`) sont **appliquées automatiquement** par l'entrypoint du backend (`MIGRATIONS_ON_BOOT=true`). Aucun montage manuel n'est nécessaire.

### 6.6 Domaine et HTTPS

Dokploy → service `frontend` → **Domains** : ajouter l'URL publique, port `80`. Let's Encrypt est géré automatiquement.

### 6.7 Déployer

Cliquer **Deploy** dans Dokploy → surveiller les logs. Séquence attendue : `db` healthy → `backend` (migrations + seeds) healthy → `worker`, `frontend`, `mysql-backup`.

---

## 7. Test du binding (vérifié le 2026-10-12)

Validation « à froid » de l'orchestration, sans exécuter la stack :

```powershell
# Production (fichier de base)
docker compose -f docker-compose.yml config -q            # => exit 0

# Local Windows (base + override)
docker compose -f docker-compose.yml -f docker-compose.local.yml config -q   # => exit 0
```

**Résultats**

| Contrôle | Résultat |
|---|---|
| Interpolation des variables (`.env`) | ✅ OK — aucune variable obligatoire manquante |
| Résolution des 6 services | ✅ `db`, `mysql-backup`, `backend`, `worker`, `redis`, `frontend` |
| Bind mounts backend/worker | ✅ `/app/public`, `/app/uploads`, `/app/storage`, `/app/config`, `/app/.keys`, `/app/backups` résolus |
| Réseaux | ✅ `easyecole_app` (bridge), `easyecole_data` (internal) |
| Port frontend | ✅ `80` en prod ; `8091` avec l'override local (port 80 occupé par Apache/WAMP) |
| Ports MySQL/Redis | ✅ non publiés (internes uniquement) |
| Fichiers référencés | ✅ `scripts/mysql-backup.sh`, `easy-ecole-backend/docker-entrypoint.sh`, `scripts/apply-migrations.cjs`, `.babelrc`, `index.js`, `migrations/` présents |
| **Verdict** | ✅ **Configuration cohérente — déployable** |

### 7.1 Point de vigilance spécifique au poste Windows

`docker compose config` montre que, **sans override**, les bind mounts se résolvent sur les chemins **Linux** (`/opt/mon-app/...`), car le `.env` ne définit pas les `*_HOST_PATH`.

- En **production** (VM Ubuntu) : correct — `/opt/mon-app/*` est le bon chemin.
- En **local Windows** : `/opt/mon-app/*` désigne l'intérieur de la VM Docker, **pas** `D:\EasyEcole\.data`. Pour un vrai test local avec persistance visible, ajouter au `.env` :

```ini
PUBLIC_HOST_PATH=./.data/public
UPLOADS_HOST_PATH=./.data/uploads
STORAGE_HOST_PATH=./.data/storage
CONFIG_HOST_PATH=./.data/config
KEYS_HOST_PATH=./.data/keys
BACKUPS_HOST_PATH=./.data/backups
```

### 7.2 Test à exécuter (démarrage réel)

Le test ci-dessus est statique (validation de configuration). Le **test de démarrage complet** (`up --build`) n'a pas été lancé : le daemon Docker est arrêté sur le poste (`com.docker.service` = Stopped) et le build (Angular + Chromium) est long. À lancer sur la VM cible :

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1/api/v1/health    # attendu : 200
```

---

## 8. Points de vigilance

1. **`DB_HOST` doit valoir `db`** (mode A) dans les conteneurs — jamais `localhost`.
2. **`DB_SYNC_ON_BOOT=true` est temporaire** : à remettre à `false` après le premier import (sinon `alter` à chaque démarrage).
3. **`/app/.keys` (`KEYS_HOST_PATH`)** : sa perte rend les données chiffrées **définitivement illisibles**. À sauvegarder hors VM.
4. **Fenêtre de démarrage backend longue** (migrations + 6 seeds) : le healthcheck est élargi à ~7 min — ne pas conclure trop vite à un échec.
5. **Override local** (`docker-compose.local.yml`) : ignoré par Git, **ne jamais déployer en production**.
6. **Secrets** : uniquement dans Dokploy / `.env` local, jamais dans le dépôt.

---

## 9. Sauvegarde et exploitation

- Conteneur `mysql-backup` (inclus) : sauvegarde quotidienne à 23 h 50 selon `TZ` dans le volume `mysql_backups`, rétention 14 jours et archivage lecture seule des fichiers persistants.
- Sauvegarder **en plus** : `/opt/mon-app/keys` (clé maîtresse) et `/opt/mon-app/config`.
- Mises à jour : push → redéploiement automatique Dokploy ; les migrations s'appliquent au boot.

---

## 10. Checklist finale

- [ ] VM APP et VM DB créées, IP et pare-feu conformes (§3, §4)
- [ ] Dossiers `/opt/mon-app/*` créés et droits `1000:1000` (§5)
- [ ] Dokploy installé, projet Docker Compose créé, Auto Deploy actif
- [ ] Variables saisies dans Dokploy (§6.4), `JWT_SECRET`/`DB_PASS`/`MYSQL_ROOT_PASSWORD` forts
- [ ] Base créée + importée (mode B) ou démarrée (mode A) ; migrations OK
- [ ] Domaine + HTTPS sur le service `frontend`
- [ ] `docker compose config` sans erreur (déjà validé, §7)
- [ ] Démarrage réel : `/api/v1/health` → `200`
- [ ] Sauvegarde des dossiers `keys` et `config` configurée
- [ ] `DB_SYNC_ON_BOOT=false` après le premier démarrage

---

## 11. Fichiers de référence

| Fichier | Rôle |
|---|---|
| `docker-compose.yml` | Orchestration de la stack (6 services) |
| `docker-compose.local.yml` | Override local Windows (non versionné) |
| `easy-ecole-backend/Dockerfile` | Image backend (Babel → Node 22 + Chromium + ffmpeg) |
| `easy-ecole-web/Dockerfile` + `nginx.conf` | Image frontend + proxy `/api`, `/media`, `/socket.io`, `/api-docs` |
| `easy-ecole-backend/docker-entrypoint.sh` | Migrations + seeds + vérif. bind mounts (fail-fast) |
| `scripts/mysql-backup.sh` | Sauvegarde automatisée |
| `migrations/*.sql` | Migrations versionnées (appliquées au boot) |
| `docs/GUIDE-DEPLOIEMENT.md` | Guide de déploiement détaillé (Dokploy, domaine, dépannage) |
