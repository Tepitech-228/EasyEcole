# EasyEcole — Agent Guide

Monorepo with two separate projects: Angular 12 frontend (`easy-ecole-web/`) and Express/Sequelize backend (`easy-ecole-backend/`).

## Commands

### Frontend (`easy-ecole-web/`)
- `npm start` — dev server (already sets `NODE_OPTIONS=--openssl-legacy-provider`)
- `npm run build` — production build
- `npm test` — Karma/Jasmine unit tests

### Backend (`easy-ecole-backend/`)
- `npm run dev` — nodemon hot-reload dev server on `localhost:3000`
- `npm run build` — Babel transpile `src/` → `lib/`
- `npm run db:reset` — full DB reset (sync + seed all tables)
- `npm run db:seed` — seed only
- `npm run db:sync` — sync schema only

### DB setup order (fresh start)
`db:reset` runs create → sync → seed in one step.

## Architecture

### Frontend
- **Lazy-loaded modules** under `src/app/features/modules/` (17 modules: auth, orientation, inscription, cours, stages, stocks, immobilisations, achats, rh, pointage, bulletins, communication, scolarite, elearning, reporting, administration, parametres)
- **Data layer** in `src/app/data/` — shared services, models, enums used by all modules
- **Layout** in `src/app/features/layout/` — base layout with sidebar nav, role-based menu items
- **JWT auth** via `TokenInterceptorService` — auto-attaches Bearer token from localStorage
- **Role checks** via `BaseComponentClass.rolesValue` — provides `isInstitution`, `isEnseignant`, `isApprenant`, etc.
- **State management**: RxJS Observables (no NgRx or signals)

### Backend
- **Express router** in `src/routes.ts` mounts 14 module routers under `/api/v1`
- **Module pattern**: `XxxRoutes.ts` → `XxxController.ts` → `models/Xxx.ts`
- **Model associations** in each module's `models/_associations.ts`
- **DB** MySQL via Sequelize ORM (config: `src/core/config/sequelize.json`)
- **Table prefixes** by module: `aut_`, `ori_`, `ins_`, `stg_`, `stk_`, `imm_`
- **Auth middleware** applied per-module in each route file (JWT verification)
- **Socket.io** for chat (`modules/elearning/socket/chatSocket.ts`)
- **Swagger** at `/api-docs` (development)

## Known Quirks

### Node.js + Angular 12
Node 17+ needs `--openssl-legacy-provider`. The `npm start` script handles this. Run `ng build` manually with: `$env:NODE_OPTIONS='--openssl-legacy-provider'; ng build`

### Watchpack errors on Windows
Cosmetic only — Webpack scans `E:\` root and hits system-protected paths. Build succeeds. Currently mitigated with `"poll": 2000` in `angular.json` build + serve options.

### FullCalendar v6 + Angular 12
FullCalendar v6 requires Angular 13+. Callbacks in `calendarOptions` may not fire reliably. **Always use Angular outputs** — e.g., `(dateClick)="handleDateClick($event)"` on `<full-calendar>`, not `dateClick: (arg) => ...` in options.

### QR Code generation
Faces EPERM errors on existing files. Workaround: try-catch with horodated filenames fallback (`auth/seed/PermissionSeed.ts`, `auth/controllers/ApprenantController.ts`).

### DB migrations
No migration framework — schema is synced directly from Sequelize model definitions. The `db:reset` script drops and recreates all tables. Seed data is idempotent (skips on conflict).

## Code Style
- Frontend: Angular 12 with `strictTemplates: true`, SCSS, Tailwind CSS v2
- Backend: TypeScript with `strict: true`, async/await controllers
- No lint or format commands configured — rely on editor defaults
