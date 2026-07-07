# Audit de Sécurité & Architecture — EasyEcole

**Date :** 07/07/2026  
**Projet :** EasyEcole (ERP Éducatif Fullstack)  
**Stack :** Angular 12.2 + Express/TypeScript + Sequelize/MySQL  
**Portée :** Backend (`easy-ecole-backend/`) + Frontend (`easy-ecole-web/`)

---

## Table des matières

1. [Résumé Exécutif](#1-résumé-exécutif)
2. [Vulnérabilités Critiques](#2-vulnérabilités-critiques)
3. [Vulnérabilités Hautes](#3-vulnérabilités-hautes)
4. [Vulnérabilités Moyennes](#4-vulnérabilités-moyennes)
5. [Bonnes Pratiques & Architecture](#5-bonnes-pratiques--architecture)
6. [Plan de Correction Priorisé](#6-plan-de-correction-priorisé)

---

## 1. Résumé Exécutif

| Niveau | Nombre |
|--------|--------|
| Critique | 4 |
| Haut | 6 |
| Moyen | 8 |
| Bas | 3 |

**Problèmes majeurs :** secrets en clair dans le dépôt Git (SMTP, CinetPay, JWT), absence d'expiration des tokens JWT, mass assignment généralisé sur toutes les entités, pas de validation structurée des entrées, pas de HTTPS en production par défaut, `{ alter: true }` risqué en production.

---

## 2. Vulnérabilités Critiques

### C-01 — Identifiants SMTP en clair dans le dépôt

**Fichier :** `easy-ecole-backend/src/core/config/mail.json` (lignes 2-7)  
**Risque :** Vol de compte email, usurpation d'identité, spam  
**Détail :** Le mot de passe SMTP (`Easyec@le1`) est stocké en clair et commité dans Git. Le fichier n'est pas dans `.gitignore`.

**Solution :** Supprimer du Git (`git rm --cached`), utiliser des variables d'environnement via `.env`, appliquer `dotenv` au démarrage.

```json
// mail.json → NE PLUS UTILISER
// Utiliser process.env.SMTP_HOST, process.env.SMTP_USER, process.env.SMTP_PASS
```

```ts
// Exemple d'implémentation EmailSender.ts
const config = {
  host: process.env.SMTP_HOST,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}
```

---

### C-02 — Clé API CinetPay en clair dans le dépôt

**Fichier :** `easy-ecole-backend/src/core/config/cinetpay.json` (lignes 2-6)  
**Risque :** Paiements frauduleux, fuite de données bancaires  
**Détail :** `site_id` (`5865931`) et `apikey` (`15300778846557a06f4267d7.52002805`) en clair.

**Solution :** Retirer du Git, utiliser des variables d'environnement, faire tourner les clés via `.env` :

```
CINETPAY_SITE_ID=...
CINETPAY_API_KEY=...
CINETPAY_API_URL=https://api-checkout.cinetpay.com/v2/payment
```

---

### C-03 — Secret JWT en dur avec valeur par défaut faible

**Fichier :** `easy-ecole-backend/src/core/config/jwt.ts`  
**Risque :** Forge de tokens JWT, usurpation de session, prise de contrôle admin  
**Détail :** `export const JWT_SECRET = process.env.JWT_SECRET || 'secret'` — si la variable d'env n'est pas définie, le secret est littéralement `'secret'`.

**Solution :** Rendre la variable d'environnement OBLIGATOIRE en production, générer un secret fort (≥ 256 bits) :

```ts
export const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be defined in production')
  }
  return secret || 'dev-secret-do-not-use-in-production'
})()
```

---

### C-04 — Token JWT de connexion sans expiration

**Fichier :** `easy-ecole-backend/src/modules/auth/controllers/AuthController.ts` (lignes 40-49)  
**Risque :** Session permanente, vol de token = accès illimité  
**Détail :** `jwt.sign({ id, email, identifiant, role }, JWT_SECRET)` ne spécifie pas `expiresIn`. Le token ne expire JAMAIS.

**Solution :** Ajouter `expiresIn` au login :

```ts
const token = jwt.sign(
  { id: utilisateur.id, email: utilisateur.email, identifiant: utilisateur.identifiant, role: utilisateur.role },
  JWT_SECRET,
  { expiresIn: '24h' } // ou '7d' selon les besoins métier
)
```

---

## 3. Vulnérabilités Hautes

### H-01 — Mass Assignment généralisé

**Fichiers :** Tous les contrôleurs (`*Controller.ts`) dans `src/modules/*/controllers/`  
**Risque :** Modification non autorisée de champs sensibles (rôle, statut, etc.)  
**Détail :** Pattern récurrent : `Model.create({ ...req.body })` et `model.update({ ...req.body })`. L'attaquant peut injecter des champs comme `role`, `isAdmin`, `motDePasse`, `id`.

**Solution :** Appliquer un allowed fields whitelist :

```ts
// Avant
const item = await User.create({ ...req.body })

// Après
const allowedFields = ['nom', 'prenoms', 'email', 'contact']
const filteredData = pick(req.body, allowedFields) // lodash.pick ou manuel
const item = await User.create(filteredData)
```

Ou utiliser les options `fields` de Sequelize :

```ts
await User.create(req.body, { fields: ['nom', 'prenoms', 'email', 'contact'] })
```

---

### H-02 — Absence de validation des entrées utilisateur

**Fichiers :** Tous les contrôleurs métier  
**Risque :** Injection NoSQL, XSS, crash applicatif, corruption de données  
**Détail :** Aucune bibliothèque de validation (Zod, Joi, class-validator). Seuls les notes ont une validation basique. Les paramètres `req.query`, `req.params`, `req.body` sont utilisés sans nettoyage.

**Solution :** Intégrer Zod (léger, TypeScript-first) sur les entrées critiques :

```ts
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  motDePasse: z.string().min(8).max(128),
})

// Dans le contrôleur
const parsed = loginSchema.safeParse(req.body)
if (!parsed.success) {
  return res.status(400).json({ errors: parsed.error.flatten() })
}
```

---

### H-03 — Pas de limitation de débit sur le login

**Fichier :** `easy-ecole-backend/src/app.ts` (lignes 60-67)  
**Risque :** Brute-force sur les mots de passe  
**Détail :** Le rate limiter global est à 200 req/15min pour TOUTES les routes. La route `/auth/login` n'a pas de limite spécifique.

**Solution :** Appliquer un rate limiter spécifique sur `/auth/login` :

```ts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 tentatives par fenêtre
  message: { success: false, message: 'Trop de tentatives, réessayez plus tard' }
})

router.post('/login', loginLimiter, AuthController.login)
```

---

### H-04 — CORS en wildcard

**Fichier :** `easy-ecole-backend/src/app.ts` (ligne 44)  
**Risque :** Requêtes cross-origin non autorisées, vol de données  
**Détail :** `origin: process.env.CORS_ORIGIN || '*'` — en production, si la variable n'est pas définie, l'API est accessible depuis n'importe quel domaine.

**Solution :** Rendre la variable obligatoire en production et restreindre aux domaines autorisés :

```ts
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:4200']
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}
```

---

### H-05 — Sync base de données risquée en production

**Fichier :** `easy-ecole-backend/src/core/helpers/DatabaseConnection.ts` (ligne 47)  
**Risque :** Perte de données, altération de schéma  
**Détail :** `await this._sequelize.sync({ alter: true })` exécuté à CHAQUE démarrage. En production, peut supprimer/modifier des colonnes.

**Solution :** Utiliser les migrations Sequelize et désactiver `alter: true` en production :

```ts
if (process.env.NODE_ENV !== 'production') {
  await this._sequelize.sync({ alter: true })
} else {
  // Utiliser les migrations à la place
}
```

---

### H-06 — Mot de passe réinitialisé via GET avec query params

**Fichier :** `easy-ecole-backend/src/modules/auth/routers/AuthRouter.ts` (ligne 191)  
**Risque :** Exposition du token de reset dans les logs serveur / historique navigateur  
**Détail :** `GET /auth/send-password-reset-link?email=...&redirectTo=...` — les paramètres sont en query string, visibles dans les logs.

**Solution :** Passer en POST avec body JSON :

```ts
router.post('/send-password-reset-link', AuthController.sendPasswordResetLink)
```

---

## 4. Vulnérabilités Moyennes

### M-01 — Token stocké dans localStorage

**Fichier :** `easy-ecole-web/src/app/core/services/local-storage.service.ts`  
**Risque :** Vol de token via XSS  
**Détail :** Le stockage en localStorage est accessible par tout script JS. Un cookie httpOnly est plus sûr.

**Solution :** Utiliser des cookies httpOnly + secure + sameSite pour le token. Alternativement, garder localStorage mais implémenter un refresh token pattern.

---

### M-02 — Frontend Angular 12.2 non supporté

**Fichier :** `easy-ecole-web/package.json`  
**Risque :** Vulnérabilités connues non patchées  
**Détail :** Angular 12.2 (LTS terminée). Dernière version stable : Angular 19+.

**Solution :** Migrer vers Angular 19+ (LTS actif). Procéder par étapes : 12 → 14 → 16 → 18 → 19.

---

### M-03 — jQuery présent dans les dépendances

**Fichier :** `easy-ecole-web/package.json` (ligne 34 : `"jquery": "^3.6.0"`)  
**Risque :** Surface d'attaque XSS étendue  
**Détail :** jQuery est une dépendance lourde et source connue de vulnérabilités XSS.

**Solution :** Supprimer jQuery si non utilisé, ou migrer vers des alternatives vanilla/ Angular natives.

---

### M-04 — Production utilise HTTP (pas HTTPS)

**Fichier :** `easy-ecole-web/src/environments/environment.prod.ts` (ligne 2)  
**Risque :** Interception des communications, vol de token  
**Détail :** `const apiBaseUrl: string = "http://" + hostname + ":3000/"` en production.

**Solution :** Forcer HTTPS dans l'environnement de production :

```ts
// environment.prod.ts
const apiBaseUrl: string = "https://api.easyecole.com/"
```

---

### M-05 — Aucun interceptor pour les 401

**Fichier :** `easy-ecole-web/src/app/core/interceptors/token-interceptor.service.ts`  
**Risque :** Token expiré non géré, utilisateur reste bloqué  
**Détail :** L'interceptor n'attache pas de gestionnaire d'erreur 401 (déconnexion automatique).

**Solution :** Ajouter un intercepteur 401 :

```ts
intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  return next.handle(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        localStorageService.remove(LocalStorageService.AUTH_TOKEN)
        router.navigate(['/auth/connexion'])
      }
      return throwError(() => error)
    })
  )
}
```

---

### M-06 — Pas de CSRF protection

**Risque :** Attaque CSRF sur les actions utilisateur  
**Détail :** Aucun token CSRF, double-submit cookie, ou SameSite cookie configuré côté API.

**Solution :** Implémenter un middleware CSRF (ex: `csurf` ou `lusca`) ou utiliser `SameSite=Strict` sur les cookies.

---

### M-07 — Upload de fichiers sans validation

**Fichier :** `easy-ecole-backend/src/modules/auth/routers/AuthRouter.ts` (lignes 12-27) et autres routers multer  
**Risque :** Upload de fichier malveillant, prise de contrôle du serveur  
**Détail :** Multer ne valide pas le type MIME, la taille, ni le contenu. Les fichiers sont stockés dans `public/` servis statiquement.

**Solution :** Ajouter des validations sur tous les uploads :

```ts
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Type de fichier non autorisé') as any, false)
    }
    cb(null, true)
  }
})
```

---

### M-08 — Aucune journalisation structurée

**Risque :** Détection d'intrusion difficile, audit impossible  
**Détail :** Seul `morgan` (logs HTTP) et `console.log` sont utilisés.

**Solution :** Intégrer Winston ou Pino avec rotation de logs et niveaux (info, warn, error) :

```ts
import winston from 'winston'
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
})

// Remplacer console.log
logger.info('Server started', { port, hostname, protocol })
```

---

## 5. Bonnes Pratiques & Architecture

### BP-01 — Migration vers un pattern de configuration centralisé

**Problème :** Configuration éparpillée (`sequelize.json`, `mail.json`, `cinetpay.json`, `jwt.ts`, variables d'env directes).  
**Solution :** Fichier `.env` unique + validation au démarrage :

```
# .env.example (à commiter, .env à ignorer)
NODE_ENV=development
PORT=3000
HOST=localhost
CORS_ORIGIN=http://localhost:4200

# Base de données
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=easyecole
DB_USER=root
DB_PASS=

# JWT
JWT_SECRET=your-256-bit-secret-here

# SMTP
SMTP_HOST=smtp.hostinger.com
SMTP_USER=...
SMTP_PASS=...

# CinetPay
CINETPAY_SITE_ID=...
CINETPAY_API_KEY=...

# SSL (optionnel)
SSL_KEY=
SSL_CERT=
```

```ts
// config.ts — validation au démarrage
import dotenv from 'dotenv'
dotenv.config()

const required = ['JWT_SECRET', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS']
for (const key of required) {
  if (!process.env[key] && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required env variable: ${key}`)
  }
}
```

---

### BP-02 — Migrations Sequelize au lieu de `sync({ alter: true })`

Créer un dossier `src/database/migrations/` et utiliser `sequelize-cli` :

```bash
npm install --save-dev sequelize-cli
npx sequelize-cli init
npx sequelize-cli migration:generate --name init-tables
npx sequelize-cli db:migrate
```

---

### BP-03 — Docker Compose pour l'environnement de développement

```yaml
# docker-compose.yml
version: '3.8'
services:
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASS}
      MYSQL_DATABASE: easyecole
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build: ./easy-ecole-backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DB_HOST=db
    depends_on:
      - db
      - redis

volumes:
  mysql_data:
```

---

### BP-04 — Amélioration architecturale : Séparation des préoccupations

**Problème actuel :** Les contrôleurs gèrent à la fois la validation, la logique métier et l'accès aux données.  
**Recommandation :** Adopter une architecture en couches :

```
src/modules/auth/
├── auth.controller.ts      # Gestion des requêtes/réponses HTTP
├── auth.service.ts          # Logique métier
├── auth.repository.ts       # Accès aux données
├── auth.validators.ts       # Schémas de validation (Zod)
├── auth.routes.ts           # Routes
└── models/                  # Modèles Sequelize
```

---

### BP-05 — Tests

Aucun test n'est présent dans le projet. Ajouter a minima :

- Tests unitaires avec Jest + ts-jest
- Tests d'intégration sur les endpoints critiques (auth, paiements)
- Tests de sécurité automatisés

```bash
npm install --save-dev jest ts-jest @types/jest supertest
```

---

## 6. Plan de Correction Priorisé

| Priorité | Réf | Action | Effort |
|----------|-----|--------|--------|
| P0 | C-01 | Retirer secrets SMTP du Git + passer en variables d'environnement | 1h |
| P0 | C-02 | Retirer clés CinetPay du Git + passer en variables d'environnement | 1h |
| P0 | C-03 | Rendre JWT_SECRET obligatoire en production | 30min |
| P0 | C-04 | Ajouter `expiresIn` au token de login JWT | 15min |
| P1 | H-01 | Filtrer les champs autorisés sur create/update (tous les contrôleurs) | 8h |
| P1 | H-02 | Intégrer Zod et valider toutes les entrées API | 16h |
| P1 | H-03 | Rate limiter spécifique sur `/auth/login` | 30min |
| P1 | H-04 | Restreindre CORS aux domaines autorisés | 30min |
| P1 | H-05 | Désactiver `alter: true` en production + migrations | 4h |
| P1 | H-06 | Passer le reset de mot de passe en POST | 15min |
| P2 | M-01 | Migrer le stockage du token en cookie httpOnly ou refresh token | 8h |
| P2 | M-04 | Forcer HTTPS en production | 30min |
| P2 | M-05 | Ajouter intercepteur 401 automatique | 1h |
| P2 | M-06 | Implémenter CSRF protection | 2h |
| P2 | M-07 | Valider les fichiers uploadés (type + taille) | 2h |
| P3 | M-02 | Planifier la migration Angular 12 → 19 | 40h |
| P3 | M-08 | Intégrer Winston/Pino pour la journalisation | 2h |
| P3 | BP-01 | Centraliser la configuration avec dotenv | 2h |
| P3 | BP-02 | Mettre en place les migrations Sequelize | 4h |
| P3 | BP-03 | Docker Compose pour le développement | 2h |
| P3 | BP-05 | Ajouter des tests (Jest + Supertest) | 20h |

---

*Rapport généré par audit automatique. Certaines vulnérabilités peuvent nécessiter une analyse manuelle complémentaire.*
