# Guide de déploiement — EasyEcole sur Ubuntu + Dokploy

Documentation : prérequis, installation Dokploy, configuration du projet, variables d'environnement, import BDD, domaine/HTTPS, mises à jour, sauvegardes, dépannage.

## 1. Vue d'ensemble

- **Hébergeur** : un serveur Ubuntu (22.04 ou 24.04, recommandé : 4 Go de RAM minimum — le build Angular est gourmand).
- **Plateforme** : Dokploy (PaaS open-source, alternative à Vercel/Heroku) installée sur ce serveur.
- **Architecture déployée** (projet Docker Compose à 3 services) :
  - `db` : MySQL 8.0 (données persistantes dans le volume `mysql_data`)
  - `backend` : API Express/Node (fichiers persistants dans les volumes `uploads` et `storage`)
  - `frontend` : nginx servant le build Angular + proxy vers le backend
- **Un seul domaine suffit** : le nginx du frontend redirige `/api`, `/media`, `/socket.io` (chat temps réel) et `/api-docs` vers le backend. HTTPS géré automatiquement par Dokploy (Let's Encrypt).
- **Mises à jour** : à chaque push sur la branche configurée, Dokploy reconstruit et redéploie automatiquement.

## 2. Prérequis serveur

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Ouvrir les ports (SSH + HTTP + HTTPS)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Vérifier le fuseau horaire (pour les dates de l'application)
sudo timedatectl set-timezone Africa/Abidjan   # adapter selon le pays
```

## 3. Installation de Dokploy

```bash
# Script d'installation officiel (installe Docker Engine + Dokploy)
curl -sSL https://dokploy.com/install.sh | sh

# Vérifier
docker ps
```

Dokploy est alors accessible sur `http://<IP_DU_SERVEUR>:3000` (interface web). Créer le compte administrateur au premier accès.

## 4. DNS

Créer un enregistrement **A** pointant vers l'IP du serveur (chez le registrar) :

| Type | Nom | Valeur |
|---|---|---|
| A | `app` | `<IP_DU_SERVEUR>` |

Exemple : l'application sera accessible sur `https://app.easyecole.com`.

## 5. Création du projet dans Dokploy

1. Dans Dokploy : **Projects → Nouveau projet** (ex. `easyecole`) → **Nouveau service → Docker Compose**.
2. **Source** : connecter le dépôt Git (GitHub/GitLab/Bitbucket), branche `main`, chemin racine du dépôt.
3. Le fichier `docker-compose.yml` du dépôt est détecté automatiquement (6 services : `db`, `mysql-backup`, `backend`, `worker`, `redis`, `frontend`).
4. Activer **Auto Deploy** (redéploiement automatique à chaque push).

## 6. Variables d'environnement

Dans Dokploy, onglet **Environment du projet** : saisir toutes les variables ci-dessous. Elles sont utilisées pour l'interpolation du fichier Compose et injectées dans les conteneurs.

### Obligatoires

| Variable | Valeur |
|---|---|
| `MYSQL_ROOT_PASSWORD` | mot de passe root MySQL (générer un mot de passe fort) |
| `DB_HOST` | `db` (nom du service Docker, PAS localhost) |
| `DB_PORT` | `3306` |
| `DB_NAME` | `easyecole` |
| `DB_USER` | `root` |
| `DB_PASS` | le même que `MYSQL_ROOT_PASSWORD` |
| `DB_SSL` | `off` (communication interne au réseau Docker) |
| `JWT_SECRET` | chaîne aléatoire forte (générer : `openssl rand -hex 64`) |
| `CORS_ORIGIN` | `https://app.easyecole.com` (l'URL publique du frontend) |
| `PORT` | `3000` |
| `HOST` | `0.0.0.0` |
| `NODE_ENV` | `production` |
| `TZ` | `Africa/Abidjan` (fuseau de l'établissement) |

### Optionnelles (selon les services souscrits)

| Variable | Rôle |
|---|---|
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | envoi d'e-mails (notifications, reçus) |
| `CINETPAY_API_KEY` / `CINETPAY_MERCHANT_ID` / `CINETPAY_BASE_URL` | paiement Mobile Money |
| `ENCRYPTION_MASTER_KEY` | clé AES-256 (64 caractères hexadécimaux) pour le chiffrement des données sensibles ; obligatoire si des identifiants de terminaux Hikvision sont enregistrés |
| `HIKVISION_POLLING_ENABLED` | mettre `false` sur les réplicas backend qui ne doivent pas interroger les terminaux Hikvision (garder une seule instance active) |
| `SSL_KEY` / `SSL_CERT` | uniquement si certificat HTTPS propre (non requis : Dokploy gère Let's Encrypt) |

`ENCRYPTION_MASTER_KEY` et `HIKVISION_POLLING_ENABLED` sont transmis au conteneur backend par `docker-compose.yml`. Le polling est activé par défaut ; sur une instance secondaire, définir explicitement `HIKVISION_POLLING_ENABLED=false`.

> **Sécurité** : ne jamais commiter ces valeurs dans le dépôt. Le fichier `.env` est ignoré par git ; rien ne doit être saisi ailleurs que dans Dokploy.

## 7. Premier déploiement

1. Cliquer sur **Deploy** dans Dokploy.
2. Dokploy construit les deux images (backend ~5-10 min, frontend Angular ~10 min selon la machine) puis démarre les 3 conteneurs (le backend attend que MySQL soit opérationnel).
3. Vérifier les logs de chaque service (onglet **Logs**).

## 8. Domaine et HTTPS

1. Dans Dokploy, service `frontend` → onglet **Domains** :
   - Ajouter le domaine `https://app.easyecole.com`
   - Port : `80`
2. Dokploy obtient et renouvelle automatiquement le certificat Let's Encrypt.

L'application est alors accessible sur `https://app.easyecole.com`. Le Swagger de l'API : `https://app.easyecole.com/api-docs/`.

## 9. Import de la base de données initiale

En production, le schéma est créé par les migrations (pas de `sync` automatique). Si une base de données existe déjà (recette), la transférer :

```bash
# Sur le poste de développement — exporter la base
mysqldump -u root -p easyecole --single-transaction --routines --triggers > easyecole_dump.sql

# Sur le serveur (SSH) — copier le dump dans le conteneur MySQL
docker cp easyecole_dump.sql easyecole-db:/tmp/easyecole_dump.sql

# Importer
docker exec -i easyecole-db sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" easyecole' < /dev/null
docker exec easyecole-db sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" easyecole < /tmp/easyecole_dump.sql'

# Appliquer les migrations SQL du dépôt (dossier migrations/)
docker exec -i easyecole-db sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" easyecole' < migrations/001_salleId_bulletins.sql
docker exec -i easyecole-db sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" easyecole' < migrations/002_modalite_bordereaux.sql
```

> **Jamais** `db:seed` en production : le seed écrase les données (`TRUNCATE`). Les données de référence (types d'évaluation, permissions, modèles de documents) sont initialisées par les seeds exécutés au démarrage de l'application.

## 10. Mises à jour

1. Pousser le code sur la branche `main` (ou la branche configurée).
2. Dokploy détecte le push et redéploie automatiquement (reconstruction des images modifiées, conteneurs recréés).
3. Si de nouvelles migrations SQL sont ajoutées : les appliquer manuellement (section 9) **avant ou juste après** le redéploiement, selon la migration.

## 11. Sauvegardes

Le service Compose `mysql-backup` sauvegarde la base réelle `db` chaque jour à **23 h 50**, dans le fuseau défini par `TZ` (par défaut `UTC`). Au démarrage, il attend le prochain 23 h 50 au lieu de produire un dump supplémentaire à minuit ou au redémarrage. Il conserve 14 jours de sauvegardes et réessaie toutes les 15 minutes si MySQL ou l'archivage échoue. Pour déclencher une sauvegarde immédiate manuelle :

```bash
docker exec easyecole-mysql-backup sh -c 'BACKUP_RUN_ONCE=true /usr/local/bin/mysql-backup.sh'
```

Chaque sauvegarde contient un dump SQL compressé de `DB_NAME` (`--single-transaction`) et une archive des fichiers persistants. Les deux archives sont stockées dans le volume Docker `mysql_backups` sous `/backups/mysql`. Ce n'est pas une réplication ni une fusion de bases : le service lit directement la base `db` et produit un instantané restaurable.

Le script vérifie le résultat de `mysqldump` et l'intégrité gzip et tar avant de publier les fichiers ; une erreur de connexion ne doit pas être considérée comme une sauvegarde valide. Pour contrôler les dernières archives :

```bash
docker exec easyecole-mysql-backup sh -c 'ls -lh /backups/mysql'
docker exec easyecole-mysql-backup sh -c 'gzip -t /backups/mysql/DERNIER_DUMP.sql.gz'
```

Avant toute restauration, valider le dump sur une base de test distincte. Ne jamais restaurer par-dessus la base de production sans sauvegarde préalable.

## 12. Dépannage courant

| Problème | Vérification / solution |
|---|---|
| Le backend ne démarre pas | `docker logs easyecole-backend` ; vérifier `DB_HOST=db` dans les variables ; `docker exec easyecole-backend ping db` |
| Le déploiement échoue avec « dependency backend failed to start: container easyecole-backend is unhealthy » et les logs montrent `mkdir: cannot create directory '/app/public/uploads': Permission denied` | Voir §12.1 — droits des bind mounts hôte |
| L'application ne répond pas sur le domaine | Vérifier l'onglet Domains du service frontend (port 80) ; `docker logs easyecole-frontend` |
| Erreur 502 / 504 sur l'API | Le backend est redémarré : attendre la fin du `depends_on` MySQL ; vérifier la mémoire du serveur (`free -h`) |
| Le build Angular échoue (mémoire) | Dokploy : augmenter les ressources de la machine (4 Go minimum) ; la limite de heap 3072 Mo est déjà configurée dans le Dockerfile |
| WebSocket chat ne fonctionne pas | Vérifier que le domaine frontend est en HTTPS et que Dokploy redirige bien le port 80 (le proxy `/socket.io/` est déjà configuré dans nginx.conf) |
| Port 3306 en conflit | Le conteneur MySQL n'expose pas le port sur l'hôte : aucun conflit possible |

### 12.1 Déploiement bloqué : « Permission denied » sur les bind mounts

**Symptôme.** Le déploiement Dokploy s'arrête en échec :

```
Error: ❌ Docker command failed
dependency backend failed to start: container easyecole-backend is unhealthy
```

et les logs du backend répètent toutes les ~60 s :

```
[entrypoint] mkdir: cannot create directory '/app/public/uploads': Permission denied
```

**Cause.** `/app/public`, `/app/uploads`, `/app/storage`, `/app/config`, `/app/.keys` et
`/app/backups` sont des **bind mounts hôte** créés par Dokploy en `root:root` (755).
Les sous-dossiers créés *dans l'image* (Dockerfile) sont **masqués** par ces montages.
Le conteneur backend s'exécute en `USER node` (uid 1000) : il ne peut donc pas créer
`/app/public/uploads`. L'entrypoint étant en `fail-fast`, le conteneur sort en erreur,
reste `unhealthy` et fait échouer le déploiement.

**Correctif livré dans le dépôt** (aucune action manuelle requise après redéploiement) :

| Fichier | Modification |
|---|---|
| `easy-ecole-backend/docker-entrypoint.sh` | Nouvelle phase **0a** : démarrage en root → `mkdir` + `chown -R 1000:1000` + `chmod -R u+rwX,g+rwX` sur les répertoires montés → **ré-exécution du script en `node`** via `setpriv` (repli `runuser`) |
| `easy-ecole-backend/Dockerfile` | Ajout de `util-linux` (garantit `setpriv` / `runuser`) dans le stage runtime |
| `docker-compose.yml` | `user: "0:0"` sur le service `backend` **uniquement** |

L'application, les seeds et les migrations continuent de tourner **en utilisateur non-root**
(uid 1000) : seul le court passage de préparation s'exécute en root. Le service `worker`
conserve l'`USER node` de l'image et démarre après `backend: service_healthy`, donc après
la réparation.

**Déblocage immédiat, sans reconstruction d'image** (à faire sur l'hôte pendant que le
correctif n'est pas encore déployé) :

```bash
sudo mkdir -p /opt/mon-app/{public,uploads,storage,config,keys,backups}
sudo chown -R 1000:1000 /opt/mon-app
sudo chmod -R u+rwX,g+rwX /opt/mon-app
```

> `1000:1000` correspond à l'utilisateur `node` de l'image. Vérifier avec
> `docker run --rm node:22-bookworm-slim id node` si l'image est modifiée.

**Procédure de redéploiement (chemin nominal)**

1. Pousser le correctif sur la branche de déploiement.
2. Dans Dokploy, relancer le déploiement (le backend doit être **reconstruit** : l'ajout de
   `util-linux` est dans l'image, `docker compose up` seul ne suffit pas).
3. Contrôler les logs : les lignes attendues sont
   `[entrypoint] Phase root : alignement des droits des repertoires montes...`
   puis `[entrypoint] Droits alignes (uid 1000 = node). Reprise en tant que 'node'...`
   puis `[entrypoint] Répertoires fichiers OK (public/, uploads/)`.
4. Vérifier que le conteneur tourne bien en `node` (et non en root) :
   `docker exec easyecole-backend ps -o user,pid,cmd` → l'application doit apparaître
   sous `node`.
5. Contrôler l'API : `docker exec easyecole-backend node -e "require('http').get('http://127.0.0.1:3000/api/v1/health', r => console.log(r.statusCode))"` → `200`.

**Si l'erreur persiste** : les chemins hôte réels peuvent différer des valeurs par défaut.
Vérifier les variables `PUBLIC_HOST_PATH`, `UPLOADS_HOST_PATH`, `STORAGE_HOST_PATH`,
`CONFIG_HOST_PATH`, `KEYS_HOST_PATH`, `BACKUPS_HOST_PATH` dans Dokploy, puis appliquer le
`chown` sur les chemins **effectivement** utilisés.

## 13. Checklist de mise en production

- [ ] Ubuntu à jour, ports 22/80/443 ouverts (ufw)
- [ ] Dokploy installé, compte admin créé
- [ ] DNS `app.<domaine>` → IP du serveur
- [ ] Projet Docker Compose créé, branche `main`, Auto Deploy activé
- [ ] Toutes les variables d'environnement saisies (section 6)
- [ ] Premier déploiement réussi (3 conteneurs opérationnels)
- [ ] Domaine + HTTPS ajoutés sur le service frontend
- [ ] Dump BDD importé (si reprise d'une base existante) + migrations SQL appliquées
- [ ] Connexion testée (admin), navigation, upload de fichier, chat
- [ ] Sauvegarde automatique configurée (cron) et testée
- [ ] `JWT_SECRET`, `DB_PASS`, `MYSQL_ROOT_PASSWORD` forts et uniques
- [ ] Contact support défini (responsable qui reçoit les alertes de logs)

## 14. Fichiers concernés par le déploiement (dépôt Git)

| Fichier | Rôle |
|---|---|
| `docker-compose.yml` | Orchestration des 3 services (utilisé par Dokploy) |
| `easy-ecole-backend/Dockerfile` | Image backend (build Babel → runtime Node 22, Chromium + ffmpeg inclus) |
| `easy-ecole-web/Dockerfile` | Image frontend (build Angular 12 → nginx) |
| `easy-ecole-web/nginx.conf` | Proxy `/api`, `/media`, `/socket.io`, `/api-docs` vers le backend |
| `migrations/*.sql` | Migrations de schéma à appliquer manuellement |
| `easy-ecole-backend/.env.example` | Référence des variables (aucun secret) |
