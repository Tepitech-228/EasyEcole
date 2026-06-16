# Module Bulletins & Relevé de Notes — Design Document

## 1. Objectif

Créer un module dédié aux bulletins de notes et relevés pour l'année scolaire structurée en 2 semestres. Chaque semestre comporte des évaluations de type Contrôle Continu (CC), Devoir, et Examen de fin de semestre. Le bulletin est généré après validation de toutes les notes, consultable par l'institution, les enseignants et les élèves.

---

## 2. Architecture

### Backend — Nouveau module `bulletins/`

```
easy-ecole-backend/src/modules/
├── inscription/                    (existant)
│   └── models/
│       ├── ListeNoteEvaluation.ts  ← + anneeAcademiqueId
│       ├── NoteEvaluation.ts       (inchangé)
│       └── TypeNoteEvaluation.ts   ← + categorie
│
└── bulletins/                      (NOUVEAU)
    ├── models/
    │   ├── Bulletin.ts
    │   └── LigneBulletin.ts
    ├── controllers/
    │   └── BulletinController.ts
    ├── routers/
    │   └── BulletinRouter.ts
    └── validators/
        └── bulletin.validator.ts
```

### Frontend — Nouveau module `bulletins/`

```
easy-ecole-web/src/app/features/modules/
├── cours/                          (existant — inchangé)
└── bulletins/                      (NOUVEAU)
    ├── bulletins-routing.module.ts
    ├── bulletins.module.ts
    ├── pages/
    │   ├── liste-bulletins-page/
    │   ├── generer-bulletins-page/
    │   ├── detail-bulletin-page/
    │   └── mon-releve-page/
    ├── components/
    │   ├── bulletin-print/
    │   └── relev-etudiant/
    └── services/
        └── bulletin.service.ts
```

### Liens avec modules existants

| Bulletin → | Type de lien | Usage |
|---|---|---|
| `inscription.Cours` | FK `coursId` | Matières du bulletin |
| `inscription.CoursParticipant` | FK | Élèves inscrits au cours |
| `inscription.CursusApprenant` | FK | Parcours, classe, année |
| `inscription.AnneeAcademique` | FK `anneeAcademiqueId` | Année scolaire |
| `inscription.ListeNoteEvaluation` | Données | Notes évaluations |
| `inscription.TypeNoteEvaluation` | FK `categorie` | Type CC/Devoir/Examen |
| `auth.Enseignant` | Données | Signature |
| `auth.Utilisateur` | FK `utilisateurId` | Élève |

---

## 3. Data Model

### Modifications aux modèles existants

**TypeNoteEvaluation** — ajout du champ `categorie` :
```
categorie: ENUM('controle_continu', 'devoir', 'examen') | nullable
```

**ListeNoteEvaluation** — ajout du champ `anneeAcademiqueId` :
```
anneeAcademiqueId: FK -> AnneeAcademique | NOT NULL
```

### Bulletin

Table `ins_bulletins`

| Champ | Type | Description |
|---|---|---|
| `id` | PK INT UNSIGNED AUTO_INCREMENT | |
| `anneeAcademiqueId` | FK INT UNSIGNED NOT NULL | Année scolaire |
| `semestre` | ENUM('semestre1','semestre2') NOT NULL | Semestre |
| `cursusApprenantId` | FK INT UNSIGNED NOT NULL | Inscription de l'élève |
| `utilisateurId` | FK INT UNSIGNED NOT NULL | Élève |
| `classeId` | FK INT UNSIGNED NOT NULL | Classe |
| `parcoursId` | FK INT UNSIGNED NOT NULL | Parcours |
| `niveauEtudeId` | FK INT UNSIGNED NOT NULL | Niveau d'étude |
| `moyenneGenerale` | FLOAT NULL | Moyenne calculée |
| `totalCredits` | INT UNSIGNED NULL | Total crédits |
| `creditsValidés` | INT UNSIGNED NULL | Crédits obtenus |
| `rang` | INT UNSIGNED NULL | Rang dans la classe |
| `effectifClasse` | INT UNSIGNED NULL | Effectif total |
| `mention` | VARCHAR(50) NULL | Mention obtenue |
| `appreciation` | TEXT NULL | Appréciation (admin) |
| `statut` | ENUM('brouillon','publie') NOT NULL DEFAULT 'brouillon' | |
| `dateGeneration` | DATETIME NULL | |
| `datePublication` | DATETIME NULL | |
| `createdAt` | DATETIME | |
| `updatedAt` | DATETIME | |

Paranoid: true (soft delete)

### LigneBulletin

Table `ins_lignes_bulletins`

| Champ | Type | Description |
|---|---|---|
| `id` | PK INT UNSIGNED AUTO_INCREMENT | |
| `bulletinId` | FK INT UNSIGNED NOT NULL | Bulletin parent |
| `coursId` | FK INT UNSIGNED NOT NULL | Matière |
| `moyenneCC` | FLOAT NULL | Moyenne des contrôles continus |
| `noteDevoir` | FLOAT NULL | Note du devoir |
| `noteExamen` | FLOAT NULL | Note de l'examen |
| `moyenne` | FLOAT NULL | Moyenne pondérée finale |
| `coefficient` | INT UNSIGNED NULL | Coefficient/crédit du cours |
| `rang` | INT UNSIGNED NULL | Rang dans la matière |
| `appreciation` | TEXT NULL | Appréciation par matière |
| `createdAt` | DATETIME | |
| `updatedAt` | DATETIME | |

**Snapshot** : Toutes les notes sont snapshotées à la génération. Une fois publié, les valeurs sont figées.

### Règles de calcul

**Moyenne par matière :**
```
moyenneCC = moyenne de toutes les évaluations CC du semestre pour ce cours
moyenne = (moyenneCC × 20% + noteDevoir × 30% + noteExamen × 50%)
```
Les pondérations exactes sont configurables par cours ou par type d'évaluation.

**Moyenne générale :**
```
moyenneGenerale = Σ(moyenneMatière × coefficient) / Σ(coefficients)
```

**Mention :**
| Moyenne | Mention |
|---|---|
| ≥ 16/20 | Très Bien |
| ≥ 14/20 | Bien |
| ≥ 12/20 | Assez Bien |
| ≥ 10/20 | Passable |
| < 10/20 | Insuffisant |

---

## 4. REST API

### Routes du module `bulletins/`

```
POST   /api/v1/bulletins/generer
       → Corps: { classeId, semestre, anneeAcademiqueId }
       → Génère les bulletins pour toute la classe

GET    /api/v1/bulletins
       → Query: ?classeId=&semestre=&anneeAcademiqueId=&statut=
       → Liste paginée des bulletins

GET    /api/v1/bulletins/:id
       → Détail complet + lignes

PUT    /api/v1/bulletins/:id
       → Corps: { appreciation, statut }
       → Modifier appréciation ou statut (admin seulement)

PUT    /api/v1/bulletins/:id/publier
       → Passe statut → 'publie', figé

GET    /api/v1/bulletins/:id/export-pdf
       → Export PDF du bulletin

GET    /api/v1/bulletins/mon-releve
       → Rélevé pour l'étudiant connecté
       → Retourne le dernier bulletin publié
```

### Routes modifiées de `inscription/`

Ajout du filtre `anneeAcademiqueId` sur les endpoints existants :
```
GET    /api/v1/listesNoteEvaluation?anneeAcademiqueId=
POST   /api/v1/listesNoteEvaluation  → + anneeAcademiqueId dans le corps
```

---

## 5. Pages & Navigation

### Frontend — Pages

**`/bulletins`** — Liste des bulletins
- Tableau avec filtres : année académique, semestre, classe, statut
- Colonnes : Élève, Classe, Moy. Gén., Mention, Rang, Statut, Actions
- Actions : Voir, Publier, Exporter PDF (admin)
- Accessible à : Institution, Enseignant (bulletins publiés de ses classes)

**`/bulletins/generer`** — Assistant de génération
- Étape 1 : Sélectionner année académique + semestre
- Étape 2 : Sélectionner une classe
- Étape 3 : Vérifier les moyennes pré-calculées (aperçu)
- Étape 4 : Confirmer la génération (statut = 'brouillon')
- Réservé à : Institution

**`/bulletins/:id`** — Détail bulletin
- Vue imprimable du bulletin complet
- Header : École, Année, Semestre, Infos élève
- Tableau : Matière, CC, Devoir, Examen, Moyenne, Coef, Mention, Appréciation
- Footer : Moy. Générale, Mention, Rang, Signatures
- Actions : Publier, Modifier appréciation, Exporter PDF
- Accessible à : Institution (tout), Enseignant (publié), Élève (son propre bulletin publié)

**`/bulletins/mon-releve`** — Rélevé personnel (étudiant)
- Version simplifiée sans les colonnes CC/Devoir/Examen
- Montre : Matière, Moyenne/20, Coef, Mention
- Footer : Moy. Générale, Mention, Rang, Crédits
- Accessible uniquement à l'étudiant connecté

### Menu latéral

Nouvelle rubrique :
```
📊 Bulletins
  ├── Tous les bulletins      (admin/enseignant)
  ├── Générer                 (admin)
  └── Mon rélevé              (étudiant)
```

### Contrôle d'accès par rôle

| Rôle | Générer | Lister | Modifier | Publier | Voir (publié) | Mon relevé |
|---|---|---|---|---|---|---|
| Institution | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Enseignant | — | ✅ (ses classes) | — | — | ✅ | — |
| Étudiant | — | — | — | — | ✅ (le sien) | ✅ |
| Apprenant | — | — | — | — | ✅ (le sien) | ✅ |

---

## 6. Cycle de vie d'un bulletin

```
Étape 1 : L'admin crée les évaluations (CC, Devoir, Examen) pour un cours/semestre
Étape 2 : Les enseignants saisissent les notes via /notes/:id/saisie
Étape 3 : L'admin clique "Générer bulletins" pour une classe + semestre
          → Backend calcule toutes les moyennes et crée les bulletins (statut: brouillon)
Étape 4 : L'admin vérifie les bulletins, ajoute des appréciations
Étape 5 : L'admin publie → statut: publie, bulletin figé
Étape 6 : Enseignants et élèves peuvent consulter
```

## 7. Contraintes techniques

- **MySQL** : Les colonnes ajoutées à TypeNoteEvaluation et ListeNoteEvaluation seront synchronisées via `sequelize.sync({ alter: true })` au prochain redémarrage avec DB accessible.
- **Snapshot** : Les bulletins stockent une copie des notes au moment de la génération. La modification ultérieure d'une évaluation n'affecte pas les bulletins déjà publiés.
- **PDF** : Génération via impression navigateur (pas de lib externe dans un premier temps).
- **Pondérations** : Les poids (CC 20%, Devoir 30%, Examen 50%) sont stockés dans `ListeNoteEvaluation.poidsTypeNoteEvaluation` déjà existant. Le bulletin les utilise pour le calcul.

---

## 8. Phases d'implémentation

### Phase 1 — Module Notes (prérequis bulletin)
1. Ajouter `anneeAcademiqueId` à `ListeNoteEvaluation`
2. Ajouter `categorie` à `TypeNoteEvaluation`
3. Ajouter ces champs dans les modèles frontend et services
4. Ajouter le filtre année dans la page liste-notes et saisie-notes

### Phase 2 — Module Bulletins
1. Créer les modèles `Bulletin` et `LigneBulletin` (backend)
2. Créer `BulletinController` avec toutes les méthodes
3. Créer `BulletinRouter`
4. Créer les composants et pages frontend
5. Ajouter la rubrique au menu
6. Tester le flux complet

### Phase 3 — Rélevé étudiant
1. Créer la page `mon-releve`
2. Créer le composant `releve-etudiant`
3. Ajouter la route et le contrôleur associé
4. Tester la consultation élève
