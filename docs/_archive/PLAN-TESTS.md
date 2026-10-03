# PLAN DE TESTS — EasyEcole

> Objectif : monter de ~0% à une couverture significative des tests unitaires,
> fonctionnels et e2e, en priorisant les modules à risque financier.

---

## État des lieux (août 2026)

### Backend (Jest)

| Métrique | Valeur |
|----------|--------|
| Fichiers de test | 40 |
| Modules couverts | 5 / 22 (inscription, stock, docgen, auth, comptabilite) |
| Modules sans test | 17 (77%) |
| Type de tests | 100 % unitaires (mocks manuels) |
| Tests d'intégration HTTP (supertest) | 0 |

### Frontend (Jasmine/Karma + Cypress)

| Métrique | Valeur |
|----------|--------|
| Fichiers `.spec.ts` | 157 |
| Tests comportementaux réels | ~0 (tous = `should create` auto-généré) |
| Modules sans test | 15 / 25 (60 %) |
| E2E Cypress | 1 fichier (navigation comptabilité) |

### Modules critiques sans couverture

| Module | Criticité | Tests backend | Tests frontend |
|--------|-----------|---------------|----------------|
| comptabilite | HAUTE | 1 (helper uniquement) | 3 pages (stub) |
| bourse | HAUTE | 0 | 0 |
| achats | HAUTE | 0 | 0 |
| rh / paie | HAUTE | 0 | 2 pages (stub) |
| scolarite | HAUTE | 0 | 0 |
| bulletins | HAUTE | 0 | 0 |
| ged | MOYENNE | 0 | 0 |
| elearning | MOYENNE | 0 | 0 |

---

## Phase 0 — Infrastructure de test (Semaine 1)

> Créer les fondations pour que chaque nouveau test soit rapide à écrire.

### 0.1 Dépendances npm à installer

- [ ] Backend : `npm install --save-dev supertest @types/supertest`
- [ ] Backend : `npm install --save-dev @faker-js/faker`
- [ ] Frontend : `npm install --save-dev cypress` (manque du package.json)
- [ ] Vérifier que `ts-jest`, `jest`, `@types/jest` sont bien à jour

### 0.2 Helpers partagés backend

> Répertoire : `src/__tests__/helpers/`

- [ ] Créer `mockSequelizeModel.ts` — factory pour mocker un modèle Sequelize
      (findAll, findOne, create, findByPk, findAndCountAll, count, associations)
- [ ] Créer `mockTransaction.ts` — wrapper pour tester les opérations transactionnelles
- [ ] Créer `mockEmailSender.ts` — stub de `EmailSender` (vérifier qu'un email est envoyé sans l'envoyer)
- [ ] Refactorer `express-mocks.ts` existant — s'assurer que mockRequest/mockResponse/mockNext couvrent
      les cas query, params, body, headers, user (JWT décodé)

### 0.3 Fixtures backend

> Répertoire : `src/__tests__/fixtures/`

- [ ] Créer `fakeUser.ts` — `createFakeUser(role?)` retourne un objet utilisateur complet
- [ ] Créer `fakeEleve.ts` — `createFakeEleve()` avec dossier, cursus, paiements
- [ ] Créer `fakePaiement.ts` — `createFakePaiement(montant, type)` avec bordereau, echeance
- [ ] Créer `fakeComptabilite.ts` — `createFakeEcriture()` avec compte, journal, exercice

### 0.4 Helpers frontend

> Répertoire : `src/test-utils/`

- [ ] Créer `test-bed.helper.ts` — configuration standard de TestBed avec providers communs
      (HttpClientTestingModule, RouterTestingModule, MaterialTestingModule)
- [ ] Créer `http-spy.helper.ts` — `createSpyHttpClient()` pour mocker les appels HTTP
- [ ] Créer `mock-services.ts` — mocks réutilisables pour AuthService, ToastService, MenuService

### 0.5 Configuration CI

- [ ] Backend : ajouter script `"test:ci": "jest --forceExit --ci --coverage --coverageReporters=text"`
- [ ] Backend : ajouter `--forceExit` et `--detectOpenHandles` dans `jest.config.ts`
- [ ] Frontend : configurer Karma pour Chrome Headless
      (modifier `karma.conf.js` : `browsers: ['ChromeHeadless']`)
- [ ] Frontend : ajouter script `"test:ci": "ng test --watch=false --browsers=ChromeHeadless"`

### 0.6 Fichier d'environnement de test

- [ ] Créer `.env.test` à la racine du backend avec des valeurs par défaut pour les tests
      (DB_HOST=localhost, JWT_SECRET=test-secret, etc.)
- [ ] Vérifier que `jest.setup.ts` charge `.env.test` quand `NODE_ENV=test`

### 0.7 Test d'exemple

- [ ] Écrire 1 test unitaire exemple (controller CRUD) en utilisant les nouveaux helpers
- [ ] Écrire 1 test d'intégration exemple (route HTTP avec supertest)
- [ ] Valider que les deux passent en local (`npm test`)

**Livrable Phase 0** : PR avec infrastructure + 2 tests exemples fonctionnels.

---

## Phase 1 — Modules financiers critiques (Semaines 2-3)

> Couvrir ce qui génère de l'argent ou des dettes.

### 1.1 Comptabilite (12 fichiers estimés)

#### Unit tests

- [ ] `ComptabiliteHelper.creerEcritureComptable()` — test création écriture
- [ ] `ComptabiliteHelper.lettrerEcritures411()` — test lettrage
- [ ] `ComptabiliteHelper.creerEcritureAutomatique()` — test écriture automatique
- [ ] `CompteController` — CRUD comptes comptables
- [ ] `JournalComptableController` — CRUD journaux
- [ ] `EcritureComptableController` — CRUD écritures
- [ ] `ExerciceComptableController` — CRUD exercices
- [ ] `ComptabiliteDashboardController` — données dashboard

#### Tests d'intégration

- [ ] `POST /comptabilite/comptes` — création compte → vérifier en BDD
- [ ] `POST /comptabilite/ecritures` — création écriture → vérifier solde
- [ ] `GET /comptabilite/etats-financiers` — bilan + compte de résultat

### 1.2 Bourse (5 fichiers estimés)

#### Unit tests

- [ ] `BourseService.calculerMontant()` — test calcul montant bourse (frais × taux)
- [ ] `BourseService.attributionBourse()` — test attribution avec vérification echeances
- [ ] `BourseConfigurationController` — CRUD configurations
- [ ] `BourseAttributionController` — CRUD attributions
- [ ] `BourseCampagneController` — campagne par niveau

#### Tests d'intégration

- [ ] `POST /bourses/configurations` — créer config → vérifier en BDD
- [ ] `POST /bourses/attributions` — attribuer bourse → vérifier réduction echeances
- [ ] Route saisir bordereau avec boursier → vérifier montants

### 1.3 Inscription / Paiements (4 fichiers estimés)

> Tests ciblés sur les flux financiers, pas le CRUD générique déjà couvert.

- [ ] `ImputationService.appliquerPaiement()` — test FIFO complet (partiel → entier)
- [ ] `ImputationService.consommerPortefeuille()` — test consommation portefeuille
- [ ] `GenerateurEcheancierSessionService` — test génération echeancier
- [ ] Route `POST /inscription/saisir` — test intégration HTTP (supertest)
      - Montant > 0, type valide → 200
      - Montant négatif → 400
      - Étudiant inexistant → 404

### 1.4 Achats (10 fichiers estimés)

#### Unit tests

- [ ] `BudgetController` — CRUD budget + lignes budget
- [ ] `DemandeController` — workflow demande d'achat
- [ ] `CommandeController` — CRUD commande
- [ ] `FactureController` — réception facture
- [ ] `ReceptionController` — réception marchandise
- [ ] `ValidationController` — workflow validation

#### Tests d'intégration

- [ ] `POST /achats/commandes` — créer commande → vérifier en BDD
- [ ] `POST /achats/factures` — réception facture → écriture comptable générée

### 1.5 RH / Paie (10 fichiers estimés)

#### Unit tests

- [ ] `RhPaieService.calculerBulletin()` — test calculs salariaux (brut → net)
- [ ] `RhPaieService.calculerSoldeConge()` — test calcul congés
- [ ] `RhEmployeController` — CRUD employés
- [ ] `RhContratEnseignantController` — contrats enseignants
- [ ] `RhBulletinPaieController` — bulletins de paie
- [ ] `RhDemandeCongeController` — demandes de congé
- [ ] `RhPretController` — prêts et remboursements

#### Tests d'intégration

- [ ] `POST /rh/bulletins-paie` — générer bulletin → écriture comptable générée
- [ ] `POST /rh/demandes-conge` — demander congé → solde débité

**Livrable Phase 1** : 41 fichiers de test. Couverture cible : 40 % sur les modules financiers.

---

## Phase 2 — Modules académiques et données sensibles (Semaines 4-5)

> Protéger l'intégrité des données étudiantes et des notes.

### 2.1 Bulletins (7 fichiers estimés)

- [ ] `MoteurCalculService` — test calcul moyennes
- [ ] `CalculMoyenneUeService` — test calcul moyenne UE
- [ ] `CalculCompensationService` — test compensation entre matières
- [ ] `CalculRattrapageService` — test notes de rattrapage
- [ ] `GenerationBulletinService` — test génération bulletin
- [ ] `GestionDetteService` — test dette académique
- [ ] `GenerateurPVService` — test génération PV

### 2.2 Scolarite (6 fichiers estimés)

- [ ] `AutoSanctionService` — test déclenchement sanctions automatiques
- [ ] `SecretariatWorkflowService` — test workflow documents
- [ ] `DemandeDocumentPaiementService` — test paiement documents
- [ ] `SecretariatController` — dashboard secrétariat
- [ ] `ClotureCaisseController` — clôture caisse
- [ ] `RegistreAcademiqueController` — registre académique

### 2.3 Auth / Middlewares (6 fichiers estimés)

- [ ] `CheckPermission` — test vérification permissions
- [ ] `TenantScope` — test multi-tenancy
- [ ] `AuthEsacompta` — test auth ESA-COMPTA
- [ ] `AuthConfidentiality` — test confidentialité
- [ ] `InscriptionComplete` — test vérification inscription
- [ ] Route `POST /auth/login` — test intégration (JWT + OTP)

### 2.4 Ged (4 fichiers estimés)

- [ ] `FolderAutoService` — test création automatique dossiers
- [ ] `GedIntegrationService` — test archivage documents
- [ ] `DocumentGedController` — CRUD documents
- [ ] `FolderController` — CRUD dossiers

### 2.5 Frontend — Core

- [ ] `auth.guard.spec.ts` — test navigation (connecté → ok, déconnecté → redirect)
- [ ] `permission.guard.spec.ts` — test permissions (a le rôle → ok, pas le rôle → 403)
- [ ] `auth.service.spec.ts` — test login, token refresh, logout
- [ ] `error-interceptor.service.spec.ts` — test retry, redirection 401
- [ ] `has-permission.directive.spec.ts` — test affichage conditionnel

### 2.6 Frontend — Pages critiques

- [ ] `esacompta-bordereaux-page.component.spec.ts` — test soumission, auto-composition, erreurs
- [ ] `inscription-page.component.spec.ts` — test création session
- [ ] `configurations-bourses-page.component.spec.ts` — test CRUD configurations
- [ ] `attributions-bourses-page.component.spec.ts` — test attribution

**Livrable Phase 2** : 35 fichiers de test. Couverture cible : 60 % modules critiques, 20 % global.

---

## Phase 3 — E2E Cypress (Semaine 6)

> Valider les parcours utilisateurs critiques de bout en bout.

### 3.1 Setup Cypress

- [ ] Installer Cypress : `npm install --save-dev cypress`
- [ ] Configurer `cypress.config.ts` : base URL, timeouts, screenshots
- [ ] Créer `cypress/support/commands.ts` — commandes custom (login, seed data)
- [ ] Créer `cypress/support/e2e.ts` — imports globaux
- [ ] Créer fixtures Cypress : `cypress/fixtures/users.json` (identifiants de test)

### 3.2 Parcours e2e critiques

- [ ] `auth/login.cy.ts` — Login → Dashboard
      - Identifiants valides → redirection dashboard
      - Identifiants invalides → message d'erreur
      - OTP requis → affichage champ OTP
- [ ] `inscription/inscription-complete.cy.ts` — Inscription étudiant complète
      - Créer session → pré-inscrire → valider → payer
- [ ] `esa-compta/saisie-bordereau.cy.ts` — Saisie bordereau ESA-COMPTA
      - Sélectionner étudiant → choisir type → saisir montant → valider
      - Vérifier auto-composition MIXTE
- [ ] `notes/publication-notes.cy.ts` — Publication notes → Bulletin
      - Saisir notes → publier → consulter bulletin
- [ ] `bourses/campagne-bourse.cy.ts` — Workflow bourse
      - Créer campagne → sélectionner niveaux → attribuer → vérifier echeances

### 3.3 Intégration CI/CD

- [ ] Ajouter job `e2e` dans `.github/workflows/ci-cd.yml` (après build Docker)
- [ ] Utiliser `cypress run` en headless dans le pipeline
- [ ] Upload des screenshots en artifact en cas d'échec

**Livrable Phase 3** : 5 parcours e2e + integration CI.

---

## Phase 4 — Extension et maintien (Semaines 7+)

> Étendre la couverture aux modules restants et maintenir la qualité.

### 4.1 Modules moyenne criticité

- [ ] elearning (7 fichiers) — services, controllers, socket
- [ ] immobilisation (8 fichiers) — amortissement, ecritures
- [ ] stock (étendre les 6 existants) — mouvements, transferts
- [ ] parent (3 fichiers) — lecture données enfants
- [ ] reporting (5 fichiers) — requêtes agrégées
- [ ] marche (3 fichiers) — appels d'offres, contrats

### 4.2 Modules basse criticité

- [ ] communication (2 fichiers)
- [ ] stage (3 fichiers)
- [ ] etablissement (1 fichier)
- [ ] qualite (3 fichiers)

### 4.3 Maintenance

- [ ] Ajouter `test:coverage` au pipeline CI (afficher le % minimum requis)
- [ ] Configurer un seuil de couverture minimum (ex : 30 % global, 60 % modules financiers)
- [ ] Bloquer les PR si couverture diminue de plus de 2 %
- [ ] Documenter les conventions de test dans CONTRIBUTING.md

---

## Récapitulatif

| Phase | Semaine | Fichiers estimés | Effort (jours) |
|-------|---------|------------------|----------------|
| Phase 0 — Infrastructure | 1 | 3-5 | 2 |
| Phase 1 — Financiers | 2-3 | 41 | 10 |
| Phase 2 — Académiques | 4-5 | 35 | 7 |
| Phase 3 — E2E | 6 | 5 specs | 4 |
| Phase 4 — Extension | 7+ | ~30 | 5 |
| **TOTAL** | **7 semaines** | **~115 fichiers** | **~28 jours** |

---

## Dépendances techniques

| Dépendance | Impact | Action | Délai |
|-----------|--------|--------|-------|
| `supertest` absent | Impossible de tester les routes HTTP | `npm install supertest @types/supertest` | 5 min |
| `cypress` absent du package.json | e2e impossible en CI | `npm install cypress` | 5 min |
| Pas de `.env.test` | Tests échouent sans variables d'env | Créer le fichier | 30 min |
| Karma sans headless | `ng test` impossible en CI | Modifier karma.conf.js | 1h |
| `@faker-js/faker` absent | Données de test人工les et répétitives | `npm install @faker-js/faker` | 5 min |

---

## Conventions de test

### Backend (Jest)

```
src/__tests__/
  modules/
    <module>/
      <Controller>.test.ts       — tests unitaires controller
      <Service>.test.ts          — tests unitaires service
      <Route>.integration.test.ts — tests d'intégration HTTP (supertest)
  fixtures/
    fakeUser.ts
    fakeEleve.ts
    fakePaiement.ts
    fakeComptabilite.ts
  helpers/
    express-mocks.ts
    mockSequelizeModel.ts
    mockTransaction.ts
    mockEmailSender.ts
```

### Frontend (Jasmine/Karma)

```
src/app/
  features/modules/<module>/pages/<page>/
    <page>.component.ts
    <page>.component.spec.ts     — co-localisé avec le composant
  data/modules/<module>/services/
    <service>.service.ts
    <service>.service.spec.ts    — co-localisé avec le service
src/test-utils/
  test-bed.helper.ts
  http-spy.helper.ts
  mock-services.ts
```

### E2E (Cypress)

```
cypress/
  e2e/
    auth/
      login.cy.ts
    inscription/
      inscription-complete.cy.ts
    esa-compta/
      saisie-bordereau.cy.ts
    notes/
      publication-notes.cy.ts
    bourses/
      campagne-bourse.cy.ts
  fixtures/
    users.json
  support/
    commands.ts
    e2e.ts
```
