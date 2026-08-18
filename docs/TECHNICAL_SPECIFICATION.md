# Technical Specification & Implementation Plan
## EasyEcole — 7 Development Tasks

**Version:** 1.0  
**Date:** 2026-08-15  
**Status:** Draft for review  

---

## Table of Contents

1. [Context & Conventions](#1-context--conventions)
2. [Task 1: Transcript Generation (Relevés de notes)](#2-task-1-transcript-generation-relevés-de-notes)
3. [Task 2: Excel Report (PV Excel)](#3-task-2-excel-report-pv-excel)
4. [Task 3: First-Year Grade Restrictions](#4-task-3-first-year-grade-restrictions)
5. [Task 4: Tuition Payment Management](#5-task-4-tuition-payment-management)
6. [Task 5: Frontend Audit & Refactoring](#6-task-5-frontend-audit--refactoring)
7. [Task 6: API Security Enhancement](#7-task-6-api-security-enhancement)
8. [Task 8: Performance Optimization](#8-task-7-performance-optimization)
9. [Cross-cutting Concerns](#9-cross-cutting-concerns)

---

## 1. Context & Conventions

### 1.1 Tech Stack

| Layer | Technology | Pattern |
|-------|-----------|---------|
| Backend | NestJS + Express | Modular monolith |
| ORM | Sequelize v6+ | Active Record / Data Mapper |
| Database | PostgreSQL | Relational |
| Frontend | Angular 17+ | Standalone components, Signals |
| Auth | JWT + OTP | Role-based access control |
| File storage | Local + GED | Multi-driver |
| Payments | Cinetpay (Mobile Money) | Singleton helper |

### 1.2 Backend Conventions

- **Module structure:** `modules/{name}/` → `controllers/`, `services/`, `models/`, `routers/`, `enums/`, `validators/`, `seed.ts`
- **Controllers:** Class-based, static methods, `req`/`res` typed via `Request`/`Response`
- **Services:** Static classes with business logic; transaction support via `Transaction` param
- **Models:** Sequelize `Model<InferAttributes<T>, InferCreationAttributes<T>>` with explicit associations
- **Routes:** `routes.ts` central file importing all module routers
- **Middleware:** `core/middlewares/` — `Authenticate`, `CheckPermission`, role-specific guards
- **Validation:** Central `core/validators/` for shared rules (e.g., `noteValidators`)
- **Naming:** `TABLE_PREFIX = 'ins_'`, `MODEL_PREFIX = 'Bulletin'` for table naming

### 1.3 Frontend Conventions

- **Feature structure:** `features/modules/{name}/` → `pages/`, `components/`, `{name}.module.ts`, `{name}-routing.module.ts`
- **Data layer:** `data/modules/{name}/` → `services/`, `models/`
- **Components:** Standalone Angular components extending `BaseComponentClass`
- **Services:** Injectable services with RxJS `BehaviorSubject` patterns
- **Enums:** `data/enums/` — centralized enum definitions
- **Shared:** `shared/components/` for reusable UI, `shared/pipes/` for pipes
- **Routing:** Feature modules declare routes in `{name}-routing.module.ts`

### 1.4 Existing Relevant Modules

| Module | Purpose | Key Files |
|--------|---------|-----------|
| `bulletins` | Grades, transcripts, deliberations | `GenerationBulletinService.ts`, `GenerateurPVService.ts`, `MoteurCalculService.ts` |
| `inscription` | Students, classes, enrollments, notes | `NoteEvaluationController.ts`, `CursusApprenant.ts`, `Classe.ts` |
| `comptabilite` | Accounting, payments | `EcritureComptableService`, `PaiementInscriptionController` |
| `auth` | Users, roles, permissions | `AuthController.ts`, `RoleController.ts`, `PermissionController.ts` |
| `docgen` | Document generation, PDF | `DocumentController.ts`, `TemplateEngine` |

---

## 2. Task 1: Transcript Generation (Relevés de notes)

### 2.1 Objective

Implement a system to generate academic transcripts (Relevés de notes) filtered by **classroom (salle/classe)**, **department (département)**, **level (niveau)**, and **academic year (année académique)**, with the ability to regenerate transcripts for previous years.

### 2.2 Scope

- New backend service + controller for transcript generation
- PDF export using existing `PDFDocument` (pdfkit) infrastructure
- Frontend page with multi-criteria filters
- Regeneration capability for historical years
- Integration with existing `Bulletin` and `CursusApprenant` models

### 2.3 Data Model

No new tables required. Leverage existing:

| Entity | Fields Used |
|--------|------------|
| `CursusApprenant` | `classeId`, `parcoursId`, `niveauEtudeId`, `anneeAcademiqueId`, `utilisateurId` |
| `Bulletin` | `classeId`, `parcoursId`, `niveauEtudeId`, `anneeAcademiqueId`, `semestre`, `moyenneGenerale`, `statut` |
| `LigneBulletin` | `coursId`, `moyenneCC`, `noteDevoir`, `noteExamen`, `moyenne`, `coefficient` |
| `Classe` | `id`, `libelle`, `departementId` |
| `NiveauEtude` | `id`, `libelle` |
| `AnneeAcademique` | `id`, `libelle` |
| `Parcours` | `id`, `libelle` |

**New filter model (frontend only):**
```typescript
interface TranscriptFilter {
  anneeAcademiqueId?: number;
  classeId?: number;
  niveauEtudeId?: number;
  departementId?: number;
  parcoursId?: number;
  semestre?: 'semestre1' | 'semestre2' | 'annuel';
  includePreviousYears?: boolean;
}
```

### 2.4 Backend Implementation

**New service:** `modules/bulletins/services/TranscriptGeneratorService.ts`

```typescript
export class TranscriptGeneratorService {
  static async generateTranscripts(filters: TranscriptFilter): Promise<GenerateResult[]>
  static async regenerateTranscripts(cursusApprenantIds: number[], anneeId: number): Promise<GenerateResult[]>
  static async getTranscriptPdf(cursusApprenantId: number, anneeId: number, semestre?: string): Promise<string>
}
```

**Responsibilities:**
1. Query `CursusApprenant` with filters, joining `Classe`, `NiveauEtude`, `Parcours`, `Utilisateur`
2. Aggregate `Bulletin` + `LigneBulletin` per student per period
3. Calculate weighted averages per UE, per semester, annual average
4. Generate PDF using `PDFDocument` (pdfkit) — reuse pattern from `GenerateurPVService`
5. Store PDF in `uploads/transcripts/` with naming convention `transcript_{cursusId}_{anneeId}_{timestamp}.pdf`
6. Return download URLs

**PDF Layout:**
- Header: School name, academic year, student info (matricule, name, class, level)
- Table per UE: ECUE name, CC average, exam grade, final grade, coefficient, credits
- Summary: Semester average, annual average, rank, mention, decision
- Footer: Generation date, signature lines

**New controller:** `modules/bulletins/controllers/TranscriptController.ts`

### 2.5 API Endpoints

| Method | Path | Handler | Auth |
|--------|------|---------|------|
| `POST` | `/api/v1/bulletins/transcripts/generate` | `TranscriptController.generate` | Admin/Secretariat |
| `POST` | `/api/v1/bulletins/transcripts/regenerate` | `TranscriptController.regenerate` | Admin |
| `GET` | `/api/v1/bulletins/transcripts/:cursusId/:anneeId` | `TranscriptController.getPdf` | Student/Admin |
| `GET` | `/api/v1/bulletins/transcripts/history/:cursusId` | `TranscriptController.getHistory` | Student/Admin |

### 2.6 Frontend Implementation

**New page:** `features/modules/bulletins/pages/transcripts-page/`

**Component structure:**
- `transcripts-page.component.ts` — Main page with filters and results table
- `transcript-card.component.ts` — Individual transcript preview
- `transcript-filters.component.ts` — Filter form (class, level, department, year, semester)

**Service:** `data/modules/bulletins/services/transcript.service.ts`

**Filter logic:**
```typescript
// Cascade filters: Year → Department → Level → Class
onAnneeChange(anneeId: number) {
  this.departements = this.getDepartementsByAnnee(anneeId);
  this.niveaux = [];
  this.classes = [];
}
onDepartementChange(deptId: number) {
  this.niveaux = this.getNiveauxByDepartement(deptId);
  this.classes = [];
}
```

### 2.7 Regeneration Logic

- Admin selects a previous year and student(s)
- System deletes old transcripts (soft delete or file cleanup)
- Regenerates from source data (Bulletins + Notes)
- Maintains audit trail via existing `AuditNote` pattern

---

## 3. Task 2: Excel Report (PV Excel)

### 3.1 Objective

Develop an automated Excel export feature for grade sheets (Procès-Verbaux) following standard academic formatting, building on the existing `exportPv` endpoint.

### 3.2 Scope

- Enhance existing `ListeNoteEvaluationController.exportPv` or create new `PvExcelService`
- Multi-sheet Excel workbook (one sheet per class or per session)
- Standard academic formatting: headers, borders, merged cells, formulas
- Support for multiple sessions (S1, S2, Rattrapage)

### 3.3 Technology

- **Library:** `exceljs` (already in package.json or add it)
- **Template:** Pre-defined Excel templates stored in `uploads/templates/pv/`
- **Fallback:** Programmatic generation if no template exists

### 3.4 Backend Implementation

**New service:** `modules/bulletins/services/PvExcelService.ts`

```typescript
export class PvExcelService {
  static async exportPvExcel(
    listeNoteEvaluationId: number,
    options?: { includeRang?: boolean; includeMention?: boolean }
  ): Promise<Buffer>
  
  static async exportDeliberationPv(
    deliberationId: number
  ): Promise<Buffer>
}
```

**Sheet structure:**
1. **Header row:** School info, academic year, class, session type, date
2. **Column headers:** N°, Nom & Prénoms, Matricule, [ECUE columns with coefficients], Moyenne, Décision, Mention, Rang
3. **Data rows:** One per student, with conditional formatting (red for <10)
4. **Footer:** Summary statistics (class average, pass rate, etc.)

**Formatting rules:**
- Column widths auto-fitted
- Header row: bold, background color `#4472C4`, white text
- Border: thin borders on all cells
- Number format: `0.00` for averages
- Conditional: Red fill for grades < 10

### 3.5 API Endpoints

| Method | Path | Handler | Auth |
|--------|------|---------|------|
| `GET` | `/api/v1/bulletins/pv/:id/export-excel` | `ListeNoteEvaluationController.exportPvExcel` | Admin/Enseignant |
| `GET` | `/api/v1/bulletins/deliberations/:id/pv-excel` | `DeliberationController.exportPvExcel` | Admin/Secretariat |

### 3.6 Frontend Implementation

**Update:** `features/modules/bulletins/pages/liste-notes-page/`

- Add "Export Excel" button next to existing "Export PDF"
- Show loading state during generation
- Trigger download via `window.open` or `Blob` download

---

## 4. Task 3: First-Year Grade Restrictions

### 4.1 Objective

Implement logic to restrict grade visibility for first-year students to Semesters 1 and 2 only. First-year students should not see grades from higher semesters or previous years.

### 4.2 Scope

- Backend: Filter notes/bulletins by student level + semester
- Frontend: Conditional UI based on student level
- No data model changes required

### 4.3 Business Rules

| Student Level | Visible Semesters |
|--------------|-------------------|
| Niveau 1 (1ère année) | S1, S2 only |
| Niveau 2 (2ème année) | S1, S2, S3, S4 |
| Niveau 3 (3ème année) | All semesters |

**Rules:**
1. A first-year student (`niveauEtudeId` → Niveau 1) can only query notes for S1 and S2 of current academic year
2. API returns `403 Forbidden` with message `Accès restreint aux semestres 1 et 2 pour les étudiants de première année` if violated
3. Frontend hides/disabled semester filters beyond S2 for first-year students
4. Transcripts (Task 1) are also restricted

### 4.4 Backend Implementation

**New middleware:** `core/middlewares/GradeAccessRestriction.ts`

```typescript
export class GradeAccessRestriction {
  static async check(req: Request, res: Response, next: NextFunction) {
    const utilisateur = req.utilisateur;
    const role = req.utilisateurRole;
    
    // Admins, teachers, secretariat: no restriction
    if (![RolesUtilisateur.APPRENANT].includes(role)) {
      return next();
    }
    
    // Get student's current level
    const cursus = await CursusApprenant.findOne({
      where: { utilisateurId: utilisateur.id, statutReinscription: 'confirme' }
    });
    
    const niveau = await NiveauEtude.findByPk(cursus.niveauEtudeId);
    if (niveau.ordre !== 1) {
      return next(); // Not first year
    }
    
    // First year: restrict semesters
    const allowedSemesters = ['semestre1', 'semestre2'];
    const requestedSemester = req.query.semestre as string;
    
    if (requestedSemester && !allowedSemesters.includes(requestedSemester)) {
      return res.status(403).json({
        error: 'ACCES_RESTREINT',
        message: 'Accès restreint aux semestres 1 et 2 pour les étudiants de première année'
      });
    }
    
    next();
  }
}
```

**Apply to routes:**
- `inscription/notes` — NoteEvaluation routes
- `bulletins` — Bulletin routes
- `inscription/mes-notes` — PublicationNote routes

### 4.5 Frontend Implementation

**Service enhancement:** `data/modules/inscription/services/note-evaluation.service.ts`

```typescript
// Add method to get allowed semesters for current user
getAllowedSemestres(): Observable<string[]> {
  return this.http.get<any>(`${this.baseUrl}/inscription/allowed-semestres`);
}
```

**Component updates:**
- `liste-notes-page.component.ts` — Filter semesters based on user level
- `mes-notes-page.component.ts` — Same
- `bulletins-page.component.ts` — Restrict to S1/S2 for first-years

---

## 5. Task 4: Tuition Payment Management

### 5.1 Objective

Create a module to manage enrollment payment installments (single payment, 3 installments, or 10 monthly installments), including payment tracking and automatic student access blocking/unblocking based on payment status.

### 5.2 Scope

- New database models for payment plans and installments
- Backend service for generating installment schedules
- Payment tracking with status (paid, pending, overdue, partial)
- Automatic access control: block/unblock student features based on payment status
- Frontend dashboard for payment management
- Integration with existing `PaiementInscription` and `Cinetpay` mobile money

### 5.3 Data Model

**New model: `PlanPaiement`**

```typescript
export class PlanPaiement extends Model {
  declare id: CreationOptional<number>
  declare cursusApprenantId: ForeignKey<CursusApprenant['id']>
  declare typePlan: 'comptant' | '3_versements' | '10_mensualites'
  declare montantTotal: number
  declare montantPaye: CreationOptional<number>
  declare statut: 'actif' | 'complete' | 'annule' | 'en_retard'
  declare dateDebut: Date
  declare dateFin: Date
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
}
```

**New model: `EcheancePaiement`**

```typescript
export class EcheancePaiement extends Model {
  declare id: CreationOptional<number>
  declare planPaiementId: ForeignKey<PlanPaiement['id']>
  declare numeroEcheance: number
  declare montant: number
  declare dateEcheance: Date
  declare datePaiement: CreationOptional<Date>
  declare montantPaye: CreationOptional<number>
  declare statut: 'paye' | 'en_attente' | 'retard' | 'partiel'
  declare methodePaiement: 'espece' | 'virement' | 'mobile_money' | 'carte'
  declare referenceTransaction: CreationOptional<string>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
}
```

**Extend `CursusApprenant`:**
```typescript
declare accesBloque: CreationOptional<boolean>
declare motifBlocage: CreationOptional<string>
declare dateBlocage: CreationOptional<Date>
```

### 5.4 Business Logic

**Plan Generation Rules:**

| Plan | Installments | Logic |
|------|-------------|-------|
| Comptant | 1 | 100% at enrollment |
| 3 versements | 3 | 40% + 30% + 30% (configurable) |
| 10 mensualites | 10 | Equal monthly amounts |

**Auto-generation:**
- On enrollment validation → create `PlanPaiement`
- Generate `EcheancePaiement` records based on plan type
- First installment due within 15 days of enrollment

**Payment Tracking:**
```typescript
interface PaymentStatus {
  planId: number
  total: number
  paid: number
  remaining: number
  overdueAmount: number
  nextDueDate: Date
  status: 'a_jour' | 'en_retard' | 'bloque'
}
```

**Block/Unblock Logic:**

```typescript
export class AccessControlService {
  static async checkStudentAccess(cursusApprenantId: number): Promise<AccessResult> {
    const plan = await PlanPaiement.findOne({
      where: { cursusApprenantId, statut: 'actif' }
    });
    
    if (!plan) return { allowed: true };
    
    const overdue = await this.calculateOverdue(plan.id);
    const threshold = await this.getOverdueThreshold(); // e.g., 2 overdue installments
    
    if (overdue.count >= threshold) {
      await CursusApprenant.update(
        { accesBloque: true, motifBlocage: `Retard de paiement: ${overdue.count} échéances` },
        { where: { id: cursusApprenantId } }
      );
      return { allowed: false, reason: 'Accès bloqué pour retard de paiement' };
    }
    
    // Unblock if previously blocked and now current
    await CursusApprenant.update(
      { accesBloque: false, motifBlocage: null, dateBlocage: null },
      { where: { id: cursusApprenantId, accesBloque: true } }
    );
    
    return { allowed: true };
  }
}
```

**Cron job:** Daily check for overdue installments → auto-block/unblock students

### 5.5 API Endpoints

| Method | Path | Handler | Auth |
|--------|------|---------|------|
| `POST` | `/api/v1/inscription/paiements/plans` | `PlanPaiementController.create` | Admin |
| `GET` | `/api/v1/inscription/paiements/plans/:cursusId` | `PlanPaiementController.getByStudent` | Admin/Student |
| `POST` | `/api/v1/inscription/paiements/echeances/:id/payer` | `EcheancePaiementController.payer` | Admin/Caissier |
| `GET` | `/api/v1/inscription/paiements/statut/:cursusId` | `PaiementController.getStatut` | Admin/Student |
| `POST` | `/api/v1/inscription/paiements/verifier-acces` | `AccessControlController.verifier` | Internal |
| `POST` | `/api/v1/inscription/paiements/debloquer/:cursusId` | `AccessControlController.debloquer` | Admin |

### 5.6 Frontend Implementation

**New module:** `features/modules/paiements/`

**Pages:**
- `payment-plans-page/` — List and manage payment plans
- `payment-schedule-page/` — View/print payment schedule
- `payment-dashboard-page/` — Overview of all payments, overdue alerts
- `payment-history-page/` — Transaction history per student

**Integration points:**
- `inscription/paiements` — Existing page enhanced with plan selector
- Student dashboard — Show payment status, next due date, overdue warning
- Admin dashboard — Widget showing students with overdue payments

**Mobile Money Integration:**
- Reuse `MobileMoneyCinetpay` for Cinetpay payments
- Add `CinetpayPaymentRequest` with installment reference
- Webhook callback to update `EcheancePaiement` status

---

## 6. Task 5: Frontend Audit & Refactoring

### 6.1 Objective

Replace all hardcoded data within the frontend with dynamic calls to the existing API.

### 6.2 Scope

- Audit all `const` arrays in components (months, days, colors, status labels, etc.)
- Replace with API-driven data or centralized config services
- Ensure no business data is hardcoded

### 6.3 Audit Findings (Sample)

| Location | Hardcoded Data | Replacement Strategy |
|----------|---------------|---------------------|
| `dashboard-page.component.ts` | `months`, `jours` | Central `ConfigService` with locale |
| `emplois-du-temps-page.component.ts` | `COULEURS_PALETTE`, `jours`, `entetes` | API `/parametres/config` + theme service |
| `paie-page.component.ts` | `MOIS_NOMS` | `data/enums/MoisEnum.ts` or API |
| `prestations-page.component.ts` | `noms` (months) | Same as above |
| `bordereaux-page.component.ts` | `moisNoms` | Same as above |
| `ged-merge.component.ts` | `nomenclaturePrefix` parts | Configurable via settings |
| `cartes-page.component.ts` | `avatars`, `months` | Theme service + enum |
| `ged-disposal.component.ts` | `headers` (CSV) | API-driven column config |

### 6.4 Implementation Plan

**Phase 1: Create centralized config services**

New service: `core/services/config.service.ts`
```typescript
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private moisNom$ = new BehaviorSubject<string[]>([]);
  private joursSemaine$ = new BehaviorSubject<string[]>([]);
  private couleursPlanning$ = new BehaviorSubject<string[]>([]);
  
  constructor(private http: HttpClient) {
    this.loadConfig();
  }
  
  async loadConfig(): Promise<void> {
    const config = await this.http.get<any>('/api/v1/auth/configuration').toPromise();
    this.moisNom$.next(config.moisNoms || []);
    this.joursSemaine$.next(config.joursSemaine || []);
    this.couleursPlanning$.next(config.couleursPlanning || []);
  }
}
```

**Phase 2: Create enums for static reference data**

New file: `data/enums/MoisFrancais.ts`
```typescript
export enum MoisFrancais {
  JANVIER = 'Janvier',
  FEVRIER = 'Février',
  // ...
}
```

New file: `data/enums/JoursSemaineFrancais.ts`
```typescript
export enum JoursSemaineFrancais {
  LUNDI = 'Lundi',
  MARDI = 'Mardi',
  // ...
}
```

**Phase 3: Replace hardcoded arrays**

For each component:
1. Inject `ConfigService`
2. Replace `const MOIS_NOMS = [...]` with `this.configService.moisNom$`
3. Use `async` pipe in template or subscribe in `ngOnInit`

**Phase 4: CSV/export headers**

Move column definitions to backend API:
```
GET /api/v1/auth/configuration/columns
```
Response:
```json
{
  "emploiDuTemps": ["Jour", "Date", "Début", "Fin", "Cours", "Enseignant", "Salle", "Description"],
  "bordereau": ["Numéro", "Date", "Montant", "Mode", "Statut"],
  "pv": ["N°", "Nom", "Matricule", "Moyenne", "Décision"]
}
```

### 6.5 Testing

- Audit script: `grep` for `const\s+\w+\s*=\s*\[` across `src/app/`
- Verify zero business-data hardcoding remains
- Visual regression test key pages

---

## 7. Task 6: API Security Enhancement

### 7.1 Objective

Strengthen API security protocols with advanced protection mechanisms and robust token management.

### 7.2 Current State

| Aspect | Current | Gap |
|--------|---------|-----|
| Auth | JWT + OTP | No refresh tokens, no token rotation |
| Rate limiting | Per-route (login, OTP) | No global rate limiting |
| Input validation | Per-controller | No centralized schema validation |
| CORS | Likely permissive | Need audit |
| Secrets | Environment variables | No secret rotation |
| Audit logging | `AuditNote` for grades only | No comprehensive API audit |
| Token storage | Frontend localStorage | Vulnerable to XSS |

### 7.3 Implementation Plan

#### 7.3.1 Token Management

**New service:** `core/services/TokenManagementService.ts`

```typescript
export class TokenManagementService {
  // Access token: 15 min
  // Refresh token: 7 days, stored in DB (Revocation list)
  // Rotation: Each refresh generates new pair
  
  static async generateTokenPair(userId: number): Promise<TokenPair>
  static async refreshToken(refreshToken: string): Promise<TokenPair>
  static async revokeToken(tokenId: string): Promise<void>
  static async revokeAllUserTokens(userId: number): Promise<void>
}
```

**New model: `RefreshToken`**
```typescript
export class RefreshToken extends Model {
  declare id: string // nanoid
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare token: string // hashed
  declare expiresAt: Date
  declare estRevoke: boolean
  declare createdAt: CreationOptional<Date>
}
```

**New middleware:** `core/middlewares/TokenRotation.ts`
- On each protected request, check if JWT is near expiry (within 5 min)
- If so, issue new token pair via `RefreshToken` rotation

#### 7.3.2 Rate Limiting

```typescript
// Global rate limiter: 100 req/min per IP
const globalLimiter = rateLimit({
  windowMs: 60000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.connection.remoteAddress
});

// Strict limiter for sensitive endpoints
const strictLimiter = rateLimit({
  windowMs: 300000, // 5 min
  max: 5,
  keyGenerator: (req) => req.utilisateur?.id || req.ip
});
```

Apply strict limiter to: `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, payment endpoints.

#### 7.3.3 Input Validation

New middleware: `core/middlewares/ValidateInput.ts`
- Use `zod` or `class-validator` schemas
- Validate all request bodies, query params, route params
- Sanitize strings (trim, escape HTML)

#### 7.3.4 CORS Hardening

```typescript
// production: specific origins only
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:4200'],
  credentials: true,
  optionsSuccessStatus: 200
};
```

#### 7.3.5 Comprehensive Audit Logging

**New model: `AuditLog`**
```typescript
export class AuditLog extends Model {
  declare id: CreationOptional<number>
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare action: string // 'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'ACCESS_DENIED'
  declare ressource: string // 'BULLETIN', 'NOTE', 'PAIEMENT'
  declare ressourceId: number | null
  declare ipAddress: string
  declare userAgent: string
  declare details: JSON
  declare createdAt: CreationOptional<Date>
}
```

**New middleware:** `core/middlewares/AuditLog.ts`
- Log all authenticated requests to sensitive endpoints
- Log failed auth attempts

#### 7.3.6 Frontend Token Security

- Move from `localStorage` to `HttpOnly` cookie + in-memory token
- Implement CSRF protection
- Auto-logout on token expiry with silent refresh

**New service:** `core/services/auth-token.service.ts`
```typescript
@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  
  setTokens(access: string, refresh: string): void {
    this.accessToken = access;
    this.refreshToken = refresh;
  }
  
  getAccessToken(): string | null {
    return this.accessToken;
  }
  
  async refresh(): Promise<void> {
    // silent refresh via refresh token cookie
  }
}
```

**Update interceptor:** `core/interceptors/token-interceptor.service.ts`
- Handle 401 → trigger silent refresh → retry original request
- Handle 403 → redirect to login

---

## 8. Task 7: Performance Optimization

### 8.1 Objective

Conduct a comprehensive audit and implement optimizations to improve overall application performance.

### 8.2 Audit Areas

#### 8.2.1 Backend

| Area | Audit Action | Optimization |
|------|-------------|--------------|
| **Database queries** | Check N+1 queries in `include` | Use `subQuery: false`, explicit `include` limits |
| **Missing indexes** | `EXPLAIN ANALYZE` on slow queries | Add indexes on foreign keys, filtered indexes |
| **Serialization** | Check JSON response size | Use `attributes: { exclude: [...] }` |
| **Caching** | Redis exists but unused? | Cache frequent reads: classes, levels, academic years |
| **Pagination** | Check `findAll` without limits | Add `limit`/`offset`, cursor pagination for large sets |
| **File downloads** | `fs.createReadStream` vs loading in memory | Stream PDFs/Excel files |
| **WebSocket** | Check socket message size | Compress payloads |

#### 8.2.2 Frontend

| Area | Audit Action | Optimization |
|------|-------------|--------------|
| **Bundle size** | `ng build --stats-json` | Lazy load all feature modules, tree-shake |
| **Change detection** | Check OnPush usage | Default to `OnPush` in all components |
| **ngFor trackBy** | Audit all `*ngFor` | Add `trackBy` functions |
| **Memory leaks** | Check subscriptions | Use `takeUntilDestroyed`, `async` pipe |
| **Image optimization** | Check avatar/image loading | Lazy load, WebP, srcset |
| **HTTP caching** | Check HTTP headers | `Cache-Control`, ETag on GET endpoints |
| **Service workers** | Check if configured | Enable for static assets |
| **Preloading** | Check router strategy | Strategic preloading of critical modules |

### 8.3 Implementation Plan

#### Phase 1: Backend (Week 1)

**1.1 Database Optimization**
```typescript
// Add indexes migration
await queryInterface.addIndex('Bulletin', ['classeId', 'anneeAcademiqueId', 'semestre']);
await queryInterface.addIndex('NoteEvaluation', ['coursParticipantId', 'anneeAcademiqueId']);
await queryInterface.addIndex('CursusApprenant', ['classeId', 'anneeAcademiqueId', 'statutReinscription']);
await queryInterface.addIndex('PaiementInscription', ['matriculeInscription', 'datePaiement']);
```

**1.2 Query Optimization**
- Replace `include: [{ association: ... }]` with explicit includes
- Add `subQuery: false` for nested includes
- Use `attributes` to exclude heavy fields (e.g., `photo`, `qrCodeData`)

**1.3 Caching Layer**
```typescript
// New: core/services/CacheService.ts
@Injectable({ providedIn: 'root' })
export class CacheService {
  constructor(private redis: RedisClient) {}
  
  async getOrSet<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);
    
    const result = await fn();
    await this.redis.setex(key, ttl, JSON.stringify(result));
    return result;
  }
}

// Usage in controllers:
const classes = await cacheService.getOrSet(
  `classes:annee:${anneeId}`,
  3600,
  () => Classe.findAll({ where: { anneeAcademiqueId: anneeId } })
);
```

**1.4 Response Compression**
```typescript
// In main.ts
import compression from 'compression';
app.use(compression({ threshold: 1024 })); // Compress responses > 1KB
```

#### Phase 2: Frontend (Week 2)

**2.1 Lazy Loading**
```typescript
// app-routing.module.ts
{
  path: 'bulletins',
  loadChildren: () => import('./features/modules/bulletins/bulletins.module').then(m => m.BulletinsModule)
}
```

**2.2 OnPush Everywhere**
```typescript
@Component({
  selector: 'app-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

**2.3 trackBy Functions**
```typescript
trackByStudentId(index: number, student: any): number {
  return student.id;
}
```

**2.4 Memoization**
```typescript
// Use memoization for expensive computed properties
classMemo = memoize((classeId: number) => {
  return this.service.getClasseDetails(classeId).pipe(shareReplay(1));
});
```

**2.5 HTTP Optimization**
```typescript
// Add caching headers on backend
res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');

// Frontend: use HttpInterceptor for cache headers
```

#### Phase 3: Monitoring (Week 3)

**3.1 Backend Metrics**
```typescript
// Add prom-client metrics
import { Counter, Histogram } from 'prom-client';

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5]
});

const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  labelNames: ['model', 'operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
});
```

**3.2 Frontend Performance**
- Add `web-vitals` monitoring
- Report to analytics endpoint
- Track LCP, FID, CLS

---

## 9. Cross-cutting Concerns

### 9.1 Testing Strategy

For each task:
1. **Unit tests:** Services, validators, business logic
2. **Integration tests:** API endpoints with test database
3. **E2E tests:** Critical user flows (Cypress or Playwright)
4. **Security tests:** Auth bypass, SQL injection, XSS

### 9.2 Deployment Checklist

- [ ] Database migrations for new tables/columns
- [ ] Environment variables for new services (Cinetpay, Redis, etc.)
- [ ] Backward compatibility checks
- [ ] Frontend build optimization (AOT, production mode)
- [ ] API documentation update (Swagger/OpenAPI)
- [ ] Load testing for new endpoints

### 9.3 Rollout Strategy

| Task | Rollout | Risk |
|------|---------|------|
| Transcript Generation | Feature flag, enable per school | Low |
| PV Excel | Parallel to existing PDF export | Low |
| Grade Restrictions | Canary: 10% first-year students first | Medium |
| Tuition Payments | Phase 1: Admin only, Phase 2: Student portal | Medium |
| Frontend Refactoring | Component-by-component with feature flags | Low |
| Security Enhancement | Staged: rate limit → tokens → audit | Medium |
| Performance | Gradual, monitor metrics between phases | Low |

---

## 10. File Structure Summary

### Backend New Files

```
easy-ecole-backend/src/modules/bulletins/
  services/
    TranscriptGeneratorService.ts       [NEW]
    PvExcelService.ts                    [NEW]
  controllers/
    TranscriptController.ts              [NEW]
  enums/
    TranscriptFormat.ts                  [NEW]

easy-ecole-backend/src/modules/inscription/
  models/
    PlanPaiement.ts                      [NEW]
    EcheancePaiement.ts                  [NEW]
  services/
    PlanPaiementService.ts               [NEW]
    EcheancePaiementService.ts           [NEW]
    AccessControlService.ts              [NEW]
  controllers/
    PlanPaiementController.ts            [NEW]
    EcheancePaiementController.ts        [NEW]
    AccessControlController.ts           [NEW]

easy-ecole-backend/src/core/
  middlewares/
    GradeAccessRestriction.ts            [NEW]
    TokenRotation.ts                     [NEW]
    ValidateInput.ts                     [NEW]
    AuditLog.ts                          [NEW]
  services/
    TokenManagementService.ts            [NEW]
    CacheService.ts                      [NEW]
  models/
    RefreshToken.ts                      [NEW]
    AuditLog.ts                          [NEW]
```

### Frontend New Files

```
easy-ecole-web/src/app/features/modules/bulletins/
  pages/
    transcripts-page/                    [NEW]
      transcripts-page.component.ts
      transcripts-page.component.html
      transcripts-page.component.scss
  services/
    transcript.service.ts                [NEW]

easy-ecole-web/src/app/features/modules/paiements/  [NEW MODULE]
  pages/
    payment-plans-page/
    payment-schedule-page/
    payment-dashboard-page/
    payment-history-page/
  services/
    payment-plan.service.ts
    echeance.service.ts
    access-control.service.ts

easy-ecole-web/src/app/core/
  services/
    config.service.ts                    [NEW]
    auth-token.service.ts                [NEW]

easy-ecole-web/src/app/data/enums/
  MoisFrancais.ts                        [NEW]
  JoursSemaineFrancais.ts                [NEW]
  ConfigurationColumns.ts                [NEW]
```

---

*End of Technical Specification*
