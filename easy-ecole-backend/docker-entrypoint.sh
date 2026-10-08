#!/bin/sh
# =============================================================================
# docker-entrypoint.sh — Entrypoint Dokploy
#
# 0. Vérifie/crée le stockage persistant des PDF (/app/storage/pdfs)
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
