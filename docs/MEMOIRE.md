# MEMOIRE — Projet EasyEcole

> Fichier mémoire généré le 25/06/2026 — Document de référence pour l'architecture complète du projet.

---

## 1. PRÉSENTATION GÉNÉRALE

EasyEcole est une plateforme de gestion scolaire couvrant l'ensemble des processus d'un établissement d'enseignement : inscription, scolarité, cours, notes, bulletins, stages, stocks, immobilisations, achats, RH, pointage, e-learning, communication, reporting et comptabilité.

### Stack Technique

```
Frontend         Backend              Base de données
Angular 12.2     Node.js + Express    MySQL
TypeScript 4.3   TypeScript 5.1       Sequelize 6 ORM
Tailwind CSS 2.2 Socket.io 4.6        Port 3306
Port 4200        Port 3000            Database: easyecole
                 API: /api/v1
```

---

## 2. STRUCTURE DU PROJET

```
E:\EASYECOLE\
├── easy-ecole-web/          # Frontend Angular 12.2
│   └── src/app/
│       ├── app-routing.module.ts
│       ├── app.module.ts
│       ├── app.component.ts
│       ├── core/             # Services, guards, interceptors
│       ├── data/             # Modèles & services par module
│       ├── features/
│       │   ├── layout/       # BaseLayout, navigation
│       │   ├── modules/      # 17 modules métier
│       │   └── pages/        # Dashboard, 404
│       └── shared/           # 17 composants réutilisables + 1 pipe
│
├── easy-ecole-backend/       # Backend Express + Sequelize
│   └── src/
│       ├── app.ts            # Point d'entrée Express
│       ├── core/
│       │   ├── config/       # sequelize.json, mail.json, cinetpay.json
│       │   ├── enums/        # 14 enums partagés
│       │   ├── helpers/      # DB, Email, PDF, CinetPay, IDGenerator
│       │   ├── middlewares/  # 9 middlewares d'auth par rôle
│       │   └── swagger.ts    # Documentation OpenAPI 3.0
│       └── modules/          # 14 modules métier
│
├── docs/                     # Documentation
│   ├── superpowers/specs/    # 9 specs de conception
│   ├── superpowers/plans/    # 4 plans d'implémentation
│   └── guide/                # Guides utilisateur
│
└── .superpowers/             # Données brainstorming
```

---

## 3. DÉPENDANCES CLÉS

### Frontend

| Package | Version | Usage |
|---------|---------|-------|
| @angular/core | 12.2 | Framework |
| tailwindcss | 2.2 | CSS utilitaire |
| @fullcalendar/angular | 6.1 | Calendrier |
| @ng-select/ng-select | 7.4 | Select avancés |
| @videogular/ngx-videogular | 4.1 | Lecteur vidéo |
| ngx-quill / quill | 15.0 / 1.3 | Éditeur de texte riche |
| html5-qrcode | 2.3 | Scan QR code |
| jwt-decode | 3.1 | Décodage JWT |
| socket.io-client | 4.8 | Chat temps réel |

### Backend

| Package | Version | Usage |
|---------|---------|-------|
| express | 4.18 | Framework HTTP |
| sequelize | 6.32 | ORM MySQL |
| mysql2 | 3.5 | Driver MySQL |
| socket.io | 4.6 | WebSocket |
| jsonwebtoken | 9.0 | JWT authentification |
| bcrypt | 5.1 | Hachage mots de passe |
| nodemailer | 6.9 | Envoi emails |
| multer | 1.4 | Upload fichiers |
| pdfkit | 0.19 | Génération PDF |
| exceljs | 4.4 | Génération Excel |
| fluent-ffmpeg | 2.1 | Traitement vidéo |
| swagger-jsdoc | - | Documentation API |
| axios | 1.6 | HTTP client (CinetPay) |

---

## 4. AUTHENTIFICATION & RÔLES

### Les 8 rôles

| Rôle | Clé API | Description |
|------|---------|-------------|
| Admin | `admin` | Super-administrateur (accès total) |
| Institution | `institution` | Direction de l'établissement |
| Enseignant | `enseignant` | Corps enseignant |
| Apprenant | `apprenant` | Étudiants |
| CaissierBanque | `caissier_banque` | Gestion des paiements |
| RessourcesHumaines | `ressources_humaines` | Gestion RH/paie |
| CabinetComptable | `cabinet_comptable` | Comptabilité/fiscalité |
| ComiteOrientation | `comite_orientation` | Orientation académique |

### Middlewares backend

9 middlewares dans `src/core/middlewares/` :
- `Authenticate` — valide le JWT, injecte `utilisateurId` et `utilisateurRole`
- `AuthAdmin`, `AuthInstitution`, `AuthEnseignant`, `AuthApprenant`, `AuthCaissierBanque`, `AuthRessourcesHumaines`, `AuthCabinetComptable`, `AuthComiteOrientation`

### Frontend — Guards & Menu

- `AuthGuard` : `CanActivate`, `CanActivateChild`, `CanLoad` — redirige vers `/auth/connexion`
- `BaseComponentClass` : décode le JWT et expose `rolesValue` (booléens par rôle)
- Le menu latéral s'adapte dynamiquement selon `rolesValue`

---

## 5. MODULES FONCTIONNELS

> 17 modules frontend (lazy-loaded) — 14 modules backend — 127 contrôleurs — ~166 modèles BDD

### 5.1 Auth (`/auth`)

**Route frontend :** `/auth`
**Route API :** `/api/v1/auth`

| Pages | Composants |
|-------|-----------|
| Connexion, Inscription, Mot de passe oublié, Réinitialisation, Confirmation email | AuthLayout |

**Contrôleurs backend :** AuthController, UtilisateurController, ApprenantController, InstitutionController, EnseignantController, CaissierBanqueController, ComiteOrientationController

**Routers API :**
| Endpoint | Router |
|----------|--------|
| `/auth/` | AuthRouter (login, register, password) |
| `/auth/utilisateurs` | UtilisateurRouter |
| `/auth/apprenants` | ApprenantRouter |
| `/auth/institutions` | InstitutionRouter |
| `/auth/enseignants` | EnseignantRouter |
| `/auth/caissiersBanque` | CaissierBanqueRouter |
| `/auth/comite-orientation` | ComiteOrientationRouter |

**Modèles BDD (préfixe `aut_`) :** Utilisateur, Apprenant, Enseignant, Institution, CaissierBanque, ComiteOrientation, Banque, AdresseApprenant, AdresseEnseignant, AdresseInstitution, AdresseCaissierBanque, IdentiteApprenant, InformationsParentsApprenant, InformationsSalarieApprenant, PersonnePrevenirApprenant

### 5.2 Orientation (`/orientation`)

**Route frontend :** `/orientation`
**Route API :** `/api/v1/orientation`

| Pages | Composants |
|-------|-----------|
| Liste parcours, Nouveau parcours, Détails parcours, Liste demandes, Détails demande | ParcoursCard, AjoutDebouche, TraitementDemande |

**Routers API (préfixe `ori_`) :**
| Endpoint | Router |
|----------|--------|
| `/orientation/parcours` | Parcours |
| `/orientation/matieres` | MatierePrerequis |
| `/orientation/niveauxEtude` | NiveauEtude |
| `/orientation/categories` | Categorie |
| `/orientation/debouchesParcours` | DeboucheParcours |
| `/orientation/prerequisParcours` | PrerequisParcours |
| `/orientation/parcoursChoisis` | ParcoursChoisi |
| `/orientation/prerequisParcoursChoisis` | PrerequisParcoursChoisi |
| `/orientation/panierParcoursChoisis` | PanierParcoursChoisi |
| `/orientation/demandesOrientation` | DemandeOrientation |
| `/orientation/reponsesOrientation` | ReponseOrientation |

### 5.3 Inscription (`/inscription`)

**Route frontend :** `/inscription`
**Route API :** `/api/v1/inscription`

Module le plus volumineux (34 contrôleurs, ~39 modèles).

| Pages (17) | Description |
|-----------|-------------|
| Sessions, Détails session | Gestion des sessions académiques |
| Parcours (liste/nouveau/détails) | Parcours de formation |
| Cours (liste) | Catalogue des cours |
| Demandes (liste/détails) | Demandes d'inscription |
| Choix parcours | Sélection de parcours |
| Paiements | Gestion des paiements |
| Mon cursus | Curriculum de l'étudiant |
| Bordereaux | Bordereaux de paiement |
| Comptabilité | Vue comptable |
| Validation bordereaux | Validation par cabinet comptable/admin |
| Mon dossier | Dossier étudiant |
| Échéances | Échéancier de paiement |
| Comité orientation | Travail du comité |

**Routers API (préfixe `ins_`) :** Sessions, Cours, Classes, Parcours, Matieres, NiveauxEtude, PrerequisParcours, ParcoursChoisis, PrerequisParcoursChoisis, DemandesInscription, ReponsesInscription, FraisInscription, PaiementsInscription, Quitus, DossiersInscription, AnneesAcademiques, CursusApprenant, SallesDeClasse, ChapitresCours, Ressources, FichiersRessource, Seances, ListesPresences, Presences, PresencesCoursParticipants, CahiersDeTexte, BlocsCahierDeTexte, TypesNoteEvaluation, ListesNoteEvaluation, NotesEvaluation, Pointages, Echeances, Bordereaux, Dossiers, PreInscriptions

### 5.4 Cours (`/cours`)

**Route frontend :** `/cours`
**Route API :** via `/inscription` (mêmes modèles)

| Pages (20) | Description |
|-----------|-------------|
| Cours (liste/détails) | Gestion des cours |
| Enseignants (liste/détails) | Annuaire enseignants |
| Chapitres (nouveau/détails/modification) | Structure des cours |
| Ressources (nouveau/modification) | Ressources pédagogiques |
| Présences (liste/détails/scan) | Gestion des présences (QR code) |
| Mes présences | Présences de l'étudiant |
| Cahiers de texte (liste/détails) | Suivi pédagogique |
| Emplois du temps | Planning |
| Notes (liste/nouveau/saisie) | Évaluations et notes |

### 5.5 Bulletins (`/bulletins`)

**Route frontend :** `/bulletins`
**Route API :** via `/inscription` (`/bulletins`, `/deliberations`)

| Pages (10) | Description |
|-----------|-------------|
| Bulletins (liste/détail) | Relevés de notes |
| Mon relevé | Relevé personnel |
| Générer bulletins | Génération en masse |
| Échelles (liste/formulaire) | Barèmes de notation |
| Délibérations (liste/détail) | Sessions de délibération |
| Paramètres bulletins | Configuration |
| Moyennes | Consultation des moyennes |

### 5.6 Paramètres (`/parametres`)

**Route frontend :** `/parametres`

| Pages (16) | Description |
|-----------|-------------|
| Profil, Compte | Paramètres personnels |
| École | Configuration établissement |
| Années scolaires (liste/formulaire) | Gestion années académiques |
| Barèmes (liste/formulaire) | Barèmes financiers |
| Frais (liste/formulaire) | Types de frais |
| Notifications | Préférences notification |
| Rôles | Gestion des rôles |
| Système | Configuration système |
| Audit | Journal d'audit |
| Sauvegardes | Gestion des backups |
| Modèles (liste/édition) | Modèles de documents |

### 5.7 Stages (`/stages`)

**Route frontend :** `/stages`
**Route API :** `/api/v1/stage` (préfixe `stg_`)

| Pages (8) | Description |
|-----------|-------------|
| Offres (liste/nouveau/détails) | Offres de stage |
| Demandes (liste/détails) | Demandes de stage |
| Entreprises (liste/nouveau/détails) | Gestion entreprises partenaires |

### 5.8 Stocks (`/stocks`)

**Route frontend :** `/stocks`
**Route API :** `/api/v1/stock` (préfixe `stk_`)

| Pages (7) | Description |
|-----------|-------------|
| Articles (liste/nouveau/détails) | Gestion articles |
| Mouvements (liste/nouveau) | Entrées/sorties stock |
| Fournisseurs (liste/nouveau) | Gestion fournisseurs |

### 5.9 Immobilisations (`/immobilisations`)

**Route frontend :** `/immobilisations`
**Route API :** `/api/v1/immobilisation` (préfixe `imm_`)

| Pages (9) | Description |
|-----------|-------------|
| Immobilisations (liste/nouveau/détails) | Gestion des actifs |
| Sites (liste/nouveau) | Sites/emplacements |
| Catégories (liste/nouveau) | Catégories d'actifs |
| Maintenances (liste/nouveau) | Planification maintenance |

### 5.10 Achats (`/achats`)

**Route frontend :** `/achats`
**Route API :** `/api/v1/achats` (préfixe `ach_`)

| Pages (11) | Description |
|-----------|-------------|
| Demandes (liste/nouveau/détails) | Demandes d'achat |
| Validations | Approbations |
| Commandes (liste/détails) | Bons de commande |
| Réceptions | Réception marchandises |
| Factures | Gestion factures |
| Budgets | Gestion budgétaire |
| Fournisseurs | Fournisseurs |
| Paramètres validateurs | Règles d'approbation |

### 5.11 RH (`/rh`)

**Route frontend :** `/rh`
**Route API :** `/api/v1/rh` (préfixe `rh_`)

| Pages (15) | Description |
|-----------|-------------|
| Dashboard RH | Tableau de bord |
| Employés (liste/détails) | Gestion employés |
| Offres emploi (liste/détails) | Recrutement |
| Candidatures (liste/détails) | Suivi candidatures |
| Formations (liste/détails) | Plan formation |
| Évaluations (liste/formulaire) | Évaluation performances |
| Paie | Traitement paie |
| Bulletins paie | Fiches de paie |
| Paramètres paie | Configuration paie |
| Prestations | Gestion avantages |

### 5.12 Pointage (`/pointage`)

**Route frontend :** `/pointage`

| Pages (8) | Description |
|-----------|-------------|
| Terminal pointage | Pointage par QR code |
| Historique | Historique des pointages |
| Shifts (liste/formulaire) | Gestion des quarts |
| Absences | Gestion absences |
| Planning | Planification |
| Rapports | Rapports de pointage |

### 5.13 Reporting (`/reporting`)

**Route frontend :** `/reporting`
**Route API :** `/api/v1/reporting` (préfixe `rpt_`)

| Pages (9) | Description |
|-----------|-------------|
| Dashboard global | Synthèse générale |
| Effectifs | Rapports d'effectifs |
| Notes | Rapports de notes |
| Paiements | Rapports financiers |
| Budget | Suivi budgétaire |
| RH | Rapports RH |
| Stocks | Rapports stocks |
| Immobilisations | Rapports actifs |
| Achats | Rapports achats |

### 5.14 Communication (`/communication`)

**Route frontend :** `/communication`
**Route API :** `/api/v1/communication` (préfixe `com_`)

| Pages (11) | Description |
|-----------|-------------|
| Suggestions / Traitement | Boîte à suggestions |
| Vie estudiantine | Portail étudiant |
| Gestion communications | Communications officielles |
| Messagerie (liste/nouveau/détail) | Messagerie interne |
| Annonces (liste/nouveau) | Tableau d'affichage |
| Notifications | Centre notifications |
| Discussions | Forums de discussion |

### 5.15 Scolarité (`/scolarite`)

**Route frontend :** `/scolarite`
**Route API :** `/api/v1/scolarite` (préfixe `scol_`)

| Pages (8) | Description |
|-----------|-------------|
| Demandes documents | Demande d'actes académiques |
| Traiter demandes | Traitement des demandes |
| Mes réclamations | Réclamations étudiants |
| Traiter réclamations | Traitement réclamations |
| Registres | Registres académiques |
| Calendrier | Calendrier académique |
| Discipline | Sanctions disciplinaires |
| Conseils de classe | Conseils de classe |

### 5.16 E-Learning (`/elearning`)

**Route frontend :** `/elearning`
**Route API :** `/api/v1/elearning` (préfixe `elearning_`)

| Pages (12) | Description |
|-----------|-------------|
| Mes cours / Détails cours | Plateforme e-learning |
| Chat | Chat temps réel (Socket.io) |
| Upload support | Dépôt ressources |
| Gestion admin | Administration e-learning |
| Quiz (liste/formulaire/exécution) | Module quiz |
| Progression | Suivi apprentissage |
| Certificats | Certificats obtenus |
| Devoirs (liste/détail) | Devoirs en ligne |

### 5.17 Administration (`/administration`)

**Route frontend :** `/administration`

| Pages (7) | Description |
|-----------|-------------|
| QR codes (étudiants/enseignants) | Génération QR codes |
| Cartes | Cartes étudiant |
| Utilisateurs | Gestion des utilisateurs |
| Rôles | Gestion rôles et permissions |
| Audit logs | Journalisation système |
| Configuration | Configuration globale |

---

## 6. COMPOSANTS PARTAGÉS

| Sélecteur | Composant | Rôle |
|-----------|-----------|------|
| `app-form-input` | FormInputComponent | Champ formulaire avec validation |
| `app-custom-button` | CustomButtonComponent | Bouton réutilisable |
| `app-custom-modal` | CustomModalComponent | Boîte de dialogue modale |
| `app-custom-alert` | CustomAlertComponent | Alertes et notifications |
| `app-form-message` | FormMessageComponent | Messages d'erreur formulaire |
| `app-video-player` | VideoPlayerComponent | Lecteur vidéo (Videogular) |
| `app-custom-file-picker` | CustomFilePickerComponent | Sélecteur fichier upload |
| `app-return-back` | ReturnBackComponent | Bouton retour arrière |
| `app-custom-badge` | CustomBadgeComponent | Badge de statut |
| `app-header-title` | HeaderTitleComponent | Titre de page |
| `app-ajout-prerequis` | AjoutPrerequisComponent | Ajout de prérequis |
| `app-details-section` | DetailsSectionComponent | Section de détails |
| `app-custom-wizard` | CustomWizardComponent | Assistant multi-étapes |
| `app-custom-pdf-viewer` | CustomPdfViewerComponent | Visualisation PDF |
| `app-cours-card` | CoursCardComponent | Carte de cours |
| `app-liste-presence-card` | ListePresenceCardComponent | Carte liste présence |
| `app-cahier-de-texte-card` | CahierDeTexteCardComponent | Carte cahier de texte |

**Pipes :** `safeUrl` — sécurise les URLs blob pour PDF/iframes

---

## 7. SERVICES CORE

| Service | Rôle |
|---------|------|
| `LocalStorageService` | Wrapper localStorage |
| `JwtTokenService` | Décodage et validation JWT |
| `HttpLoaderService` | État de chargement HTTP (spinner) |
| `CookieService` | Gestion des cookies |

**Intercepteurs :**
- `TokenInterceptorService` — injecte le token JWT Bearer dans chaque requête
- `ProgressInterceptorService` — affiche/masque le spinner de chargement

**Guard :**
- `AuthGuard` — `CanActivate` / `CanActivateChild` / `CanLoad`

**Classe de base :** `BaseComponentClass` — expose `rolesValue` avec flags par rôle

---

## 8. ARCHITECTURE BACKEND

### Convention de nommage

- Préfixe table : `{module}_{table}` (ex: `aut_utilisateurs`, `ins_cours`)
- Préfixe modèle Sequelize : `{ModulePrefix}{Model}` (ex: `AutUtilisateur`, `InsCours`)
- Les modèles bulletins utilisent le préfixe `ins_` (pas de module dédié)

### Module files

Chaque module backend contient :
- `{Module}Module.ts` — définit préfixe table et modèle
- `{Module}Routes.ts` — monte les sous-routers
- `controllers/` — logique métier
- `models/` — définitions Sequelize
- `routers/` — définition des endpoints Express

### Résumé des modules backend

| Module | Préfixe table | Préfixe modèle | Nb modèles | Nb routeurs | Nb contrôleurs |
|--------|-------------|-------------|:--------:|:--------:|:------------:|
| Auth | `aut_` | `Aut` | 15 | 7 | 7 |
| Orientation | `ori_` | `Ori` | 11 | 11 | 11 |
| Inscription | `ins_` | `Ins` | 39 | 36 | 34 |
| Stage | `stg_` | `Stg` | 8 | 8 | 8 |
| Stock | `stk_` | `Stk` | 6 | 6 | 6 |
| Immobilisation | `imm_` | `Imm` | 11 | 11 | 11 |
| Achats | `ach_` | `Ach` | 13 | 10 | 6 |
| E-Learning | `elearning_` | `ELearning` | 9 | 5 | 5 |
| Communication | `com_` | `Com` | 4 | 3 | 3 |
| Scolarité | `scol_` | `Scol` | 10 | 7 | 7 |
| Comptabilité | `cpt_` | `Cpt` | 3 | 3 | 3 |
| RH | `rh_` | `Rh` | 17 | 17 | 17 |
| Reporting | `rpt_` | `Rpt` | 16 | 7 | 7 |
| **TOTAL** | — | — | **166** | **136** | **127** |

---

## 9. BASE DE DONNÉES

### Configuration

- **Dialecte :** MySQL 5.6+
- **Base :** `easyecole`
- **Hôte :** localhost:3306
- **Utilisateur :** root (sans mot de passe en dev)
- **ORM :** Sequelize 6 avec `{ alter: true }` (pas de migrations manuelles)
- **Fichier de config :** `src/core/config/sequelize.json`

### Gestion des tables

Les tables sont créées/synchronisées automatiquement via :
```
src/core/scripts/sync-database.ts
src/core/scripts/reset-database.ts
src/core/scripts/seed.ts
src/core/scripts/sync-reporting.ts
```

---

## 10. INTÉGRATIONS EXTERNES

| Intégration | Technologie | Usage |
|-------------|-------------|-------|
| Paiement mobile | CinetPay API | Orange Money, MTN MoMo, etc. |
| Email | Nodemailer + SMTP Hostinger | Notifications, confirmations |
| API Docs | Swagger UI | Documentation interactive `/api-docs` |
| Temps réel | Socket.io 4.6 | Chat e-learning |
| Vidéo | fluent-ffmpeg | Compression/transcodage |
| QR Code | qrcode npm | Génération codes QR étudiants/enseignants |
| PDF | PDFKit | Génération bulletins, quitus, documents |
| XLSX | ExcelJS | Export rapports |

---

## 11. ENUMS PARTAGÉS

14 enums identiques côté frontend et backend :

| Enum | Valeurs |
|------|---------|
| `RolesUtilisateur` | admin, institution, enseignant, apprenant, caissier_banque, ressources_humaines, cabinet_comptable, comite_orientation |
| `TypesPaiement` | Carte bancaire, Mobile money, Espèces, Virement |
| `EtatsCoursChoisi` | En cours, Validé, Échoué |
| `EtatsDePresence` | Présent, Absent, Retard, Justifié |
| `SemestresParcours` | Semestre 1, Semestre 2 |
| `AnneesParcours` | Année 1, Année 2, Année 3 |
| `PeriodesEvaluation` | CC, Examen, Rattrapage |
| `TypesEvaluation` | Devoir, Examen, Projet |
| `TypesRessource` | PDF, Vidéo, Document, Lien |
| `EtatsSession` | Ouverte, Fermée, En cours |
| `EtatsValidationParcours` | En attente, Validé, Rejeté |
| `JoursSemaine` | Lundi à Dimanche |
| `SituationsMatrimoniales` | Célibataire, Marié, Divorcé, Veuf |
| `EtatsPhysique` | Valide, Handicapé |

---

## 12. DÉPLOIEMENT & CONFIGURATION

### Frontend

| Variable | Dev | Prod |
|----------|-----|------|
| API | `http://{hostname}:3000/api/v1` | URL de production |
| Port | 4200 | - |
| Build | `ng build` | `ng build --prod` |

### Backend

| Variable | Valeur |
|----------|--------|
| Port | 3000 (configurable via `PORT`) |
| CORS | Toutes origines autorisées |
| Static | Dossier `public/` |
| Docs | Swagger UI à `/api-docs` |
| DB MySQL | root@localhost:3306/easyecole |
| Environnement | Développement (babel-register) / Production (compilé dans `lib/`) |

### Commandes utiles

```bash
# Frontend
cd easy-ecole-web
npm start                # ng serve --port 4200

# Backend
cd easy-ecole-backend
npm start                # Démarrage serveur (babel-register)
npm run reset-database   # Reset BDD + seed
```

> **Note :** Sous Node.js v22+, utiliser `NODE_OPTIONS=--openssl-legacy-provider` pour le build Angular.

---

## 13. STATISTIQUES CLÉS

| Métrique | Valeur |
|----------|-------|
| Modules frontend | 17 |
| Pages (composants) | ~169 |
| Composants partagés | 17 |
| Modules backend | 14 |
| Contrôleurs backend | 127 |
| Modèles BDD | ~166 |
| Routeurs API | 136 |
| Rôles utilisateur | 8 |
| Enums partagés | 14 |
| Middlewares auth | 9 |
