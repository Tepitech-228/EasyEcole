# Saisie de notes d'évaluation — Design

## Routes

| Route | Page | Description |
|---|---|---|
| `/cours/notes` | `ListeNotesPageComponent` (existant) | Liste des évaluations + boutons Nouvelle évaluation / Saisir |
| `/cours/notes/nouveau` | `NouvelleEvaluationPageComponent` | Formulaire de création d'une évaluation |
| `/cours/notes/:id/saisie` | `SaisieNotesPageComponent` | Saisie des notes par étudiant |

## Composants à créer

### NouvelleEvaluationPageComponent
- Dropdown **Cours** (filtrés par enseignant connecté si rôle enseignant)
- Dropdown **Type d'évaluation** (DST, Composition, Examen, etc.)
- Champ **Date** (date picker)
- Champs **Heure début / Heure fin** (time inputs)
- Champ **Poids / Coefficient** (number, %)
- Utilise `CoursService.getAll()`, `TypeNoteEvaluationService.getAll()`
- Crée via `ListeNoteEvaluationService.create()`
- Redirige vers `/cours/notes/:id/saisie` après création

### SaisieNotesPageComponent
- Entête : Cours, Type, Date, Poids
- Charge `ListeNoteEvaluation` avec `notesEvaluation[]` et `coursParticipants[]` (students enrolled)
- Tableau :
  - # / Étudiant (nom/prénom)
  - Note (input number 0-20, step 0.5)
  - Statut (noté / vide)
- Sauvegarde via `ListeNoteEvaluationService.update()` ou `NoteEvaluationService` (bulk)
- Visible pour : Enseignant du cours, Admin, Institution

## Modifications sur liste existante

- Bouton **"Nouvelle évaluation"** dans l'entête → `/cours/notes/nouveau`
- Ajouter colonne **"Actions"** dans le tableau
- Bouton **"Saisir"** par ligne → `/cours/notes/:id/saisie`
- Restreindre aux rôles : Enseignant (son cours), Admin, Institution

## Services backend (existants)

- `ListeNoteEvaluationService` — CRUD complet
- `ListeNoteEvaluationService.get(id)` — retourne la liste avec `notesEvaluation` et `cours.coursParticipants.apprenant`
- `CoursParticipantService` — pour lister les étudiants d'un cours
