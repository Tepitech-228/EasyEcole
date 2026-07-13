# Module Paiement Scolarité & Dossier Étudiant — Design

> Date : 22/06/2026
> Statut : Approuvé

## 1. Nouveau rôle

| Élément | Valeur |
|---------|--------|
| Identifiant | `cabinet_comptable` |
| Middleware | `AuthCabinetComptable.ts` |
| Enum | `RolesUtilisateur.CABINET_COMPTABLE = 'cabinet_comptable'` |

## 2. Nouvelles tables (préfixe `ins_`)

### `ins_echeances`
| Champ | Type | Description |
|-------|------|-------------|
| id | INT PK | Auto-incrément |
| dossierEtudiantId | FK → ins_dossiers_etudiants | Dossier concerné |
| type | ENUM | inscription / scolarite |
| numeroEcheance | INT | 1 à 10 pour mensualités, 0 pour 1 fois |
| montant | DECIMAL | Montant de l'échéance |
| devise | STRING | XAF par défaut |
| dateLimite | DATE | Date butoir |
| datePaiement | DATE | Null si pas payé |
| statut | ENUM | impaye / paye / en_retard |
| moisConcerne | STRING | ex: "2026-09" |

### `ins_bordereaux`
| Champ | Type | Description |
|-------|------|-------------|
| id | INT PK | Auto-incrément |
| echeanceId | FK → ins_echeances | Échéance concernée |
| utilisateurId | FK → Utilisateur | Étudiant qui upload |
| fichier | STRING | Chemin du fichier uploadé (PDF/image) |
| montant | DECIMAL | Montant sur le bordereau |
| referenceBancaire | STRING | Référence banque |
| statut | ENUM | en_attente / valide / rejete |
| dateSoumission | DATE | Date d'upload |
| dateValidation | DATE | Date de validation |
| valideParId | FK → Utilisateur | Cabinet comptable qui a validé |
| commentaire | TEXT | Motif rejet éventuel |

### `ins_dossiers_etudiants`
| Champ | Type | Description |
|-------|------|-------------|
| id | INT PK | Auto-incrément |
| utilisateurId | FK → Utilisateur | L'étudiant |
| matricule | STRING UNIQUE | Matricule généré |
| codeQR | STRING | Données du QR code |
| photo | STRING | Photo de l'étudiant |
| statut | ENUM | actif / suspendu / archive |
| dateCreation | DATE | Date de création |
| fraisScolarite | DECIMAL | Montant total scolarité |
| modePaiement | ENUM | unique / mensuel |
| nbMensualites | INT | 10 si mensuel, 1 si unique |
| demarrageParcours | DATE | Date début des cours |

## 3. Modifications pointage/scanner

Dans le module Pointage existant, modifier la vérification pour :
1. Scanner le QR code → récupérer le matricule
2. Chercher le dossier étudiant
3. Vérifier toutes les échéances (si impayé → rouge, si à jour → vert)

Retour JSON :
```json
{ "statut": "vert", "message": "Accès autorisé" }
```
ou
```json
{ "statut": "rouge", "message": "Échéance mois 3 impayée", "echeancesRestantes": [...] }
```

## 4. Workflow complet

```
Institution :
  → Crée les échéances pour un étudiant (1 ou 10 mois)
  → Le montant total est défini dans le dossier étudiant

Étudiant :
  → Va à la banque, paie
  → Reçoit le bordereau
  → Upload le bordereau sur la plateforme (POST /inscription/bordereaux)
  → Choisit l'échéance concernée

Cabinet Comptable :
  → Liste les bordereaux en attente (GET /inscription/bordereaux?statut=en_attente)
  → Vérifie le bordereau
  → Valide ou rejette (PUT /inscription/bordereaux/:id/valider)
  → Si validé → échéance marquée "payée"
  → Si rejeté → échéance reste "impayée" + commentaire

Scanner (pointage) :
  → Scanne QR code
  → Vérifie statut de l'étudiant
  → VERT (tout payé) ou ROUGE (impayé)
```

## 5. Génération automatique des échéances

Quand un dossier étudiant est créé avec `modePaiement = mensuel` et `nbMensualites = 10` :
- Générer 10 échéances (1 par mois)
- Montant = fraisScolarite / 10
- DateLimite = chaque 5 du mois (ou configurable)

Quand un dossier étudiant est créé avec `modePaiement = unique` :
- Générer 1 échéance unique
- Montant = fraisScolarite
- DateLimite = date de début des cours

## 6. Backend

### Fichiers à créer
```
src/core/middlewares/AuthCabinetComptable.ts
src/modules/inscription/models/Echeance.ts
src/modules/inscription/models/Bordereau.ts
src/modules/inscription/models/DossierEtudiant.ts
src/modules/inscription/controllers/EcheanceController.ts
src/modules/inscription/controllers/BordereauController.ts
src/modules/inscription/controllers/DossierEtudiantController.ts
src/modules/inscription/routers/EcheanceRouter.ts
src/modules/inscription/routers/BordereauRouter.ts
src/modules/inscription/routers/DossierEtudiantRouter.ts
```

### Fichiers à modifier
```
src/core/enums/RolesUtilisateur.ts
src/routes.ts (ajouter les nouvelles routes)
src/modules/inscription/InscriptionRoutes.ts
src/modules/inscription/models/_associations.ts
src/modules/inscription/controllers/PointageController.ts (vérification QR statut)
```

### Routes API

| Méthode | Route | Rôle |
|---------|-------|------|
| GET | /inscription/echeances | Tous (filtré par étudiant) |
| POST | /inscription/echeances | Institution |
| POST | /inscription/bordereaux | Apprenant (upload) |
| GET | /inscription/bordereaux | Cabinet/institution (filtre statut) |
| PUT | /inscription/bordereaux/:id/valider | Cabinet comptable |
| PUT | /inscription/bordereaux/:id/rejeter | Cabinet comptable |
| POST | /inscription/dossiers/generer | Institution (après 1er paiement) |
| GET | /inscription/dossiers/:matricule/statut | Scanner (vert/rouge) |

## 7. Frontend

### Pages à créer dans le module inscription
```
pages/bordereaux-page/              → Étudiant : upload + historique
pages/validation-bordereaux-page/   → Cabinet comptable : liste à valider
pages/mon-dossier-page/             → Étudiant : voir son dossier + QR code
pages/gestion-echeances-page/       → Institution : créer/gérer échéances
```

### Modification page pointage existante
```
pages/scan-presence-page/ → Vérifier aussi le statut QR du dossier étudiant
```
