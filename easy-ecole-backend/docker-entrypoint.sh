#!/bin/sh
# =============================================================================
# docker-entrypoint.sh — Entrypoint Dokploy
#
# 1. Lance le seed des comptes système + autorisations (idempotent)
# 2. Démarre l'application (node index.js)
# =============================================================================

set -e

echo "[entrypoint] Seed des comptes système..."
node lib/core/scripts/seed-comptes-par-role.js || echo "[entrypoint] ⚠ Seed compte terminé avec erreur (non bloquant)"

echo "[entrypoint] Démarrage de l'application..."
exec node index.js "$@"
