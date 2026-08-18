# Functional Specification — Institutional Business Processes

> **Document purpose**: Map institutional business requirements to the current EasyEcole backend implementation, identify gaps, and define technical requirements for system developers and administrative auditors.  
> **Generated**: 2026-08-12  
> **Scope**: 7 core institutional workflows (grading, access control, documentation, archiving, remedial exams, communication, diploma validation)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Academic Grading & Calculation Logic](#2-academic-grading--calculation-logic)
3. [Grade Management & Access Control](#3-grade-management--access-control)
4. [Student Documentation & Financial Compliance](#4-student-documentation--financial-compliance)
5. [Archiving Protocols](#5-archiving-protocols)
6. [Remedial Session (Rattrapage) Workflow](#6-remedial-session-rattrapage-workflow)
7. [Communication & Content Management](#7-communication--content-management)
8. [Diploma Validation & Externalization](#8-diploma-validation--externalization)
9. [Planning & Emplois du Temps](#9-planning--emplois-du-temps)
10. [Cross-Cutting Technical Requirements](#10-cross-cutting-technical-requirements)
11. [Audit & Compliance Matrix](#11-audit--compliance-matrix)

---

## 1. Executive Summary

### Current State
The EasyEcole backend implements a comprehensive academic management system with 22 modules covering authentication, inscriptions, courses, evaluations, bulletins, payments, e-learning, GED, communication, and reporting. The grading engine supports configurable evaluation rules (RegleEvaluation), weighted averages by ECTS credits, and a full deliberation workflow with locking mechanisms.

### Critical Gaps vs. Institutional Requirements
| # | Requirement | Status | Severity |
|---|-------------|--------|----------|
| 1 | 30 credits per semester enforcement | **Not enforced** | High |
| 2 | 40% devoir + 60% examen formula | **Wrong formula (40/30/30) in seed; not in production code** | High |
| 3 | 2-week grade submission window | **Not implemented** | Medium |
| 4 | IT department bulk data loading with teacher lock revocation | **Not implemented** | High |
| 5 | Saturday rattrapage scheduling | **Not implemented** | Medium |
| 6 | Monday-Wednesday grading timeline enforcement | **Not implemented** | Medium |
| 7 | Teacher self-entry for remedial grades | **Partially implemented (saveNotes exists but no teacher-only restriction)** | Medium |
| 8 | Evaluation Service restricted to printing (no data entry) | **Not implemented** | High |
| 9 | Financial compliance check for e-learning access | **Not implemented** | Medium |
| 10 | FDG validation for public communications | **Not implemented** | High |
| 11 | CABINET AEC diploma externalization | **Not implemented** | High |
| 12 | COEED deliberation minutes transmission | **Not implemented** | High |
| 13 | Physical + digital dual storage for PV | **Partial (storageLocation field exists, no physical tracking)** | Medium |
| 14 | 10-year retention enforcement | **Not automated** | Medium |
| 15 | Secretariat verification for syllabus | **Not implemented** | Medium |

---

## 2. Academic Grading & Calculation Logic

### 2.1 Business Requirement
- **Credit system**: 30 ECTS credits per semester
- **UE evaluation formula**: `moyenne_cours = 0.4 × note_devoir + 0.6 × note_examen`

### 2.2 Current Implementation

#### Credit System
| Entity | File | ECTS Field | Current Status |
|--------|------|-----------|----------------|
| `Cours` (UE) | `src/modules/inscription/models/Cours.ts` | `creditEcts` (nullable INTEGER) | Populated in `seed-catalogue-part1.ts` (60 credits for L1-L3 semesters 1-4, 30 for M1/M2 semesters 5-6) |
| `Ecue` | `src/modules/inscription/models/Ecue.ts` | `creditEcts` (nullable DECIMAL(4,1)) | No seed data |
| `Bulletin` | `src/modules/bulletins/models/Bulletin.ts` | `totalCredits`, `creditsValides` | Calculated at generation |
| `RegleEvaluation` | `src/modules/inscription/models/RegleEvaluation.ts` | `validation_credit = '60'` | **Stored but never evaluated** |

**Credit calculation formula** (`MoteurCalculService.ts` lines 101-107, `CalculCompensationService.ts` lines 128-134):
```typescript
const moyenneGenerale = sommeECTS > 0 ? sommeProduitECTS / sommeECTS : 0;
// where sommeProduitECTS = sum(moyenneUe * creditEcts)
```

#### Grade Calculation Formula
| Layer | Formula | File | Lines |
|-------|---------|------|-------|
| Course average (`LigneBulletin.moyenne`) | `sum(note × poidsTypeNoteEvaluation) / sum(poids)` | `GenerationBulletinService.ts` | 199-234 |
| CC average (`moyenneCC`) | Filtered to `categorie === 'controle_continu'` only | `GenerationBulletinService.ts` | 236-273 |
| Devoir/Examen separation | Stored as separate fields, **not combined** | `GenerationBulletinService.ts` | 275-310 |
| UE average (`moyenneUe`) | MCC-weighted: `sum(moyenne × coefficient) / sum(coefficient)` | `MoteurCalculService.ts` | 75, `CalculMoyenneUeService.ts` | 36-53 |
| General average (`moyenneGenerale`) | ECTS-weighted | `MoteurCalculService.ts` | 101-107 |

### 2.3 Gap Analysis

| Gap | Current | Required | Technical Action |
|------|---------|----------|------------------|
| **No 30-credit enforcement** | `SemestreProgressionService.getProgression()` computes total but does not validate against 30 | Enforce max 30 ECTS per semester at course creation and semester validation | Add validation in `CoursController.create()` and `SemestreAcademiqueService.appliquerCloture()` |
| **Wrong formula in seed** | `seed.ts` lines 884, 908 use `cc * 0.4 + dev * 0.3 + exam * 0.3` | `0.4 × devoir + 0.6 × examen` | Update seed formula; add `RegleEvaluation` rule type `poids_devoir_examen` |
| **No production enforcement of 40/60** | `GenerationBulletinService.calculerMoyenneCours()` uses generic `poidsTypeNoteEvaluation` | Enforce 40/60 when `TypeNoteEvaluation` categories are `devoir`/`examen` | Add `calculerMoyenneAvecFormule()` method in `GenerationBulletinService` |
| **`TypeNoteEvaluation.categorie` not settable via API** | `createTypeNoteEvaluation()` silently drops `categorie` | Allow setting `categorie` via API | Update `TypeNoteEvaluationController.createTypeNoteEvaluation()` to accept `categorie` |

### 2.4 Technical Requirements for Developers
1. **`src/modules/inscription/controllers/CoursController.ts`**: Add validation:
   ```typescript
   const totalCredits = await Cours.sum('creditEcts', { where: { semestreId } });
   if (totalCredits + newCours.creditEcts > 30) {
     return res.status(400).json({ message: 'Total ECTS exceeds 30 per semester' });
   }
   ```
2. **`src/modules/inscription/services/GenerationBulletinService.ts`**: Add `calculerMoyenneFormuleObligatoire()` that enforces `0.4 × devoir + 0.6 × examen` when both exist.
3. **`src/modules/inscription/models/RegleEvaluation.ts`**: Add rule type `poids_devoir_examen` with configurable values.
4. **`src/modules/inscription/controllers/TypeNoteEvaluationController.ts`**: Accept `categorie` in create/update.

---

## 3. Grade Management & Access Control

### 3.1 Business Requirement
- **2-week submission window**: Teachers enter grades within 2 weeks of exam date.
- **IT department bulk loading**: IT loads department grades into the system.
- **Strict locking**: Once IT loads a department's grades, teacher access is revoked. Only ESA IT officer can unlock.

### 3.2 Current Implementation

#### Grade Entry Lifecycle
| State | Trigger | Effect |
|-------|---------|--------|
| `brouillon` | Teacher enters grade | Editable by teacher |
| `publie` | `PublicationNoteController.publier()` | Read-only; audit trail created |
| Locked | `ListeNoteEvaluation.estVerrouillee = true` | No modifications allowed |
| Semester `cloture` | `SemestreAcademique.statut = 'cloture'` | All notes read-only |

**Lock enforcement** (`NoteEvaluationController.upsert()` line 152, `bulkUpsert()` line 219):
```typescript
const { allowed, reason } = SemestreAcademiqueService.canWriteNotes(semester.statut);
if (!allowed) return res.status(409).json({ message: reason });
```

**Published note protection** (`NoteEvaluationController.upsert()` line 176):
```typescript
if (existing.statut === 'publie') {
  return res.status(400).json({ message: "Impossible de modifier une note publiée" });
}
```

#### Missing: 2-Week Window & IT Lock Revocation
| Feature | Current Status | File Reference |
|---------|---------------|----------------|
| Submission deadline based on exam date + 14 days | **Not implemented** | N/A |
| IT bulk loading endpoint | **Not implemented** | N/A |
| Department-level lock after IT upload | **Not implemented** | N/A |
| ESA IT officer-only unlock | **Not implemented** | N/A |

### 3.3 Gap Analysis

| Gap | Severity | Description |
|-----|----------|-------------|
| **No submission window** | Medium | `ListeNoteEvaluation` has `dateDebut`/`dateFin` but no automatic closure 14 days after exam. |
| **No IT bulk loading** | High | No controller or service exists for IT to bulk-upload grades. `NoteEvaluationController.bulkUpsert()` exists but is role-agnostic. |
| **No teacher lock revocation** | High | No mechanism to revoke teacher write access after IT upload. Current locking is semester-level or note-level only. |
| **No ESA IT officer role** | High | `RolesUtilisateur` enum has no `IT_OFFICER` or `AGENT_SAISIE` role. |

### 3.4 Technical Requirements for Developers
1. **Add `dateFermetureSaisie` to `ListeNoteEvaluation`** (auto = `dateFin + 14 days`).
2. **Create `SaisieNotesITController`** with role `IT_OFFICER`:
   - `POST /api/saisie-it/bulk-upload`: Accepts CSV/JSON of grades, validates against `dateFermetureSaisie`, sets `ListeNoteEvaluation.estVerrouillee = true`, revokes teacher permissions.
3. **Add `departementId` to `Utilisateur`** and `Cours` to scope locks per department.
4. **Update `CheckPermission` middleware** to check for active `ListeNoteEvaluation` lock before allowing teacher writes.

---

## 4. Student Documentation & Financial Compliance

### 4.1 Business Requirement
- **Transcript request (relevé de notes)** requires:
  1. Financial clearance (Accounting)
  2. Provisional registration authorization
  3. Physical collection via Secretariat

### 4.2 Current Implementation

#### Document Request Workflow
| Step | Model | Status Flow |
|------|-------|-------------|
| 1. Request | `DemandeDocument` | `soumise` → `validee` → `delivree` (or `rejetee`) |
| 2. Financial check | `DemandeDocumentPaiementService` | Rejects if `fraisPayes = false` for `demande_etudiant` source |
| 3. PDF generation | `DocumentPDFGenerator.generateDocument` | Generates PDF |
| 4. Archiving | `ArchiveGedService.archiverDocumentScolarite` | Stores in GED with `documentTypeCode: 'attestation'` |

**File references**:
- `src/modules/scolarite/models/DemandeDocument.ts`
- `src/modules/scolarite/controllers/DemandeDocumentController.ts`
- `src/modules/scolarite/services/DemandeDocumentPaiementService.ts`

### 4.3 Gap Analysis

| Gap | Severity | Description |
|-----|----------|-------------|
| **No provisional registration check** | Medium | No validation of provisional registration authorization before document delivery. |
| **No Secretariat collection queue** | Medium | No model tracks which secretariat agent processed/collected the request. |
| **Financial clearance is binary** | Medium | Only checks `fraisPayes` boolean; does not integrate with `LigneFraisEtudiant.solde` for comprehensive debt check. |
| **No multi-step approval** | Medium | `traiterDemandeDocument` is a single-step approval. No Accounting → Secretariat handoff workflow. |

### 4.4 Technical Requirements for Developers
1. **Add `autorisationInscriptionProvisoire` boolean to `DemandeDocument`** and enforce it in `traiterDemandeDocument`.
2. **Add `traiteParSecretariat` boolean and `secretariatAgentId` to `DemandeDocument`** to track physical collection.
3. **Integrate `VerificationPaiementService`** into `DemandeDocumentPaiementService` to check full student debt status (`LigneFraisEtudiant.solde`) instead of just `fraisPayes`.
4. **Create `DemandeDocumentWorkflowService`** to orchestrate: Accounting clearance → Provisional auth check → Secretariat collection.

---

## 5. Archiving Protocols

### 5.1 Business Requirement
- **Dual storage**: Digital scanning + physical filing for Minutes of Meetings (Procès-Verbaux).
- **Retention period**: Minimum 10 years.

### 5.2 Current Implementation

#### GED Models
| Model | File | Key Fields |
|-------|------|-----------|
| `DocumentGed` | `src/modules/ged/models/DocumentGed.ts` | `storageLocation` (default `'local'`), `duaEndDate`, `lifecycleStatus`, `isEncrypted`, `integrityHash` |
| `ProcessusGenerateur` | `src/modules/ged/models/ProcessusGenerateur.ts` | Maps to `DELIBERATION`, `DIPLOME`, `BULLETIN`, etc. |
| `DocumentType` | `src/modules/ged/models/DocumentType.ts` | `duaDurationYears`, `isPermanent` |
| `DisposalRecord` | `src/modules/ged/models/DisposalRecord.ts` | `statut: 'en_attente'|'validee'|'rejetee'` |
| `BackupRecord` | `src/modules/ged/models/BackupRecord.ts` | Backup job tracking |

**Archive service** (`src/core/services/ArchiveGedService.ts`):
- Auto-archives deliberation PVs via `archiverDocumentDeliberation`
- Computes SHA-256 integrity hash for every file
- Audit logging via `AuditService.log`

### 5.3 Gap Analysis

| Gap | Severity | Description |
|-----|----------|-------------|
| **No physical storage tracking** | High | `storageLocation` field exists but is not used to track physical box/folder/shelf locations. |
| **No automated retention enforcement** | Medium | `duaEndDate` and `lifecycleStatus` exist but no scheduled job transitions documents to `a_detruire` or purges them. |
| **No dual-storage reconciliation** | Medium | No process ensures digital and physical copies are synchronized or that physical copies are scanned. |

### 5.4 Technical Requirements for Developers
1. **Extend `DocumentGed`** with `physicalLocation` (box/folder/shelf), `physicalScanDate`, `physicalArchiveAgentId`.
2. **Create `ArchiveRetentionService`** with scheduled job (cron) to:
   - Check `duaEndDate` against current date
   - Transition `lifecycleStatus` to `a_detruire` for expired documents
   - Alert archivists 30 days before expiration
3. **Add `PhysicalArchive` model** to track box movements, shelf locations, and scan status.
4. **Update `ArchiveGedService.archiverDocumentDeliberation()`** to require `physicalScanDate` and `physicalLocation` before setting `lifecycleStatus = 'archive'`.

---

## 6. Remedial Session (Rattrapage) Workflow

### 6.1 Business Requirement
End-to-end process:
1. Student requests remedial exam (or system auto-generates from failed UEs)
2. Verify failed units
3. Fee payment (5,000 XAF default)
4. Registration for Saturday session
5. Grading timeline: Monday to Wednesday
6. **Teachers grade and enter their own data**; Evaluation Service prints transcripts only (no data entry).

### 6.2 Current Implementation

#### Rattrapage Models & Controllers
| Component | File | Status |
|-----------|------|--------|
| `RattrapageInscription` | `src/modules/inscription/models/RattrapageInscription.ts` | Supports `source: 'auto'` and `source: 'demande_etudiant'` |
| `SessionExamen` | `src/modules/inscription/models/SessionExamen.ts` | `type: ENUM('normale', 'rattrapage')` |
| `RattrapageController` | `src/modules/inscription/controllers/RattrapageController.ts` | `assignerAuto`, `creerDemandeEtudiant`, `saveNotes` |
| `ParametreFrais` | `src/modules/comptabilite/models/ParametreFrais.ts` | Key `frais_rattrapage` (default 5000 XAF) |

**Fee enforcement** (`RattrapageController.saveNotes`):
```typescript
if (source === 'demande_etudiant' && !paiementConfirme) {
  return res.status(400).json({ message: "Paiement requis avant saisie des notes" });
}
```

### 6.3 Gap Analysis

| Gap | Severity | Description |
|-----|----------|-------------|
| **Saturday scheduling** | Medium | Only `getProchainCoursEnseignant` references `SAMEDI`. No Saturday-specific session creation. |
| **Monday-Wednesday grading timeline** | High | No day-of-week constraints on note entry for rattrapage sessions. |
| **Teacher self-entry restriction** | Medium | `saveNotes` allows any authorized teacher; no enforcement that the grading teacher enters their own data. |
| **Evaluation Service restricted to printing** | High | No `EVALUATION_SERVICE` role or permission restriction exists. `PublicationNoteController` can publish notes. |
| **No provisional registration check** | Medium | Rattrapage registration does not verify provisional registration status. |

### 6.4 Technical Requirements for Developers
1. **Add `jourSemaine` validation to `SessionExamen`**: Enforce `SAMEDI` for `type = 'rattrapage'`.
2. **Add `dateGradingDeadline` to `RattrapageInscription`**: Auto-set to session date + 3 days (Wednesday). Reject note entry after deadline.
3. **Add `EVALUATION_SERVICE` role** to `RolesUtilisateur` with permission `rattrapage.imprimer_only` (no `rattrapage.notes.create/edit`).
4. **Add `enseignantGradientId` to `RattrapageInscription`** and enforce: only the assigned teacher can enter notes for their session.

---

## 7. Communication & Content Management

### 7.1 Business Requirement
- **Public disclosures**: Communication Officer drafts → FDG validates → Publication.
- **Pedagogical content pipeline**: Syllabus → Secretariat verification → Digital upload.
- **Access restriction**: Only financially compliant, regularly enrolled students.

### 7.2 Current Implementation

#### Communication Module
| Model | File | Key Fields |
|-------|------|-----------|
| `Communication` | `src/modules/communication/models/Communication.ts` | `statut: 'brouillon'|'publiee'`, `cible: 'tous'|'apprenants'|'enseignants'|'personnel'` |
| `Actualite` | `src/modules/communication/models/Actualite.ts` | `titre`, `contenu`, `categorie` — **no status field** |
| `Suggestion` | `src/modules/communication/models/Suggestion.ts` | `statut: 'ouverte'|'traitee'|'fermee'` |

**Critical issue** (`CommunicationController.createCommunication`):
```typescript
// Line 65: defaults to 'publiee' instead of 'brouillon'
statut: 'publiee'
```

#### E-Learning Access Control
| Middleware | File | Current Check |
|-----------|------|---------------|
| `InscriptionComplete` | `src/core/middlewares/InscriptionComplete.ts` | Checks `DossierEtudiant.statut === 'actif'` and `CursusApprenant` exists |
| `VerificationPaiementService` | `src/modules/inscription/services/VerificationPaiementService.ts` | **Not used in elearning module** |

### 7.3 Gap Analysis

| Gap | Severity | Description |
|-----|----------|-------------|
| **No FDG validation workflow** | High | No approval step for public communications. Content goes live immediately. |
| **No Communication Officer role** | High | `RolesUtilisateur` lacks communication-specific role. |
| **No draft/publish workflow** | High | `CommunicationController.createCommunication` defaults to `publiee`. |
| **No Syllabus model** | Medium | Pedagogical content is in `CoursEnLigne`/`ModuleElearning` without formal syllabus submission. |
| **No Secretariat verification** | Medium | No review/approval step for uploaded content. |
| **No financial compliance in elearning** | Medium | Students with unpaid dues can access content. |
| **No enrollment status check** | Medium | No check against current academic year or active enrollment. |

### 7.4 Technical Requirements for Developers
1. **Add `FDG_VALIDATION` permission** and `COMMUNICATION_OFFICER` role:
   - Communication Officer can create drafts (`brouillon`)
   - FDG role can approve (`valider`) before publication
   - Update `CommunicationController.createCommunication` to default `statut = 'brouillon'`
2. **Add `confidentialityLevel` to `Actualite`**: `public`, `interne`, `restreint`.
3. **Create `Syllabus` model** linked to `Cours` with `statut: 'soumis'|'verifie_secretariat'|'upload_digital'|'publie'`.
4. **Create `SyllabusController`** with Secretariat verification workflow.
5. **Update `InscriptionComplete` middleware** to call `VerificationPaiementService` and reject students with `impaye` or `en_retard` status.
6. **Add `currentAcademicYear` check** in `InscriptionComplete` to verify active enrollment.

---

## 8. Diploma Validation & Externalization

### 8.1 Business Requirement
- Diploma validation is **outsourced to CABINET AEC**.
- Process: COEED deliberation minutes → transmission to CABINET AEC → FDG supervision → diploma issuance.

### 8.2 Current Implementation

#### Diploma Models
| Model | File | Key Fields |
|-------|------|-----------|
| `Diplome` | `src/modules/scolarite/models/Diplome.ts` | `numeroDiplome`, `mention`, `dateDelivrance`, `fichierPDF` |
| `DocumentDelivre` | `src/modules/scolarite/models/DocumentDelivre.ts` | Links `DemandeDocument` to delivered PDF |
| `Deliberation` | `src/modules/bulletins/models/Deliberation.ts` | `sessionType: 'initiale'|'rattrapage'`, `verrouille`, `statut` |

**PV generation** (`GenerateurPVService.ts`):
- Creates A4 PDF with jury members, ranked results, statistics
- Auto-archived in GED via `ArchiveGedService.archiverDocumentDeliberation`

### 8.3 Gap Analysis

| Gap | Severity | Description |
|-----|----------|-------------|
| **No CABINET AEC integration** | High | **Zero references** to CABINET AEC in the entire codebase. |
| **No COEED references** | High | **Zero references** to COEED deliberation minutes transmission workflow. |
| **No FDG supervision** | High | No FDG role or supervision mechanism for diploma validation. |
| **No automatic diploma generation** | Medium | `DiplomeController` only supports CRUD; no auto-generation from deliberation results. |

### 8.4 Technical Requirements for Developers
1. **Add `externalIssuer` workflow to `DocumentGed`**:
   - Create `Externe` model (or extend `ProcessusGenerateur`) with fields: `nomCabinet`, `contact`, `delaiMax`, `statutTransmission`.
2. **Add `coeDeliberationMinutes` field to `Deliberation`**: Reference to COEED minutes document.
3. **Create `TransmissionExterneService`**:
   - Triggered after `Deliberation.publier()`
   - Transmits deliberation minutes to CABINET AEC via email/API
   - Logs transmission status and FDG supervision notes
4. **Add `FDG` role** to `RolesUtilisateur` with permission `diplome.superviser`.
5. **Create `DiplomeAutoGenerationService`**:
   - Triggered after CABINET AEC confirmation
   - Generates diploma PDF from deliberation results
   - Links to `DocumentDelivre` and archives in GED

---

## 9. Cross-Cutting Technical Requirements

### 9.1 Role & Permission Architecture
| Required Role | Purpose | Current Status |
|---------------|---------|---------------|
| `IT_OFFICER` | Grade bulk loading, teacher lock revocation | **Missing** |
| `EVALUATION_SERVICE` | Print transcripts only, no data entry | **Missing** |
| `COMMUNICATION_OFFICER` | Draft public communications | **Missing** |
| `FDG` | Validate communications, supervise diploma validation | **Missing** |
| `SECRETARIAT` | Syllabus verification, document collection | **Partial** (no dedicated permissions) |

### 9.2 Scheduled Jobs Required
| Job | Frequency | Purpose |
|-----|-----------|---------|
| `retentionEnforcer` | Daily | Transition expired documents to `a_detruire` |
| `submissionWindowCloser` | Daily | Close grade entry 14 days after exam date |
| `financialComplianceChecker` | Hourly | Update student financial status for elearning access |
| `rattrapageScheduler` | Weekly | Create Saturday rattrapage sessions for failed students |

### 9.3 Audit Trail Requirements
All business processes must log to `AuditNote` or `Log`:
- Grade modifications: `ancienneNote`, `nouvelleNote`, `modifiePar`, `motif` (existing in `AuditNote.ts`)
- Document requests: requester, approver, timestamp, status change
- Diploma transmission: sender, recipient (CABINET AEC), timestamp, confirmation
- Archiving actions: agent, document type, retention period, storage location

---

## 10. Audit & Compliance Matrix

### 10.1 Traceability Matrix: Business Process → Model → Controller → Gap

| Business Process | Primary Model | Controller | Gap ID | Severity |
|------------------|---------------|------------|--------|----------|
| Credit validation (30/semester) | `Cours`, `SemestreAcademique` | `CoursController` | G-01 | High |
| 40/60 grade formula | `LigneBulletin`, `RegleEvaluation` | `NoteEvaluationController` | G-02 | High |
| 2-week submission window | `ListeNoteEvaluation` | `ListeNoteEvaluationController` | G-03 | Medium |
| IT bulk loading + lock | `ListeNoteEvaluation`, `Utilisateur` | **New**: `SaisieNotesITController` | G-04 | High |
| Transcript request | `DemandeDocument` | `DemandeDocumentController` | G-05 | Medium |
| Physical collection tracking | `DemandeDocument` | `DemandeDocumentController` | G-06 | Medium |
| Dual storage (PV) | `DocumentGed`, `PhysicalArchive` | `ArchiveGedService` | G-07 | Medium |
| 10-year retention | `DocumentGed`, `DocumentType` | **New**: `ArchiveRetentionService` | G-08 | Medium |
| Saturday rattrapage | `SessionExamen`, `RattrapageInscription` | `RattrapageController` | G-09 | Medium |
| Mon-Wed grading timeline | `RattrapageInscription` | `RattrapageController` | G-10 | High |
| Teacher self-entry | `RattrapageInscription`, `NoteEvaluation` | `RattrapageController` | G-11 | Medium |
| Evaluation Service print-only | `RattrapageInscription`, `RolePermission` | **New**: role restriction | G-12 | High |
| FDG communication validation | `Communication`, `RolePermission` | `CommunicationController` | G-13 | High |
| Syllabus pipeline | `CoursEnLigne`, `Syllabus` | **New**: `SyllabusController` | G-14 | Medium |
| Elearning financial gate | `CoursEnLigne`, `InscriptionComplete` | `InscriptionComplete` middleware | G-15 | Medium |
| CABINET AEC diploma | `Diplome`, `DocumentGed` | **New**: `TransmissionExterneService` | G-16 | High |
| COEED minutes transmission | `Deliberation`, `DocumentGed` | **New**: `TransmissionExterneService` | G-17 | High |
| Weekly/monthly schedule generation | `Seance` | `SeanceController` | G-18 | Medium |
| Room assignment by capacity | `Seance`, `SalleDeClasse` | **New**: `AffectationSalleService` | G-19 | Medium |
| SG elaboration → FDG signature | `Seance` (no status), DocGen | **New**: planning approval workflow | G-20 | High |
| Supervisor integration in planning software | `Seance` | `SeanceController` | G-21 | Medium |
| Student distribution/ventilation | `CursusApprenant`, `Classe` | **New**: `RepartitionEtudiantsService` | G-22 | Medium |

---

## 9. Planning & Emplois du Temps

### 9.1 Business Requirement
- **Schedule editing**: Weekly and monthly schedule generation based on course programming.
- **Approval chain**: SG (Secrétaire Général) elaborates the schedule → submits to FDG for signature.
- **Distribution**: After FDG signature, transmitted to supervisors for integration into planning management software, and for ventilation (distribution) to students.
- **Classroom assignment**: Done by the General Supervisor or supervisors based on the number of students in each filière (program).

### 9.2 Current Implementation

#### Planning Model: `Seance`
| Field | Type | Current Status |
|-------|------|---------------|
| `jourSemaine` | ENUM (LUNDI–SAMEDI) | ✅ Implemented |
| `salle` | STRING (free-text) | ✅ Implemented but **not linked** to structured `SalleDeClasse` |
| `salleDeClasseId` | UUID (FK → `ins_salles_de_classes`) | ✅ Implemented but **nullable and unused** in scheduling logic |
| `dateDebut` / `dateFin` | DATE | ✅ Implemented (validity period) |
| `heureDebut` / `heureFin` | TIME | ✅ Implemented |
| `coursId` | UUID (FK) | ✅ Implemented |
| `enseignantId` | UUID (FK) | ✅ Implemented |
| `statut` | — | **❌ Missing** — no approval/draft/publish states |

#### Supporting Models
| Model | Key Fields | Relevance |
|-------|-----------|-----------|
| `SalleDeClasse` | `libelle`, `capacite`, `equipements`, `classeId`, `parcoursId` | Room definitions with capacity — **exists but unused** in scheduling |
| `Classe` | `libelle`, `capaciteMax`, `niveauEtudeId` | Class sections with max capacity |
| `Cours` | `code`, `intitule`, `classeId`, `parcoursId`, `enseignantId`, `volumeHoraire` | Course definitions with weekly hours |
| `CursusApprenant` | `utilisateurId`, `classeId`, `parcoursId`, `anneeAcademiqueId` | Student enrollment record |
| `CoursParticipant` | `utilisateurId`, `coursId`, `cursusApprenantId` | Student-to-course enrollment |

#### Controllers & Routes
| Controller | Route | Role | Capability |
|------------|-------|------|-----------|
| `SeanceController.getAllSeances` | `GET /inscription/seances` | All (filtered) | List sessions |
| `SeanceController.getPlanning` | `GET /inscription/seances/planning` | All | Weekly schedule expansion with filters |
| `SeanceController.createSeance` | `POST /inscription/seances` | INSTITUTION only | Manual session creation |
| `SeanceController.updateSeance` | `PUT /inscription/seances/:id` | INSTITUTION only | Manual session update |
| `SeanceController.publierEmploiDuTemps` | `POST /inscription/seances/publier` | INSTITUTION/ADMIN | Publishes schedule, sends notifications |
| `HierarchyController.getEmploisDuTempsTree` | `GET /inscription/hierarchy/emplois-du-temps` | All | Semester → sessions tree |

#### Existing Approval Patterns (Reusable)
| Pattern | Model | Status Flow | Reusability |
|---------|-------|-------------|-------------|
| `Bordereau` | `ins_bordereaux` | `en_attente` → `valide`/`rejete` | Simple 2-state approval |
| `Deliberation` | `ins_deliberations` | `planifiee` → `en_cours` → `cloturee` → `publiee` | Complex state machine |
| `DocGen` | `docgen_documents`, `docgen_signatures` | `brouillon` → `en_attente_*` → `signé` | **Best candidate** for planning approval |

### 9.3 Gap Analysis

| Gap | Severity | Description |
|-----|----------|-------------|
| **No schedule generation service** | High | Sessions are created manually one-by-one. No `EmploiDuTempsGenerator` to produce weekly/monthly schedules from `Cours.volumeHoraire`. |
| **No approval workflow for schedules** | High | No `statut` field on `Seance`. No SG → FDG validation chain. Schedule can be published without oversight. |
| **No SG/FDG roles** | High | `RolesUtilisateur` lacks `SECRETAIRE_GENERAL` and `DIRECTEUR_ETUDES` (FDG). |
| **No room assignment algorithm** | High | `salle` is free-text. `SalleDeClasse.capacite` is never compared against course enrollment. No automatic assignment based on effectif. |
| **No student distribution/ventilation** | Medium | `CursusApprenant.classeId` is assigned manually. No logic to distribute students across classes based on capacity or filière criteria. |
| **No supervisor/surveillant assignment** | Medium | `SessionExamen` has no surveillant field. No link between supervisors and schedule slots for distribution duties. |
| **No versioning/draft system** | Medium | Changes to `Seance` are immediate. No draft → approval → publication pipeline. |
| **DocGen planning documents lack signature workflow** | Medium | `EDT001`, `EDT002`, `EDT003` exist in DocGen types but have no `signatureRequired` or workflow configuration. |

### 9.4 Technical Requirements for Developers

#### 1. Planning Approval Workflow (SG → FDG)
**Option A: Extend `Seance` with status field**
```typescript
// In Seance model
statut: ENUM('brouillon', 'en_attente_sg', 'valide_sg', 'en_attente_fdg', 'approuve', 'publie', 'rejete')
valideParSgId: UUID (FK → Utilisateur)
dateValidationSg: DATE
valideParFdgId: UUID (FK → Utilisateur)
dateSignatureFdg: DATE
commentaireSg: TEXT
commentaireFdg: TEXT
```

**Option B: Use DocGen workflow (preferred)**
- Create `DocGenDocument` with `sourceType = 'planning'`, `sourceId = seanceId`
- Configure `DocGenWorkflow` with steps: SG validation → FDG signature
- Reuse existing `SigningController` infrastructure

#### 2. Roles to Add
| Role | Permission Scope |
|------|-----------------|
| `SECRETAIRE_GENERAL` | `planning.elaborer`, `planning.soumettre_fdg` |
| `DIRECTEUR_ETUDES` (FDG) | `planning.signer`, `planning.rejeter` |
| `SURVEILLANT` | `planning.integrer_logiciel`, `planning.ventiler_etudiants` |

#### 3. Schedule Generation Service
**New service: `EmploiDuTempsGenerator`**
```typescript
class EmploiDuTempsGenerator {
  // Input: semester, parcours, classe
  // Output: array of Seance objects
  
  generateHebdomadaire(semestreId: UUID): Seance[] {
    // 1. Load all Cours for semester/parcours/classe
    // 2. For each Cours, distribute volumeHoraire across days
    // 3. Respect constraints: teacher availability, room availability
    // 4. Return draft Seance objects
  }
  
  generateMensuel(semestreId: UUID, mois: number): Seance[] {
    // Filter weekly sessions for given month
  }
}
```

#### 4. Room Assignment Service
**New service: `AffectationSalleService`**
```typescript
class AffectationSalleService {
  assignerSalle(seance: Seance, cours: Cours): SalleDeClasse {
    // 1. Get course enrollment count from CoursParticipant
    const effectif = await CoursParticipant.count({ where: { coursId: cours.id } });
    
    // 2. Find available SalleDeClasse with capacite >= effectif
    const sallesDisponibles = await SalleDeClasse.findAll({
      where: {
        capacite: { [Op.gte]: effectif },
        parcoursId: cours.parcoursId,
        etablissementId: cours.etablissementId
      },
      include: [{ model: Seance, where: { /* check time conflicts */ } }]
    });
    
    // 3. Return best match (smallest sufficient capacity)
    return sallesDisponibles.sort((a, b) => a.capacite - b.capacite)[0];
  }
}
```

#### 5. Student Distribution Service
**New service: `RepartitionEtudiantsService`**
```typescript
class RepartitionEtudiantsService {
  async repartirParFiliere(parcoursId: UUID, anneeAcademiqueId: UUID): Promise<void> {
    // 1. Get all CursusApprenant for parcours/year
    // 2. Group by niveauEtude
    // 3. For each niveau, distribute across classes based on:
    //    - Classe.capaciteMax
    //    - Student preferences (if applicable)
    //    - Academic performance (if applicable)
    // 4. Update CursusApprenant.classeId
  }
}
```

#### 6. Supervisor Integration Endpoints
```typescript
// New routes in SeanceController or SurveillantController
POST /inscription/seances/:id/integrer-logiciel // Supervisor confirms integration
POST /inscription/seances/:id/ventiler-etudiants // Supervisor triggers student distribution notification
```

#### 7. Updated `publierEmploiDuTemps` Flow
```typescript
async publierEmploiDuTemps(seanceId: UUID, utilisateurId: UUID) {
  // 1. Verify FDG signature exists (dateSignatureFdg is not null)
  // 2. Set statut = 'publie'
  // 3. Generate PDF (EDT001 for students, EDT002 for teachers, EDT003 for room occupancy)
  // 4. Archive in GED
  // 5. Send notifications to:
  //    - Teachers (enseignantId)
  //    - Students (via CoursParticipant)
  //    - Supervisors (for software integration)
}
```

### 9.5 Integration with Existing Modules

| Integration Point | Module | Description |
|-------------------|--------|-------------|
| `Cours.volumeHoraire` | Inscription | Source of weekly hours for schedule generation |
| `SalleDeClasse.capacite` | Inscription | Room capacity constraint for assignment |
| `CursusApprenant` | Inscription | Student enrollment target for distribution |
| `DocGen` | DocGen | Signature workflow for SG/FDG approval |
| `Notification` | Communication | Alerts for schedule publication |
| `ArchiveGedService` | GED | Archive published schedules |

---

## 10. Cross-Cutting Technical Requirements
1. **Grade integrity**: All grade modifications must produce `AuditNote` records. Current implementation satisfies this requirement (`NoteEvaluationController.upsert()` lines 184, 247).
2. **Document retention**: `DocumentGed.duaEndDate` and `DocumentType.duaDurationYears` are defined but **no automated enforcement exists**. Auditors should flag this as a control gap.
3. **Role separation**: No role currently restricts the Evaluation Service to printing only. This is a **critical segregation of duties gap**.
4. **External validation**: CABINET AEC and COEED are completely absent from the system. Diploma validation is entirely internal, contrary to institutional requirements.
5. **Financial compliance**: The elearning module lacks financial gating. Students with outstanding debts can access paid content.

---

## 11. Audit & Compliance Matrix

### 11.1 Traceability Matrix: Business Process → Model → Controller → Gap

| Business Process | Primary Model | Controller | Gap ID | Severity |
|------------------|---------------|------------|--------|----------|
| Credit validation (30/semester) | `Cours`, `SemestreAcademique` | `CoursController` | G-01 | High |
| 40/60 grade formula | `LigneBulletin`, `RegleEvaluation` | `NoteEvaluationController` | G-02 | High |
| 2-week submission window | `ListeNoteEvaluation` | `ListeNoteEvaluationController` | G-03 | Medium |
| IT bulk loading + lock | `ListeNoteEvaluation`, `Utilisateur` | **New**: `SaisieNotesITController` | G-04 | High |
| Transcript request | `DemandeDocument` | `DemandeDocumentController` | G-05 | Medium |
| Physical collection tracking | `DemandeDocument` | `DemandeDocumentController` | G-06 | Medium |
| Dual storage (PV) | `DocumentGed`, `PhysicalArchive` | `ArchiveGedService` | G-07 | Medium |
| 10-year retention | `DocumentGed`, `DocumentType` | **New**: `ArchiveRetentionService` | G-08 | Medium |
| Saturday rattrapage | `SessionExamen`, `RattrapageInscription` | `RattrapageController` | G-09 | Medium |
| Mon-Wed grading timeline | `RattrapageInscription` | `RattrapageController` | G-10 | High |
| Teacher self-entry | `RattrapageInscription`, `NoteEvaluation` | `RattrapageController` | G-11 | Medium |
| Evaluation Service print-only | `RattrapageInscription`, `RolePermission` | **New**: role restriction | G-12 | High |
| FDG communication validation | `Communication`, `RolePermission` | `CommunicationController` | G-13 | High |
| Syllabus pipeline | `CoursEnLigne`, `Syllabus` | **New**: `SyllabusController` | G-14 | Medium |
| Elearning financial gate | `CoursEnLigne`, `InscriptionComplete` | `InscriptionComplete` middleware | G-15 | Medium |
| CABINET AEC diploma | `Diplome`, `DocumentGed` | **New**: `TransmissionExterneService` | G-16 | High |
| COEED minutes transmission | `Deliberation`, `DocumentGed` | **New**: `TransmissionExterneService` | G-17 | High |
| Weekly/monthly schedule generation | `Seance` | `SeanceController` | G-18 | Medium |
| Room assignment by capacity | `Seance`, `SalleDeClasse` | **New**: `AffectationSalleService` | G-19 | Medium |
| SG elaboration → FDG signature | `Seance` (no status), DocGen | **New**: planning approval workflow | G-20 | High |
| Supervisor integration in planning software | `Seance` | `SeanceController` | G-21 | Medium |
| Student distribution/ventilation | `CursusApprenant`, `Classe` | **New**: `RepartitionEtudiantsService` | G-22 | Medium |

### 11.2 Compliance Notes for Auditors
1. **Grade integrity**: All grade modifications must produce `AuditNote` records. Current implementation satisfies this requirement (`NoteEvaluationController.upsert()` lines 184, 247).
2. **Document retention**: `DocumentGed.duaEndDate` and `DocumentType.duaDurationYears` are defined but **no automated enforcement exists**. Auditors should flag this as a control gap.
3. **Role separation**: No role currently restricts the Evaluation Service to printing only. This is a **critical segregation of duties gap**.
4. **External validation**: CABINET AEC and COEED are completely absent from the system. Diploma validation is entirely internal, contrary to institutional requirements.
5. **Financial compliance**: The elearning module lacks financial gating. Students with outstanding debts can access paid content.
6. **Schedule governance**: The planning module has no approval workflow. Schedules can be published without FDG signature, contrary to institutional requirements.

---

*End of Functional Specification Document*
