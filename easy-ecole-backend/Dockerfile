# =============================================================================
# EasyEcole - Backend API (Express / Sequelize / TypeScript)
# Build multi-stage.
#
# NOTE SUR L'IMAGE : on utilise node:22-bookworm-slim (Debian) et NON alpine
# car le runtime a besoin de :
#   - Chromium (via puppeteer, utilisé pour la génération des cartes étudiantes
#     et des PDF docgen) — les libs système nécessaires sont fournies en Debian
#   - ffmpeg (via fluent-ffmpeg, traitement vidéo module eLearning)
# Une image alpine nécessiterait d'installer des paquets musl supplémentaires
# et n'est pas la voie la plus robuste ici.
#
# Le build (Babel) est indépendant du runtime : lib/ + node_modules de
# production suffisent. Les sources TS ne sont pas copiées dans l'image finale.
# =============================================================================

# -----------------------------------------------------------------------------
# ÉTAPE 1 — BUILD : compilation TypeScript via Babel -> lib/
# -----------------------------------------------------------------------------
FROM node:22-bookworm-slim AS build

WORKDIR /app

# Manifestes pour profiter du cache Docker
COPY package.json package-lock.json ./
COPY .babelrc ./

# Le script postinstall de puppeteer tente de télécharger Chrome pendant
# `npm ci`. Inutile pour la compilation Babel : on le saute ici (le stage
# runtime, lui, installe réellement Chromium).
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Installation des dépendances (y compris dev : @babel/cli, ts, etc.)
#
# OPTIONS DE ROBUSTESSE ET DE RAPIDITÉ (build Dokploy) :
#  - --mount=type=cache : le cache npm survit aux rebuilds. Sans lui, chaque
#    déploiement retélécharge TOUS les tarballs (mesuré : ~30 min sur le
#    serveur). Avec lui, un rebuild ne récupère que ce qui manque.
#  - --fetch-retries* / --fetch-timeout : une coupure réseau côté registre
#    (npm error code ECONNRESET) est retentée au lieu de faire échouer tout
#    le déploiement.
#  - --no-audit --no-fund : l'audit parcourt l'arbre complet sur le réseau,
#    sans aucun effet sur le contenu de node_modules.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund \
      --fetch-retries=3 --fetch-retry-mintimeout=2000 --fetch-retry-maxtimeout=15000 \
      --fetch-timeout=120000

# Sources TypeScript (les tests et scripts dev sont exclus via .dockerignore)
COPY tsconfig.json ./
COPY src ./src

# Script npm réel du package.json : "build": "babel src --out-dir lib --copy-files --extensions .ts,.js"
RUN npm run build

# -----------------------------------------------------------------------------
# ÉTAPE 2 — RUNTIME
# -----------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runtime

# Variable d'environnement par défaut : charge lib/app (compilé) via index.js
# et active le mode production côté Sequelize (sync désactivé, pas d'alter).
ENV NODE_ENV=production

WORKDIR /app

# ---------------------------------------------------------------------------
# Dépendances système requises par :
#  - puppeteer/Chromium (cartes étudiantes, docgen PDF)   -> libs Chrome
#  - fluent-ffmpeg (vidéos eLearning)                     -> ffmpeg
# ---------------------------------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    unzip \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    libxkbcommon0 \
    libx11-6 \
    libgcc-s1 \
    libstdc++6 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# Dépendances npm de PRODUCTION uniquement (pas de devDependencies).
# PUPPETEER_CACHE_DIR : force le téléchargement de Chromium dans un dossier
# prévisible, re-créé au runtime par l'utilisateur non-root `node`.
#
# Mêmes options que le stage build (cache npm persistant, retries réseau) :
# c'est CETTE étape qui télécharge Chromium (~150 Mo), donc c'est elle qui
# était la plus longue et la plus exposée aux ECONNRESET.
# ---------------------------------------------------------------------------
COPY package.json package-lock.json ./
ENV PUPPETEER_CACHE_DIR=/opt/puppeteer_cache
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --no-audit --no-fund \
      --fetch-retries=3 --fetch-retry-mintimeout=2000 --fetch-retry-maxtimeout=15000 \
      --fetch-timeout=120000

# ---------------------------------------------------------------------------
# Artefact compilé + point d'entrée
# ---------------------------------------------------------------------------
COPY --from=build /app/lib ./lib
COPY index.js ./
COPY docker-entrypoint.sh ./

# ---------------------------------------------------------------------------
# Migrations SQL + runner
# ---------------------------------------------------------------------------
# Ces fichiers étaient jusqu'ici montés EN VOLUME manuellement dans Dokploy à
# chaque déploiement (source de la « gymnastique » et des schémas partiels). Ils
# sont désormais versionnés dans le dépôt et copiés dans l'image : le
# déploiement est reproductible, sans configuration manuelle.
#
# - migrations/                 : un fichier .sql = une migration
# - scripts/apply-migrations.cjs: runner (CommonJS, sans dépendance de dev)
# ---------------------------------------------------------------------------
COPY migrations ./migrations
COPY scripts/apply-migrations.cjs ./scripts/apply-migrations.cjs
RUN chmod +x docker-entrypoint.sh

# ---------------------------------------------------------------------------
# Répertoires d'écriture (montés en volumes nommés dans docker-compose.yml :
#   uploads -> /app/public   (photos, GED, dossiers, docgen, multer…)
#   storage -> /app/storage  (cartes étudiantes générées, docgen)
# Ils sont créés DANS l'image pour que Docker initialise le volume nommé avec
# l'arborescence attendue (multer ne crée pas les dossiers lui-même).
# ---------------------------------------------------------------------------
RUN mkdir -p \
    /app/public/uploads/images \
    /app/public/uploads/documents \
    /app/public/uploads/videos \
    /app/public/ged \
    /app/public/docgen/cachets \
    /app/public/auth/profiles \
    /app/public/auth/apprenants/photos \
    /app/public/auth/enseignants/photos \
    /app/public/elearning/videos \
    /app/public/inscription/bordereaux \
    /app/public/inscription/dossiers \
    /app/storage/cartes \
    /app/storage/docgen \
    && chown -R node:node /app

# Utilisateur non-root (les processus Node/Chromium tournent avec --no-sandbox
# côté application, déjà géré dans le code : voir GenerateurCarteService /
# PdfGeneratorService qui passent --no-sandbox --disable-setuid-sandbox).
USER node

EXPOSE 3000

# ---------------------------------------------------------------------------
# CMD = entrypoint lance le seed comptes système puis démarre l'application.
# Le seed est idempotent : les comptes sont créés s'ils manquent, mis à jour
# si le rôle a changé, ignorés si déjà correct.
# IMPORTANT : app.ts utilise `process.argv[2]` comme adresse d'écoute.
# ---------------------------------------------------------------------------
CMD ["./docker-entrypoint.sh", "0.0.0.0"]
