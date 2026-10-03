#!/bin/sh
# =============================================================================
# docker-entrypoint.sh — Entrypoint Dokploy
#
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

# Les migrations ne sont plus appliquées automatiquement au démarrage.
# Raison : une migration en échec (ou destructive) rendait le conteneur
# INUTILISABLE (fail-fast), et 015_seed_filieres_inscription.sql supprime les
# parcours non utilisés + la contrainte UNIQUE sur ins_parcours.titre — Applied
# automatiquement, elle efface le référentiel des formations.
# Les migrations s'appliquent donc à la demande, sur une base validée :
#   docker compose exec backend npm run db:migrate
# ou, dans Dokploy, en activant ponctuellement MIGRATIONS_ON_BOOT=true.
if [ "${MIGRATIONS_ON_BOOT:-false}" = "true" ]; then
  echo "[entrypoint] Application des migrations SQL (incrémental)..."
  # `|| exit 1` est rendu explicite malgré `set -e` : le comportement fail-fast
  # (déploiement en échec si une migration échoue) ne doit pas dépendre du shell.
  node /app/scripts/apply-migrations.cjs || exit 1
else
  echo "[entrypoint] Migrations au démarrage désactivées (MIGRATIONS_ON_BOOT != true)."
  echo "[entrypoint] → les appliquer à la demande : npm run db:migrate"
fi

# `|| echo` neutralise volontairement `set -e` sur cette ligne : le seed des
# comptes ne doit pas empêcher l'application de démarrer. Le runner de
# migrations ci-dessus, lui, reste bloquant.
echo "[entrypoint] Seed des comptes système..."
node lib/core/scripts/seed-comptes-par-role.js || echo "[entrypoint] ⚠ Seed comptes terminé avec erreur (non bloquant)"

echo "[entrypoint] Démarrage de l'application..."
exec node index.js "$@"
