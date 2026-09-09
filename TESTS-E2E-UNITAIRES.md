# Tests E2E, tests unitaires et builds

Ce document décrit les commandes de validation du projet EasyEcole.

## Commande unique

Depuis la racine `D:\EasyEcole`, lancer :

```powershell
npm run test:all
```

Cette commande enchaîne les types et builds backend/frontend, les tests unitaires
Jest/Karma, Cypress et les scripts E2E backend. Elle continue après un échec afin
de produire un bilan complet. Le rapport horodaté est écrit dans `test-reports/`.

Prérequis : le backend doit écouter sur `http://localhost:3000` et le frontend sur
`http://localhost:4200` pour les tests E2E. Les variables JWT Cypress doivent être
définies si les specs authentifiées sont exécutées.

## 1. Prérequis

Ouvrir deux terminaux :

- frontend : `D:\EasyEcole\easy-ecole-web`
- backend : `D:\EasyEcole\easy-ecole-backend`

Installer les dépendances si nécessaire :

```powershell
cd D:\EasyEcole\easy-ecole-web
npm install

cd D:\EasyEcole\easy-ecole-backend
npm install
```

## 2. Démarrer l'application

### Backend

Depuis `easy-ecole-backend` :

```powershell
npm run start:server
```

Le backend écoute normalement sur `http://localhost:3000`.

Alternative avec le backend compilé :

```powershell
npm run build
npm start
```

Si le port `3000` est déjà utilisé, ne démarrez pas une seconde instance.

### Frontend

Depuis `easy-ecole-web` :

```powershell
npm start
```

Le frontend écoute normalement sur `http://localhost:4200`.

## 3. Tests E2E Cypress frontend

### Commande complète

```powershell
cd D:\EasyEcole\easy-ecole-web
npm run test:e2e
```

### Mode interactif

```powershell
npm run test:e2e:dev
```

La configuration se trouve dans [cypress.config.ts](easy-ecole-web/cypress.config.ts).

- URL frontend : `http://localhost:4200`
- pattern : `cypress/e2e/**/*.cy.ts`
- API backend attendue : `http://localhost:3000`

### Specs disponibles

#### Comptabilité

Fichier : [bilan-compte-resultat.cy.ts](easy-ecole-web/cypress/e2e/comptabilite/bilan-compte-resultat.cy.ts)

Vérifie :

- navigation entre les pages comptables ;
- présence des onglets Bilan, Compte de résultat, Exercices, Balance, Grand livre, Écritures et Plan comptable ;
- activation de l’onglet courant ;
- retour vers la page précédente.

Commande ciblée :

```powershell
npx cypress run --spec cypress/e2e/comptabilite/bilan-compte-resultat.cy.ts
```

#### Inscription, relevé et rattrapage

Fichier : [inscription-workflows.cy.ts](easy-ecole-web/cypress/e2e/inscription/inscription-workflows.cy.ts)

Vérifie :

- arborescence parcours, grade et filière ;
- sélection d’une session ;
- présence des documents requis ;
- upload des pièces ;
- affichage du relevé de notes ;
- affichage des demandes de rattrapage.

Cette spec nécessite un JWT apprenant dans `APPRENANT_TOKEN` :

```powershell
$env:APPRENANT_TOKEN = '<JWT_APPRENANT>'
npx cypress run --spec cypress/e2e/inscription/inscription-workflows.cy.ts
```

#### Smoke test des modules

Fichier : [module-smoke.cy.ts](easy-ecole-web/cypress/e2e/coverage/module-smoke.cy.ts)

Vérifie le chargement des routes racines de 26 modules, notamment :

- orientation ;
- inscription ;
- cours ;
- bulletins ;
- scolarité ;
- communication ;
- e-learning ;
- parent ;
- comptabilité ;
- achats ;
- stocks ;
- RH ;
- administration ;
- GED ;
- reporting ;
- surveillance.

Cette spec vérifie la route, le rôle, la redirection d’authentification et l’absence d’erreur Angular.

Elle nécessite un objet JSON de tokens par rôle :

```powershell
$env:E2E_TOKENS = '{"apprenant":"JWT","enseignant":"JWT","institution":"JWT","admin":"JWT","parent":"JWT","surveillant":"JWT"}'
npx cypress run --spec cypress/e2e/coverage/module-smoke.cy.ts
```

## 4. Tests E2E backend

Ces scripts appellent directement l’API backend sur `localhost:3000`. Le backend doit être démarré avant leur exécution.

### Première inscription

```powershell
node D:\EasyEcole\easy-ecole-web\tmp-e2e-inscription.cjs
```

Couvre la création de demande, le choix de parcours, les dossiers d’inscription, l’upload des pièces, le bordereau et la validation du flux.

### Notes et relevés S1/S2

```powershell
node D:\EasyEcole\easy-ecole-backend\e2e-notes-releve.cjs
```

Couvre :

- création ou récupération des listes de notes ;
- saisie des notes S1 et S2 ;
- rejet des notes invalides ;
- génération des bulletins ;
- publication des bulletins ;
- consultation du relevé étudiant.

### Workflow rattrapage

```powershell
node D:\EasyEcole\easy-ecole-backend\e2e-rattrapage-workflow.cjs
```

Vérifie :

- sessions ouvertes ;
- demandes étudiant ;
- pièces obligatoires ;
- validation de la demande ;
- bordereau et paiement ;
- complétude du dossier.

### Planning, volumes horaires et pointage

```powershell
node D:\EasyEcole\easy-ecole-backend\e2e-planning-volume-pointage.cjs
```

Vérifie :

- volumes horaires des UE ;
- heures des enseignants ;
- conflits de planning ;
- suivi des retards et absences ;
- publication de l’emploi du temps ;
- notifications enseignants et étudiants.

### Demandes de documents

```powershell
node D:\EasyEcole\easy-ecole-backend\e2e-demandes-documents.cjs
```

Vérifie :

- création d’une demande par un étudiant ;
- refus du traitement par un étudiant ;
- traitement par l’établissement ;
- génération du PDF ;
- disponibilité du document dans l’espace étudiant.

## 5. Tests unitaires frontend Angular

Le frontend utilise Jasmine, Karma et Angular Test.

### Tous les tests unitaires

```powershell
cd D:\EasyEcole\easy-ecole-web
npm test
```

La commande ouvre généralement Karma dans un navigateur Chrome.

### Exécution ciblée

```powershell
npx ng test --include="src/app/features/modules/cours/pages/liste-notes-page/liste-notes-page.component.spec.ts"
```

Autres exemples :

```powershell
npx ng test --include="src/app/core/guards/auth.guard.spec.ts"
npx ng test --include="src/app/features/modules/inscription/pages/liste-sessions-page/liste-sessions-page.component.spec.ts"
npx ng test --include="src/app/data/modules/inscription/services/seance.service.spec.ts"
```

Les tests unitaires frontend couvrent les composants, services, guards, interceptors, pipes et pages Angular.

## 6. Tests unitaires backend Jest

Le backend utilise Jest avec TypeScript.

### Tous les tests

```powershell
cd D:\EasyEcole\easy-ecole-backend
npm test
```

### Mode watch

```powershell
npm run test:watch
```

### Rapport de couverture

```powershell
npm run test:coverage
```

### Tests ciblés

```powershell
npx jest src/__tests__/modules/inscription/SeanceController.test.ts
npx jest src/__tests__/modules/inscription/RattrapageWorkflow.test.ts
npx jest src/__tests__/modules/inscription/PresenceController.test.ts
npx jest src/__tests__/modules/stock/ArticleController.test.ts
npx jest src/__tests__/modules/auth/AuthController.test.ts
```

Les tests backend couvrent principalement les contrôleurs d’authentification, inscription, planning, présence, rattrapage, stock, comptabilité et génération documentaire.

## 7. Validation TypeScript et builds

### Vérification des types backend

```powershell
cd D:\EasyEcole\easy-ecole-backend
npm run types
```

### Build backend

```powershell
npm run build
```

Résultat attendu : compilation Babel de l’ensemble des fichiers TypeScript backend.

### Build frontend

```powershell
cd D:\EasyEcole\easy-ecole-web
npm run build
```

Le build peut afficher des warnings de budget Angular sans être en échec. Une réussite doit afficher :

```text
Browser application bundle generation complete.
Copying assets complete.
Index html generation complete.
```

## 8. Lancer la validation principale

Ordre recommandé :

```powershell
# Terminal backend
cd D:\EasyEcole\easy-ecole-backend
npm run types
npm run build
npm run start:server
```

```powershell
# Terminal frontend
cd D:\EasyEcole\easy-ecole-web
npm run build
npm start
```

```powershell
# Terminal tests
cd D:\EasyEcole\easy-ecole-web
npm run test:e2e
```

Puis lancer les E2E backend :

```powershell
node D:\EasyEcole\easy-ecole-backend\e2e-demandes-documents.cjs
node D:\EasyEcole\easy-ecole-backend\e2e-planning-volume-pointage.cjs
node D:\EasyEcole\easy-ecole-backend\e2e-rattrapage-workflow.cjs
node D:\EasyEcole\easy-ecole-backend\e2e-notes-releve.cjs
```

## 9. Problèmes fréquents

### Port 3000 déjà utilisé

Ne pas démarrer une seconde instance backend. Vérifier le processus existant ou utiliser un autre port.

### Port 4200 déjà utilisé

Arrêter l’ancien serveur Angular ou modifier le port dans le script `start` et dans `cypress.config.ts`.

### Cypress non installé

```powershell
cd D:\EasyEcole\easy-ecole-web
npx cypress install
```

### Token E2E absent

Les specs Cypress authentifiées ne peuvent pas fonctionner sans JWT. Fournir `APPRENANT_TOKEN` ou `E2E_TOKENS` avant l’exécution.

### Build Angular avec warnings de budget

Un warning de budget n’est pas une erreur de compilation. Le build reste valide si Angular termine avec `Browser application bundle generation complete.`
