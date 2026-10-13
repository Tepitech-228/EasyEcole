#!/bin/sh
# =============================================================================
# docker-entrypoint.sh — Entrypoint Dokploy
#
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
# 0. STOCKAGE PERSISTANT DES PDF — /app/storage/pdfs
# -----------------------------------------------------------------------------
# En production, /app/storage est un BIND MOUNT sur l'hôte
# (${STORAGE_HOST_PATH:-/opt/mon-app/storage}) : tout fichier écrit ici
# survit aux redéploiements, rollbacks et recréations de conteneur.
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
  echo "[entrypoint] → le bind mount /app/storage est-il présent dans docker-compose.yml ?"
  exit 1
fi
if [ ! -w "$PDFS_DIR" ]; then
  echo "[entrypoint] ERREUR : $PDFS_DIR n'est pas accessible en écriture (uid=$(id -u))."
  echo "[entrypoint] → Sur l'hôte (VM Linux), exécuter AVANT le déploiement :"
  echo "[entrypoint]    sudo mkdir -p /opt/mon-app/storage/pdfs"
  echo "[entrypoint]    sudo chown -R 1000:1000 /opt/mon-app/storage"
  echo "[entrypoint]    sudo chmod -R u+rwX,g+rwX /opt/mon-app/storage"
  echo "[entrypoint]   (1000:1000 = utilisateur node ; vérifier avec : id node)"
  echo "[entrypoint]   Puis relancer le déploiement."
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
FILE_DIRS="/app/public/uploads/images /app/public/uploads/documents /app/public/uploads/videos /app/public/docgen/cachets /app/public/auth/profiles /app/public/auth/apprenants/photos /app/public/auth/enseignants/photos /app/public/elearning/videos /app/public/inscription/bordereaux /app/public/inscription/dossiers /app/uploads/pv"
for d in $FILE_DIRS; do
  if ! mkdir -p "$d"; then
    echo "[entrypoint] ERREUR : impossible de créer $d."
    echo "[entrypoint] → le bind mount hôte (/app/public, /app/uploads) est-il monté ?"
    exit 1
  fi
done
for d in /app/public /app/uploads /app/config /app/.keys /app/backups; do
  if [ ! -w "$d" ]; then
    echo "[entrypoint] ERREUR : $d n'est pas accessible en écriture (uid=$(id -u))."
    echo "[entrypoint] → Sur l'hôte (VM Linux), exécuter AVANT le déploiement :"
    echo "[entrypoint]    sudo mkdir -p /opt/mon-app/{public,uploads,storage,config,keys,backups}"
    echo "[entrypoint]    sudo chown -R 1000:1000 /opt/mon-app"
    echo "[entrypoint]    sudo chmod -R u+rwX,g+rwX /opt/mon-app"
    echo "[entrypoint]   (1000:1000 = utilisateur node ; vérifier avec : id node)"
    echo "[entrypoint]   Puis relancer le déploiement."
    exit 1
  fi
done
echo "[entrypoint] Répertoires fichiers OK (public/, uploads/) — écriture autorisée"

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
  node lib/core/scripts/setup-production.js || echo "[entrypoint] ⚠ amorçage du schéma terminé avec erreur (non bloquant)"
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
node lib/core/scripts/seed-boot.js || echo "[entrypoint] ⚠ Seed boot terminé avec erreur (non bloquant)"

echo "[entrypoint] Démarrage de l'application..."
exec node index.js "$@"
