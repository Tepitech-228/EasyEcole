#!/bin/sh
# =============================================================================
# docker-entrypoint.sh — Entrypoint Dokploy
#
# 1. Applique les migrations SQL incrémentales (idempotentes, suivi
#    schema_migrations) — FAIL-FAST : si une migration échoue, le conteneur
#    ne démarre pas (le déploiement est marqué en échec, pas d'API à moitié.
# 2. Lance le seed des comptes système + autorisations (idempotent)
# 3. Démarre l'application (node index.js)
#
# Les fichiers de migration sont montés en volume (./migrations:/app/migrations)
# et le runner scripts/apply-migrations.cjs est monté sur /app/scripts/.
# =============================================================================

set -e

echo "[entrypoint] Application des migrations SQL (incrémental)..."
node /app/scripts/apply-migrations.cjs || exit 1

echo "[entrypoint] Seed des comptes système..."
node lib/core/scripts/seed-comptes-par-role.js || echo "[entrypoint] ⚠ Seed compte terminé avec erreur (non bloquant)"

echo "[entrypoint] Démarrage de l'application..."
exec node index.js "$@"
