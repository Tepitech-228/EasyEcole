#!/bin/sh
# =============================================================================
# docker-entrypoint.sh — Entrypoint Dokploy
#
# 0a. Répare les droits des BIND MOUNTS hôte (/app/public, /app/uploads,
#     /app/storage, /app/config, /app/.keys, /app/backups) qui sont créés par
#     Dokploy en root:root, puis RE-EXÉCUTE ce script en `node` (uid 1000).
#     Indispensable : sinon `mkdir /app/public/uploads` échoue en
#     « Permission denied » → conteneur unhealthy → déploiement en échec.
#     L'application, les seeds et les migrations tournent en non-root.
# 0. Vérifie/crée le stockage persistant des PDF (/app/storage/pdfs)
# 0b. Vérifie/crée les répertoires fichiers sous les bind mounts hôte
#     (/app/public, /app/uploads) — multer ne crée pas ses dossiers.
# 1. Applique les migrations SQL incrémentales (idempotentes, suivi
#    schema_migrations) UNIQUEMENT si MIGRATIONS_ON_BOOT=true — FAIL-FAST :
#    si une migration échoue, le conteneur ne démarre pas (le déploiement est
#    marqué en échec, pas d'API à moitié). Par défaut elles sont SAUTÉES :
#    voir le bloc ci-dessous pour le détail.
# 2. Lance le seed des comptes système + autorisations (idempotent)
# 3. Démarre l'application (node index.js)
#
# OÙ SONT LES MIGRATIONS ?
# ----------------------------
# Les fichiers `migrations/*.sql` et le runner `scripts/apply-migrations.cjs`
# sont versionnés dans le dépôt et COPIÉS DANS L'IMAGE par le Dockerfile.
# Ils ne sont PLUS montés en volume manuellement : plus rien à configurer dans
# Dokploy, le déploiement est reproductible.
#
# ⚠️ Si vous lisez ceci parce que vous cherchiez les anciens montages
#    « ./migrations:/app/migrations » et « /app/scripts/apply-migrations.cjs »,
#    ils sont désormais inutiles : supprimez-les de la configuration Dokploy.
# =============================================================================

set -e

# -----------------------------------------------------------------------------
# 0a. REPARATION DES DROITS DES BIND MOUNTS (phase root, une seule fois)
# -----------------------------------------------------------------------------
# PROBLEME (deploiement Dokploy) :
#   /app/public, /app/uploads, /app/storage… sont des BIND MOUNTS HOSTE crees
#   par Dokploy en root:root (755). Les sous-dossiers crees DANS l'image
#   (Dockerfile) sont MASQUES par ces montages. Le conteneur demarre en
#   `node` (uid 1000) → il ne peut PAS creer /app/public/uploads :
#       mkdir: cannot create directory '/app/public/uploads': Permission denied
#   → l'entree sort en erreur (fail-fast) → le conteneur reste « unhealthy »
#   → `docker compose up` echoue :
#       Error dependency backend failed to start
#       container easyecole-backend is unhealthy
#
# CORRECTIF :
#   Le service backend demarre en root (docker-compose.yml : `user: "0:0"`),
#   aligne les droits des repertoires montes sur l'utilisateur applicatif
#   `node` (uid 1000), puis RE-EXECUTE cet entrypoint en tant que `node`.
#   L'application, les seeds et les migrations tournent donc TOUJOURS en
#   utilisateur non-root : seul ce court passage de preparation s'execute
#   en root. Aucune intervention manuelle sur l'hote n'est necessaire.
#
#   L'operateur `node` est celui de l'image node:*-bookworm-slim (uid 1000).
# -----------------------------------------------------------------------------
if [ "$(id -u)" = "0" ]; then
  echo "[entrypoint] Phase root : alignement des droits des repertoires montes..."

  MOUNT_DIRS="/app/public /app/uploads /app/storage /app/config /app/.keys /app/backups /app/documents"
  for d in $MOUNT_DIRS; do
    mkdir -p "$d" 2>/dev/null || true
  done

  # Garde-fou stockage : en production (REQUIRE_DOCUMENTS_MOUNT=true),
  # refuser de demarrer si /mnt/easyecole-documents ou /mnt/easyecole-storage
  # n'est pas monte. Les marqueurs sont crees automatiquement par le service
  # init-storage (scripts/init-document-storage.sh). Sans ce test, Docker
  # creerait un dossier local vide et l'application ecrirait hors du stockage.
  if [ "${REQUIRE_DOCUMENTS_MOUNT:-${REQUIRE_WS22_MOUNT:-false}}" = "true" ]; then
    for marker in \
      /app/documents/.easyecole-mounted \
      /app/backups/.easyecole-mounted
    do
      if [ ! -f "$marker" ]; then
        echo "[entrypoint] ERREUR : stockage persistant absent ou incomplet ($marker)."
        echo "[entrypoint] Verifier les montages /mnt/easyecole-documents et /mnt/easyecole-storage"
        echo "[entrypoint] sur la VM APP, puis le service init-storage (docker compose logs init-storage)."
        exit 1
      fi
    done
  fi

  # `chown -R` : les fichiers ecrits par une version anterieure du conteneur
  # (en root) doivent redevenir accessibles a `node`. Idempotent, sans
  # suppression de donnees. `chmod` : on laisse l'acces au groupe, comme
  # documente dans le message d'erreur ci-dessous.
  #
  # On ne lance la passe recursive QUE s'il existe reellement une entite non
  # possedee par 1000 (detection par `find -quit`, lecture seule) : sur un
  # serveur deja en bons droits, le demarrage ne coute qu'une simple lecture
  # au lieu d'un renommage de masse sur le GED. Si `find` echoue (droits,
  # volume indisponible), on repasse en mode "reparer" pour ne pas laisser
  # un deploiement dans le meme etat qu'avant.
  #
  # ATTENTION FS SANS PROPRIETE POSIX : sur un disque NTFS/exFAT/vfat ou un
  # partage CIFS/NFS monte sans uid=1000, `chown` echoue en EPERM et `chmod`
  # est sans effet : les droits sont FIXES par les options de montage de
  # l'hote. On affiche donc l'erreur (plus de 2>/dev/null) et on VERIFIE
  # l'ecriture reelle en uid 1000 avant de continuer, pour ne pas boucler
  # indefiniment sur « Permission denied ».
  can_write_as_node() {
    _dir="$1"
    if command -v setpriv >/dev/null 2>&1; then
      setpriv --reuid=1000 --regid=1000 --init-groups test -w "$_dir" 2>/dev/null
    elif command -v runuser >/dev/null 2>&1; then
      runuser -u node -- test -w "$_dir" 2>/dev/null
    else
      # Aucun outil fiable pour tester : on laisse la suite echouer avec
      # son propre message (block 0 / 0b).
      return 0
    fi
  }

  PERM_ERRORS=""
  for d in $MOUNT_DIRS; do
    OFFENDERS="$(find "$d" ! -user 1000 -print -quit 2>/dev/null)"
    FIND_RC=$?
    if [ -n "$OFFENDERS" ] || [ "$FIND_RC" -ne 0 ]; then
      echo "[entrypoint]   → droits non conformes dans $d : reparation…"
      # Journal borne : un chown refuse sur un gros GED peut produire des
      # milliers de lignes EPERM ; on n'en garde que la premiere.
      CHOWN_LOG="$(mktemp 2>/dev/null || echo /tmp/easyecole-chown.log)"
      if chown -R 1000:1000 "$d" 2>"$CHOWN_LOG"; then
        rm -f "$CHOWN_LOG"
        chmod -R u+rwX,g+rwX "$d" 2>/dev/null || true
      else
        echo "[entrypoint]   ⚠ chown refuse sur $d : $(head -n 1 "$CHOWN_LOG" 2>/dev/null)"
        rm -f "$CHOWN_LOG"
        echo "[entrypoint]     (NTFS/exFAT/SMB/NFS ignorent chown : corriger les options de montage cote hote)"
        # Dernier recours non recursif : si le FS honore chmod sans chown,
        # cela suffit pour creer des sous-dossiers a la racine du montage.
        chmod a+rwX "$d" 2>/dev/null || true
      fi
    fi
    if ! can_write_as_node "$d"; then
      PERM_ERRORS="$PERM_ERRORS $d"
    fi
  done

  SKIP_PRIVDROP=0
  if [ -n "$PERM_ERRORS" ]; then
    if [ "${ALLOW_ROOT_FALLBACK:-false}" = "true" ]; then
      echo "[entrypoint] AVERTISSEMENT : ecriture impossible en uid 1000 dans :$PERM_ERRORS"
      echo "[entrypoint] ALLOW_ROOT_FALLBACK=true : demarrage en root pour ne pas bloquer le service."
      echo "[entrypoint] Corriger les droits du montage cote hote, puis repasser ALLOW_ROOT_FALLBACK=false."
      if command -v findmnt >/dev/null 2>&1; then
        for d in $PERM_ERRORS; do
          echo "[entrypoint]   $d : $(findmnt -T "$d" -no FSTYPE,OPTIONS 2>/dev/null)"
        done
      fi
      SKIP_PRIVDROP=1
    else
      echo "[entrypoint] ERREUR : ecriture impossible en uid 1000 dans :$PERM_ERRORS"
      echo "[entrypoint] Le systeme de fichiers des montages n'applique pas chown/chmod."
      if command -v findmnt >/dev/null 2>&1; then
        for d in $PERM_ERRORS; do
          echo "[entrypoint]   $d : $(findmnt -T "$d" -no FSTYPE,OPTIONS 2>/dev/null)"
        done
      fi
      echo "[entrypoint] Cas 1 - disque ext4/xfs/btrfs (POSIX) : chown doit fonctionner."
      echo "[entrypoint]   sudo chown -R 1000:1000 /mnt/easyecole-documents /mnt/easyecole-storage"
      echo "[entrypoint]   verifier aussi que le disque n'est pas monte en 'ro'."
      echo "[entrypoint] Cas 2 - disque NTFS/exFAT/vfat : les droits viennent du montage."
      echo "[entrypoint]   /etc/fstab : uid=1000,gid=1000,umask=0002 (ajouter permissions si ntfs-3g)"
      echo "[entrypoint]   sudo mount -a"
      echo "[entrypoint] Cas 3 - Docker avec userns-remap : 'root' conteneur != root hote."
      echo "[entrypoint]   docker info | grep -i userns  (desactiver userns-remap pour ce service)"
      echo "[entrypoint] Controle : sudo -u '#1000' touch /mnt/easyecole-documents/created/_legacy/storage/.write-test"
      exit 1
    fi
  fi

  if [ "$SKIP_PRIVDROP" = "0" ]; then
    echo "[entrypoint] Droits alignes (uid 1000 = node). Reprise en tant que 'node'..."

    # Abandon des privileges : setpriv (util-linux) prioritaire, runuser en repli.
    # Chemin ABSOLU du script : la re-execution doit retrouver le script quel que
    # soit le repertoire courant du process re-execute.
    SCRIPT_PATH="$(readlink -f "$0" 2>/dev/null || echo "$0")"
    if command -v setpriv >/dev/null 2>&1; then
      exec setpriv --reuid=1000 --regid=1000 --init-groups "$SCRIPT_PATH" "$@"
    fi
    if command -v runuser >/dev/null 2>&1; then
      exec runuser -u node -- "$SCRIPT_PATH" "$@"
    fi
    # Repli final : Node est TOUJOURS present dans l'image et sait poser les
    # identites lui-meme (process.setuid/setgid). Aucune dependance systeme.
    if command -v node >/dev/null 2>&1; then
      echo "[entrypoint] Repli : changement d'identite realise via Node."
      exec node -e '
        const { spawnSync } = require("child_process");
        process.setgroups([]);
        process.setgid(1000);
        process.setuid(1000);
        const r = spawnSync(process.argv[1], process.argv.slice(2), { stdio: "inherit" });
        process.exit(r.status === null ? 1 : r.status);
      ' "$SCRIPT_PATH" "$@"
    fi

    echo "[entrypoint] ERREUR : impossible d'abandonner les privilèges root."
    echo "[entrypoint] → Installer util-linux dans l'image (Dockerfile, étape runtime)."
    exit 1
  fi
fi

# -----------------------------------------------------------------------------
# 0. STOCKAGE PERSISTANT DES PDF — /app/storage/pdfs
# -----------------------------------------------------------------------------
# En production, /app/storage est un BIND MOUNT historique sur l'hôte
# (${STORAGE_HOST_PATH:-/mnt/easyecole-documents/created/_legacy/storage}) :
# tout fichier écrit ici survit aux redéploiements, rollbacks et recréations
# de conteneur. Les nouveaux PDF générés vont dans /app/documents/created/.
#
# On vérifie ICI, AVANT migrations et seeds, que :
#   - le dossier existe — création idempotente : `mkdir -p` ne crée que ce
#     qui manque, ne supprime JAMAIS rien (aucun rm -rf, aucun nettoyage de
#     PDF au démarrage) ;
#   - il est accessible en écriture par l'utilisateur `node` du conteneur.
#
# Échec → on sort avec un message explicite (fail-fast, comme les migrations)
# plutôt que de laisser l'API démarrer puis échouer silencieusement au
# premier enregistrement de PDF.
PDFS_DIR="/app/storage/pdfs"
if ! mkdir -p "$PDFS_DIR"; then
  echo "[entrypoint] ERREUR : impossible de créer $PDFS_DIR."
  echo "[entrypoint] → le bind mount /app/storage est-il présent dans docker-compose.prod.yml ?"
  exit 1
fi
if [ ! -w "$PDFS_DIR" ]; then
  echo "[entrypoint] ERREUR : $PDFS_DIR n'est pas accessible en écriture (uid=$(id -u))."
  echo "[entrypoint] → Verifier le service init-storage (docker compose logs init-storage)"
  echo "[entrypoint]   et les montages /mnt/easyecole-documents / /mnt/easyecole-storage."
  echo "[entrypoint]   Puis relancer le deploiement."
  exit 1
fi
echo "[entrypoint] Stockage PDF OK : $PDFS_DIR (écriture autorisée — aucun fichier existant modifié)"

# -----------------------------------------------------------------------------
# 0b. RÉPERTOIRES FICHIERS — /app/public, /app/uploads (bind mounts hôte)
# -----------------------------------------------------------------------------
# Même logique que /app/storage/pdfs, mais pour les AUTRES bind mounts.
# Pourquoi c'est indispensable : dès que /app/public et /app/uploads sont des
# BIND MOUNTS sur l'hôte, les sous-dossiers créés DANS l'image au build
# (voir Dockerfile, bloc `RUN mkdir -p`) sont MASQUÉS par le montage. Or
# multer (src/core/config/upload.ts) écrit dans public/uploads/{images,
# documents,videos} SANS créer le dossier → ENOENT/EACCES au premier upload
# sur un hôte neuf.
# On (re)crée donc ici, de façon IDEMPOTENTE (mkdir -p ne supprime jamais
# rien), tous les dossiers d'écriture runtime attendus sous ces montages.
FILE_DIRS="/app/public/uploads/images /app/public/uploads/documents /app/public/uploads/videos /app/public/docgen/cachets /app/public/auth/profiles /app/public/auth/apprenants/photos /app/public/auth/enseignants/photos /app/public/elearning/videos /app/public/inscription/bordereaux /app/public/inscription/dossiers /app/uploads/pv /app/documents/uploads /app/documents/created"
for d in $FILE_DIRS; do
  if ! mkdir -p "$d"; then
    echo "[entrypoint] ERREUR : impossible de créer $d."
    echo "[entrypoint] → le bind mount hôte (/app/public, /app/uploads) est-il monté ?"
    exit 1
  fi
done
for d in /app/public /app/uploads /app/config /app/.keys /app/backups /app/documents; do
  if [ ! -w "$d" ]; then
    echo "[entrypoint] ERREUR : $d n'est pas accessible en écriture (uid=$(id -u))."
    echo "[entrypoint] → Verifier le service init-storage (docker compose logs init-storage)"
    echo "[entrypoint]   et les montages /mnt/easyecole-documents / /mnt/easyecole-storage."
    echo "[entrypoint]   Puis relancer le deploiement."
    exit 1
  fi
done
echo "[entrypoint] Répertoires fichiers OK (public/, uploads/, documents/) — écriture autorisée"

# -----------------------------------------------------------------------------
# 0c. AMORÇAGE DU SCHÉMA DE BASE (AVANT les migrations) — base NEUVE uniquement
# -----------------------------------------------------------------------------
# POURQUOI ICI (et pas après) : les fichiers `migrations/*.sql` sont des
# migrations d'ÉVOLUTION — elles font des ALTER/INSERT sur des tables qui
# SUPPOSENT donc déjà exister. Or sur une base NEUVE (premier déploiement),
# AUCUNE table n'existe : la 1ère migration (`001_salleId_bulletins.sql`) échoue
# alors en `ER_NO_SUCH_TABLE` (ins_bulletins) et, fail-fast oblige, le conteneur
# ne démarre JAMAIS. Le schéma de base n'étant créé que par l'application — qui
# démarre APRÈS les migrations —, on aboutit à une impasse d'amorçage.
#
# On crée donc ICI les tables MANQUANTES (création seule, SANS ALTER : les
# tables existantes et leurs données ne sont JAMAIS touchées), AVANT les
# migrations. Idempotent : sur une base déjà peuplée, aucune table n'est créée
# et le script ne fait que vérifier/rapporter.
#
# Non bloquant volontairement : un échec ici ne doit pas bloquer un déploiement
# sur base EXISTANTE ; sur base neuve, l'erreur reste visible et les migrations
# échoueront juste après avec un message explicite si le schéma est incomplet.
#
# DB_PASSWORD ↔ DB_PASS : ce script historique lit `DB_PASSWORD` alors que toute
# la stack (compose, DatabaseConnection, runner de migrations) utilise `DB_PASS`.
# On fournit donc l'alias pour éviter une connexion à mot de passe vide.
if [ "${DB_BOOTSTRAP_SCHEMA:-true}" = "true" ]; then
  echo "[entrypoint] Amorçage du schéma de base (création des tables manquantes, sans ALTER)..."
  export DB_PASSWORD="${DB_PASSWORD:-${DB_PASS:-}}"
  # Le script DOIT sortir de lui-même (il ferme son pool Sequelize puis
  # process.exit). `timeout` est un FILET DE SÉCURITÉ anti-blocage : si un jour
  # le script restait suspendu, l'entrypoint ne doit JAMAIS bloquer ici — sinon
  # l'API ne démarre pas et le conteneur finit « unhealthy ».
  # Borné sous la fenêtre de santé du backend (start_period 240 s + retries).
  if command -v timeout >/dev/null 2>&1; then
    timeout 300 node lib/core/scripts/setup-production.js \
      || echo "[entrypoint] ⚠ amorçage du schéma terminé avec erreur ou interrompu (non bloquant)"
  else
    # Repli : si `timeout` est absent, on lance quand même (sinon l'amorçage
    # serait silencieusement sauté et une base neuve resterait sans tables).
    node lib/core/scripts/setup-production.js \
      || echo "[entrypoint] ⚠ amorçage du schéma terminé avec erreur (non bloquant)"
  fi
else
  echo "[entrypoint] Amorçage du schéma désactivé (DB_BOOTSTRAP_SCHEMA != true)."
fi

# Les migrations SQL incrémentales (idempotentes, suivi schema_migrations)
# sont appliquées automatiquement au démarrage (défaut), AVANT le seed et
# l'application. Comportement fail-fast : si une migration échoue, le
# conteneur ne démarre pas et le déploiement est marqué en échec (pas d'API
# à moitié migrée). Pour sauter cette étape ponctuellement :
#   MIGRATIONS_ON_BOOT=false
if [ "${MIGRATIONS_ON_BOOT:-true}" = "true" ]; then
  echo "[entrypoint] Application des migrations SQL (incrémental)..."
  # `|| exit 1` est rendu explicite malgré `set -e` : le comportement fail-fast
  # (déploiement en échec si une migration échoue) ne doit pas dépendre du shell.
  node /app/scripts/apply-migrations.cjs || exit 1
else
  echo "[entrypoint] Migrations au démarrage désactivées (MIGRATIONS_ON_BOOT != true)."
  echo "[entrypoint] → les appliquer à la demande : npm run db:migrate"
fi

# `|| echo` neutralise volontairement `set -e` sur ces lignes : les seeds
# ne doivent pas empêcher l'application de démarrer. Le runner de
# migrations ci-dessus, lui, reste bloquant.

# Seeds fonctionnels idempotents (comptes système, rôles RBAC, docgen,
# GED, documents requis par niveau, paramètres de frais) + contrôle de
# santé des tables critiques. POINT D'ENTRÉE UNIQUE des seeds : tout nouveau
# seed fonctionnel doit être branché dans lib/core/scripts/seed-boot.js
# (voir les règles en tête de src/core/scripts/seed-boot.ts).
# Non bloquant volontairement : une erreur de seed ne doit pas empêcher
# l'API de démarrer — elle est visible dans les logs au boot.
echo "[entrypoint] Seeds fonctionnels (seed-boot)..."
# `timeout` = FILET DE SÉCURITÉ : les seeds sont NON BLOQUANTS par contrat
# (une erreur ne doit pas empêcher l'API de démarrer). On les borne donc pour
# qu'une lenteur ou un blocage (verrou DDL, latence base) ne retienne JAMAIS
# l'API sur le chemin critique — sinon le conteneur finit « unhealthy ».
# Non destructif : les seeds sont idempotents, ils se termineront au boot suivant.
if command -v timeout >/dev/null 2>&1; then
  timeout 600 node lib/core/scripts/seed-boot.js \
    || echo "[entrypoint] ⚠ Seed boot terminé avec erreur ou interrompu (non bloquant)"
else
  node lib/core/scripts/seed-boot.js \
    || echo "[entrypoint] ⚠ Seed boot terminé avec erreur (non bloquant)"
fi

echo "[entrypoint] Démarrage de l'application..."
exec node index.js "$@"
