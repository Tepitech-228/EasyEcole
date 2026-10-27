# Sauvegarde en temps réel WS22 - EasyEcole (PDF + MySQL)

Ce document détaille pas à pas la mise en place pour utiliser un **Windows Server 2022** comme cible de stockage pour les PDF (générés/reçus) et comme sauvegarde quasi temps-réel de la base MySQL EasyEcole.

L'objectif : utiliser l'interface **ens192 (192.168.100.0/24)** pour isoler ce trafic de sauvegarde/stockage.

## 1. Objectifs

- **Fichiers PDF** : montage SMB direct depuis Linux vers Windows Server 2022. L'application écrit directement sur le partage. Pas de script de copie en temps réel nécessaire.
- **Base MySQL** : réplication binaire (Master -> Replica) entre le MySQL du conteneur Docker (db) et un MySQL installé sur Windows Server 2022.
- **Isolation réseau** : trafic entre Linux et WS22 passe uniquement par ens192.
- **Robustesse** : autorisation uniquement via compte dédié, restriction par pare-feu Windows, montage résilient avec _netdev/nofail.

## 2. Schéma réseau

| Élément | IP | Rôle |
| --- | --- | --- |
| Serveur applicatif Linux (EasyEcole) | 192.168.100.10 (ens192) / 192.168.85.50 (ens160) | Application + Docker (backend/worker/db/redis/frontend) |
| Windows Server 2022 | 192.168.100.XX (à renseigner) | Partage SMB + MySQL Replica |
| Gateway Internet | 192.168.85.1 | Sortie Internet uniquement via ens160 |

> Seul le trafic 192.168.100.0/24 doit transiter entre Linux et WS22 pour ce besoin.

## 3. Préparation sur Windows Server 2022

### 3.1 Créer l'arborescence

Ouvrir l'Explorateur Windows et créer :

`	ext
D:\EasyEcole\
├── Documents\    # PDF générés / reçus par l'application
└── Sauvegardes\  # Dumps, binlogs, archives de sauvegarde
`

### 3.2 Créer le compte de service

1. Win + R > lusrmgr.msc (Gestion de l'ordinateur > Utilisateurs et groupes locaux)
2. Utilisateurs > Clic droit > Nouvel utilisateur...
3. Nom d'utilisateur : easyecole-svc
4. Mot de passe : (fort et unique)
5. Cocher : L'utilisateur ne peut pas changer le mot de passe
6. Cocher : Le mot de passe n'expire jamais (à adapter selon politique de sécurité)
7. Valider

### 3.3 Créer le partage SMB

1. Ouvrir Gestionnaire de serveur > Services de fichiers et de stockage > Partages
2. Tâches > Nouveau partage...
3. Sélectionner : Partage SMB - Rapide
4. Chemin du dossier : D:\EasyEcole
5. Nom du partage : EasyEcole
6. Poursuivre avec les paramètres par défaut
7. Terminer

### 3.4 Droits NTFS et Partage

#### A) Autorisations de partage

Clic droit sur le partage EasyEcole > Propriétés > Autorisations de partage

- Supprimer Tout le monde s'il est présent
- Ajouter easyecole-svc avec Contrôle total

#### B) Autorisations NTFS

Clic droit sur D:\EasyEcole > Propriétés > Sécurité > Avancé > Modifier les autorisations

- Ajouter easyecole-svc : Lecture et exécution, Affichage du contenu du dossier, Lecture, Écriture
- Conserver Administrateurs, Système
- Appliquer à ce dossier, sous-dossiers et fichiers

### 3.5 Restreindre l'accès par pare-feu Windows

1. Ouvrir wf.msc (Pare-feu Windows Defender avec fonctions avancées de sécurité)
2. Aller dans Règles entrantes
3. Rechercher Partage de fichiers et d'imprimantes (SMB-In)
4. Clic droit > Propriétés > Onglet Étendue
5. Section Adresses IP distantes > Ces adresses IP > Ajouter...
6. Ajouter : 192.168.100.10
7. Appliquer et OK

> Seul le serveur Linux sur ens192 pourra initier une connexion SMB.

## 4. Préparation sur le serveur Linux (EasyEcole)

### 4.1 Installer les dépendances

`ash
sudo apt update
sudo apt install cifs-utils -y
`

### 4.2 Créer le fichier d'identifiants

`ash
sudo mkdir -p /etc/samba
sudo nano /etc/samba/creds-easyecole
`

Contenu :

`	ext
username=easyecole-svc
password=VOTRE_MOT_DE_PASSE_FORT_ICI
`

Sécuriser :

`ash
sudo chmod 600 /etc/samba/creds-easyecole
sudo chown root:root /etc/samba/creds-easyecole
`

### 4.3 Créer les points de montage

`ash
sudo mkdir -p /data/documents /data/backups /data/tmp
`

### 4.4 Configurer /etc/fstab

Éditer fstab :

`ash
sudo nano /etc/fstab
`

Ajouter à la fin (remplacer 192.168.100.XX par l'IP réelle de ton WS22 sur 192.168.100.0/24) :

`	ext
//192.168.100.XX/EasyEcole/Documents   /data/documents   cifs   credentials=/etc/samba/creds-easyecole,uid=1000,gid=1000,vers=3.1.1,cache=loose,rw,_netdev,nofail,x-systemd.automount 0 0
//192.168.100.XX/EasyEcole/Sauvegardes /data/backups     cifs   credentials=/etc/samba/creds-easyecole,uid=1000,gid=1000,vers=3.1.1,cache=loose,rw,_netdev,nofail,x-systemd.automount 0 0
`

### 4.5 Monter et vérifier

`ash
sudo mount -a
df -h | grep EasyEcole
findmnt | grep EasyEcole
`

Test d'écriture :

`ash
touch /data/documents/test_ws22.txt
ls -la /data/documents/test_ws22.txt
rm /data/documents/test_ws22.txt
`

Le fichier doit apparaître dans D:\EasyEcole\Documents\ sur ton Windows Server 2022.

## 5. Brancher l'application EasyEcole

### 5.1 Variables d'environnement

Dans ton .env du backend (easy-ecole-backend/.env) ou dans l'environnement Docker :

`env
DOCUMENTS_STORAGE_DIR=/data/documents
TMP_DIR=/data/tmp
`

Ton service PdfStorageService est déjà configuré pour utiliser ces variables. L'arborescence {annee}/{mois}/{type}/ sera donc créée directement sur le partage WS22.

### 5.2 docker-compose.yml

Les volumes /data/documents et /data/tmp sont déjà présents dans ton docker-compose.yml. Étant montés au niveau de l'hôte Linux, Docker y accède directement. Aucun changement supplémentaire requis.

Redémarrer si besoin :

`ash
docker compose up -d
`

## 6. Sauvegarde MySQL en temps-réel (Master -> Replica)

### 6.1 Côté Linux - Activer le binary log dans MySQL Docker

Le MySQL tourne dans le conteneur db. Il faut activer log_bin.

Édite ton docker-compose.yml pour le service db (ou ajoute un fichier de config MySQL).

Exemple avec volume de config :

`yaml
  db:
    image: mysql:8.0
    ...
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql-config/my.cnf:/etc/mysql/conf.d/my.cnf:ro
`

Créer mysql-config/my.cnf :

`ini
[mysqld]
server-id = 1
log_bin = mysql-bin
binlog_format = ROW
expire_logs_days = 7
max_binlog_size = 100M
gtid_mode = ON
enforce_gtid_consistency = ON
`

Redémarrer MySQL :

`ash
docker compose down db
docker compose up -d db
`

Vérifier :

`ash
docker exec -it easyecole-db mysql -uroot -p -e "SHOW VARIABLES LIKE 'log_bin'; SHOW MASTER STATUS;"
`

Noter le File et Position (ou Executed_Gtid_Set si GTID).

### 6.2 Créer un utilisateur de réplication

Dans le MySQL master :

`sql
CREATE USER 'repl'@'192.168.100.%' IDENTIFIED BY 'MOT_DE_PASSE_REPLICATION_FORT';
GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'repl'@'192.168.100.%';
FLUSH PRIVILEGES;
`

### 6.3 Côté Windows Server 2022 - Installer MySQL

1. Télécharger **MySQL Community Server** depuis le site officiel
2. Installer en mode Server only ou Developer Default
3. Configurer type Standalone MySQL Server
4. Port 3306
5. Créer un mot de passe oot
6. Démarrer le service MySQL80

### 6.4 Configurer le replica sur WS22

Éditer my.ini (généralement C:\ProgramData\MySQL\MySQL Server 8.0\my.ini) :

`ini
[mysqld]
server-id = 2
relay-log = mysql-relay-bin
log_replica_updates = 1
read_only = 1
gtid_mode = ON
enforce_gtid_consistency = ON
`

Redémarrer le service MySQL sur WS22.

### 6.5 Lancer la réplication

Sur le **replica WS22**, se connecter à MySQL et exécuter :

`sql
CHANGE MASTER TO
  MASTER_HOST='192.168.100.10',
  MASTER_USER='repl',
  MASTER_PASSWORD='MOT_DE_PASSE_REPLICATION_FORT',
  MASTER_AUTO_POSITION=1;
START SLAVE;
`

Vérifier l'état :

`sql
SHOW SLAVE STATUS\G
`

Vérifier que :
- Slave_IO_Running: Yes
- Slave_SQL_Running: Yes
- Last_IO_Error et Last_SQL_Error sont vides

### 6.6 Sauvegardes complémentaires vers le partage

Même avec la réplication, conserver des dumps journaliers. Créer un script sur Linux vers /data/backups/ :

`ash
#!/bin/bash
DATE=
docker exec easyecole-db mysqldump -uroot -p --single-transaction --routines --triggers --all-databases > /data/backups/mysql-dump-.sql
find /data/backups/ -name 'mysql-dump-*.sql' -mtime +7 -delete
`

Placer dans cron (ex. 02:00 quotidien).

## 7. Tests de validation

| Test | Commande / Action | Attendu |
| --- | --- | --- |
| Connexion SMB | smbclient //192.168.100.XX/EasyEcole -U easyecole-svc | Connexion réussie |
| Montage auto | systemctl list-units --type=automount \| grep EasyEcole | Actif |
| Écriture PDF | Générer un PDF via l'application | Fichier visible dans D:\EasyEcole\Documents\ dans les secondes qui suivent |
| Arborescence | Vérifier Documents\YYYY\MM\type\ | Présente conformément au PdfStorageService |
| MySQL IO | SHOW SLAVE STATUS\G sur WS22 | Slave_IO_Running: Yes, Slave_SQL_Running: Yes |
| Latence réplication | Créer un enregistrement en prod | Visible sur replica presque immédiatement |
| Résilience | Arrêter/démarrer réseau ens192 brièvement | Montage se reconnecte avec 
ofail/_netdev |

## 8. Points de vigilance

- **Permissions** : Ne jamais utiliser un compte admin Windows pour ce montage. Uniquement easyecole-svc.
- **Pare-feu** : Garder la règle SMB restreinte à 192.168.100.10 uniquement.
- **SMB version** : ers=3.1.1 est recommandé pour Windows Server 2022. Éviter ers=1.0.
- **Réplication** : Si Slave_SQL_Running: No, ne pas forcer. Analyser l'erreur GTID/position avant reprise.
- **Espace disque** : Surveiller D:\EasyEcole\ (Documents + Sauvegardes). Prévoir de l'espace suffisant.
- **Démarrage** : Avec 
ofail + x-systemd.automount, le serveur Linux ne doit pas rester bloqué au boot si WS22 est indisponible.
- **Sécurité** : Le fichier /etc/samba/creds-easyecole doit rester 600 root:root.

## 9. Checklist finale

- [ ] Dossiers Documents\ et Sauvegardes\ créés sur WS22
- [ ] Compte easyecole-svc créé et utilisé
- [ ] Partage SMB EasyEcole configuré avec droits NTFS + Partage stricts
- [ ] Pare-feu Windows restreint à 192.168.100.10
- [ ] cifs-utils installé, creds sécurisés, fstab configuré
- [ ] Montage fonctionnel (mount -a, écriture test OK)
- [ ] .env backend mis à jour avec DOCUMENTS_STORAGE_DIR=/data/documents
- [ ] docker compose up -d OK
- [ ] MySQL binlog activé, utilisateur epl créé
- [ ] MySQL installé/configuré sur WS22 en replica lecture seule
- [ ] Réplication Master -> Replica opérationnelle (IO/SQL Running)
- [ ] Dumps journaliers vers /data/backups/ en place
