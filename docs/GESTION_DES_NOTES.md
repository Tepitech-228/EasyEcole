# Gestion des Notes — EasyEcole

> Document d'architecture technique — Juillet 2026

---

## Table des matières

1. [Présentation générale](#1-présentation-générale)
2. [Modèle de données](#2-modèle-de-données)
3. [Architecture des API](#3-architecture-des-api)
4. [Workflow de saisie des notes](#4-workflow-de-saisie-des-notes)
5. [Moteur de calcul](#5-moteur-de-calcul)
6. [Génération des bulletins](#6-génération-des-bulletins)
7. [Délibérations](#7-délibérations)
8. [Export et import](#8-export-et-import)
9. [Reporting et statistiques](#9-reporting-et-statistiques)
10. [Sécurité et rôles](#10-sécurité-et-rôles)
11. [Interface utilisateur](#11-interface-utilisateur)
12. [Améliorations proposées](#12-améliorations-proposées)
13. [Annexes](#13-annexes)

---

## 1. Présentation générale

### 1.1 Périmètre

Le module **Gestion des Notes** couvre l'ensemble du cycle de vie des évaluations et des résultats académiques :

- Définition des **types d'évaluation** (Contrôle Continu, Devoir, Examen)
- Création de **sessions d'évaluation** avec poids configurable
- **Saisie des notes** individuelles par élève
- **Calcul automatique** des moyennes, mentions, rangs, crédits
- **Génération de bulletins** officiels avec signatures électroniques
- **Délibérations** avec décisions (admis, rattrapage, redoublement)
- **Export/Import** de procès-verbaux (PV) Excel
- **Reporting** et statistiques par classe, semestre, année

### 1.2 Modules liés

| Module | Relation |
|--------|----------|
| **Auth** | Authentification, rôles (Institution, Enseignant, Apprenant) |
| **Inscription** | Cours, participants, années académiques, classes, parcours |
| **Scolarité** | Registre académique, réclamations, conseil de classe |
| **Stage** | Notes de stage (module distinct) |
| **Reporting** | Agrégats, taux de réussite, moyennes |
| **Communication** | Notifications (email) à la publication des résultats |

### 1.3 Principe général

```
TypeNoteEvaluation (CC/Devoir/Examen)
       ↓
ListeNoteEvaluation (session d'évaluation avec poids)
       ↓
NoteEvaluation (note individuelle par participant)
       ↓
Bulletin → LigneBulletin (agrégation par étudiant/semestre)
       ↓
Deliberation → ResultatDeliberation (décision finale)
```

---

## 2. Modèle de données

### 2.1 Diagramme relationnel

```
┌─────────────────────────────────────────────┐
│           ins_types_note_evaluation          │
├─────────────────────────────────────────────┤
│ id (PK)                                      │
│ libelle (string, unique) ← "Controle Continu"│
│ description (string, nullable)               │
│ poids (float, nullable) ← poids par défaut   │
│ categorie (enum) ← controle_continu|devoir|  │
│                    examen                    │
│ createdAt, updatedAt, deletedAt              │
└──────────────────┬──────────────────────────┘
                   │ 1
                   │
                   │ *
┌──────────────────┴──────────────────────────┐
│          ins_listes_notes_evaluation         │
├──────────────────────────────────────────────┤
│ id (PK)                                       │
│ date (DATEONLY)                               │
│ heureDebut (TIME)                             │
│ heureFin (TIME)                               │
│ commentaire (string, nullable)                │
│ poidsTypeNoteEvaluation (float) ← poids réel  │
│ typeNoteEvaluationId (FK)                     │
│ coursId (FK → ins_cours)                     │
│ enseignantId (FK → aut_enseignants)          │
│ anneeAcademiqueId (FK)                        │
│ createdAt, updatedAt, deletedAt               │
└──────────────────┬───────────────────────────┘
                   │ 1
                   │
                   │ *
┌──────────────────┴──────────────────────────┐
│            ins_notes_evaluation              │
├──────────────────────────────────────────────┤
│ id (PK)                                       │
│ note (float, nullable) ← valeur 0-20         │
│ listeNoteEvaluationId (FK)                   │
│ coursParticipantId (FK → ins_cours_          │
│                      participants)           │
│ createdAt, updatedAt, deletedAt              │
└──────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              ins_bulletins                    │
├─────────────────────────────────────────────┤
│ id (PK)                                      │
│ anneeAcademiqueId (FK)                       │
│ semestre (enum: semestre1, semestre2)        │
│ cursusApprenantId (FK)                       │
│ utilisateurId (FK)                           │
│ classeId (FK)                                │
│ parcoursId (FK)                              │
│ niveauEtudeId (FK)                           │
│ moyenneGenerale (float)                      │
│ totalCredits (int)                           │
│ creditsValides (int)                         │
│ rang (int)                                   │
│ effectifClasse (int)                         │
│ mention (string 50)                          │
│ appreciation (text, nullable)                │
│ statut (enum: brouillon, publie)             │
│ dateGeneration (date)                        │
│ datePublication (date)                       │
│ signatureEnseignant (text) ← base64 PNG     │
│ signatureChef (text) ← base64 PNG           │
│ dateSignatureEnseignant (date)              │
│ dateSignatureChef (date)                     │
│ createdAt, updatedAt, deletedAt              │
└──────────────────┬──────────────────────────┘
                   │ 1
                   │
                   │ *
┌──────────────────┴──────────────────────────┐
│          ins_lignes_bulletins                │
├──────────────────────────────────────────────┤
│ id (PK)                                       │
│ bulletinId (FK)                               │
│ coursId (FK → ins_cours)                     │
│ moyenneCC (float) ← moyenne des CC           │
│ noteDevoir (float)                           │
│ noteExamen (float)                           │
│ moyenne (float) ← moyenne pondérée           │
│ coefficient (int)                            │
│ rang (int) ← rang dans la matière           │
│ appreciation (text, nullable)                │
│ createdAt, updatedAt                         │
└──────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│           ins_deliberations                  │
├─────────────────────────────────────────────┤
│ id (PK)                                      │
│ libelle (string 255)                         │
│ classeId (FK)                                │
│ anneeAcademiqueId (FK)                       │
│ periode (string 50)                          │
│ date (DATE)                                  │
│ statut (enum: planifiee, en_cours,           │
│           cloturee)                          │
│ effectif (int, default 0)                    │
│ admis (int, default 0)                       │
│ createdAt, updatedAt, deletedAt              │
└──────────────────┬──────────────────────────┘
                   │ 1
                   │
                   │ *
┌──────────────────┴──────────────────────────┐
│       ins_resultats_deliberation             │
├──────────────────────────────────────────────┤
│ id (PK)                                       │
│ deliberationId (FK)                           │
│ cursusApprenantId (FK)                       │
│ nom (string 100)                              │
│ prenoms (string 100)                          │
│ matricule (string 50)                         │
│ moyenne (float, nullable)                     │
│ mention (string 50, nullable)                │
│ rang (int, nullable)                          │
│ decision (enum: admis, rattrapage,           │
│            redouble)                          │
│ createdAt, updatedAt                          │
└──────────────────────────────────────────────┘
```

### 2.2 Tables de référence

| Table | Préfixe | Module | Rôle |
|-------|---------|--------|------|
| `ins_types_note_evaluation` | `InsTypeNoteEvaluation` | Inscription | Types d'évaluation (CC, Devoir, Examen) |
| `ins_listes_notes_evaluation` | `InsListeNoteEvaluation` | Inscription | Sessions d'évaluation |
| `ins_notes_evaluation` | `InsNoteEvaluation` | Inscription | Notes individuelles |
| `ins_bulletins` | `InsBulletin` | Bulletins | Bulletins de notes |
| `ins_lignes_bulletins` | `InsLigneBulletin` | Bulletins | Lignes de bulletins par matière |
| `ins_deliberations` | `InsDeliberation` | Bulletins | Sessions de délibération |
| `ins_resultats_deliberation` | `InsResultatDeliberation` | Bulletins | Résultats individuels de délibération |
| `stg_notes_stage` | `NoteStage` | Stage | Notes de stage |
| `rpt_notes_moyennes` | `RptNoteMoyenne` | Reporting | Aggrégats de moyennes par classe/matière |
| `rpt_evaluations` | `RptEvaluation` | Reporting | Statistiques d'évaluations |
| `rpt_reussite` | `RptReussite` | Reporting | Taux de réussite |

### 2.3 Modèle détaillé des tables

#### `ins_types_note_evaluation` — Types d'évaluation

Définit les catégories d'évaluation avec leurs poids par défaut.

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | INT UNSIGNED | PK, auto-increment | Identifiant unique |
| `libelle` | STRING(255) | UNIQUE, NOT NULL | Libellé (ex: "Controle Continu") |
| `description` | TEXT | NULLABLE | Description optionnelle |
| `poids` | FLOAT | NULLABLE | Poids par défaut (ex: 40.0 pour CC) |
| `categorie` | ENUM | 'controle_continu','devoir','examen' | Catégorie utilisée dans les calculs |
| `createdAt` | DATETIME | | Date de création |
| `updatedAt` | DATETIME | | Date de modification |
| `deletedAt` | DATETIME | NULLABLE | Soft delete (paranoid) |

**Données initiales (seed)** :
| libelle | poids | categorie |
|---------|-------|-----------|
| Controle Continu | 40.0 | controle_continu |
| Devoir | 30.0 | devoir |
| Examen | 30.0 | examen |

#### `ins_listes_notes_evaluation` — Sessions d'évaluation

Représente une session d'évaluation spécifique (un CC, un devoir, un examen) pour un cours donné.

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | INT UNSIGNED | PK, auto-increment | Identifiant unique |
| `date` | DATEONLY | NOT NULL | Date de l'évaluation |
| `heureDebut` | TIME | NULLABLE | Heure de début |
| `heureFin` | TIME | NULLABLE | Heure de fin |
| `commentaire` | STRING(255) | NULLABLE | Commentaire libre |
| `poidsTypeNoteEvaluation` | FLOAT | NOT NULL | Poids effectif pour cette session (ex: 30.0) |
| `typeNoteEvaluationId` | INT UNSIGNED | FK → `ins_types_note_evaluation` | Type d'évaluation |
| `coursId` | INT UNSIGNED | FK → `ins_cours` | Cours concerné |
| `enseignantId` | INT UNSIGNED | FK → `aut_enseignants` | Enseignant responsable |
| `anneeAcademiqueId` | INT UNSIGNED | FK → `ins_annees_academiques` | Année académique |
| `createdAt` | DATETIME | | Date de création |
| `updatedAt` | DATETIME | | Date de modification |
| `deletedAt` | DATETIME | NULLABLE | Soft delete |

#### `ins_notes_evaluation` — Notes individuelles

Note attribuée à un étudiant pour une session d'évaluation donnée.

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | INT UNSIGNED | PK, auto-increment | Identifiant unique |
| `note` | FLOAT | NULLABLE | Valeur de la note (0-20) |
| `listeNoteEvaluationId` | INT UNSIGNED | FK → `ins_listes_notes_evaluation` | Session d'évaluation |
| `coursParticipantId` | INT UNSIGNED | FK → `ins_cours_participants` | Participant (étudiant inscrit au cours) |
| `createdAt` | DATETIME | | Date de création |
| `updatedAt` | DATETIME | | Date de modification |
| `deletedAt` | DATETIME | NULLABLE | Soft delete |

**Contrainte d'unicité** : Un seul enregistrement par `(listeNoteEvaluationId, coursParticipantId)`.

#### `ins_bulletins` — Bulletins

Bulletin de notes généré pour un étudiant, un semestre, une classe.

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | INT UNSIGNED | PK, auto-increment | Identifiant unique |
| `anneeAcademiqueId` | INT UNSIGNED | FK | Année académique |
| `semestre` | ENUM | 'semestre1','semestre2' | Semestre concerné |
| `cursusApprenantId` | INT UNSIGNED | FK → `ins_cursus_apprenants` | Cursus de l'apprenant |
| `utilisateurId` | INT UNSIGNED | FK → `aut_utilisateurs` | Utilisateur lié |
| `classeId` | INT UNSIGNED | FK → `ins_classes` | Classe |
| `parcoursId` | INT UNSIGNED | FK → `ins_parcours` | Parcours/formation |
| `niveauEtudeId` | INT UNSIGNED | FK → `ins_niveaux_etude` | Niveau d'étude |
| `moyenneGenerale` | FLOAT | NULLABLE | Moyenne générale (/20) |
| `totalCredits` | INT UNSIGNED | NULLABLE | Total des crédits |
| `creditsValides` | INT UNSIGNED | NULLABLE | Crédits validés (moyenne ≥ 10) |
| `rang` | INT UNSIGNED | NULLABLE | Rang dans la classe |
| `effectifClasse` | INT UNSIGNED | NULLABLE | Effectif de la classe |
| `mention` | STRING(50) | NULLABLE | Mention obtenue |
| `appreciation` | TEXT | NULLABLE | Appréciation du conseil |
| `statut` | ENUM | 'brouillon','publie' | Statut de publication |
| `dateGeneration` | DATE | NULLABLE | Date de génération |
| `datePublication` | DATE | NULLABLE | Date de publication |
| `signatureEnseignant` | TEXT | NULLABLE | Signature enseignant (base64 PNG) |
| `signatureChef` | TEXT | NULLABLE | Signature chef d'établissement (base64 PNG) |
| `dateSignatureEnseignant` | DATE | NULLABLE | Date signature enseignant |
| `dateSignatureChef` | DATE | NULLABLE | Date signature chef |
| `createdAt` | DATETIME | | Date de création |
| `updatedAt` | DATETIME | | Date de modification |
| `deletedAt` | DATETIME | NULLABLE | Soft delete |

#### `ins_lignes_bulletins` — Lignes de bulletin

Détail par matière d'un bulletin.

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | INT UNSIGNED | PK, auto-increment | Identifiant unique |
| `bulletinId` | INT UNSIGNED | FK → `ins_bulletins` | Bulletin parent |
| `coursId` | INT UNSIGNED | FK → `ins_cours` | Matière |
| `moyenneCC` | FLOAT | NULLABLE | Moyenne des contrôles continus |
| `noteDevoir` | FLOAT | NULLABLE | Note du devoir |
| `noteExamen` | FLOAT | NULLABLE | Note de l'examen |
| `moyenne` | FLOAT | NULLABLE | Moyenne pondérée de la matière |
| `coefficient` | INT UNSIGNED | NULLABLE | Coefficient de la matière |
| `rang` | INT UNSIGNED | NULLABLE | Rang dans la matière |
| `appreciation` | TEXT | NULLABLE | Appréciation |
| `createdAt` | DATETIME | | Date de création |
| `updatedAt` | DATETIME | | Date de modification |

#### `ins_deliberations` — Sessions de délibération

Session de délibération pour une classe, période donnée.

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | INT UNSIGNED | PK, auto-increment | Identifiant unique |
| `libelle` | STRING(255) | NOT NULL | Libellé de la session |
| `classeId` | INT UNSIGNED | FK → `ins_classes` | Classe concernée |
| `anneeAcademiqueId` | INT UNSIGNED | FK | Année académique |
| `periode` | STRING(50) | NOT NULL | Période (ex: "Semestre 1") |
| `date` | DATE | NOT NULL | Date de la délibération |
| `statut` | ENUM | 'planifiee','en_cours','cloturee' | Statut de la session |
| `effectif` | INT UNSIGNED | DEFAULT 0 | Effectif total |
| `admis` | INT UNSIGNED | DEFAULT 0 | Nombre d'admis |
| `createdAt` | DATETIME | | Date de création |
| `updatedAt` | DATETIME | | Date de modification |
| `deletedAt` | DATETIME | NULLABLE | Soft delete |

#### `ins_resultats_deliberation` — Résultats de délibération

Résultat individuel pour chaque étudiant lors d'une délibération.

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | INT UNSIGNED | PK, auto-increment | Identifiant unique |
| `deliberationId` | INT UNSIGNED | FK → `ins_deliberations` | Délibération parent |
| `cursusApprenantId` | INT UNSIGNED | FK → `ins_cursus_apprenants` | Étudiant |
| `nom` | STRING(100) | NOT NULL | Nom (dénormalisé) |
| `prenoms` | STRING(100) | NOT NULL | Prénoms (dénormalisé) |
| `matricule` | STRING(50) | NOT NULL | Matricule (dénormalisé) |
| `moyenne` | FLOAT | NULLABLE | Moyenne générale |
| `mention` | STRING(50) | NULLABLE | Mention |
| `rang` | INT UNSIGNED | NULLABLE | Rang |
| `decision` | ENUM | 'admis','rattrapage','redouble' | Décision du jury |
| `createdAt` | DATETIME | | Date de création |
| `updatedAt` | DATETIME | | Date de modification |

### 2.4 Associations Sequelize

#### Module Bulletins (`_associations.ts`)

```
Bulletin.hasMany(LigneBulletin, { as: 'lignesBulletins', foreignKey: 'bulletinId' })
LigneBulletin.belongsTo(Bulletin, { as: 'bulletin', foreignKey: 'bulletinId' })

Bulletin.belongsTo(AnneeAcademique, { as: 'anneeAcademique' })
Bulletin.belongsTo(CursusApprenant, { as: 'cursusApprenant' })
Bulletin.belongsTo(Utilisateur, { as: 'utilisateur' })
Bulletin.belongsTo(Classe, { as: 'classe' })
Bulletin.belongsTo(Parcours, { as: 'parcours' })
Bulletin.belongsTo(NiveauEtude, { as: 'niveauEtude' })

LigneBulletin.belongsTo(Cours, { as: 'cours', foreignKey: 'coursId' })

Deliberation.hasMany(ResultatDeliberation, { as: 'resultats', foreignKey: 'deliberationId' })
ResultatDeliberation.belongsTo(Deliberation, { as: 'deliberation', foreignKey: 'deliberationId' })

Deliberation.belongsTo(Classe, { as: 'classe' })
Deliberation.belongsTo(AnneeAcademique, { as: 'anneeAcademique' })
ResultatDeliberation.belongsTo(CursusApprenant, { as: 'cursusApprenant' })
```

#### Module Inscription (extrait notes)

```
TypeNoteEvaluation.hasMany(ListeNoteEvaluation, { as: 'listesNotesEvaluation' })
ListeNoteEvaluation.belongsTo(TypeNoteEvaluation, { as: 'typeNoteEvaluation' })

Cours.hasMany(ListeNoteEvaluation, { as: 'listesNotesEvaluation' })
ListeNoteEvaluation.belongsTo(Cours, { as: 'cours' })

ListeNoteEvaluation.hasMany(NoteEvaluation, { as: 'notesEvaluation' })
NoteEvaluation.belongsTo(ListeNoteEvaluation, { as: 'listeNoteEvaluation' })

AnneeAcademique.hasMany(ListeNoteEvaluation, { as: 'listesNotesEvaluation' })
ListeNoteEvaluation.belongsTo(AnneeAcademique, { as: 'anneeAcademique' })

Enseignant.hasMany(ListeNoteEvaluation, { as: 'listesNotesEvaluation' })
ListeNoteEvaluation.belongsTo(Enseignant, { as: 'enseignant' })

CoursParticipant.hasMany(NoteEvaluation, { as: 'notesEvaluation' })
NoteEvaluation.belongsTo(CoursParticipant, { as: 'coursParticipant' })
```

---

## 3. Architecture des API

### 3.1 Routes montées

Toutes les routes sont montées sous `/api/v1/inscription/`. Les bulletins et délibérations sont intégrés via le routeur d'inscription.

```
/api/v1/inscription/
├── notesEvaluation
│   ├── GET /               → Liste des notes (filtres)
│   ├── POST /upsert        → Création ou mise à jour d'une note
│   ├── POST /bulk-upsert   → Création ou mise à jour en masse
│   ├── GET /:id            → Détail d'une note
│   └── DELETE /:id         → Suppression logique
│
├── listesNoteEvaluation
│   ├── GET /               → Liste des sessions d'évaluation
│   ├── POST /              → Création d'une session
│   ├── GET /:id            → Détail d'une session
│   ├── PUT /:id            → Modification
│   ├── DELETE /:id         → Suppression
│   ├── GET /statistics/count → Compteur
│   ├── GET /:id/export-pv  → Export PV Excel
│   └── POST /:id/import-pv → Import PV Excel
│
├── typesNoteEvaluation
│   ├── GET /               → Liste des types d'évaluation
│   ├── POST /              → Création
│   ├── GET /:id            → Détail
│   ├── PUT /:id            → Modification
│   ├── DELETE /:id         → Suppression
│   └── GET /statistics/count → Compteur
│
├── bulletins
│   ├── POST /generer       → Génération des bulletins (classe, semestre)
│   ├── GET /               → Liste des bulletins (filtres + pagination)
│   ├── GET /mon-releve     → Relevé de l'étudiant connecté
│   ├── GET /moyennes       → Statistiques globales
│   ├── GET /:id            → Détail d'un bulletin
│   ├── PUT /:id            → Modification (appréciation uniquement)
│   ├── PUT /:id/publier    → Publication du bulletin
│   ├── DELETE /:id         → Suppression logique
│   ├── PUT /:id/signer-enseignant → Signature enseignant
│   └── PUT /:id/signer-chef → Signature chef d'établissement
│
└── deliberations
    ├── GET /               → Liste des délibérations
    ├── POST /              → Création d'une session
    ├── GET /:id            → Détail avec résultats
    ├── PUT /:id            → Modification
    ├── DELETE /:id         → Suppression
    ├── POST /:id/charger-resultats → Chargement des résultats depuis bulletins
    ├── PUT /:id/resultats/:resultatId → Mise à jour d'une décision individuelle
    └── PUT /:id/cloturer   → Clôture de la délibération
```

### 3.2 Middlewares appliqués

| Middleware | Rôle | Routes concernées |
|-----------|------|-------------------|
| `Authenticate` | Vérification JWT + utilisateur actif | Toutes |
| `AuthInstitution` | Rôle Institution uniquement | Création, modification, suppression, publication |
| `AuthEnseignant` | Rôle Enseignant uniquement | Signature enseignant |
| `AuthApprenant` | Rôle Apprenant uniquement | Mon relevé |
| `CheckPermission` | Vérification permission spécifique | Actions critiques |

### 3.3 Permissions (CheckPermission)

| Permission | Action |
|-----------|--------|
| `action.evaluation.bulletin.generer` | Génération des bulletins |
| `action.evaluation.bulletin.modifier` | Modification d'un bulletin |
| `action.evaluation.bulletin.publier` | Publication d'un bulletin |
| `action.evaluation.bulletin.supprimer` | Suppression d'un bulletin |
| `action.evaluation.deliberation.creer` | Création d'une délibération |
| `action.evaluation.deliberation.modifier` | Modification d'une délibération |
| `action.evaluation.deliberation.supprimer` | Suppression d'une délibération |
| `action.evaluation.deliberation.charger-resultats` | Chargement des résultats |
| `action.evaluation.deliberation.modifier-resultat` | Modification d'une décision |
| `action.evaluation.deliberation.cloturer` | Clôture d'une délibération |

---

## 4. Workflow de saisie des notes

### 4.1 Définition des types d'évaluation

L'institution crée les types d'évaluation via `POST /api/v1/inscription/typesNoteEvaluation`.

Chaque type est défini par :
- **libelle** : nom affiché (ex: "Contrôle Continu", "Devoir", "Examen")
- **categorie** : rôle dans le calcul automatique (`controle_continu`, `devoir`, `examen`)
- **poids** : poids par défaut (ex: 40% pour le CC)

### 4.2 Création d'une session d'évaluation

L'enseignant crée une session via `POST /api/v1/inscription/listesNoteEvaluation`.

**Étapes** :
1. Sélectionner le cours (`coursId`)
2. Choisir le type d'évaluation (`typeNoteEvaluationId`)
3. Définir la date, les heures, le poids effectif
4. Le système crée automatiquement les `NoteEvaluation` vierges pour tous les participants inscrits au cours

### 4.3 Saisie des notes

L'enseignant saisit les notes via `POST /api/v1/inscription/notesEvaluation/upsert` (une note) ou `POST /api/v1/inscription/notesEvaluation/bulk-upsert` (plusieurs notes).

**Contrôles** :
- La note doit être comprise entre 0 et 20 (pas de validation backend explicite — à implémenter comme amélioration)
- L'enseignant ne peut modifier que les notes des sessions d'évaluation dont il est responsable
- Le `coursParticipantId` doit exister et correspondre au cours de la session

### 4.4 Import / Export de PV Excel

**Export** : `GET /api/v1/inscription/listesNoteEvaluation/:id/export-pv`
- Génère un fichier Excel structuré avec les colonnes : Matricule, Nom, Prénom, Note
- Téléchargeable au format `.xlsx`

**Import** : `POST /api/v1/inscription/listesNoteEvaluation/:id/import-pv`
- Upload d'un fichier Excel rempli
- Validation des données (correspondance matricule, plage de notes)
- Mise à jour des notes existantes ou création des nouvelles
- Retourne un rapport d'import (succès, erreurs, détails)

---

## 5. Moteur de calcul

### 5.1 Calcul des moyennes par matière

Pour chaque étudiant et chaque matière, lors de la génération du bulletin, le système :

1. **Regroupe** toutes les notes d'évaluation par catégorie (`controle_continu`, `devoir`, `examen`)
2. **Calcule la moyenne par catégorie** :
   - `moyenneCC` = moyenne des notes de catégorie `controle_continu`
   - `noteDevoir` = note de catégorie `devoir` (généralement unique)
   - `noteExamen` = note de catégorie `examen` (généralement unique)
3. **Calcule la moyenne pondérée** de la matière :
   ```
   moyenneMatiere = (moyenneCC * 0.4 + noteDevoir * 0.3 + noteExamen * 0.3) / (0.4 + 0.3 + 0.3)
   ```
   *(Les pondérations correspondent aux poids des types d'évaluation)*

**Algorithme (BulletinController - méthode `generer`)** :
```
POUR CHAQUE étudiant DANS la classe:
    POUR CHAQUE cours DANS le parcours:
        LIRE toutes les NoteEvaluation de l'étudiant pour ce cours
        SÉPARER par catégorie (CC, Devoir, Examen)
        CALCULER moyenneCC = MOYENNE(notes CC)
        CALCULER noteDevoir
        CALCULER noteExamen
        CALCULER moyenne = moyenneCC * poidsCC + noteDevoir * poidsDevoir + noteExamen * poidsExamen
                         / (poidsCC + poidsDevoir + poidsExamen)
        STOCKER dans LigneBulletin

    CALCULER moyenneGenerale = SOMME(moyenne * coefficient) / SOMME(coefficient)
    CALCULER creditsValides = SOMME(coefficient POUR moyenne >= 10)
    CALCULER mention
    CALCULER rang
    CRÉER Bulletin
```

### 5.2 Calcul de la moyenne générale

```
moyenneGenerale = Σ(moyenneMatière_i × coefficient_i) / Σ(coefficient_i)
```

### 5.3 Validation des crédits

Un crédit est validé si la moyenne de la matière est ≥ 10/20.

```
créditsValidés = Σ(coefficient_i) POUR moyenneMatière_i >= 10
```

### 5.4 Calcul du rang

Le rang est déterminé en triant tous les bulletins d'une même classe et semestre par `moyenneGenerale` décroissante.

```
rangs = TRIER(étudiants) PAR moyenneGenerale DESC
```

### 5.5 Attribution des mentions

| Moyenne | Mention |
|---------|---------|
| 18 - 20 | Très Bien |
| 16 - 17.99 | Bien |
| 14 - 15.99 | Assez Bien |
| 12 - 13.99 | Passable |
| 10 - 11.99 | Suffisant |
| 8 - 9.99 | Insuffisant |
| 0 - 7.99 | Très Insuffisant |

*(Échelle configurable via l'interface Échelles)*

---

## 6. Génération des bulletins

### 6.1 Déclenchement

La génération est déclenchée par l'institution via :
```
POST /api/v1/inscription/bulletins/generer
Body: { classeId, semestre, anneeAcademiqueId }
```

### 6.2 Processus de génération

1. **Identification des étudiants** : récupération de tous les `CursusApprenant` pour la classe donnée
2. **Identification des cours** : récupération des cours du parcours associé à la classe
3. **Collecte des notes** : pour chaque étudiant et chaque cours, agrégation des `NoteEvaluation` via les `ListeNoteEvaluation` du semestre
4. **Calcul** : moyennes, crédits, mentions, rang
5. **Création** : insertion d'un `Bulletin` avec ses `LigneBulletin`
6. **Statut** : les bulletins sont créés en statut `brouillon`

### 6.3 Workflow de publication

```
BROUILLON ──[publier]──> PUBLIÉ
```

| Statut | Actions possibles |
|--------|------------------|
| `brouillon` | Modification de l'appréciation, suppression, signature |
| `publié` | Consultation par l'étudiant, plus de modification |

### 6.4 Signatures électroniques

Le bulletin supporte deux signatures :
- **Signature Enseignant** : apposée par l'enseignant principal
- **Signature Chef d'Établissement** : apposée par l'institution

Les signatures sont capturées via un composant canvas (SignaturePad) et stockées en base64 PNG dans les champs `signatureEnseignant` et `signatureChef` du bulletin.

### 6.5 Consultation par l'étudiant

L'étudiant consulte ses bulletins publiés via :
```
GET /api/v1/inscription/bulletins/mon-releve
```

### 6.6 Statistiques globales

```
GET /api/v1/inscription/bulletins/moyennes
```

Retourne pour chaque classe :
- Effectif
- Moyenne générale de la classe
- Note minimale et maximale
- Taux de réussite
- Meilleur étudiant

---

## 7. Délibérations

### 7.1 Cycle de vie d'une délibération

```
PLANIFIÉE ──[charger résultats]──> EN COURS ──[clôturer]──> CLÔTURÉE
```

### 7.2 Création d'une session

```
POST /api/v1/inscription/deliberations
Body: { libelle, classeId, anneeAcademiqueId, periode, date }
```

### 7.3 Chargement des résultats

```
POST /api/v1/inscription/deliberations/:id/charger-resultats
```

1. Récupère tous les bulletins publiés pour la classe/période
2. Crée un `ResultatDeliberation` pour chaque étudiant
3. **Décision automatique** :
   - `moyenne >= 10` → **admis**
   - `moyenne < 10` → **rattrapage**
4. Passe le statut de la délibération à `en_cours`

### 7.4 Ajustement des décisions

```
PUT /api/v1/inscription/deliberations/:id/resultats/:resultatId
Body: { decision: "admis" | "rattrapage" | "redouble" }
```

Le jury peut modifier individuellement chaque décision.

### 7.5 Clôture

```
PUT /api/v1/inscription/deliberations/:id/cloturer
```

- Finalise la délibération
- Passe le statut à `cloturée`
- Met à jour les compteurs (`effectif`, `admis`)

---

## 8. Export et import

### 8.1 Export PV Excel

**Endpoint** : `GET /api/v1/inscription/listesNoteEvaluation/:id/export-pv`

**Format du fichier généré** :
| Matricule | Nom | Prénom(s) | Note |
|-----------|-----|-----------|------|
| MAT001 | DUPONT | Jean | 14.5 |
| MAT002 | MARTIN | Marie | 12.0 |

**Fonctionnement** :
- Généré avec la librairie `exceljs`
- Téléchargé au format `.xlsx`
- Filigrane avec le nom de l'évaluation, la date, le cours

### 8.2 Import PV Excel

**Endpoint** : `POST /api/v1/inscription/listesNoteEvaluation/:id/import-pv`

**Fonctionnement** :
- Upload via `multer` (fichier `.xlsx` ou `.xls`)
- Lecture et parsing du fichier avec `exceljs`
- Pour chaque ligne :
  1. Recherche du participant par matricule
  2. Validation de la note (0-20) *(non strictement appliquée actuellement)*
  3. Mise à jour ou création de la `NoteEvaluation`
- **Rapport d'import retourné** :
  ```json
  {
    "success": true,
    "importedCount": 25,
    "errorCount": 2,
    "details": [
      { "matricule": "MAT001", "nom": "DUPONT", "note": 14.5, "status": "ok" },
      { "matricule": "MAT999", "nom": "INCONNU", "note": null, "status": "matricule_invalide" }
    ],
    "errors": ["Matricule MAT999 non trouvé"]
  }
  ```

---

## 9. Reporting et statistiques

### 9.1 Tables de reporting

| Table | Contenu | Mise à jour |
|-------|---------|-------------|
| `rpt_notes_moyennes` | Moyennes par classe et matière | Script `sync-reporting.ts` |
| `rpt_evaluations` | Statistiques globales d'évaluation | Script `sync-reporting.ts` |
| `rpt_reussite` | Taux de réussite par classe/semestre | Script `sync-reporting.ts` |

### 9.2 Endpoints disponibles

**Moyennes par classe** (depuis le contrôleur Bulletins) :
```
GET /api/v1/inscription/bulletins/moyennes
?anneeAcademiqueId=&semestre=&classeId=
```
Retourne : effectif, moyenne générale, min, max, taux de réussite, meilleur étudiant.

**Reporting dédié** (module reporting) :
```
GET /api/v1/reporting/notes/moyennes
GET /api/v1/reporting/notes/reussite
```

### 9.3 Indicateurs calculés

| Indicateur | Formule |
|-----------|---------|
| Moyenne générale classe | `MOYENNE(moyenneGenerale)` de tous les bulletins de la classe |
| Note minimale | `MIN(moyenneGenerale)` |
| Note maximale | `MAX(moyenneGenerale)` |
| Taux de réussite | `NB(moyenneGenerale >= 10) / EFFECTIF * 100` |
| Taux de mention | `NB(mention != null) / EFFECTIF * 100` |

---

## 10. Sécurité et rôles

### 10.1 Matrice des permissions

| Action | Admin | Institution | Enseignant | Apprenant | Caissier |
|--------|-------|-------------|------------|-----------|----------|
| Gérer types d'évaluation | ✅ | ✅ | ❌ | ❌ | ❌ |
| Créer session d'évaluation | ✅ | ✅ | ✅ (ses cours) | ❌ | ❌ |
| Saisir des notes | ✅ | ✅ | ✅ (ses évaluations) | ❌ | ❌ |
| Voir les notes | ✅ | ✅ | ✅ (ses cours) | ✅ (les siennes) | ❌ |
| Générer bulletins | ✅ | ✅ | ❌ | ❌ | ❌ |
| Publier bulletins | ✅ | ✅ | ❌ | ❌ | ❌ |
| Signer bulletin (enseignant) | ✅ | ❌ | ✅ | ❌ | ❌ |
| Signer bulletin (chef) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Créer délibération | ✅ | ✅ | ❌ | ❌ | ❌ |
| Modifier décision délibération | ✅ | ✅ | ❌ | ❌ | ❌ |
| Consulter son relevé | ✅ | ✅ | ❌ | ✅ | ❌ |
| Exporter PV | ✅ | ✅ | ✅ | ❌ | ❌ |
| Importer PV | ✅ | ✅ | ✅ | ❌ | ❌ |

### 10.2 Middleware d'authentification

```typescript
// Vérification JWT standard
Authenticate → vérifie token, charge utilisateur

// Vérifications de rôle
AuthInstitution → utilisateur.type === 'institution'
AuthEnseignant  → utilisateur.type === 'enseignant'
AuthApprenant   → utilisateur.type === 'apprenant'

// Vérification de permission granulaire
CheckPermission('action.evaluation.bulletin.generer')
```

### 10.3 Contrôle d'accès au niveau enseignant

L'enseignant ne peut :
- Voir que les sessions d'évaluation dont il est responsable (`ListeNoteEvaluation.enseignantId`)
- Saisir/modifier que les notes des sessions qui lui appartiennent
- Signer que les bulletins de ses classes

---

## 11. Interface utilisateur

### 11.1 Pages du module Bulletins

| Page | Route | Rôle | Description |
|------|-------|------|-------------|
| **Liste des bulletins** | `/bulletins` | Institution, Enseignant | Tableau filtré avec stats cards |
| **Mon relevé** | `/bulletins/mon-releve` | Apprenant | Relevé personnel de notes |
| **Générer bulletins** | `/bulletins/generer` | Institution | Formulaire de génération |
| **Détail bulletin** | `/bulletins/:id` | Institution, Enseignant | Bulletin complet avec signatures |
| **Moyennes** | `/bulletins/moyennes` | Institution, Enseignant | Statistiques globales |
| **Échelles** | `/bulletins/echelles` | Institution | Gestion des barèmes |
| **Nouvelle échelle** | `/bulletins/echelles/nouveau` | Institution | Création d'un barème |
| **Délibérations** | `/bulletins/deliberations` | Institution | Liste des sessions |
| **Détail délibération** | `/bulletins/deliberations/:id` | Institution | Résultats et décisions |
| **Paramètres** | `/bulletins/parametres` | Institution | Configuration des bulletins |

### 11.2 Pages du module Cours (Notes)

| Page | Route | Rôle | Description |
|------|-------|------|-------------|
| **Liste des notes** | `/cours/notes` | Enseignant, Institution | Sessions d'évaluation |
| **Nouvelle évaluation** | `/cours/notes/nouveau` | Enseignant | Création d'une session |
| **Saisie des notes** | `/cours/notes/:id/saisie` | Enseignant | Grille de saisie |

### 11.3 Pages du module Reporting

| Page | Route | Rôle | Description |
|------|-------|------|-------------|
| **Rapport notes** | `/reporting/notes` | Institution | Statistiques et taux |

### 11.4 Composants réutilisables

| Composant | Utilisation |
|-----------|-------------|
| `signature-pad` | Canvas de signature électronique (souris + tactile) |
| `custom-modal` | Boîte de dialogue pour l'import PV |
| `custom-alert` | Notifications de succès/erreur |
| `custom-badge` | Badges de mentions et statuts |

### 11.5 Règles d'affichage

**Couleurs des notes** :
- `>= 14` : vert
- `>= 10` : ambre/orange
- `< 10` : bleu

**Validation des crédits** :
- `>= 10` : "Validé" (vert)
- `< 10` : "Non" (bleu)

**Mentions** : badges colorés par niveau
- Très Bien : vert foncé
- Bien : vert clair
- Assez Bien : bleu
- Passable : ambre
- Suffisant : gris
- Insuffisant / Très Insuffisant : rouge (inactif)

**Statuts bulletin** :
- Brouillon : ambre
- Publié : vert

**Statuts délibération** :
- Planifiée : ambre
- En cours : bleu
- Clôturée : vert

---

## 12. Améliorations proposées

### 12.1 Audit trail des modifications de notes

**Problème** : Aucune traçabilité des modifications de notes. Impossible de savoir qui a modifié quoi et quand.

**Solution** : Créer une table `grade_audit_logs` :

```sql
CREATE TABLE ins_audit_notes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  noteEvaluationId INT UNSIGNED NOT NULL,
  ancienneNote FLOAT,
  nouvelleNote FLOAT,
  modifiePar INT UNSIGNED NOT NULL,
  motif TEXT,
  createdAt DATETIME NOT NULL,
  INDEX idx_note (noteEvaluationId),
  INDEX idx_modifie_par (modifiePar)
);
```

**Déclenchement** : À chaque `upsert` ou `bulk-upsert` de `NoteEvaluation`, si la note existait déjà et a changé, créer une entrée d'audit.

### 12.2 Échelles de notes persistées

**Problème** : Les échelles de notes sont gérées côté frontend uniquement (hardcodées dans `EchellesPageComponent`). Le backend n'a pas de table d'échelles.

**Solution** : Créer une table `ins_echelles_notes` dans le backend, avec CRUD complet :

```sql
CREATE TABLE ins_echelles_notes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  libelle VARCHAR(100) NOT NULL,
  noteMin FLOAT NOT NULL,
  noteMax FLOAT NOT NULL,
  mention VARCHAR(50) NOT NULL,
  actif BOOLEAN DEFAULT true,
  ordre INT UNSIGNED DEFAULT 0,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME
);
```

### 12.3 Workflow d'appel / contestation

**Problème** : Pas de processus pour qu'un étudiant conteste une note.

**Solution** : Étendre le module Scolarité avec un workflow de réclamation dédié aux notes :

1. L'étudiant soumet une réclamation sur une note spécifique (`NoteEvaluationId`)
2. L'enseignant reçoit une notification et peut répondre
3. Si non résolu, escalade à l'institution
4. Toute modification suite à réclamation est tracée dans l'audit log

### 12.4 Notifications à la publication

**Problème** : Les étudiants ne sont pas notifiés quand leurs bulletins sont publiés.

**Solution** : Utiliser Nodemailer (déjà présent dans le projet) pour envoyer un email automatique :
- À la publication d'un bulletin
- À la clôture d'une délibération
- Avec lien vers le relevé de notes

### 12.5 Relevé de notes officiel PDF

**Problème** : Pas de génération de relevé de notes officiel format PDF (bulletin papier).

**Solution** : Utiliser PDFKit (déjà dans les dépendances) pour générer un PDF format A4 :
- En-tête de l'établissement
- Tableau des notes par matière
- Moyenne générale, mention, rang
- Cachet et signatures

**Endpoint** : `GET /api/v1/inscription/bulletins/:id/pdf`

### 12.6 Bulk edit des notes

**Problème** : La saisie individuelle est fastidieuse pour les grandes classes.

**Solution** : Ajouter un endpoint de mise à jour groupée avec formule :
```
PUT /api/v1/inscription/notesEvaluation/bulk-adjust
Body: {
  listeNoteEvaluationId: 1,
  operation: "add" | "multiply" | "replace",
  valeur: 0.5,
  filtre: { noteMin: 0, noteMax: 20 }
}
```

### 12.7 Validation backend des notes

**Problème** : Actuellement, les notes ne sont pas validées côté backend (0-20).

**Solution** : Ajouter un validateur Joi/Zod dans le middleware :
```typescript
note: Joi.number().min(0).max(20).required()
```

### 12.8 Dashboard de notes

**Problème** : Pas de vue synthétique avec graphiques pour l'institution.

**Solution** : Ajouter un dashboard avec :
- Répartition des mentions (camembert)
- Évolution des moyennes (courbes)
- Comparaison classe/matière (barres)
- Taux de réussite par semestre

---

## 13. Annexes

### 13.1 Arborescence des fichiers Backend

```
easy-ecole-backend/src/modules/
├── bulletins/
│   ├── controllers/
│   │   ├── BulletinController.ts
│   │   └── DeliberationController.ts
│   ├── models/
│   │   ├── Bulletin.ts
│   │   ├── LigneBulletin.ts
│   │   ├── Deliberation.ts
│   │   ├── ResultatDeliberation.ts
│   │   └── _associations.ts
│   ├── routers/
│   │   ├── BulletinRouter.ts
│   │   └── DeliberationRouter.ts
│   └── validators/
│       └── BulletinValidator.ts
│
└── inscription/
    ├── controllers/
    │   ├── NoteEvaluationController.ts
    │   ├── ListeNoteEvaluationController.ts
    │   └── TypeNoteEvaluationController.ts
    ├── models/
    │   ├── NoteEvaluation.ts
    │   ├── ListeNoteEvaluation.ts
    │   └── TypeNoteEvaluation.ts
    └── routers/
        ├── NoteEvaluationRouter.ts
        ├── ListeNoteEvaluationRouter.ts
        └── TypeNoteEvaluationRouter.ts
```

### 13.2 Arborescence des fichiers Frontend

```
easy-ecole-web/src/app/
├── data/
│   ├── enums/
│   │   ├── PeriodesEvaluation.ts
│   │   └── TypesEvaluation.ts
│   └── modules/
│       ├── bulletins/models/
│       │   ├── Bulletin.model.ts
│       │   └── LigneBulletin.model.ts
│       ├── inscription/models/
│       │   ├── NoteEvaluation.model.ts
│       │   ├── ListeNoteEvaluation.model.ts
│       │   └── TypeNoteEvaluation.model.ts
│       └── inscription/services/
│           ├── liste-note-evaluation.service.ts
│           ├── type-note-evaluation.service.ts
│           └── pv-evaluation.service.ts
│
└── features/modules/
    ├── bulletins/
    │   ├── bulletins.module.ts
    │   ├── bulletins-routing.module.ts
    │   ├── services/
    │   │   ├── bulletin.service.ts
    │   │   └── deliberation.service.ts
    │   ├── components/
    │   │   └── signature-pad/
    │   │       └── signature-pad.component.ts
    │   └── pages/
    │       ├── liste-bulletins-page/
    │       ├── generer-bulletins-page/
    │       ├── detail-bulletin-page/
    │       ├── mon-releve-page/
    │       ├── moyennes-page/
    │       ├── echelles-page/
    │       ├── echelle-form-page/
    │       ├── deliberations-page/
    │       ├── deliberation-detail-page/
    │       └── parametres-bulletins-page/
    │
    ├── cours/
    │   ├── cours-routing.module.ts
    │   └── pages/
    │       ├── liste-notes-page/
    │       ├── nouvelle-evaluation-page/
    │       └── saisie-notes-page/
    │
    └── reporting/
        └── pages/
            └── rapport-notes-page/
```

### 13.3 Commandes utiles

```bash
# Lancer le backend
npm run dev

# Réinitialiser la base de données (drop + sync + seed)
npm run db:reset

# Seed uniquement (données notes/bulletins/délibérations)
npm run db:seed

# Synchroniser le reporting
npm run db:sync-reporting

# Synchroniser le schéma uniquement
npm run db:sync
```

### 13.4 Dépendances clés

| Technologie | Version | Usage |
|-------------|---------|-------|
| Express.js | 4.18 | Framework HTTP |
| Sequelize | 6.32 | ORM MySQL |
| MySQL2 | 3.5 | Driver MySQL |
| ExcelJS | 4.4 | Génération/Lecture Excel PV |
| PDFKit | 0.19 | Génération PDF (bulletins) |
| Multer | 1.4 | Upload fichiers (import PV) |
| JWT | 9.0 | Authentification |
| Bcrypt | 5.1 | Hash mots de passe |
| Swagger | 6.3 | Documentation API |

---

> **Document maintenu par l'équipe EasyEcole** — Pour toute question ou suggestion, merci de créer une issue.
