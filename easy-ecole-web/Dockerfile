# =============================================================================
# EasyEcole - Frontend (Angular 12, module-based)
# Build multi-stage.
#
# ATTENTION NODE/ANGULAR 12 : le build Angular 12 sur Node moderne (>= 17)
# échoue avec ERR_OSSL_EVP_UNSUPPORTED. Le workaround est :
#     NODE_OPTIONS=--openssl-legacy-provider
# (constaté en local sur Node 22 — la commande npm "build" du projet la pose
# aussi, mais uniquement pour Windows via `set`, ce qui est ignoré par sh).
# On la pose donc en ENV du stage build pour être sûr qu'elle s'applique.
# =============================================================================

# -----------------------------------------------------------------------------
# ÉTAPE 1 — BUILD : ng build (configuration "production", la configuration par
# défaut de angular.json)
# -----------------------------------------------------------------------------
FROM node:22-bookworm-slim AS build

# NODE_OPTIONS : --openssl-legacy-provider (compat Angular 12 / Node >=17) et
# une limite de heap raisonnable (le build Angulaire double passe ES2015+ES5 est
# gourmand en mémoire ; 3072 Mo est un bon compromis sous Docker Desktop).
ENV NODE_OPTIONS="--openssl-legacy-provider --max-old-space-size=3072"
ENV NG_CLI_ANALYTICS=false

WORKDIR /app

# Manifestes pour le cache Docker
COPY package.json package-lock.json ./

# Installation des dépendances (npm 10 exécute les scripts postinstall de
# core-js / esbuild / @angular/cli — attendus ici)
RUN npm ci

# Sources de l'application
COPY angular.json ./
COPY tsconfig.json tsconfig.app.json tsconfig.spec.json ./
# Configuration Tailwind INDISPENSABLE au build : sans elle, PostCSS charge
# Tailwind avec sa config par défaut (aucun glob "content") et purge TOUTES
# les classes utilitaires -> CSS vide en production alors que ng serve local
# fonctionne (le fichier existe sur disque).
COPY tailwind.config.js ./
COPY src ./src

# Script npm réel : "build": "... && ng build" (production par défaut,
# sortie dans dist/easy-ecole-web)
RUN npm run build

# -----------------------------------------------------------------------------
# ÉTAPE 2 — RUNTIME : nginx
# -----------------------------------------------------------------------------
FROM nginx:1.27-alpine

# Fichier de configuration nginx : proxy /api -> backend:3000, SPA fallback,
# gzip, WebSocket /socket.io, médias /media.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Artefact Angular compilé
COPY --from=build /app/dist/easy-ecole-web /usr/share/nginx/html

EXPOSE 80

# CMD par défaut de l'image nginx (nginx -g 'daemon off;')
