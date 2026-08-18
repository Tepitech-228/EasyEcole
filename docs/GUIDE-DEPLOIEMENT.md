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
3. Le fichier `docker-compose.yml` du dépôt est détecté automatiquement (3 services : `db`, `backend`, `frontend`).
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
| `ENCRYPTION_MASTER_KEY` | clé AES-256 (64 caractères hexadécimaux) pour le chiffrement des données sensibles |
| `SSL_KEY` / `SSL_CERT` | uniquement si certificat HTTPS propre (non requis : Dokploy gère Let's Encrypt) |

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

Créer un script de sauvegarde sur le serveur (`/opt/easyecole-backup.sh`) et le planifier via cron :

```bash
#!/bin/bash
# Sauvegarde EasyEcole — base + fichiers (volumes uploads et storage)
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/backups/easyecole
mkdir -p $BACKUP_DIR

# 1) Base MySQL
docker exec easyecole-db sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" easyecole --single-transaction' > $BACKUP_DIR/easyecole_$DATE.sql

# 2) Fichiers uploadés (photos, GED, vidéos) et documents générés (cartes, docgen)
docker run --rm -v easyecole_uploads:/data -v $BACKUP_DIR:/backup busybox tar czf /backup/uploads_$DATE.tar.gz -C /data .
docker run --rm -v easyecole_storage:/data -v $BACKUP_DIR:/backup busybox tar czf /backup/storage_$DATE.tar.gz -C /data .

# 3) Nettoyage : garder 14 jours
find $BACKUP_DIR -name "*.sql" -mtime +14 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +14 -delete
```

```bash
sudo chmod +x /opt/easyecole-backup.sh
# Planification : tous les jours à 02h00
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/easyecole-backup.sh") | crontab -
```

> Les noms de volumes (`easyecole_uploads`, `easyecole_storage`) sont à vérifier avec `docker volume ls` — Dokploy peut préfixer les noms.

## 12. Dépannage courant

| Problème | Vérification / solution |
|---|---|
| Le backend ne démarre pas | `docker logs easyecole-backend` ; vérifier `DB_HOST=db` dans les variables ; `docker exec easyecole-backend ping db` |
| L'application ne répond pas sur le domaine | Vérifier l'onglet Domains du service frontend (port 80) ; `docker logs easyecole-frontend` |
| Erreur 502 / 504 sur l'API | Le backend est redémarré : attendre la fin du `depends_on` MySQL ; vérifier la mémoire du serveur (`free -h`) |
| Le build Angular échoue (mémoire) | Dokploy : augmenter les ressources de la machine (4 Go minimum) ; la limite de heap 3072 Mo est déjà configurée dans le Dockerfile |
| WebSocket chat ne fonctionne pas | Vérifier que le domaine frontend est en HTTPS et que Dokploy redirige bien le port 80 (le proxy `/socket.io/` est déjà configuré dans nginx.conf) |
| Port 3306 en conflit | Le conteneur MySQL n'expose pas le port sur l'hôte : aucun conflit possible |

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
