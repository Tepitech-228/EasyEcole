# Logique Métier — EasyEcole

> Document généré le 13/07/2026 à partir de l'analyse complète du backend.

---

## Table des Matières

1. [Architecture générale](#1-architecture-générale)
2. [Module Auth & Utilisateurs](#2-module-auth--utilisateurs)
3. [Module Institution](#3-module-institution)
4. [Module Inscription & Scolarité](#4-module-inscription--scolarité)
5. [Module Cours & Évaluations](#5-module-cours--évaluations)
6. [Module Bulletins & Notes](#6-module-bulletins--notes)
7. [Module Paiements](#7-module-paiements)
8. [Module E-Learning](#8-module-e-learning)
9. [Module Stages](#9-module-stages)
10. [Module Orientation](#10-module-orientation)
11. [Module Communication](#11-module-communication)
12. [Module Reporting](#12-module-reporting)
13. [Module Menu & Configuration](#13-module-menu--configuration)
14. [Module RH](#14-module-rh)
15. [Module Achats](#15-module-achats)
16. [Module Signature & Présence](#16-module-signature--présence)
17. [Module Transverses](#17-module-transverses)
18. [Système de Permissions](#18-système-de-permissions)
19. [Système de Seed](#19-système-de-seed)
20. [Règles transverses & Contraintes](#20-règles-transverses--contraintes)

---

## 1. Architecture Générale

### Stack technique
- **Backend** : Node.js + Express + Sequelize (PostgreSQL)
- **Frontend** : Angular 18+ standalone components
- **Authentification** : JWT (access + refresh tokens)
- **Base de données** : PostgreSQL via Sequelize ORM

### Structure du backend
easy-ecole-backend/
├── src/
│   ├── core/           # Configuration centrale
│   │   ├── config/     # DB, auth, email constants
│   │   ├── middlewares/ # Authenticate, Authorize, upload
│   │   ├── models/     # Modèle Sequelize de base
│   │   ├── helpers/    # Fonctions transverses
│   │   └── scripts/    # seed.ts
│   ├── modules/        # Modules métier
│   │   ├── auth/
│   │   ├── inscription/
│   │   ├── cours/
│   │   ├── bulletin/
│   │   ├── paiement/
│   │   ├── elearning/
│   │   ├── stage/
│   │   ├── orientation/
│   │   ├── communication/
│   │   ├── reporting/
│   │   ├── menu/
│   │   ├── rh/
│   │   ├── achat/
│   │   ├── signature/
│   │   └── transverses/
│   └── index.ts        # Point d'entrée (app.listen)
└── uploads/            # Fichiers uploadés

### Port d'écoute
- Backend : port 3000
- Frontend : port 4200

---

## 2. Module Auth & Utilisateurs

### Modèles

#### Utilisateur (`Utilisateur.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto-généré |
| `nom` | STRING(100) | Requis |
| `prenom` | STRING(100) | Requis |
| `email` | STRING(255) | Unique, requis |
| `motDePasse` | STRING(255) | Hashé (bcrypt) |
| `telephone` | STRING(20) | Optionnel |
| `role` | ENUM | `SUPER_ADMIN`, `ADMIN`, `PROFESSEUR`, `ELEVE`, `PARENT`, `SURVEILLANT`, `COMPTABLE`, `SECRETAIRE` |
| `photoProfil` | TEXT | Optionnel |
| `statut` | ENUM | `ACTIF`, `INACTIF`, `SUSPENDU` |
| `derniereConnexion` | DATE | Optionnel |
| `tokenVersion` | INTEGER | Défaut 0, incrémenté à chaque logout |
| `refreshToken` | TEXT | Optionnel |

Relations :
- `hasMany Inscription` (via `utilisateurId`)
- `belongsToMany Role` (via `RoleUtilisateur`)
- `belongsToMany Permission` (via `UtilisateurPermission`)
- `hasMany Message` (envoyés)
- `belongsToMany Message` (destinataires via `MessageDestinataire`)
- `hasMany Presence`
- `hasMany Signature`

#### RefreshToken (`RefreshToken.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `token` | TEXT | Requis |
| `utilisateurId` | UUID (FK) | Requis |
| `expiresAt` | DATE | Requis |
| `createdAt` | DATE | Auto |

#### Role (`Role.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `nom` | STRING(100) | Unique, requis |
| `description` | TEXT | Optionnel |
| `isSystem` | BOOLEAN | Défaut false |

Relations : `belongsToMany Utilisateur`, `belongsToMany Permission`

#### RoleUtilisateur (`RoleUtilisateur.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `roleId` | UUID (PK,FK) | Composite |
| `utilisateurId` | UUID (PK,FK) | Composite |

#### Permission (`Permission.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `code` | STRING(100) | Unique, requis |
| `libelle` | STRING(255) | Requis |
| `description` | TEXT | Optionnel |
| `module` | STRING(100) | Requis |
| `type` | ENUM | `READ`, `WRITE`, `DELETE`, `ADMIN` |

Relations : `belongsToMany Role`, `belongsToMany Utilisateur`

#### UtilisateurPermission (`UtilisateurPermission.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `utilisateurId` | UUID (PK,FK) | Composite |
| `permissionId` | UUID (PK,FK) | Composite |

### Contrôleurs

#### AuthController
| Méthode | Route | Description |
|---|---|---|
| `login` | POST /api/auth/login | Authentifie, génère JWT (access 10h + refreshToken), met à jour `derniereConnexion` |
| `logout` | POST /api/auth/logout | Incrémente `tokenVersion`, invalide tous les JWT précédents |
| `refreshToken` | POST /api/auth/refresh | Échange refreshToken valide contre un nouveau accessToken |
| `forgotPassword` | POST /api/auth/forgot-password | Envoie email de réinitialisation |
| `resetPassword` | POST /api/auth/reset-password | Réinitialise le mot de passe via token |

**Règle métier (login)** :
1. Cherche l'utilisateur par email
2. Vérifie `statut === 'ACTIF'` (sinon → 403)
3. Compare motDePasse avec bcrypt
4. Génère JWT avec `{ id, email, role, tokenVersion }`, expiration 10 heures
5. Génère refreshToken stocké en BDD
6. Met à jour `derniereConnexion`

**Règle métier (logout)** :
1. Authentifie l'utilisateur via le middleware
2. `utilisateur.tokenVersion += 1`
3. Sauvegarde
4. Tous les JWT émis avant cette incrémentation deviennent invalides

#### UtilisateurController
| Méthode | Route | Description |
|---|---|---|
| `getProfile` | GET /api/auth/utilisateurs/profile | Profil de l'utilisateur connecté |
| `updateProfile` | PUT /api/auth/utilisateurs/profile | Modifie son propre profil |
| `getAllUtilisateurs` | GET /api/auth/utilisateurs | Liste paginée (SUPER_ADMIN, ADMIN) |
| `getUtilisateurById` | GET /api/auth/utilisateurs/:id | Détail d'un utilisateur |
| `adminCreateUtilisateur` | POST /api/auth/utilisateurs | Crée un utilisateur (SUPER_ADMIN, ADMIN) |
| `adminUpdateUtilisateur` | PUT /api/auth/utilisateurs/:id | Modifie un utilisateur (SUPER_ADMIN, ADMIN) |
| `deleteUtilisateur` | DELETE /api/auth/utilisateurs/:id | Supprime ou désactive (SUPER_ADMIN, ADMIN, INSTITUTION) |
| `getStatistics` | GET /api/auth/utilisateurs/statistics | Stats par rôle |
| `getPermissions` | GET /api/auth/utilisateurs/:id/permissions | Permissions d'un utilisateur |
| `updatePermissions` | PUT /api/auth/utilisateurs/:id/permissions | Met à jour les permissions directes |

**Règle métier (création)** :
1. Hash le mot de passe avec bcrypt
2. Crée l'utilisateur
3. Si rôle `ELEVE`, crée automatiquement une inscription avec statut `NOUVEAU`
4. Si un `roleId` est fourni dans le body, associe l'utilisateur à ce rôle via `RoleUtilisateur`

**Règle métier (suppression)** :
- `SUPER_ADMIN` peut supprimer définitivement
- `ADMIN` peut désactiver (statut → `INACTIF`)
- L'utilisateur ne peut pas se supprimer lui-même

### Middlewares d'authentification

#### Authenticate.ts
1. Extrait le token du header `Authorization: Bearer <token>`
2. Vérifie la signature JWT avec la clé secrète
3. Vérifie que le `tokenVersion` du JWT correspond à celui en BDD
4. Charge l'utilisateur complet depuis la DB (avec `institutionId` si applicable)
5. Attache `req.user` à la requête

#### Authorize.ts
1. Reçoit une liste de rôles autorisés (ex: `['SUPER_ADMIN', 'ADMIN']`)
2. Vérifie `req.user.role` ∈ liste autorisée
3. Sinon → 403

#### On peut combiner :
```typescript
router.get('/route',
  Authenticate,
  Authorize('SUPER_ADMIN', 'ADMIN'),
  controller.method
);
```

### Routes exposées
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- GET  /api/auth/utilisateurs/profile
- PUT  /api/auth/utilisateurs/profile
- GET  /api/auth/utilisateurs
- GET  /api/auth/utilisateurs/statistics
- POST /api/auth/utilisateurs
- GET  /api/auth/utilisateurs/:id
- PUT  /api/auth/utilisateurs/:id
- DELETE /api/auth/utilisateurs/:id
- GET  /api/auth/utilisateurs/:id/permissions
- PUT  /api/auth/utilisateurs/:id/permissions
- GET  /api/auth/utilisateurs/:id/roles
- PUT  /api/auth/utilisateurs/:id/roles

### Gestion des tokens
- **Access token** : JWT, durée 10h, contient `{id, email, role, tokenVersion}`
- **Refresh token** : UUID stocké en BDD, durée 7 jours
- **TokenVersion** : entier dans `Utilisateur`, incrémenté à chaque logout. Le middleware Authenticate compare le tokenVersion du JWT avec celui en DB. Si différent → 401. Cela permet d'invalider tous les tokens actifs d'un utilisateur en un seul logout.

---

## 3. Module Institution

### Modèles

#### Institution (`Institution.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `nom` | STRING(255) | Requis |
| `adresse` | TEXT | Optionnel |
| `ville` | STRING(100) | Optionnel |
| `pays` | STRING(100) | Optionnel |
| `telephone` | STRING(20) | Optionnel |
| `email` | STRING(255) | Optionnel |
| `siteWeb` | STRING(255) | Optionnel |
| `logo` | TEXT | Optionnel |
| `typeEtablissement` | ENUM | `ECOLE`, `UNIVERSITE`, `CENTRE_FORMATION`, `AUTRE` |
| `code` | STRING(50) | Unique |
| `statut` | ENUM | `ACTIF`, `INACTIF` |

**Règle métier** : L'application peut être multi-institution. Chaque institution a son propre code, logo et configuration. Les utilisateurs sont liés à une institution via `institutionId`.

### Routes exposées
- CRUD complet via `/api/institutions`
- Upload logo

---

## 4. Module Inscription & Scolarité

### Modèles

#### Inscription (`Inscription.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `utilisateurId` | UUID (FK) | Requis |
| `classeId` | UUID (FK) | Requis |
| `anneeAcademiqueId` | UUID (FK) | Requis |
| `dateInscription` | DATE | Défaut now() |
| `statut` | ENUM | `NOUVEAU`, `ACTIF`, `SUSPENDU`, `EXCLU`, `TERMINE`, `REINSCRIT` |
| `montantFrais` | DECIMAL(10,2) | Optionnel |
| `montantRestant` | DECIMAL(10,2) | Optionnel |
| `dernierPaiement` | DATE | Optionnel |
| `typePaiement` | ENUM | `MENSUEL`, `TRIMESTRIEL`, `SEMESTRIEL`, `ANNUEL` |
| `referencesPaiement` | TEXT | Optionnel |

Relations :
- `belongsTo Classe`
- `belongsTo AnneeAcademique`
- `belongsTo Utilisateur`
- `hasMany Note`
- `hasMany Paiement`
- `hasMany Absence`
- `hasMany Evaluation`
- `hasOne Assurance`

#### Classe (`Classe.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `nom` | STRING(100) | Requis |
| `niveau` | STRING(50) | Requis |
| `anneeAcademiqueId` | UUID (FK) | Requis |
| `capaciteMax` | INTEGER | Optionnel |
| `description` | TEXT | Optionnel |

#### AnneeAcademique (`AnneeAcademique.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `annee` | STRING(9) | Ex: "2025-2026", unique |
| `dateDebut` | DATE | Requis |
| `dateFin` | DATE | Requis |
| `estActive` | BOOLEAN | Défaut true |
| `description` | TEXT | Optionnel |

**Règle métier** : Une seule année académique peut être active à la fois.

#### Matiere (`Matiere.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `nom` | STRING(100) | Requis |
| `code` | STRING(20) | Unique |
| `coefficient` | INTEGER | Défaut 1 |
| `classeId` | UUID (FK) | Optionnel |
| `anneeAcademiqueId` | UUID (FK) | Requis |
| `type` | ENUM | `OBLIGATOIRE`, `OPTIONNELLE`, `LANGUE_VIVANTE`, `ACTIVITE` |

Relations : `belongsToMany Professeur` (via `ProfesseurMatiere`)

#### ProfesseurMatiere (`ProfesseurMatiere.ts`)
| Champ | Type |
|---|---|
| `professeurId` | UUID (PK,FK) |
| `matiereId` | UUID (PK,FK) |
| `classeId` | UUID (FK) |

**Règle métier** : Un professeur peut enseigner plusieurs matières dans plusieurs classes. L'association est faite par le triplet (professeur, matiere, classe).

#### Seance (`Seance.ts`) — planning
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `classeId` | UUID (FK) | Requis |
| `matiereId` | UUID (FK) | Requis |
| `professeurId` | UUID (FK) | Requis |
| `jourSemaine` | ENUM | `LUNDI`–`DIMANCHE` |
| `heureDebut` | TIME | Requis |
| `heureFin` | TIME | Requis |
| `salle` | STRING(50) | Optionnel |
| `typeSeance` | ENUM | `COURS`, `TD`, `TP`, `EVALUATION` |

#### Semestre (`Semestre.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `nom` | STRING(100) | Requis |
| `dateDebut` | DATE | Requis |
| `dateFin` | DATE | Requis |
| `anneeAcademiqueId` | UUID (FK) | Requis |
| `estActif` | BOOLEAN | Défaut true |

#### TrancheHoraire (`TrancheHoraire.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `nom` | STRING(100) | Requis |
| `heureDebut` | TIME | Requis |
| `heureFin` | TIME | Requis |

### Contrôleurs

#### InscriptionController
| Méthode | Route | Description |
|---|---|---|
| `createInscription` | POST /api/inscription | Inscrit un élève à une classe pour une année académique |
| `getAllInscriptions` | GET /api/inscription | Liste filtrée par statut/classe/année |
| `getInscriptionById` | GET /api/inscription/:id | Détail avec relations |
| `updateInscription` | PUT /api/inscription/:id | Modifie l'inscription |
| `deleteInscription` | DELETE /api/inscription/:id | Supprime |
| `getByClasse` | GET /api/inscription/classe/:classeId | Inscriptions d'une classe |
| `getStatistics` | GET /api/inscription/statistics | Stats globales |

**Règles métier (inscription)** :
1. Vérifie que la classe a une capacité disponible (`capaciteMax`)
2. Vérifie que l'élève n'est pas déjà inscrit dans la même classe/année
3. Crée l'inscription avec statut `NOUVEAU`
4. Si `montantFrais` > 0, le `montantRestant` est initialisé à `montantFrais`

#### PlanningController
| Méthode | Route | Description |
|---|---|---|
| `getPlanning` | GET /api/inscription/seances/planning | Planning complet avec filtres |
| `createSeance` | POST /api/inscription/seances | Crée une séance de planning |
| `updateSeance` | PUT /api/inscription/seances/:id | Modifie une séance |
| `deleteSeance` | DELETE /api/inscription/seances/:id | Supprime une séance |
| `getSeancesByProfesseur` | GET /api/inscription/seances/professeur/:id | Planning d'un professeur |
| `getSeancesByClasse` | GET /api/inscription/seances/classe/:id | Planning d'une classe |

#### ClasseController
| Méthode | Route | Description |
|---|---|---|
| `createClasse` | POST /api/classes | Crée une classe |
| `getAllClasses` | GET /api/classes | Liste toutes les classes |
| `getClasseById` | GET /api/classes/:id | Détail |
| `updateClasse` | PUT /api/classes/:id | Modifie |
| `deleteClasse` | DELETE /api/classes/:id | Supprime si vide |

#### MatiereController
| Méthode | Route | Description |
|---|---|---|
| CRUD complet | /api/matieres | Gestion des matières |

#### ProfesseurMatiereController
| Méthode | Route | Description |
|---|---|---|
| `assignerProfesseur` | POST /api/professeur-matieres | Associe un professeur à une matière |
| `getByProfesseur` | GET /api/professeur-matieres/professeur/:id | Matières d'un prof |
| `getByClasse` | GET /api/professeur-matieres/classe/:id | Profs d'une classe |
| `removeAssignment` | DELETE /api/professeur-matieres/:id | Supprime l'association |

### Routes exposées
- CRUD complet pour : inscriptions, classes, matières, années académiques, semestres, séances, tranches horaires
- Routes spécifiques : `/api/inscription/classe/:classeId`, `/api/inscription/statistics`

---

## 5. Module Cours & Évaluations

### Modèles

#### Cours (`Cours.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `titre` | STRING(255) | Requis |
| `description` | TEXT | Optionnel |
| `contenu` | TEXT | Optionnel |
| `matiereId` | UUID (FK) | Requis |
| `classeId` | UUID (FK) | Requis |
| `professeurId` | UUID (FK) | Requis |
| `typeCours` | ENUM | `COURS`, `TD`, `TP`, `EXERCICE`, `RESSOURCE` |
| `pieceJointe` | TEXT | Optionnel |
| `estPublic` | BOOLEAN | Défaut false |

Relations :
- `hasMany Evaluation`
- `belongsToMany Eleve` (via `CoursEleve`)

#### Evaluation (`Evaluation.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `titre` | STRING(255) | Requis |
| `type` | ENUM | `DEVOIR`, `EXAMEN`, `COMPOSITION`, `INTERROGATION`, `PROJET` |
| `bareme` | INTEGER | Défaut 20 |
| `coefficient` | INTEGER | Défaut 1 |
| `date` | DATE | Requis |
| `duree` | INTEGER | Minutes, optionnel |
| `matiereId` | UUID (FK) | Requis |
| `classeId` | UUID (FK) | Requis |
| `professeurId` | UUID (FK) | Requis |
| `semestreId` | UUID (FK) | Requis |
| `listeNoteEvaluationId` | UUID (FK) | Optionnel |

Relations :
- `belongsTo ListeNoteEvaluation`
- `hasMany Note`

#### ListeNoteEvaluation (`ListeNoteEvaluation.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `nom` | STRING(255) | Requis |
| `dateDebut` | DATE | Requis |
| `dateFin` | DATE | Requis |
| `anneeAcademiqueId` | UUID (FK) | Requis |
| `estCloturee` | BOOLEAN | Défaut false |
| `estVerrouillee` | BOOLEAN | Défaut false |

**Règle métier** : Une liste d'évaluation est une période de saisie des notes. Quand elle est verrouillée, les notes associées ne peuvent plus être modifiées.

### Contrôleurs

#### CoursController
| Méthode | Route | Description |
|---|---|---|
| CRUD complet | /api/cours | Gestion des cours |
| `getByProfesseur` | GET /api/cours/professeur/:id | Cours d'un prof |
| `getByClasse` | GET /api/cours/classe/:id | Cours d'une classe |
| `uploadPieceJointe` | POST /api/cours/:id/piece-jointe | Upload fichier |

#### EvaluationController
| Méthode | Route | Description |
|---|---|---|
| CRUD complet | /api/evaluations | Gestion des évaluations |
| `getByProfesseur` | GET /api/evaluations/professeur/:id | Évals d'un prof |
| `getByClasse` | GET /api/evaluations/classe/:id | Évals d'une classe |
| `getByMatiere` | GET /api/evaluations/matiere/:id | Évals d'une matière |

#### ListeNoteEvaluationController
| Méthode | Route | Description |
|---|---|---|
| `createListeNoteEvaluation` | POST /api/liste-note-evaluations | Crée une période de saisie |
| `getAllListeNoteEvaluations` | GET /api/liste-note-evaluations | Liste toutes |
| `updateListeNoteEvaluation` | PUT /api/liste-note-evaluations/:id | Modifie |
| `deleteListeNoteEvaluation` | DELETE /api/liste-note-evaluations/:id | Supprime |
| `cloturerListe` | PUT /api/liste-note-evaluations/:id/cloturer | Clôture |
| `verrouillerListe` | PUT /api/liste-note-evaluations/:id/verrouiller | Verrouille |

### Routes exposées
- CRUD complet pour : cours, évaluations, listes de notes
- Routes spécifiques par professeur/classe/matière

---

## 6. Module Bulletins & Notes

### Modèles

#### Note (`Note.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `valeur` | DECIMAL(5,2) | Requis (0-20) |
| `evaluationId` | UUID (FK) | Requis |
| `inscriptionId` | UUID (FK) | Requis |
| `appreciation` | TEXT | Optionnel |
| `dateSaisie` | DATE | Défaut now() |
| `estModifiable` | BOOLEAN | Défaut true |
| `estValidée` | BOOLEAN | Défaut false |

**Contrainte unique** : `[evaluationId, inscriptionId]` — un élève ne peut avoir qu'une note par évaluation.

#### Bulletin (`Bulletin.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `inscriptionId` | UUID (FK) | Requis |
| `semestreId` | UUID (FK) | Requis |
| `moyenneGenerale` | DECIMAL(5,2) | Calculée |
| `rang` | INTEGER | Calculé |
| `appreciationGenerale` | TEXT | Optionnel |
| `totalCoefficients` | INTEGER | Calculé |
| `totalPoints` | DECIMAL(10,2) | Calculé |
| `dateEdition` | DATE | Défaut now() |
| `statut` | ENUM | `BROUILLON`, `PUBLIE`, `VERROUILLE` |

#### Mention (`Mention.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `nom` | STRING(100) | Unique |
| `seuilMin` | DECIMAL(5,2) | Requis |
| `seuilMax` | DECIMAL(5,2) | Requis |

**Règles métier des mentions** :
- `0-9.99` → Insuffisant
- `10-11.99` → Passable
- `12-13.99` → Assez Bien
- `14-15.99` → Bien
- `16-20` → Très Bien

### Contrôleurs

#### NoteController
| Méthode | Route | Description |
|---|---|---|
| `createNote` | POST /api/notes | Ajoute une note |
| `createBulkNotes` | POST /api/notes/bulk | Ajout/mise à jour en masse |
| `getAllNotes` | GET /api/notes | Liste filtrée |
| `getNoteById` | GET /api/notes/:id | Détail |
| `updateNote` | PUT /api/notes/:id | Modifie |
| `deleteNote` | DELETE /api/notes/:id | Supprime |
| `getNotesByEvaluation` | GET /api/notes/evaluation/:id | Notes d'une évaluation |
| `getNotesByInscription` | GET /api/notes/inscription/:id | Notes d'un élève |
| `getNotesByClasse` | GET /api/notes/classe/:id | Notes d'une classe |
| `validerNote` | PUT /api/notes/:id/valider | Valide une note |
| `getStatistics` | GET /api/notes/statistics | Statistiques |

**Règles métier (bulk-upsert)** :
1. Reçoit un tableau `{ evaluationId, inscriptionId, valeur, appreciation }`
2. Pour chaque entrée :
   - Si `(evaluationId, inscriptionId)` existe déjà → UPDATE
   - Sinon → INSERT
3. Recalcule les moyennes des bulletins concernés

**Règles métier (validation)** :
1. Une fois validée, `estModifiable = false`
2. Une note associée à une `ListeNoteEvaluation` verrouillée ne peut plus être modifiée
3. Le champ `estModifiable` est un filet de sécurité complémentaire

#### BulletinController
| Méthode | Route | Description |
|---|---|---|
| `createBulletin` | POST /api/bulletins | Génère un bulletin |
| `getAllBulletins` | GET /api/bulletins | Liste filtrée |
| `getBulletinById` | GET /api/bulletins/:id | Détail avec notes |
| `updateBulletin` | PUT /api/bulletins/:id | Appréciation, statut |
| `deleteBulletin` | DELETE /api/bulletins/:id | Supprime |
| `publierBulletin` | PUT /api/bulletins/:id/publier | Publie |
| `verrouillerBulletin` | PUT /api/bulletins/:id/verrouiller | Verrouille |
| `getByInscription` | GET /api/bulletins/inscription/:id | Bulletins d'un élève |
| `getByClasse` | GET /api/bulletins/classe/:id | Bulletins d'une classe |
| `getStatistics` | GET /api/bulletins/statistics | Stats |
| `getDetailBulletin` | GET /api/bulletins/:id/detail | Bulletin complet imprimable |

**Règle métier (calcul du bulletin)** :
1. Récupère toutes les notes de l'inscription pour le semestre
2. Pour chaque matière, calcule la moyenne : `sum(valeur * coefficient) / sum(coefficient)`
3. Calcule la moyenne générale : `sum(moyenneMatiere * coefficientMatiere) / totalCoefficients`
4. Calcule le rang : classement des moyennes générales de tous les élèves de la classe
5. Détermine la mention selon les seuils définis dans la table `Mention`
6. Crée le bulletin avec `statut: 'BROUILLON'`

### Routes exposées
- CRUD complet pour : notes, bulletins
- Routes bulk : POST /api/notes/bulk
- Routes de validation : PUT /api/notes/:id/valider
- Routes de publication/verrouillage des bulletins
- Statistiques : GET /api/notes/statistics, GET /api/bulletins/statistics

---

## 7. Module Paiements

### Modèles

#### Paiement (`Paiement.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `inscriptionId` | UUID (FK) | Requis |
| `montant` | DECIMAL(10,2) | Requis |
| `datePaiement` | DATE | Défaut now() |
| `modePaiement` | ENUM | `ESPECES`, `CHEQUE`, `VIREMENT`, `CARTE_BANCAIRE`, `MOBILE_MONEY` |
| `reference` | STRING(100) | Unique |
| `statut` | ENUM | `EN_ATTENTE`, `VALIDE`, `REJETE`, `REMBOURSE` |
| `typePaiement` | ENUM | `INSCRIPTION`, `SCOLARITE`, `MENSUALITE`, `TRANCHE`, `AUTRE` |
| `observations` | TEXT | Optionnel |
| `validePar` | UUID (FK) | Optionnel (utilisateurId) |

#### Frais (`Frais.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `classeId` | UUID (FK) | Requis |
| `anneeAcademiqueId` | UUID (FK) | Requis |
| `typeFrais` | ENUM | `INSCRIPTION`, `SCOLARITE`, `MENSUALITE`, `TRANCHE`, `AUTRE` |
| `montant` | DECIMAL(10,2) | Requis |
| `description` | TEXT | Optionnel |
| `estObligatoire` | BOOLEAN | Défaut true |

#### Echeance (`Echeance.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `inscriptionId` | UUID (FK) | Requis |
| `dateEcheance` | DATE | Requis |
| `montant` | DECIMAL(10,2) | Requis |
| `libelle` | STRING(255) | Requis |
| `statut` | ENUM | `EN_ATTENTE`, `PAYEE`, `EN_RETARD`, `ANNULEE` |

### Contrôleurs

#### PaiementController
| Méthode | Route | Description |
|---|---|---|
| CRUD complet | /api/paiements | Gestion des paiements |
| `validerPaiement` | PUT /api/paiements/:id/valider | Valide un paiement |
| `rejeterPaiement` | PUT /api/paiements/:id/rejeter | Rejette |
| `getByInscription` | GET /api/paiements/inscription/:id | Paiements d'un élève |
| `getStatistics` | GET /api/paiements/statistics | Statistiques financières |

**Règles métier (validation de paiement)** :
1. Le champ `validePar` est renseigné avec l'ID du valideur
2. Le statut passe à `VALIDE`
3. Le `montantRestant` de l'inscription est diminué du montant payé
4. L'échéance correspondante passe à `PAYEE`

#### FraisController
| Méthode | Route | Description |
|---|---|---|
| CRUD complet | /api/frais | Gestion des frais |
| `getByClasse` | GET /api/frais/classe/:id | Frais d'une classe |

#### EcheanceController
| Méthode | Route | Description |
|---|---|---|
| CRUD complet | /api/echeances | Gestion des échéances |
| `getByInscription` | GET /api/echeances/inscription/:id | Échéances d'un élève |
| `getEcheancesEnRetard` | GET /api/echeances/en-retard | Liste des retards |

### Routes exposées
- CRUD complet pour : paiements, frais, échéances
- Routes de validation/rejet des paiements
- Statistiques financières

---

## 8. Module E-Learning

### Modèles

#### RessourcePedagogique (`RessourcePedagogique.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `titre` | STRING(255) | Requis |
| `description` | TEXT | Optionnel |
| `type` | ENUM | `DOCUMENT`, `VIDEO`, `LIEN`, `EXERCICE`, `QUIZ` |
| `fichier` | TEXT | URL du fichier |
| `matiereId` | UUID (FK) | Requis |
| `classeId` | UUID (FK) | Requis |
| `professeurId` | UUID (FK) | Requis |
| `estPublic` | BOOLEAN | Défaut false |

#### Quiz (`Quiz.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `titre` | STRING(255) | Requis |
| `description` | TEXT | Optionnel |
| `duree` | INTEGER | Minutes |
| `dateOuverture` | DATE | Requis |
| `dateFermeture` | DATE | Requis |
| `tentativesMax` | INTEGER | Défaut 1 |
| `matiereId` | UUID (FK) | Requis |
| `classeId` | UUID (FK) | Requis |
| `professeurId` | UUID (FK) | Requis |

Relations :
- `hasMany Question`
- `hasMany TentativeQuiz`

#### Question (`Question.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `quizId` | UUID (FK) | Requis |
| `texte` | TEXT | Requis |
| `type` | ENUM | `QCM`, `VRAI_FAUX`, `TEXT`, `CHIFFRE` |
| `points` | INTEGER | Défaut 1 |
| `ordre` | INTEGER | Défaut 0 |

Relations :
- `hasMany Reponse`

#### Reponse (`Reponse.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `questionId` | UUID (FK) | Requis |
| `texte` | TEXT | Requis |
| `estCorrecte` | BOOLEAN | Défaut false |

#### TentativeQuiz (`TentativeQuiz.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `quizId` | UUID (FK) | Requis |
| `eleveId` | UUID (FK) | Requis (inscriptionId) |
| `dateDebut` | DATE | Auto |
| `dateFin` | DATE | Optionnel |
| `score` | DECIMAL(5,2) | Calculé |
| `statut` | ENUM | `EN_COURS`, `TERMINE`, `CORRIGE` |

### Contrôleurs

#### RessourcePedagogiqueController
| Méthode | Route | Description |
|---|---|---|
| CRUD complet | /api/ressources-pedagogiques | Gestion des ressources |
| `uploadRessource` | POST /api/ressources-pedagogiques/upload | Upload fichier |

#### QuizController
| Méthode | Route | Description |
|---|---|---|
| CRUD complet | /api/quiz | Gestion des quiz |
| `getByMatiere` | GET /api/quiz/matiere/:id | Quiz d'une matière |
| `getByClasse` | GET /api/quiz/classe/:id | Quiz d'une classe |

#### TentativeQuizController
| Méthode | Route | Description |
|---|---|---|
| `startQuiz` | POST /api/tentatives-quiz/start | Démarre une tentative |
| `submitQuiz` | POST /api/tentatives-quiz/:id/submit | Soumet les réponses |
| `getByEleve` | GET /api/tentatives-quiz/eleve/:id | Tentatives d'un élève |
| `getByQuiz` | GET /api/tentatives-quiz/quiz/:id | Tentatives d'un quiz |

**Règles métier (quiz)** :
1. Vérifie que la date courante est entre `dateOuverture` et `dateFermeture`
2. Vérifie que l'élève n'a pas dépassé `tentativesMax`
3. Au submit, calcule le score automatiquement en comparant les réponses avec `estCorrecte`
4. Le statut passe à `TERMINE` après soumission

### Routes exposées
- CRUD complet pour : ressources pédagogiques, quiz, questions, réponses, tentatives
- Upload de ressources

---

## 9. Module Stages

### Modèles

#### Stage (`Stage.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `titre` | STRING(255) | Requis |
| `description` | TEXT | Optionnel |
| `dateDebut` | DATE | Requis |
| `dateFin` | DATE | Requis |
| `dureeSemaines` | INTEGER | Optionnel |
| `eleveId` | UUID (FK) | Requis |
| `professeurId` | UUID (FK) | Requis (tuteur pédagogique) |
| `entrepriseId` | UUID (FK) | Requis |
| `statut` | ENUM | `PLANIFIE`, `EN_COURS`, `TERMINE`, `ANNULE`, `VALIDE` |
| `typeStage` | ENUM | `STAGE_ACADEMIQUE`, `STAGE_PROFESSIONNEL`, `ALTERNANCE`, `PROJET_FIN_ETUDES` |
| `convention` | TEXT | URL du fichier PDF |

#### Entreprise (`Entreprise.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `nom` | STRING(255) | Requis |
| `adresse` | TEXT | Optionnel |
| `ville` | STRING(100) | Optionnel |
| `telephone` | STRING(20) | Optionnel |
| `email` | STRING(255) | Optionnel |
| `siteWeb` | STRING(255) | Optionnel |
| `secteurActivite` | STRING(100) | Optionnel |
| `tuteurProfessionnel` | STRING(255) | Nom du tuteur en entreprise |

#### RapportStage (`RapportStage.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `stageId` | UUID (FK) | Requis |
| `titre` | STRING(255) | Requis |
| `fichier` | TEXT | URL |
| `dateSoumission` | DATE | Défaut now() |
| `note` | DECIMAL(5,2) | Optionnel |
| `appreciation` | TEXT | Optionnel |

#### EvaluationStage (`EvaluationStage.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `stageId` | UUID (FK) | Requis |
| `evaluateurId` | UUID (FK) | Requis |
| `critere` | STRING(100) | Requis |
| `note` | DECIMAL(5,2) | Requis |
| `commentaire` | TEXT | Optionnel |

### Contrôleurs

#### StageController
| Méthode | Route | Description |
|---|---|---|
| CRUD complet | /api/stages | Gestion des stages |
| `getByEleve` | GET /api/stages/eleve/:id | Stages d'un élève |
| `getByProfesseur` | GET /api/stages/professeur/:id | Stages supervisés |
| `validerStage` | PUT /api/stages/:id/valider | Valide un stage |
| `uploadConvention` | POST /api/stages/:id/convention | Upload convention |

#### EntrepriseController
| Méthode | Route | Description |
|---|---|---|
| CRUD complet | /api/entreprises | Gestion des entreprises |

#### RapportStageController
| Méthode | Route | Description |
|---|---|---|
| CRUD complet | /api/rapports-stage | Gestion des rapports |

#### EvaluationStageController
| Méthode | Route | Description |
|---|---|---|
| CRUD complet | /api/evaluations-stage | Évaluations de stage |

### Routes exposées
- CRUD complet pour : stages, entreprises, rapports de stage, évaluations de stage
- Upload convention et rapports
- Validation des stages

---

## 10. Module Orientation

### Modèles

#### DemandeOrientation (`DemandeOrientation.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `eleveId` | UUID (FK) | Requis |
| `typeOrientation` | ENUM | `CONSEIL_ORIENTATION`, `REORIENTATION`, `AFFECTATION_UNIVERSITE`, `CHOIX_OPTIONS` |
| `statut` | ENUM | `EN_ATTENTE`, `EN_TRAITEMENT`, `TRAITEE`, `FERMEE` |
| `description` | TEXT | Requis |
| `reponse` | TEXT | Optionnel |
| `conseillerId` | UUID (FK) | Optionnel |
| `dateTraitement` | DATE | Optionnel |

#### Voeu (`Voeu.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `eleveId` | UUID (FK) | Requis |
| `etablissement` | STRING(255) | Requis |
| `filiere` | STRING(255) | Requis |
| `ordre` | INTEGER | Requis (1=prioritaire) |
| `statut` | ENUM | `EN_ATTENTE`, `ACCEPTE`, `REFUSE`, `LISTE_ATTENTE` |
| `decisionDate` | DATE | Optionnel |

#### ConseilOrientation (`ConseilOrientation.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `eleveId` | UUID (FK) | Requis |
| `conseillerId` | UUID (FK) | Requis |
| `dateConseil` | DATE | Requis |
| `contenu` | TEXT | Requis |
| `typeConseil` | ENUM | `SCOLAIRE`, `PROFESSIONNEL`, `PERSONNEL` |

### Contrôleurs

#### OrientationController
| Méthode | Route | Description |
|---|---|---|
| CRUD complet | /api/orientation/demandes | Gestion des demandes |
| `traiterDemande` | PUT /api/orientation/demandes/:id/traiter | Traite une demande |
| `getByEleve` | GET /api/orientation/demandes/eleve/:id | Demandes d'un élève |

#### VoeuController
| Méthode | Route | Description |
|---|---|---|
| CRUD complet | /api/orientation/voeux | Gestion des vœux |
| `classerVoeux` | PUT /api/orientation/voeux/classer | Réordonne les vœux |

#### ConseilController
| Méthode | Route | Description |
|---|---|---|
| CRUD complet | /api/orientation/conseils | Gestion des conseils |

### Routes exposées
- CRUD pour : demandes d'orientation, vœux, conseils
- Traitement des demandes, classement des vœux

---

## 11. Module Communication

### Modèles

#### Message (`Message.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `expediteurId` | UUID (FK) | Requis |
| `objet` | STRING(255) | Requis |
| `contenu` | TEXT | Requis |
| `typeMessage` | ENUM | `INTERNE`, `EMAIL`, `NOTIFICATION` |
| `priorite` | ENUM | `BASSE`, `NORMALE`, `HAUTE`, `URGENTE` |
| `dateEnvoi` | DATE | Défaut now() |

#### MessageDestinataire (`MessageDestinataire.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `messageId` | UUID (FK) | Requis |
| `destinataireId` | UUID (FK) | Requis |
| `luLe` | DATE | Optionnel |
| `archiveLe` | DATE | Optionnel |
| `supprimeLe` | DATE | Optionnel |

#### Notification (`Notification.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `utilisateurId` | UUID (FK) | Requis |
| `titre` | STRING(255) | Requis |
| `message` | TEXT | Requis |
| `type` | ENUM | `INFO`, `ATTENTION`, `SUCCES`, `ERREUR` |
| `lien` | STRING(255) | Optionnel |
| `estLue` | BOOLEAN | Défaut false |
| `dateCreation` | DATE | Auto |

### Contrôleurs

#### MessageController
| Méthode | Route | Description |
|---|---|---|
| `sendMessage` | POST /api/messages | Envoie un message |
| `getReceivedMessages` | GET /api/messages/received | Messages reçus |
| `getSentMessages` | GET /api/messages/sent | Messages envoyés |
| `getMessageById` | GET /api/messages/:id | Détail |
| `marquerLu` | PUT /api/messages/:id/lu | Marque comme lu |
| `archiverMessage` | PUT /api/messages/:id/archiver | Archive |
| `supprimerMessage` | PUT /api/messages/:id/supprimer | Suppression logique |

#### NotificationController
| Méthode | Route | Description |
|---|---|---|
| `getNotifications` | GET /api/notifications | Notifications de l'utilisateur |
| `marquerLue` | PUT /api/notifications/:id/lue | Marque comme lue |
| `marquerToutesLues` | PUT /api/notifications/toutes-lues | Tout marquer lu |

### Routes exposées
- CRUD messages avec destinataires
- Gestion des notifications
- Routes de lecture/archivage/suppression logique

---

## 12. Module Reporting

### Modèles

#### Rapport (`Rapport.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `titre` | STRING(255) | Requis |
| `typeRapport` | ENUM | `SCOLARITE`, `FINANCIER`, `STAGE`, `ELEARNING`, `ORIENTATION`, `PERSONNALISE` |
| `parametres` | JSONB | Requis (filtres) |
| `generateurId` | UUID (FK) | Requis (utilisateur) |
| `format` | ENUM | `PDF`, `EXCEL`, `CSV`, `HTML` |
| `dateGeneration` | DATE | Auto |
| `fichier` | TEXT | URL du fichier généré |
| `statut` | ENUM | `EN_ATTENTE`, `EN_COURS`, `TERMINE`, `ECHEC` |

### Contrôleurs

#### RapportController
| Méthode | Route | Description |
|---|---|---|
| `genererRapport` | POST /api/rapports | Lance une génération |
| `getAllRapports` | GET /api/rapports | Liste des rapports |
| `getRapportById` | GET /api/rapports/:id | Détail |
| `telechargerRapport` | GET /api/rapports/:id/telecharger | Télécharge le fichier |
| `deleteRapport` | DELETE /api/rapports/:id | Supprime |

#### ReportingController
| Méthode | Route | Description |
|---|---|---|
| `getStatistiquesGlobales` | GET /api/reporting/statistiques | Stats générales |
| `getPerformancesScolaires` | GET /api/reporting/performances | Performances par classe |
| `getTauxReussite` | GET /api/reporting/taux-reussite | Taux de réussite |
| `getSuiviPaiements` | GET /api/reporting/suivi-paiements | Suivi financier |
| `exportCSV` | GET /api/reporting/export-csv | Export données |

### Routes exposées
- Génération et téléchargement de rapports
- Statistiques globales, performances, taux de réussite, suivi paiements
- Export CSV

---

## 13. Module Menu & Configuration

### Modèles

#### Menu (`Menu.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `libelle` | STRING(100) | Requis |
| `icone` | STRING(50) | Optionnel |
| `route` | STRING(255) | Optionnel |
| `ordre` | INTEGER | Défaut 0 |
| `parentId` | UUID (FK) | Optionnel (menu parent) |
| `estActif` | BOOLEAN | Défaut true |
| `module` | STRING(100) | Requis |

Relations :
- `belongsToMany Role` (via `MenuRole`)
- `belongsToMany Permission` (via `MenuPermission`)

#### MenuRole (`MenuRole.ts`)
| Champ | Type |
|---|---|
| `menuId` | UUID (PK,FK) |
| `roleId` | UUID (PK,FK) |

#### MenuPermission (`MenuPermission.ts`)
| Champ | Type |
|---|---|
| `menuId` | UUID (PK,FK) |
| `permissionId` | UUID (PK,FK) |

### Contrôleurs

#### MenuController
| Méthode | Route | Description |
|---|---|---|
| `getMenus` | GET /api/menus | Menus accessibles à l'utilisateur connecté |
| `createMenu` | POST /api/menus | Crée un menu |
| `updateMenu` | PUT /api/menus/:id | Modifie |
| `deleteMenu` | DELETE /api/menus/:id | Supprime |

**Règle métier (affichage des menus)** :
1. Récupère l'utilisateur connecté avec ses rôles et permissions
2. Filtre les menus accessibles via `MenuRole` (si l'utilisateur a un rôle associé au menu) OU `MenuPermission` (si l'utilisateur a une permission associée au menu)
3. Construit l'arborescence (menus parents → enfants)
4. Retourne les menus triés par `ordre`

### Routes exposées
- GET /api/menus (filtré par rôle/permission)
- CRUD pour l'administration des menus

---

## 14. Module RH

### Modèles

#### Employe (`Employe.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `utilisateurId` | UUID (FK) | Requis |
| `matricule` | STRING(50) | Unique |
| `dateEmbauche` | DATE | Requis |
| `poste` | STRING(255) | Requis |
| `departement` | STRING(100) | Optionnel |
| `typeContrat` | ENUM | `CDI`, `CDD`, `STAGE`, `VACATAIRE`, `TEMPORAIRE` |
| `salaire` | DECIMAL(10,2) | Optionnel |
| `statut` | ENUM | `ACTIF`, `CONGE`, `SUSPENDU`, `LICENCIE` |

#### Pointage (`Pointage.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `employeId` | UUID (FK) | Requis |
| `date` | DATE | Requis |
| `heureArrivee` | TIME | Requis |
| `heureDepart` | TIME | Optionnel |

#### Conge (`Conge.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `employeId` | UUID (FK) | Requis |
| `typeConge` | ENUM | `ANNUEL`, `MALADIE`, `EXCEPTIONNEL`, `SANS_SOLDE` |
| `dateDebut` | DATE | Requis |
| `dateFin` | DATE | Requis |
| `motif` | TEXT | Optionnel |
| `statut` | ENUM | `EN_ATTENTE`, `APPROUVE`, `REFUSE` |

### Contrôleurs

#### EmployeController
| Méthode | Route | Description |
|---|---|---|
| CRUD complet | /api/employes | Gestion des employés |

#### PointageController
| Méthode | Route | Description |
|---|---|---|
| `pointerArrivee` | POST /api/pointages/arrivee | Pointe l'arrivée |
| `pointerDepart` | PUT /api/pointages/:id/depart | Pointe le départ |
| `getByEmploye` | GET /api/pointages/employe/:id | Pointages d'un employé |

#### CongeController
| Méthode | Route | Description |
|---|---|---|
| CRUD complet | /api/conges | Gestion des congés |
| `approuverConge` | PUT /api/conges/:id/approuver | Approuve |
| `refuserConge` | PUT /api/conges/:id/refuser | Refuse |

### Routes exposées
- CRUD employés, pointages, congés
- Pointage arrivée/départ
- Approbation/refus des congés

---

## 15. Module Achats

### Modèles

#### Fournisseur (`Fournisseur.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `nom` | STRING(255) | Requis |
| `contact` | STRING(100) | Optionnel |
| `email` | STRING(255) | Optionnel |
| `telephone` | STRING(20) | Optionnel |
| `adresse` | TEXT | Optionnel |

#### Commande (`Commande.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `fournisseurId` | UUID (FK) | Requis |
| `dateCommande` | DATE | Requis |
| `statut` | ENUM | `EN_ATTENTE`, `VALIDE`, `LIVREE`, `ANNULEE` |
| `montantTotal` | DECIMAL(10,2) | Calculé |
| `utilisateurId` | UUID (FK) | Requis |

#### LigneCommande (`LigneCommande.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `commandeId` | UUID (FK) | Requis |
| `produit` | STRING(255) | Requis |
| `quantite` | INTEGER | Requis |
| `prixUnitaire` | DECIMAL(10,2) | Requis |

### Contrôleurs

#### FournisseurController
| Méthode | Route | Description |
|---|---|---|
| CRUD complet | /api/fournisseurs | Gestion des fournisseurs |

#### CommandeController
| Méthode | Route | Description |
|---|---|---|
| CRUD complet | /api/commandes | Gestion des commandes |
| `validerCommande` | PUT /api/commandes/:id/valider | Valide |
| `livrerCommande` | PUT /api/commandes/:id/livrer | Marque livrée |

### Routes exposées
- CRUD fournisseurs et commandes
- Validation et livraison des commandes

---

## 16. Module Signature & Présence

### Modèles

#### Signature (`Signature.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `utilisateurId` | UUID (FK) | Requis |
| `type` | ENUM | `ELECTRONIQUE`, `NUMERIQUE`, `MANUSCRITE` |
| `valeur` | TEXT | Hash ou référence |
| `dateSignature` | DATE | Auto |
| `documentType` | STRING(100) | Optionnel |
| `documentId` | UUID | Optionnel |

#### Presence (`Presence.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `seanceId` | UUID (FK) | Requis |
| `inscriptionId` | UUID (FK) | Requis |
| `statut` | ENUM | `PRESENT`, `ABSENT`, `RETARD`, `EXCUSE` |
| `date` | DATE | Requis |
| `justificatif` | TEXT | Optionnel |

### Contrôleurs

#### SignatureController
| Méthode | Route | Description |
|---|---|---|
| `signerDocument` | POST /api/signatures | Signe un document |
| `verifierSignature` | GET /api/signatures/:id/verifier | Vérifie une signature |
| `getByUtilisateur` | GET /api/signatures/utilisateur/:id | Signatures d'un utilisateur |

#### PresenceController
| Méthode | Route | Description |
|---|---|---|
| `marquerPresence` | POST /api/presences | Marque une présence |
| `marquerPresencesGroupe` | POST /api/presences/groupe | Présences en masse |
| `getBySeance` | GET /api/presences/seance/:id | Présences d'une séance |
| `getByEleve` | GET /api/presences/eleve/:id | Présences d'un élève |
| `getStatistics` | GET /api/presences/statistics | Statistiques |

### Routes exposées
- Signature de documents
- Marquage de présence (individuel et groupe)
- Statistiques de présence

---

## 17. Module Transverses

### Modèles

#### Parametre (`Parametre.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `cle` | STRING(100) | Unique |
| `valeur` | TEXT | Requis |
| `description` | TEXT | Optionnel |
| `module` | STRING(100) | Requis |

#### Log (`Log.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `utilisateurId` | UUID (FK) | Optionnel |
| `action` | STRING(255) | Requis |
| `entite` | STRING(100) | Requis |
| `entiteId` | UUID | Optionnel |
| `donneesAvant` | JSONB | Optionnel |
| `donneesApres` | JSONB | Optionnel |
| `adresseIP` | STRING(45) | Optionnel |
| `dateAction` | DATE | Auto |

#### PieceJointe (`PieceJointe.ts`)
| Champ | Type | Contraintes |
|---|---|---|
| `id` | UUID (PK) | Auto |
| `nom` | STRING(255) | Requis |
| `chemin` | TEXT | Requis |
| `typeMime` | STRING(100) | Requis |
| `taille` | INTEGER | Octets |
| `entite` | STRING(100) | Requis (ex: "Stage") |
| `entiteId` | UUID | Requis |

### Contrôleurs

#### ParametreController
| Méthode | Route | Description |
|---|---|---|
| `getParametres` | GET /api/parametres | Liste des paramètres |
| `updateParametre` | PUT /api/parametres/:cle | Modifie un paramètre |

#### LogController
| Méthode | Route | Description |
|---|---|---|
| `getLogs` | GET /api/logs | Liste des logs (filtrée) |
| `getLogsByUtilisateur` | GET /api/logs/utilisateur/:id | Logs d'un utilisateur |

#### PieceJointeController
| Méthode | Route | Description |
|---|---|---|
| `uploadPieceJointe` | POST /api/pieces-jointes | Upload |
| `getPiecesJointes` | GET /api/pieces-jointes/entite/:entite/:id | Pièces d'une entité |
| `deletePieceJointe` | DELETE /api/pieces-jointes/:id | Supprime |

### Routes exposées
- Gestion des paramètres globaux
- Consultation des logs d'audit
- Upload/Download de pièces jointes

---

## 18. Système de Permissions

### Architecture
EasyEcole utilise un système hybride **Permissions + Rôles** :

1. **Permissions** : droits atomiques définis dans la table `Permission`
   - Chaque permission a un `code` unique, un `libelle`, un `module` et un `type`
   - Types : `READ`, `WRITE`, `DELETE`, `ADMIN`
   - Exemples : `utilisateurs.create`, `notes.valider`, `bulletins.publier`

2. **Rôles** : groupes de permissions prédéfinis
   - Liés aux permissions via `RolePermission`
   - Liés aux utilisateurs via `RoleUtilisateur`
   - Un utilisateur peut avoir plusieurs rôles

3. **Permissions directes** : assignées directement à un utilisateur via `UtilisateurPermission`
   - Permettent de déroger aux droits de son rôle

4. **Permissions effectives** = `Union(Permissions des rôles de l'utilisateur, Permissions directes)`

### Vérification des permissions
```typescript
// Dans les contrôleurs
const utilisateur = await Utilisateur.findByPk(req.user.id, {
  include: [
    { model: Role, include: [Permission] },
    { model: Permission, as: 'permissionsDirectes' }
  ]
});

// Calcul des permissions effectives
const permissionsEffectives = [
  ...new Set([
    ...utilisateur.Roles.flatMap(r => r.Permissions.map(p => p.code)),
    ...utilisateur.permissionsDirectes.map(p => p.code)
  ])
];
```

### Permissions seedées
| Code | Module | Type |
|---|---|---|
| `utilisateurs.view` | auth | READ |
| `utilisateurs.create` | auth | WRITE |
| `utilisateurs.edit` | auth | WRITE |
| `utilisateurs.delete` | auth | DELETE |
| `utilisateurs.assign_roles` | auth | ADMIN |
| `roles.view` | auth | READ |
| `roles.create` | auth | WRITE |
| `roles.edit` | auth | WRITE |
| `roles.delete` | auth | DELETE |
| `roles.assign_permissions` | auth | ADMIN |
| `parametres.view` | configuration | READ |
| `parametres.edit` | configuration | WRITE |
| `classes.view` | scolarite | READ |
| `classes.create` | scolarite | WRITE |
| `classes.edit` | scolarite | WRITE |
| `classes.delete` | scolarite | DELETE |
| `inscriptions.view` | scolarite | READ |
| `inscriptions.create` | scolarite | WRITE |
| `inscriptions.edit` | scolarite | WRITE |
| `inscriptions.delete` | scolarite | DELETE |
| `matieres.view` | scolarite | READ |
| `matieres.create` | scolarite | WRITE |
| `matieres.edit` | scolarite | WRITE |
| `matieres.delete` | scolarite | DELETE |
| `notes.view` | notes | READ |
| `notes.create` | notes | WRITE |
| `notes.edit` | notes | WRITE |
| `notes.delete` | notes | DELETE |
| `notes.valider` | notes | ADMIN |
| `cours.view` | cours | READ |
| `cours.create` | cours | WRITE |
| `cours.edit` | cours | WRITE |
| `cours.delete` | cours | DELETE |
| `evaluations.view` | cours | READ |
| `evaluations.create` | cours | WRITE |
| `evaluations.edit` | cours | WRITE |
| `evaluations.delete` | cours | DELETE |
| `bulletins.view` | bulletins | READ |
| `bulletins.create` | bulletins | WRITE |
| `bulletins.edit` | bulletins | WRITE |
| `bulletins.delete` | bulletins | DELETE |
| `bulletins.publier` | bulletins | ADMIN |
| `paiements.view` | paiements | READ |
| `paiements.create` | paiements | WRITE |
| `paiements.edit` | paiements | WRITE |
| `paiements.delete` | paiements | DELETE |
| `paiements.valider` | paiements | ADMIN |
| `stages.view` | stages | READ |
| `stages.create` | stages | WRITE |
| `stages.edit` | stages | WRITE |
| `stages.delete` | stages | DELETE |
| `elearning.view` | elearning | READ |
| `elearning.create` | elearning | WRITE |
| `elearning.edit` | elearning | WRITE |
| `elearning.delete` | elearning | DELETE |
| `presences.view` | presences | READ |
| `presences.create` | presences | WRITE |
| `presences.edit` | presences | WRITE |
| `orientation.view` | orientation | READ |
| `orientation.create` | orientation | WRITE |
| `orientation.edit` | orientation | WRITE |
| `orientation.delete` | orientation | DELETE |
| `messages.view` | communication | READ |
| `messages.send` | communication | WRITE |
| `rapports.view` | reporting | READ |
| `rapports.create` | reporting | WRITE |
| `rapports.delete` | reporting | DELETE |
| `menus.view` | menus | READ |
| `menus.create` | menus | WRITE |
| `menus.edit` | menus | WRITE |
| `menus.delete` | menus | DELETE |

### Rôles seedés
| Rôle | Description |
|---|---|
| SUPER_ADMIN | Accès total à toutes les fonctionnalités |
| ADMIN | Gestion des utilisateurs, rôles, permissions, configuration |
| PROFESSEUR | Gestion des cours, évaluations, notes, présence |
| ELEVE | Consultation de ses notes, cours, emploi du temps, bulletins |
| PARENT | Consultation des données de son (ses) enfant(s) |
| SURVEILLANT | Gestion des présences, discipline |
| COMPTABLE | Gestion des paiements, frais, échéances |
| SECRETAIRE | Gestion des inscriptions, dossiers administratifs |

---

## 19. Système de Seed

Le fichier `src/core/scripts/seed.ts` initialise la base de données avec :

1. **Permissions** (toutes les permissions listées ci-dessus)
2. **Rôles** (SUPER_ADMIN, ADMIN, PROFESSEUR, ELEVE, PARENT, SURVEILLANT, COMPTABLE, SECRETAIRE) — chaque rôle est associé aux permissions pertinentes
3. **Utilisateurs** (un compte par rôle pour test)
4. **Année académique** (2025-2026)
5. **Classes, matières, inscriptions**
6. **Évaluations, notes**
7. **Bulletins**
8. **Paiements**
9. **Menus**

**Comptes de test créés** :
| Email | Mot de passe | Rôle |
|---|---|---|
| superadmin@easyecole.com | password | SUPER_ADMIN |
| admin@easyecole.com | password | ADMIN |
| professeur@easyecole.com | password | PROFESSEUR |
| eleve@easyecole.com | password | ELEVE |
| parent@easyecole.com | password | PARENT |
| surveillant@easyecole.com | password | SURVEILLANT |
| comptable@easyecole.com | password | COMPTABLE |
| secretaire@easyecole.com | password | SECRETAIRE |

---

## 20. Règles Transverses & Contraintes

### Authentification
- JWT access token valide 10 heures
- Refresh token stocké en BDD, valide 7 jours
- TokenVersion permet d'invalider tous les tokens d'un utilisateur (logout)
- Un utilisateur avec statut !== `ACTIF` ne peut pas se connecter

### Autorisations
- Middleware `Authenticate` : vérifie JWT + tokenVersion
- Middleware `Authorize` : vérifie le rôle
- Permissions : vérification au niveau contrôleur (permissions effectives)
- Un utilisateur ne peut pas se supprimer lui-même

### Validation des données
- Champs requis signalés dans les modèles Sequelize
- Contraintes `unique` sur les colonnes critiques (email, code, reference)
- Contrainte `unique: ['evaluationId', 'inscriptionId']` sur les notes
- Pas de librairie de validation externe (Joi, Zod) — validation via Sequelize et code métier

### Gestion des fichiers
- Upload via `multer` (middleware personnalisé dans `core/middlewares/upload.ts`)
- Stockage dans `uploads/` à la racine du backend
- Pièces jointes liées aux entités via la table `PieceJointe`

### Audit
- Table `Log` pour tracer les actions importantes
- Champs `utilisateurId`, `action`, `entite`, `entiteId`, `donneesAvant`, `donneesApres`, `adresseIP`

### Configuration
- Table `Parametre` pour la configuration clé-valeur par module
- API REST pour lire et modifier les paramètres

### Cycle de vie des données
- **Inscription** : NOUVEAU → ACTIF → TERMINE (ou SUSPENDU/EXCLU)
- **Note** : saisie → validation (estModifiable = false)
- **Bulletin** : BROUILLON → PUBLIE → VERROUILLE
- **Paiement** : EN_ATTENTE → VALIDE/REJETE
- **Stage** : PLANIFIE → EN_COURS → TERMINE/VALIDE
- **Demande d'orientation** : EN_ATTENTE → EN_TRAITEMENT → TRAITEE
- **Quiz** : EN_COURS → TERMINE → CORRIGE
- **Présence** : PRESENT / ABSENT / RETARD / EXCUSE
