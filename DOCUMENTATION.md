# Documentation Technique — EasyEcole

> **Version :** 1.0.0  
> **Stack :** Node.js 22 + Express + TypeScript + Sequelize (MySQL) · Angular 12.2 + RxJS 6  
> **Architecture :** Monolithic backend (modular) · SPA frontend (lazy-loaded modules)

---

## Table des matières

1. [Présentation générale](#1-présentation-générale)
2. [Architecture technique](#2-architecture-technique)
3. [Modules fonctionnels — Backend](#3-modules-fonctionnels--backend)
   - 3.1 Auth & Utilisateurs
   - 3.2 Orientation
   - 3.3 Inscription (cœur métier)
   - 3.4 Bulletins & Évaluations
   - 3.5 Cours & Pédagogie
   - 3.6 Scolarité
   - 3.7 E-Learning
   - 3.8 Communication
   - 3.9 GED (Gestion Électronique de Documents)
   - 3.10 Stages
   - 3.11 Comptabilité (OHADA)
   - 3.12 Ressources Humaines
   - 3.13 Paie
   - 3.14 Achats
   - 3.15 Stocks
   - 3.16 Immobilisations
   - 3.17 Pointage
   - 3.18 Reporting
   - 3.19 Administration
4. [Modules fonctionnels — Frontend](#4-modules-fonctionnels--frontend)
5. [Workflows métier](#5-workflows-métier)
6. [Sécurité & Authentification](#6-sécurité--authentification)
7. [Base de données](#7-base-de-données)
8. [Déploiement & Configuration](#8-déploiement--configuration)

---

## 1. Présentation générale

EasyEcole est un **système de gestion scolaire complet** (ERP éducatif) destiné aux établissements d'enseignement supérieur. Il couvre l'intégralité du cycle de vie d'un étudiant : de la demande d'orientation à l'obtention du diplôme, en passant par les inscriptions, le suivi pédagogique, les notes, les bulletins, les paiements, et la comptabilité OHADA.

### Périmètre fonctionnel

| Domaine | Couverture |
|---|---|
| **Pré-inscription** | Catalogue de parcours, demande d'orientation, choix de parcours, panier |
| **Inscription** | Sessions, demandes, dossiers, paiements, échéances, bordereaux, quitus |
| **Pédagogie** | Cours, chapitres, ressources, séances, présences, cahiers de textes |
| **Évaluation** | Types d'évaluation, listes d'évaluation, notes, publication, compensation |
| **Bulletins** | Génération, lignes, moyennes, mentions, rangs, délibérations, jury |
| **Scolarité** | Documents, réclamations, registres, calendrier, discipline, conseils de classe |
| **E-Learning** | Cours en ligne, quiz, devoirs, progression, certificats, chat |
| **Stages** | Offres, demandes, conventions, rapports, notes, attestations |
| **RH** | Employés, contrats, prestations enseignants, évaluations, formations |
| **Paie** | Rubriques, périodes, bulletins de paie, lignes, cotisations |
| **Comptabilité** | Plan comptable OHADA (classe 1-7), journaux (VEN, ACH, BQ, CAI, PAI, OD), écritures, balance, grand-livre |
| **Achats** | Demandes, validations, commandes, réceptions, factures, budgets, engagements |
| **Stocks** | Articles, catégories, fournisseurs, mouvements (entrée/sortie), bons de commande |
| **Immobilisations** | Sites, bâtiments, localisations, immobilisations, acquisitions, amortissements, maintenances, cessions |
| **Pointage** | Shifts, plannings, historique, absences, rapports |
| **Communication** | Annonces, messagerie, discussions, suggestions, notifications |
| **Reporting** | Effectifs, notes, paiements, budget, RH, stocks, immobilisations, achats |
| **GED** | Dossiers documentaires, catalogues, nomenclature, sessions, upload |

---

## 2. Architecture technique

### 2.1 Stack

```
┌─────────────────────────────────────────────┐
│            Frontend Angular 12               │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Auth Mod │ │ Inscription│ │  19 modules   │ │
│  │          │ │   Module  │ │  lazy-loaded   │ │
│  └──────────┘ └──────────┘ └──────────────┘ │
│        │              │              │        │
│        └──────────────┴──────────────┘        │
│                    HTTP (JWT Bearer)          │
├─────────────────────────────────────────────┤
│              Backend Express (Node 22)        │
│  ┌─────────────────────────────────────────┐ │
│  │  Middleware : Auth, Permissions, Cache   │ │
│  ├─────────────────────────────────────────┤ │
│  │  Modules (15) : Controller → Service →  │ │
│  │  Sequelize Model → MySQL                 │ │
│  ├─────────────────────────────────────────┤ │
│  │  Helpers : EmailSender, PDFGenerator,    │ │
│  │  Cinetpay, RedisClient, Comptabilite     │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 2.2 Convention de nommage

| Élément | Convention | Exemple |
|---|---|---|
| Tables | `{module}_` prefix | `ins_sessions`, `aut_utilisateurs` |
| Modèles Sequelize | `{Module}{Nom}` | `InsSession`, `AutUtilisateur` |
| Contrôleurs | `{Nom}Controller` (statique) | `SessionController.getAll` |
| Routes | kebab-case | `frais-parcours` |
| Composants Angular | PascalCase + suffix `Page`/`Component` | `ListeSessionsPageComponent` |
| Services Angular | kebab-case `.service.ts` | `session.service.ts` |
| Modules Angular | PascalCase + suffix `Module` | `InscriptionModule` |

### 2.3 Structure des répertoires

#### Backend (`easy-ecole-backend/`)

```
src/
├── app.ts                     # Configuration Express (cors, json, routes, swagger)
├── routes.ts                  # Agrégateur de routes modules
├── core/
│   ├── config/                # jwt.ts, sequelize.json
│   ├── enums/                 # 15 enums (Roles, Types, États, etc.)
│   ├── helpers/               # DatabaseConnection, EmailSender, PDFGenerator,
│   │                          # IDGenerator, MobileMoneyCinetpay, ComptabiliteHelper
│   ├── middlewares/           # Authenticate, AuthAdmin, AuthEnseignant, AuthApprenant,
│   │                          # AuthRessourcesHumaines, AuthCaissierBanque, AuthComiteOrientation,
│   │                          # AuthInstitution, AuthCabinetComptable, CheckPermission,
│   │                          # CacheMiddleware, ErrorHandler
│   ├── scripts/               # seed.ts, seed-bulletins.ts, reset-database.ts, sync-*.ts
│   ├── types/                 # express.d.ts (augmentation Request)
│   └── validators/            # noteValidators.ts
└── modules/
    ├── auth/                  # Module Auth
    ├── orientation/           # Module Orientation
    ├── inscription/           # Module Inscription (coeur)
    ├── bulletins/             # Module Bulletins
    ├── comptabilite/          # Module Comptabilité OHADA
    ├── rh/                    # Module RH & Paie
    ├── achats/                # Module Achats
    ├── stocks/                # Module Stocks
    ├── immobilisation/        # Module Immobilisations
    ├── scolarite/             # Module Scolarité
    ├── elearning/             # Module E-Learning
    ├── communication/         # Module Communication
    ├── stage/                 # Module Stages
    ├── ged/                   # Module GED
    └── reporting/             # Module Reporting
```

Chaque module contient :
- `{Nom}Module.ts` — Point d'entrée
- `{Nom}Routes.ts` — Agrégateur de routes
- `routers/` — Fichiers de routes Express
- `controllers/` — Contrôleurs (classes statiques)
- `models/` — Modèles Sequelize + `_associations.ts`
- `services/` — Logique métier (optionnel)
- `validators/` — Validateurs (optionnel)
- `socket/` — WebSocket (optionnel)
- `seed/` — Seeds spécifiques (optionnel)

#### Frontend (`easy-ecole-web/src/app/`)

```
app/
├── app-routing.module.ts      # Routes racines (19 modules lazy)
├── app.module.ts              # Module racine
├── app.component.ts/html      # Coque (loading + toast + router-outlet)
├── core/                      # Guards, interceptors, services globaux
│   ├── guards/                # AuthGuard, PermissionGuard
│   ├── interceptors/          # TokenInterceptor, ProgressInterceptor
│   ├── services/              # ToastService, HttpLoaderService, JwtTokenService,
│   │                          # LocalStorageService, PermissionStateService, CookieService
│   ├── directives/            # HasPermissionDirective
│   └── base-component-class.ts
├── features/
│   ├── layout/                # BaseLayoutComponent, NavMenu, sidebar
│   ├── pages/                 # DashboardPageComponent (eager)
│   └── modules/               # 19 modules lazy-loaded
├── shared/                    # Composants réutilisables (18)
└── data/                      # Data services (110+) et modèles (100+)
    └── modules/
        ├── auth/
        ├── orientation/
        ├── inscription/
        └── ... (par module)
```

### 2.4 Principes techniques clés

- **Backend** : Contrôleurs statiques (pas d'instances), Sequelize `Model<InferAttributes, InferCreationAttributes>`, `MODULE_MODEL_PREFIX`/`MODULE_TABLE_PREFIX`, `paranoid: true` (soft delete), `DatabaseConnection` singleton, `EmailSender` singleton
- **Frontend** : Angular 12.2 (RxJS 6, pas de signaux/standalone), lazy-loading par module, AuthGuard sur les routes protégées, TokenInterceptor pour le JWT
- **Node v22 + Angular 12** : nécessite `NODE_OPTIONS=--openssl-legacy-provider`

---

## 3. Modules fonctionnels — Backend

---

### 3.1 Auth & Utilisateurs

**Préfixe table :** `aut_` · **Préfixe modèle :** `Aut`  
**Route de base :** `/api/v1/auth`

#### Description
Module d'authentification et de gestion des utilisateurs. Gère 8 rôles (apprenant, institution, enseignant, caissier_banque, ressources_humaines, cabinet_comptable, comite_orientation, admin). Authentification par JWT (Bearer token). Supporte login, register, confirmation email, reset password.

#### Modèles principaux

| Modèle | Table | Champs clés |
|---|---|---|
| **Utilisateur** | `aut_utilisateurs` | id (UUID), nom, prenoms, identifiant (unique), email (unique), motDePasse (bcrypt), role (enum 8 valeurs), contact, photoDeProfil, dateVerificationEmail, dateCreation, dateModification |
| **Apprenant** | `aut_apprenants` | id, photo, qrCode, dateNaissance, lieuNaissance, adresseId, identiteId, informationsSalarieId, informationsParentsId, personnePrevenirId, utilisateurId |
| **Enseignant** | `aut_enseignants` | id, photo, qrCode, dateNaissance, lieuNaissance, fonction, adresseId, utilisateurId |
| **Institution** | `aut_institutions` | id, dateNaissance, lieuNaissance, fonction, adresseId, utilisateurId |
| **Permission** | `aut_permissions` | id, key (unique), libelle, module, type (menu/action), parentKey |
| **Role** | `aut_roles` | id, nom (unique), description |

#### API Routes

| Méthode | Chemin | Middleware | Fonction |
|---|---|---|---|
| POST | `/auth/login` | — | Authentification (email + motDePasse) → JWT |
| POST | `/auth/register` | — | Création de compte |
| POST | `/auth/update-profile` | Authenticate + upload | Mise à jour photo de profil |
| GET | `/auth/utilisateurs` | Authenticate | Liste paginée des utilisateurs |
| GET | `/auth/utilisateurs/:id` | — | Détail utilisateur |
| PUT | `/auth/utilisateurs/` | — | Mise à jour |
| DELETE | `/auth/utilisateurs/:id` | AuthInstitution + Permission | Suppression logique |
| GET | `/auth/apprenants/` | — | Liste apprenants |
| GET | `/auth/apprenants/:id` | — | Détail apprenant |
| PUT | `/auth/apprenants/` | — | Mise à jour apprenant |
| POST | `/auth/apprenants/qr-codes/generate` | AuthInstitution | Génération QR codes masse |
| GET | `/auth/permissions/` | Authenticate | Arbre des permissions |
| GET | `/auth/permissions/flat` | Authenticate | Liste plate des permissions |
| GET | `/auth/permissions/mes-permissions` | Authenticate | Permissions de l'utilisateur courant |
| POST | `/auth/permissions/check` | Authenticate | Vérification d'une permission |
| GET,POST,PUT,DELETE | `/auth/roles/...` | — | CRUD rôles + assignation permissions/utilisateurs |

#### Associations clés
```
Utilisateur 1──1 Apprenant / Enseignant / Institution / CaissierBanque / ComiteOrientation
Apprenant 1──1 AdresseApprenant ─ IdentiteApprenant ─ InformationsParentsApprenant
Role N──N Permission (via RolePermission)
Role N──N Utilisateur (via UserRole)
Utilisateur N──N Permission (via UserPermission)
```

---

### 3.2 Orientation

**Préfixe table :** `ori_` · **Préfixe modèle :** `Ori`  
**Route de base :** `/api/v1/orientation`

#### Description
Module de pré-orientation : catalogue de parcours, matières prérequis, niveaux d'étude, catégories de formation. L'étudiant peut explorer les parcours, les ajouter à un panier, soumettre une demande d'orientation, et recevoir une réponse.

#### Modèles principaux

| Modèle | Champs clés |
|---|---|
| **Parcours** | titre, contenu, categorieId, niveauEtudeId, dureeDeFormation, type (LICENCE/MASTER) |
| **Categorie** | libelle, description |
| **NiveauEtude** | libelle, description |
| **MatierePrerequis** | libelle |
| **PrerequisParcours** | parcoursId, niveauEtudeId, matierePrerequisId, noteRequise, typeEvaluation, periodeEvaluation |
| **DemandeOrientation** | dateDemande, utilisateurId |
| **ReponseOrientation** | message, dateReponse, demandeOrientationId, utilisateurId |
| **ParcoursChoisi** | etatDeValidation, choixFinal, parcoursId, demandeOrientationId |
| **PanierParcoursChoisi** | (panier de sélection) |

#### API Routes

Toutes les routes sont sous `/orientation` avec Authenticate :
- CRUD standard : `/parcours`, `/matieres`, `/niveauxEtude`, `/categories`
- `/debouchesParcours`, `/prerequisParcours`, `/parcoursChoisis`
- `/demandesOrientation`, `/reponsesOrientation`, `/panierParcoursChoisis`
- `/prerequisParcoursChoisis`

#### Workflow
```
Étudiant consulte le catalogue → Ajoute des parcours au panier
→ Soumet une demande d'orientation → Reçoit une réponse du comité
→ Parcours choisi validé → Bascule vers Inscription
```

---

### 3.3 Inscription (cœur métier)

**Préfixe table :** `ins_` · **Préfixe modèle :** `Ins`  
**Route de base :** `/api/v1/inscription`

#### Description
Module central de l'application. Gère l'intégralité du cycle d'inscription : sessions, cours, classes, demandes d'inscription, dossiers étudiants, paiements, échéances, bordereaux, présences, notes, évaluations, et publications.

C'est le plus gros module avec **~48 contrôleurs**, **~49 routeurs**, **~49 modèles**.

#### Modèles principaux

| Groupe | Modèles |
|---|---|
| **Structure** | AnneeAcademique, Session, Cours, Classe, Parcours, NiveauEtude, SalleDeClasse |
| **Demande** | DemandeInscription, ReponseInscription, EtapeInscription, PreInscription, DossierInscription |
| **Étudiant** | CursusApprenant, CoursParticipant, DossierEtudiant |
| **Paiement** | FraisInscription, PaiementInscription, Echeance, Bordereau, Quitus |
| **Frais** | FraisParcours, ReductionFrais, PenaliteRetard |
| **Pédagogie** | ChapitreCours, Ressource, FichierRessource, Seance |
| **Présence** | Presence, ListePresence, PresenceCoursParticipant, Pointage |
| **Évaluation** | TypeNoteEvaluation, ListeNoteEvaluation, NoteEvaluation, PublicationNote |
| **Suivi** | Absence, Equivalence, Dispense, RattrapageInscription, CahierDeTexte, BlocCahierDeTexte |
| **UE/MCC** | UniteEnseignement, Mcc, RegleEvaluation, SessionExamen |

#### Champs clés par modèle

| Modèle | Champs importants |
|---|---|
| **AnneeAcademique** | libelle (ex: "2025-2026") |
| **Session** | libelle, dateDebut, dateFin, anneeAcademiqueId, niveauEtudeId, parcoursId |
| **Cours** | code, intitule, credit, estObligatoire, semestre, classeId, parcoursId, enseignantId |
| **CursusApprenant** | parcoursId, niveauEtudeId, classeId, anneeAcademiqueId, utilisateurId, demandeInscriptionId, externe |
| **DemandeInscription** | matricule (unique), dateDemande, dateValidation, sessionId, etapeInscriptionId, utilisateurId |
| **PaiementInscription** | numero, montant, datePaiement, type (especes/mobile_money/virement/cheque), matriculeInscription, utilisateurId |
| **Echeance** | dossierEtudiantId, type, numeroEcheance, montant, dateLimite, statut, moisConcerne |
| **Bordereau** | echeanceId, fichier, montant, statut (soumis/valide/rejete), dateSoumission, dateValidation |
| **NoteEvaluation** | note (0-20), listeNoteEvaluationId, coursParticipantId, statut (brouillon/publie) |
| **PublicationNote** | (traçabilité de publication) |
| **FraisParcours** | parcoursId, niveauEtudeId, anneeAcademiqueId, montant |
| **ReductionFrais** | type (bourse/fratrie/merite/personnalisee), valeur, typeValeur (pourcentage/montant_fixe) |
| **PenaliteRetard** | type, pourcentage, delaiGrace |

#### API Routes

Toutes sous `/inscription` avec Authenticate.
Plus de **45 préfixes** : sessions, cours, classes, parcours, demandesInscription, paiementsInscription, quitus, dossiersInscription, anneesAcademiques, cursusApprenant, sallesDeClasse, chapitresCours, ressources, fichiersRessource, seances, presences, listesPresences, cahiersDeTexte, blocsCahierDeTexte, typesNoteEvaluation, listesNoteEvaluation, notesEvaluation, pointages, echeances, bordereaux, dossiers, pre-inscriptions, unites-enseignement, mcc, regles-evaluation, sessions-examens, absences, equivalences, dispenses, rattrapages, publications-notes, frais-parcours, reductions-frais, penalites-retard.

Routes spéciales :
- `GET /bordereaux/:id/download` — téléchargement fichier (public)
- `POST /notesEvaluation/bulk` — création/update en masse de notes
- `GET /publications-notes/mes-notes` — notes publiées de l'étudiant connecté

#### Workflow Inscription complet
```
1. Session ouverte par l'institution
2. Étudiant soumet DemandeInscription
3. DossierInscription créé (pièces justificatives)
4. Pré-inscription validée par le comité d'orientation
5. CursusApprenant créé (parcours, classe, année)
6. Choix des cours (CoursParticipant)
7. Paiement des frais (PaiementInscription ou échéancier)
8. Bordereaux de paiement uploadés/validés
9. Echeances générées si mensualisation
10. Quitus délivré quand tout est payé
```

#### Workflow Évaluation
```
1. Enseignant crée TypeNoteEvaluation (CC/DS/Examen)
2. Crée ListeNoteEvaluation (date, coefficient, cours)
3. Saisit les notes (NoteEvaluation) — validation 0-20, bulk upsert
4. Publie les notes (statut → 'publie', création PublicationNote)
5. Étudiant consulte ses notes publiées (GET /mes-notes)
6. Bulletin généré à partir des notes publiées
```

---

### 3.4 Bulletins & Évaluations

**Route :** `/api/v1/inscription` (partagé avec module Inscription)

#### Modèles

| Modèle | Champs clés |
|---|---|
| **Bulletin** | semestre, cursusApprenantId, classeId, parcoursId, niveauEtudeId, moyenneGenerale, totalCredits, creditsValides, rang, effectifClasse, mention, appreciation, statut (brouillon/publie), dateGeneration, datePublication, signatureEnseignant, signatureChef |
| **LigneBulletin** | bulletinId, coursId, moyenneCC, noteDevoir, noteExamen, moyenne, coefficient, rang, appreciation |
| **Deliberation** | libelle, classeId, periode, date, statut (planifiee/en_cours/cloturee), effectif, admis |
| **ResultatDeliberation** | deliberationId, cursusApprenantId, moyenne, mention, rang, decision (admis/rattrapage/redouble) |
| **EchelleNote** | libelle, noteMin, noteMax, mention, ordre |
| **JuryMembre** | deliberationId, utilisateurId, role (president/membre/secretaire), presence |
| **AuditNote** | (traçabilité des modifications de notes) |

#### API Routes

Toutes sous `/inscription` :
- `/bulletins` — CRUD + génération
- `/deliberations` — CRUD + gestion jury + résultats
- `/echelles-notes` — barèmes de notation
- `/audit-notes` — historique des modifications
- `/jury-membres` — composition du jury

#### Workflow Bulletin
```
1. Notes publiées pour un semestre
2. Calcul compensation (CalculCompensationService)
3. Génération bulletins (calcul moyennes, crédits, rangs)
4. Délibération programmée (jury, résultats)
5. Publication bulletins (statut → 'publie')
6. Étudiant consulte son relevé de notes
```

---

### 3.5 Cours & Pédagogie

Partie du module Inscription. Gère :
- **Cours** : code, intitulé, crédits, semestre, enseignant
- **Chapitres** : organisation du cours
- **Ressources** : supports de cours (PDF, vidéo, etc.)
- **FichierRessource** : fichiers uploadés
- **Séances** : sessions de cours planifiées
- **Présences** : émargement (avec scan QR code)
- **Cahiers de textes** : suivi pédagogique

---

### 3.6 Scolarité

**Préfixe table :** `scol_` · **Préfixe modèle :** `Scol`  
**Route de base :** `/api/v1/scolarite`

#### Modèles
| Modèle | Description |
|---|---|
| **TypeDocument** | Types de documents (relevé, attestation, diplôme, etc.) |
| **DemandeDocument** | Demandes de documents par les étudiants |
| **DocumentDelivre** | Documents générés et délivrés |
| **Reclamation** | Réclamations des étudiants |
| **ReponseReclamation** | Réponses aux réclamations |
| **RegistreAcademique** | Registre des résultats |
| **EvenementCalendrier** | Calendrier académique |
| **SanctionDiscipline** | Sanctions disciplinaires |
| **ConseilClasse** | Conseils de classe |
| **DecisionConseil** | Décisions du conseil |
| **Livre** | Bibliothèque / fonds documentaire |

#### API Routes
Toutes sous `/scolarite` : demandesDocument, typesDocument, reclamations, registres, calendrier, discipline, conseils, bibliotheque

---

### 3.7 E-Learning

**Préfixe table :** `elearning_` · **Préfixe modèle :** `ELearning`  
**Route de base :** `/api/v1/elearning`

#### Modèles
| Modèle | Description |
|---|---|
| **CoursEnLigne** | Cours numérique (lié à un Cours) |
| **ModuleElearning** | Modules/sections du cours |
| **Support** | Supports (PDF, vidéo compressée) |
| **Salon** | Salon de discussion |
| **ParticipantSalon** | Participants au salon |
| **Message** | Messages du chat (temps réel via Socket.io) |
| **Devoir** | Devoir à rendre |
| **SoumissionDevoir** | Soumission de l'étudiant |
| **Quiz** | Questionnaire |
| **ReponseQuiz** | Réponses au quiz |
| **Progression** | Suivi progression |
| **Certificat** | Certificat de réussite |

#### API Routes
Sous `/elearning` : cours, modules, supports, chat, notifications, devoirs, quiz, progression, certificats

---

### 3.8 Communication

**Préfixe table :** `com_` · **Préfixe modèle :** `Com`  
**Route de base :** `/api/v1/communication`

#### Modèles
| Modèle | Description |
|---|---|
| **Communication** | Communications officielles |
| **Actualite** | Actualités / annonces |
| **Suggestion** | Suggestions (vie estudiantine) |
| **ReponseSuggestion** | Réponse aux suggestions |

---

### 3.9 GED (Gestion Électronique de Documents)

**Préfixe table :** `ged_` · **Préfixe modèle :** `Ged`  
**Route de base :** `/api/v1/ged`

#### Modèles
| Modèle | Description |
|---|---|
| **DocumentGed** | Document numérique (avec fichier uploadé) |
| **Folder** | Dossier / répertoire documentaire |
| **SessionGed** | Session de traitement documentaire |

---

### 3.10 Stages

**Préfixe table :** `stg_` · **Préfixe modèle :** `Stg`  
**Route de base :** `/api/v1/stages`

#### Modèles
| Modèle | Description |
|---|---|
| **Entreprise** | Entreprise d'accueil |
| **Tuteur** | Tuteur professionnel |
| **OffreStage** | Offre de stage |
| **DemandeStage** | Candidature |
| **ConventionStage** | Convention tripartite |
| **RapportStage** | Rapport de stage |
| **NoteStage** | Notation du stage |
| **AttestationStage** | Attestation de stage |

---

### 3.11 Comptabilité (OHADA)

**Préfixe table :** `cpt_` · **Préfixe modèle :** `Cpt`  
**Route de base :** `/api/v1/comptabilite`

#### Description
Module de comptabilité conforme au **Plan Comptable OHADA** (Organisation pour l'Harmonisation en Afrique du Droit des Affaires). Couvre les classes 1 à 7.

#### Modèles

| Modèle | Table | Champs clés |
|---|---|---|
| **Compte** | `cpt_comptes` | numero (string, ex: "512"), libelle, classe (1-7), sousClasse, nature (Debit/Credit), categorie, description, actif, moduleSource |
| **JournalComptable** | `cpt_journaux` | code (VEN/ACH/BQ/CAI/PAI/OD), libelle, type, actif |
| **EcritureComptable** | `cpt_ecritures` | journalId, numeroEcriture, dateEcriture, dateComptable, compteDebitId, compteCreditId, montant, libelle, reference, moduleSource, utilisateurSaisieId, validee, utilisateurValidationId, dateValidation |

#### Plan comptable seedé (33 comptes)

| Classe | Comptes |
|---|---|
| **Classe 1** (Ressources durables) | 101 (Capital), 106 (Réserves), 12 (Résultat), 13 (Subventions) |
| **Classe 2** (Actif immobilisé) | 21 (Immobilisations) |
| **Classe 3** (Stocks) | 31 (Marchandises) |
| **Classe 4** (Tiers) | 401 (Fournisseurs), 411 (Clients), 421 (Personnel), 431 (Sécurité sociale), 447 (État) |
| **Classe 5** (Trésorerie) | 512 (Banque), 521 (Caisse) |
| **Classe 6** (Charges) | 601 (Achats), 611 (Transports), 641 (Personnel), 646 (Honoraires), 661 (Intérêts) |
| **Classe 7** (Produits) | 701 (Ventes), 702 (Prestations) |

Sous-comptes dédiés :
- 641100 (Salaires), 641200 (Prestations enseignants)
- 702100 (Inscriptions), 702200 (Scolarité), 702300 (Examens), 702400 (Divers)

#### Journaux

| Code | Libellé | Type |
|---|---|---|
| VEN | Journal des Ventes | Vente |
| ACH | Journal des Achats | Achat |
| BQ | Journal de Banque | Banque |
| CAI | Journal de Caisse | Caisse |
| PAI | Journal de Paie | Paie |
| OD | Journal des Opérations Diverses | OD |

#### API Routes

Sous `/comptabilite` :
- `GET /comptes` — liste (filtrable par classe)
- `GET /comptes/:id` — détail
- `GET /journaux` — liste des journaux
- `CRUD /ecritures` — écritures comptables
- `GET /ecritures` — avec filtres (journal, statut validation, date)

#### Workflow comptable

```
┌────────────────────────────────────────────────────────────┐
│                    Écriture Comptable                      │
│  Journal VEN : Débit 512 (Banque) / Crédit 702 (Ventes)   │
│  Journal PAI : Débit 641 (Personnel) / Crédit 512 (Banque)  │
│                                                            │
│  1. Saisie → 2. Validation → 3. Lettrage → 4. Balance    │
│                                                            │
│  Balance = Σ(Débits) = Σ(Crédits)                          │
│  Grand-Livre = Historique complet d'un compte              │
└────────────────────────────────────────────────────────────┘
```

**Intégrations automatiques :**
- `RhPrestationEnseignant.payer()` → écriture (Débit 641200 / Crédit 512, journal PAI)
- `PaiementInscription.createMobileMoneyPaiementInscription()` → écriture (Débit 512 / Crédit 702, journal VEN)

---

### 3.12 Ressources Humaines

**Préfixe table :** `rh_` · **Préfixe modèle :** `Rh`  
**Route de base :** `/api/v1/rh`

#### Modèles

| Modèle | Description |
|---|---|
| **RhDepartement** | Départements (informatique, admin, etc.) |
| **RhTypeContrat** | Types de contrat (CDI, CDD, vacataire, etc.) |
| **RhPoste** | Postes / fonctions |
| **RhEmploye** | Employés (lié à un Utilisateur) — statut: actif/suspendu/quitte |
| **RhOffreEmploi** | Offres d'emploi |
| **RhCandidature** | Candidatures spontanées ou sur offre |
| **RhEntretien** | Entretiens d'embauche |
| **RhFormation** | Formations continues |
| **RhParticipationFormation** | Participation aux formations |
| **RhCritereEvaluation** | Critères d'évaluation (avec poids) |
| **RhFicheEvaluation** | Fiches d'évaluation employé |
| **RhEvaluationCritere** | Notes par critère |
| **RhContratEnseignant** | Contrats spécifiques enseignants (CDI/CDD/vacataire, montant mensuel/taux horaire/volume, statut: brouillon/actif/resilie, pieceJointe) |

#### API Routes

Sous `/rh` : departements, types-contrat, postes, employes, offres-emploi, candidatures, entretiens, formations, participations-formation, criteres-evaluation, fiches-evaluation, evaluations-criteres, contrats-enseignant (CRUD + résilier/activer)

---

### 3.13 Paie

**Préfixe :** `rh_` (même module RH)

#### Modèles

| Modèle | Description |
|---|---|
| **RhRubriquePaie** | Rubriques (salaire de base, IRPP, CNSS, etc.) — type: gain/retenue/cotisation, modeCalcul: fixe/pourcentage, imposable |
| **RhPeriodePaie** | Périodes de paie (mois, année, statut) |
| **RhBulletinPaie** | Bulletin de paie (employé, période, totalGains, totalRetenues, netAPayer, statut) |
| **RhLigneBulletin** | Lignes du bulletin (rubrique, base, taux, montant) |
| **RhPrestationEnseignant** | Prestations vacataires (enseignant, cours, mois, année, nombreHeures, tauxHoraire, montant, statut: saisie/validee/payee) |

#### Workflow Paie
```
┌─────────────────────────────────────────────────────────┐
│ 1. Paramétrage rubriques (gain/retenue/cotisation)      │
│ 2. Création période de paie                             │
│ 3. Saisie prestations enseignants (saisie → validee)    │
│ 4. Génération bulletins                                 │
│ 5. Validation → Paiement (statut → payee)               │
│    → Écriture compta auto : D 641200 / C 512 (PAI)     │
└─────────────────────────────────────────────────────────┘
```

---

### 3.14 Achats

**Préfixe table :** `ach_` · **Préfixe modèle :** `Ach`  
**Route de base :** `/api/v1/achats`

#### Modèles

| Modèle | Description |
|---|---|
| **CategorieAchat** | Catégories d'achats |
| **Fournisseur** | Fournisseurs |
| **Budget** | Budget par département/période |
| **LigneBudget** | Lignes budgétaires par catégorie |
| **Demande** | Demande d'achat (avec circuit validation) |
| **LigneDemande** | Lignes de la demande |
| **Engagement** | Engagement budgétaire |
| **Commande** | Bon de commande |
| **LigneCommande** | Lignes de commande |
| **Reception** | Réception de commande |
| **LigneReception** | Lignes réceptionnées |
| **FactureProforma** | Factures fournisseurs |
| **LigneFacture** | Lignes de facture |

#### Workflow Achats
```
Demande → Validation(s) → Engagement budgétaire → Commande
→ Réception → Facture → Paiement
```

---

### 3.15 Stocks

**Préfixe table :** `stk_` · **Préfixe modèle :** `Stk`

#### Modèles
| Modèle | Description |
|---|---|
| **CategorieArticle** | Catégories (fournitures, équipement, etc.) |
| **Article** | Articles (nom, référence, stockActuel, stockMinimum, prixUnitaire) |
| **Fournisseur** | Fournisseurs |
| **MouvementStock** | Mouvements (entrée/sortie, quantite, motif) |
| **BonCommande** | Bons de commande internes |
| **LigneBonCommande** | Lignes de commande |

#### Workflow Stock
```
Article créé → Mouvement d'entrée (achat) → Stock augmente
→ Mouvement de sortie (utilisation) → Stock diminue
→ Alerte si stock < stockMinimum
```

---

### 3.16 Immobilisations

**Préfixe table :** `imm_` · **Préfixe modèle :** `Imm`

#### Modèles

| Modèle | Description |
|---|---|
| **Site** | Sites (campus, annexes) — champs: nom, ville |
| **Batiment** | Bâtiments par site |
| **Localisation** | Salles/emplacements |
| **Departement** | Départements |
| **CategorieImmobilisation** | Catégories avec durée/taux d'amortissement |
| **Immobilisation** | Biens (nom, référence, codeQR, état: neuf/bon/moyen/mauvais/reforme, valeurAcquisition) |
| **Acquisition** | Détail d'acquisition |
| **Amortissement** | Échéancier d'amortissement |
| **Maintenance** | Maintenances curatives/préventives |
| **MaintenanceProgrammee** | Planification maintenance |
| **Cession** | Cession/revente d'immobilisation |

---

### 3.17 Pointage

**Préfixe table :** `ptg_` · **Préfixe modèle :** `Ptg`  
**Route de base :** `/api/v1/pointage`

Pages : Terminal (scan), Historique, Shifts, Planning, Absences, Rapports

---

### 3.18 Reporting

**Préfixe table :** `rpt_` · **Préfixe modèle :** `Rpt`

Rapports pré-calculés sous forme de tables dédiées (snapshots) pour les performances :

| Modèle | Description |
|---|---|
| **RptEffectif** | Effectifs étudiants |
| **RptEvaluation** | Résultats d'évaluation |
| **RptNoteMoyenne** | Moyennes par classe/cours |
| **RptReussite** | Taux de réussite |
| **RptPaiement** | Statistiques paiements |
| **RptBudgetVsReel** | Budget vs réel |
| **RptPaie** | Masse salariale |
| **RptStock** | État des stocks |
| **RptImmobilisation** | Valeur du patrimoine |

---

### 3.19 Administration

Module transverse (pas de base de données propre). Utilise Auth & Permissions :

- **QR Codes** : génération pour étudiants et enseignants
- **Utilisateurs** : gestion CRUD
- **Rôles** : création, assignation, permissions
- **Permissions** : arbre hiérarchique, vérification
- **Audit Logs** : traçabilité des actions
- **Configuration** : paramètres généraux du système

---

## 4. Modules fonctionnels — Frontend

### 4.1 Modules et routes

| Module frontend | Route | Pages | Auth |
|---|---|---|---|
| **Auth** | `/auth/connexion`, `/auth/inscription`, `/auth/mot-de-passe-oublie`, `/auth/reinitialisation-mot-de-passe`, `/auth/confirmation-email` | 5 | Non |
| **Dashboard** | `/` | 1 (accueil) | Oui |
| **Orientation** | `/orientation/parcours`, `/orientation/demandes` | 5 | Non |
| **Inscription** | `/inscription/sessions`, `/inscription/cours`, `/inscription/parcours`, `/inscription/demandes`, `/inscription/paiements`, `/inscription/cursus`, `/inscription/bordereaux`, `/inscription/dossiers`, `/inscription/echeances`, `/inscription/frais-parcours` | 20 | Oui |
| **Cours** | `/cours/cours`, `/cours/presences`, `/cours/notes`, `/cours/notes/:id/saisie`, `/cours/mes-notes`, `/cours/cahiers-de-texte`, `/cours/enseignants`, `/cours/emplois-du-temps` | 21 | Oui |
| **Bulletins** | `/bulletins`, `/bulletins/generer`, `/bulletins/deliberations`, `/bulletins/ues`, `/bulletins/mcc`, `/bulletins/sessions`, `/bulletins/rattrapages`, `/bulletins/absences`, `/bulletins/echelles`, `/bulletins/jury`, `/bulletins/equivalences`, `/bulletins/dispenses`, `/bulletins/audit-notes`, `/bulletins/mon-releve` | 27 | Oui |
| **Scolarité** | `/scolarite/demandes-documents`, `/scolarite/reclamations`, `/scolarite/registres`, `/scolarite/calendrier`, `/scolarite/discipline`, `/scolarite/conseils`, `/scolarite/bibliotheque` | 10 | Oui |
| **E-Learning** | `/elearning`, `/elearning/:id/chat`, `/elearning/quiz`, `/elearning/devoirs`, `/elearning/progression`, `/elearning/certificats` | 12 | Oui |
| **Stages** | `/stages/offres`, `/stages/demandes`, `/stages/entreprises` | 8 | Oui |
| **Comptabilité** | `/comptabilite/dashboard`, `/comptabilite/plan-comptable`, `/comptabilite/balance`, `/comptabilite/grand-livre`, `/comptabilite/ecritures` | 5 | Oui |
| **RH** | `/rh`, `/rh/employes`, `/rh/offres-emploi`, `/rh/candidatures`, `/rh/paie`, `/rh/prestations`, `/rh/contrats-enseignant`, `/rh/formations`, `/rh/evaluations` | 16 | Oui |
| **Achats** | `/achats/demandes`, `/achats/commandes`, `/achats/factures`, `/achats/budgets`, `/achats/fournisseurs`, `/achats/validations` | 11 | Oui |
| **Stocks** | `/stocks/articles`, `/stocks/mouvements`, `/stocks/fournisseurs` | 7 | Oui |
| **Immobilisations** | `/immobilisations`, `/immobilisations/sites`, `/immobilisations/categories`, `/immobilisations/maintenances` | 9 | Oui |
| **Pointage** | `/pointage`, `/pointage/historique`, `/pointage/shifts`, `/pointage/absences`, `/pointage/planning`, `/pointage/rapports` | 7 | Oui |
| **Communication** | `/communication`, `/communication/annonces`, `/communication/messagerie`, `/communication/suggestions`, `/communication/notifications`, `/communication/discussions` | 11 | Oui |
| **Reporting** | `/reporting`, `/reporting/effectifs`, `/reporting/notes`, `/reporting/paiements`, `/reporting/budget`, `/reporting/rh`, `/reporting/stocks`, `/reporting/immobilisations` | 9 | Oui |
| **GED** | `/ged/catalog`, `/ged/upload`, `/ged/nomenclature`, `/ged/document/:id`, `/ged/folders`, `/ged/sessions` | 8 | Oui |
| **Administration** | `/administration/utilisateurs`, `/administration/roles`, `/administration/permissions`, `/administration/qr-codes`, `/administration/audit-logs`, `/administration/configuration` | 7 | Oui |
| **Paramètres** | `/parametres/profil`, `/parametres/compte`, `/parametres/ecole`, `/parametres/annees-scolaires`, `/parametres/frais`, `/parametres/roles`, `/parametres/permissions`, `/parametres/notifications`, `/parametres/systeme`, `/parametres/sauvegardes` | 16 | Oui |

### 4.2 Composants partagés (SharedModule)

| Composant | Usage |
|---|---|
| `FormInputComponent` | Champ de formulaire réutilisable |
| `CustomButtonComponent` | Bouton avec gestion de chargement |
| `CustomModalComponent` | Fenêtre modale générique |
| `CustomAlertComponent` | Alerte / notification |
| `VideoPlayerComponent` | Lecteur vidéo (ngx-videogular) |
| `CustomFilePickerComponent` | Sélecteur de fichier |
| `CustomBadgeComponent` | Badge de statut |
| `HeaderTitleComponent` | Titre de page |
| `CustomWizardComponent` | Assistant multi-étapes |
| `CustomPdfViewerComponent` | Visualiseur PDF |
| `LoadingSpinnerComponent` | Spinner de chargement global |
| `ToastContainerComponent` | Conteneur de notifications toast |
| `CoursCardComponent` | Carte de cours |
| `PresenceCardComponent` | Carte de présence |
| `SafeUrlPipe` | Pipe de sécurisation d'URL |

### 4.3 Sidebar (5 groupes)

Le menu latéral est organisé en 5 groupes, avec visibilité par rôle et permission :

```
┌─────────────────────────────────────┐
│ Groupe 1 : Scolarite & Formation    │
│  Inscription (8 sous-pages)         │
│  Orientation (2)                    │
│  Cours (8)                          │
│  Évaluations (14)                   │
│  Scolarité (10)                     │
│  E-Learning (6)                     │
├─────────────────────────────────────┤
│ Groupe 2 : Finances & Operations    │
│  Finance (5)                        │
│  Achats (5)                         │
│  Stages (3)                         │
│  Stocks (3)                         │
│  Immobilisations (4)                │
│  RH (7)                             │
│  Pointage (6)                       │
├─────────────────────────────────────┤
│ Groupe 3 : Communication & Support  │
│  Communication (5)                  │
│  Reporting (4)                      │
├─────────────────────────────────────┤
│ Groupe 4 : Archivages Numeriques    │
│  Documents (2)                      │
│  Traitement (2)                     │
│  Organisation (2)                   │
├─────────────────────────────────────┤
│ Groupe 5 : Administration & Comptes │
│  Administration (7)                 │
│  Comité orientation (1)             │
│  Paramètres (12)                    │
└─────────────────────────────────────┘
```

---

## 5. Workflows métier

### 5.1 Parcours étudiant complet

```
                  ┌─────────────────┐
                  │  Consultation   │
                  │  Catalogue      │
                  └────────┬────────┘
                           │
                  ┌────────▼────────┐
                  │  Ajout Panier   │
                  │  Orientation    │
                  └────────┬────────┘
                           │
                  ┌────────▼────────┐
                  │  Demande        │
                  │  Orientation    │
                  └────────┬────────┘
                           │
                  ┌────────▼────────┐
                  │  Réponse Comité │
                  │  (Validation)   │
                  └────────┬────────┘
                           │
                  ┌────────▼────────┐
                  │  Inscription    │
                  │  (Session)      │
                  └────────┬────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
     ┌────────▼───┐ ┌─────▼─────┐ ┌───▼────────┐
     │  Dossier   │ │  Choix    │ │  Paiement   │
     │  Pièces    │ │  Cours    │ │  Échéances  │
     └────────┬───┘ └─────┬─────┘ └───┬────────┘
              │            │            │
              └────────────┼────────────┘
                           │
                  ┌────────▼────────┐
                  │  Cursus actif   │
                  │  (Classe, UE)   │
                  └────────┬────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
     ┌────────▼───┐ ┌─────▼─────┐ ┌───▼────────┐
     │  Cours     │ │  Séances  │ │  Présences │
     │  Ressources│ │  Cahier   │ │  QR Code   │
     └────────┬───┘ │  Texte    │ └────────────┘
              │     └───────────┘
              │            │
              └────────────┼────────────┐
                           │            │
                  ┌────────▼───┐  ┌────▼─────────┐
                  │  Évaluations│  │  Notes 0-20  │
                  │  CC, DS    │  │  Publication  │
                  │  Examen    │  │  (blocage si  │
                  └────────┬───┘  │   'publie')   │
                           │      └──────┬────────┘
                           │            │
                           └──────┬─────┘
                                  │
                         ┌────────▼────────┐
                         │  Bulletin       │
                         │  Compensation   │
                         │  Moyenne / Rang │
                         └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │  Délibération   │
                         │  Jury / Décision│
                         └────────┬────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
     ┌────────▼───┐     ┌────────▼─────┐     ┌──────▼─────────┐
     │  Admis     │     │  Rattrapage  │     │  Redoublement  │
     │  Semestre  │     │  Session 2   │     │  Réinscription │
     │  Suivant   │     │  (max note)  │     │                │
     └────────────┘     └──────────────┘     └────────────────┘
```

### 5.2 Workflow Paiement & Comptabilité

```
┌───────────────────────────────────────────────────────────────────┐
│                        Paiement étudiant                          │
│                                                                   │
│  FraisInscription fixés par session                               │
│       │                                                           │
│       ▼                                                           │
│  DossierEtudiant créé avec modePaiement (comptant/mensualité)     │
│       │                                                           │
│       ├── Si comptant → Paiement unique (Mobile Money/Espèces)   │
│       │      │                                                    │
│       │      └── Écriture compta auto (D 512 / C 702, VEN)       │
│       │                                                           │
│       └── Si mensualité → Échéances générées (N mensualités)     │
│              │                                                    │
│              ▼                                                    │
│         Bordereau uploadé par étudiant                            │
│              │                                                    │
│              ▼                                                    │
│         Bordereau validé par institution                          │
│              │                                                    │
│              └── Échéance marquée payée                           │
│                                                                   │
│  Quand tout payé → Quitus délivré                                 │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                     Paiement Prestation Enseignant                │
│                                                                   │
│  Prestation saisie (saisie) → Validée (validee) → Payée (payee)  │
│       │                                                           │
│       └── Écriture compta auto (D 641200 / C 512, journal PAI)   │
└───────────────────────────────────────────────────────────────────┘
```

### 5.3 Workflow Évaluation & Bulletin

```
┌──────────────────────────────────────────────────────────────────┐
│  1. Paramétrage                                                  │
│     ├── TypeNoteEvaluation (CC: 40%, DS: 30%, Examen: 30%)      │
│     ├── EchelleNote (A: 16-20, B: 12-16, C: 10-12, D: 0-10)    │
│     └── RegleEvaluation (seuil compensation, crédits minimum)    │
│                                                                  │
│  2. Création ListeNoteEvaluation (cours, type, date, coef)      │
│                                                                  │
│  3. Saisie notes (bulk upsert, validation 0-20)                 │
│     │                                                            │
│     ▼                                                            │
│  4. Publication (statut → 'publie', verrouillage modification)   │
│     │                                                            │
│     ▼                                                            │
│  5. Consultation étudiant (GET /mes-notes, widget dashboard)     │
│     │                                                            │
│     ▼                                                            │
│  6. Génération Bulletin                                          │
│     ├── Calcul moyenneCC (pondération)                           │
│     ├── Note examen                                              │
│     ├── Moyenne = moyenneCC × 0.4 + noteExamen × 0.6            │
│     ├── Compensation entre UE                                   │
│     ├── Calcul crédits ECTS                                      │
│     ├── Classement (rang / effectif)                             │
│     └── Mention                                                  │
│     │                                                            │
│     ▼                                                            │
│  7. Délibération                                                 │
│     ├── Jury (président + membres + secrétaire)                  │
│     ├── Décision (admis/rattrapage/redouble)                     │
│     └── Signature                                                │
│     │                                                            │
│     ▼                                                            │
│  8. Publication bulletin (statut → 'publie')                     │
│     │                                                            │
│     ▼                                                            │
│  9. Consultation relevé de notes + impression PDF                │
└──────────────────────────────────────────────────────────────────┘
```

### 5.4 Workflow Paie & RH

```
┌──────────────────────────────────────────────────────────────────┐
│  Gestion des employés                                            │
│  ├── Création contrat (CDI/CDD/vacataire)                        │
│  ├── Département, poste, salaire de base                         │
│  └── Statut : actif/suspendu/quitté                              │
│                                                                  │
│  Contrats Enseignants (module dédié)                             │
│  ├── Type : CDI / CDD / Vacataire                                │
│  ├── Mode : montant mensuel / taux horaire + volume              │
│  ├── Statut : brouillon → actif → résilié                        │
│  └── Pièce jointe (contrat signé en PDF)                         │
│                                                                  │
│  Prestations (vacataires)                                        │
│  ├── Enseignant, cours, mois, année                              │
│  ├── Nombre d'heures × taux horaire = montant                    │
│  └── Statut : saisie → validee → payee                           │
│                                                                  │
│  Paie mensuelle                                                  │
│  ├── Paramétrage rubriques (gain/retenue/cotisation)             │
│  ├── Période de paie (mois, année, statut)                       │
│  ├── Génération bulletins (employé, total gains, retenues, net)  │
│  ├── Cotisations sociales (CNSS, IPM, etc.)                      │
│  ├── Impôt (IRPP)                                                │
│  └── Net à payer = total gains - total retenues                  │
│                                                                  │
│  Évaluations employés                                            │
│  ├── Critères avec poids (compétence, ponctualité, qualité)      │
│  ├── Fiche d'évaluation (note globale, commentaire)              │
│  └── Entretien annuel                                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. Sécurité & Authentification

### 6.1 Middleware chain

```
Requête HTTP
    │
    ▼
CORS (helmet)
    │
    ▼
Rate Limiting (express-rate-limit)
    │
    ▼
JSON Body Parser
    │
    ▼
Router → Middleware spécifique
    │
    ├── Authenticate.ts
    │   ├── Extrait Bearer token du header Authorization
    │   ├── Vérifie JWT (jsonwebtoken.verify)
    │   ├── Ajoute req.utilisateurId et req.utilisateurRole
    │   └── Passe au suivant ou 401
    │
    ├── Auth{Role}.ts (AuthEnseignant, AuthAdmin, etc.)
    │   └── Vérifie req.utilisateurRole === rôle attendu
    │
    ├── CheckPermission.ts
    │   └── Vérifie permission spécifique dans UserPermission/Role
    │
    └── Controller
```

### 6.2 Rôles disponibles

| Rôle | Middleware | Description |
|---|---|---|
| `apprenant` | `AuthApprenant` | Étudiant |
| `institution` | `AuthInstitution` | Administration établissement |
| `enseignant` | `AuthEnseignant` | Enseignant / professeur |
| `caissier_banque` | `AuthCaissierBanque` | Caissier |
| `ressources_humaines` | `AuthRessourcesHumaines` | RH |
| `cabinet_comptable` | `AuthCabinetComptable` | Comptable |
| `comite_orientation` | `AuthComiteOrientation` | Comité d'orientation |
| `admin` | `AuthAdmin` | Super-administrateur |

### 6.3 Permissions

Système de permissions fin par permission key (ex: `inscription.sessions.creer`).
- Arborescence : module → entité → action
- Types : `menu` (visibilité dans le sidebar) et `action` (boutons/opérations)
- Assignation : directe (UserPermission) ou par rôle (Role → RolePermission)
- Vérification frontend : `HasPermissionDirective` (`*appHasPermission`)

### 6.4 Protection des données

- **Mots de passe** : bcrypt (hash + salt)
- **JWT** : signé avec secret configurable dans `core/config/jwt.ts`
- **Soft delete** : tous les modèles Sequelize utilisent `paranoid: true` (champ `deletedAt`)
- **Validation entrées** : côté contrôleur/validateur (ex: `noteValidators.ts` pour notes 0-20)
- **Upload fichiers** : multer, limitation taille

---

## 7. Base de données

### 7.1 Connexion

Via `DatabaseConnection.ts` (singleton Sequelize) :
```typescript
const sequelize = new Sequelize({
  database: config.development.database,
  username: config.development.username,
  password: config.development.password,
  host: config.development.host,
  dialect: 'mysql',
  logging: false
});
```

### 7.2 Modèle de命名

Chaque module définit ses modèles avec :
```typescript
const MODULE_TABLE_PREFIX = 'ins_'
const MODULE_MODEL_PREFIX = 'Ins'

class Session extends Model<InferAttributes<Session>, InferCreationAttributes<Session>> {
  declare id: CreationOptional<string>
  declare libelle: string
  // ...
}
```

### 7.3 Associations

Chaque module a un fichier `_associations.ts` appelé dans `DatabaseConnection.ts` :
```typescript
// ins__associations.ts
Cours.belongsTo(Classe, { foreignKey: 'classeId' })
Cours.belongsTo(Parcours, { foreignKey: 'parcoursId' })
Cours.belongsTo(Enseignant, { foreignKey: 'enseignantId' })
// ...
```

### 7.4 Seed

Le fichier `seed.ts` initialise :
- **Comptes OHADA** : 33 comptes (classes 1-7) + sous-comptes (641100, 641200, 702100-702400)
- **Journaux** : VEN, ACH, BQ, CAI, PAI, OD

Exécution automatique au démarrage si `Compte.count() === 0`.

---

## 8. Déploiement & Configuration

### 8.1 Prérequis

- Node.js ≥ 22
- MySQL ≥ 8
- Redis (optionnel, pour le cache)

### 8.2 Variables d'environnement

```bash
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=easyecole
DB_USER=root
DB_PASSWORD=***
JWT_SECRET=***
REDIS_URL=redis://... (optionnel)
```

### 8.3 Lancement

```bash
# Backend
cd easy-ecole-backend
npm install
npm start        # ou : node index.js

# Frontend (nécessite NODE_OPTIONS pour Node 22)
cd easy-ecole-web
npm install
$env:NODE_OPTIONS="--openssl-legacy-provider"
ng serve         # → http://localhost:4200
```

### 8.4 Configuration frontend

Fichier `src/environments/environment.ts` :
```typescript
export const environment = {
  API_URL: 'http://localhost:3000/api/v1',
  API_MODULES: { AUTH, ORIENTATION, INSCRIPTION, COMPTABILITE, COURS,
                 IMMOBILISATIONS, STOCKS, STAGES, SCOLARITE, ELEARNING,
                 COMMUNICATION, RH },
  MEDIAS_PATH: { AUTH: { PROFILES, PHOTOS, PHOTOS_ENSEIGNANTS } }
}
```

### 8.5 Limitations connues

- **Node v22 + Angular 12** : nécessite `NODE_OPTIONS=--openssl-legacy-provider`
- **Fichiers GED** : verrouillés par permissions système (BUILTIN\Administrateurs)
- **package.json** : verrouillé en écriture (EPERM) — aucune dépendance installable
- **Pas de tests automatisés** ni CI/CD

---

## 9. Statistiques du projet

| Métrique | Valeur |
|---|---|
| **Modules backend** | 15 |
| **Contrôleurs backend** | ~140 |
| **Modèles backend** | ~130 |
| **Routes API backend** | ~350 |
| **Modules frontend** | 19 |
| **Pages frontend** | ~210 |
| **Services frontend** | ~110 |
| **Composants partagés** | 18 |
| **Enums** | 15 |
| **Types** | 6 |
| **Base de données** | MySQL, ~130 tables |

---

> **Document générée le 06/07/2026** — EasyEcole v1.0.0
