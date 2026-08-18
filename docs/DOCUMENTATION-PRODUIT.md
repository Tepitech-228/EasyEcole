# EasyEcole — Documentation Produit Complète

> Vue d'ensemble du produit et documentation détaillée de chaque module.
> Couvre l'intégralité du projet : backend (Express/Sequelize/MySQL) et frontend (Angular).

---

## Table des matières

1. [Présentation du produit](#1-présentation-du-produit)
2. [Vue d'ensemble des pôles](#2-vue-densemble-des-pôles)
3. [Architecture technique](#3-architecture-technique)
4. [Démarrage rapide](#4-démarrage-rapide)
5. [Scripts utiles](#5-scripts-utiles)
6. [Authentification, rôles et permissions](#6-authentification-rôles-et-permissions)
7. [Documentation par module](#7-documentation-par-module)
8. [Parcours métier de bout en bout](#8-parcours-métier-de-bout-en-bout)
9. [Base de données](#9-base-de-données)
10. [Comptes de démonstration](#10-comptes-de-démonstration)
11. [Documents de référence](#11-documents-de-référence)

---

## 1. Présentation du produit

**EasyEcole** est une plateforme de gestion scolaire/universitaire (« ERP établissement ») qui digitalise l'ensemble des processus d'un établissement d'enseignement supérieur ou secondaire : de l'orientation des futurs étudiants jusqu'à la délivrance des diplômes, en passant par la scolarité, la pédagogie, les finances, les ressources humaines, la gestion des stocks et du patrimoine, la qualité, la communication et l'archivage numérique.

### Objectifs du produit
- **Digitaliser de bout en bout** la vie de l'établissement (admission → inscription → cours → évaluation → diplomation).
- **Unifier** les données métier dans une base unique cohérente (~280 tables).
- **Sécuriser les flux financiers** : bordereaux de paiement, encaissements, rapprochement bancaire, Mobile Money (CinetPay).
- **Moderniser l'apprentissage** : e-learning (cours en ligne, quiz, devoirs, chat temps réel), génération de documents officiels, archivage GED avec confidentialité par rôle.
- **Se préparer à la certification ISO 21001** (management des organismes éducatifs) : gestion qualité, audits, revues de direction, enquêtes de satisfaction.
- **Multi-publics** : direction, scolarité, comptabilité, RH, enseignants, apprenants, parents, comité d'orientation, caissiers, cabinet comptable.

### Publics utilisateurs (rôles applicatifs)
`admin` (super administrateur), `institution` (direction), `enseignant`, `apprenant`, `ressources_humaines`, `caissier_banque`, `cabinet_comptable`, `comite_orientation`, `parent`.

---

## 2. Vue d'ensemble des pôles

| Pôle | Modules backend | Frontend (features/modules) | Doc dédiée |
|------|-----------------|-----------------------------|------------|
| **Pédagogique** | inscription, orientation, bulletins, scolarite, stage, etablissement | inscription, orientation, cours, bulletins, scolarite, stages | [01-PEDAGOGIQUE.md](01-PEDAGOGIQUE.md) |
| **Financier** | comptabilite, achats, stock, immobilisation | comptabilite, achats, stocks, immobilisations | [02-FINANCIER.md](02-FINANCIER.md) |
| **Ressources Humaines** | rh | rh, pointage | [03-RH.md](03-RH.md) |
| **Communication** | communication | communication | [04-COMMUNICATION.md](04-COMMUNICATION.md) |
| **Archivage (GED)** | ged | ged | [05-GED.md](05-GED.md) |
| **E-Learning** | elearning | elearning | [06-ELEARNING.md](06-ELEARNING.md) |
| **Espace Parents** | parent | parent | [07-PARENTS.md](07-PARENTS.md) |
| **Administration & Système** | auth, menu, reporting | administration, parametres, reporting | [08-ADMIN.md](08-ADMIN.md) |
| **Gestion documentaire** | docgen | docgen | [09-DOCGEN.md](09-DOCGEN.md) |
| **Qualité** | qualite | qualite | [11-GAPS-ISO.md](11-GAPS-ISO.md) |
| **Marchés publics** | marche | marche | — |
| **Multi-établissement** | etablissement | — | — |

Fichiers liés : [LIAISONS-TABLES-BDD.md](LIAISONS-TABLES-BDD.md) (relations entre toutes les tables), [../ARCHITECTURE.md](../ARCHITECTURE.md) (pages, routes et APIs), [../API_ENDPOINTS.md](../API_ENDPOINTS.md) (liste des endpoints).

---

## 3. Architecture technique

### Stack
| Couche | Technologie | Détails |
|--------|-------------|---------|
| Backend | **Node.js + Express 4 + TypeScript 5** | API REST, montage des routes dans `src/routes.ts`, port **3000** (`PORT` dans `.env`) |
| ORM | **Sequelize 6 + mysql2** | Base **MySQL** `easyecole` (config `src/core/config/sequelize.json`, port 3307 en dev) |
| Auth | **JWT** (jsonwebtoken) + **bcrypt** | Middlewares `Authenticate`, `Authorize`, `InscriptionComplete` dans `src/core/middlewares` |
| Frontend | **Angular 12.2** + Tailwind CSS + Angular Material | Port **4200**, modules `core/`, `data/`, `shared/`, `features/` |
| Temps réel | **Socket.IO** + **SSE** | Chat e-learning (Socket.IO), flux d'événements `/events` (SSE) |
| Intégrations | CinetPay (Mobile Money), Nodemailer (email), node-cron (rappel salles et échéances) | |
| Génération | pdfkit + puppeteer (PDF), exceljs (Excel), docx (Word), qrcode (QR codes) | Cartes étudiant, bulletins, PV, courriers… |
| Sécurité | helmet (CSP), CORS (origine configurable via `CORS_ORIGIN`, requis), express-rate-limit | |
| API Doc | Swagger (`src/core/swagger`) | |

### Organisation du backend (`easy-ecole-backend/src/`)
```
src/
├── app.ts                     # Point d'entrée : middlewares, routes, Socket.IO, cron, seeds de démarrage
├── routes.ts                  # Montage de toutes les routes modulaires
├── core/
│   ├── config/                # sequelize.json, constantes
│   ├── enums/                 # TypesEvaluation, PeriodesEvaluation, RolesUtilisateur…
│   ├── helpers/               # DatabaseConnection, IDGenerator, EmailSender, MobileMoneyCinetpay…
│   ├── middlewares/           # Authenticate, Authorize, ErrorHandler, upload…
│   ├── models/                # Modèle Sequelize de base
│   ├── scripts/               # seed.ts, seed-accounts.ts, sync-database.ts, reset-database.ts…
│   ├── services/              # RappelSalleCron, RappelEcheanceCron…
│   └── swagger/               # Spécification Swagger
└── modules/<module>/
    ├── models/                # 1 fichier TS par table + _associations.ts (FK, alias, relations)
    ├── controllers/           # Logique HTTP
    ├── routers/               # Définition des routes (ou <Module>Routes.ts à la racine du module)
    ├── services/              # Logique métier complexe (calculs, génération…)
    ├── validators/            # Validation des entrées
    ├── enums/                 # Enums propres au module
    └── seed.ts                # Seed autonome du module (script npm dédié)
```

> Conventions importantes : chaque module expose ses modèles via `models/_associations.ts` ; les relations
> entre modules (ex. `ins_` vers `aut_`, `ged_` vers `aut_`) sont déclarées dans le module qui possède la clé
> étrangère. Détail complet dans [LIAISONS-TABLES-BDD.md](LIAISONS-TABLES-BDD.md).

### Organisation du frontend (`easy-ecole-web/src/app/`)
```
src/app/
├── core/        # Services transverses, guards, interceptors, configuration Angular
├── data/        # Modèles de données (DTO), services d'accès API
├── shared/      # Composants réutilisables, pipes, directives
└── features/
    ├── layout/              # Shell applicatif (sidebar, header…)
    ├── pages/               # Pages hors modules (accueil…)
    └── modules/             # 23 domaines : achats, administration, auth, bulletins, communication,
                             # comptabilite, cours, docgen, elearning, ged, immobilisations, inscription,
                             # marche, orientation, parametres, parent, pointage, qualite, reporting,
                             # rh, scolarite, stages, stocks
```

---

## 4. Démarrage rapide

1. **Prérequis** : Node.js, MySQL (config `src/core/config/sequelize.json`) ; la base `easyecole` est créée via `db:create`.
2. **Variables d'environnement** (backend, fichier `.env`) :
   - `CORS_ORIGIN` **requis** (ex. `http://localhost:4200`) sinon le serveur refuse de démarrer ;
   - `PORT` (défaut 3000), variables BDD, `JWT_SECRET`… (voir `src/core/config`).
3. **Installer** : `npm install` (racine), puis dans `easy-ecole-backend` et `easy-ecole-web`.
4. **Initialiser la base** :
   ```
   npm run db:setup --prefix easy-ecole-backend   # reset + sync (recrée toutes les tables)
   npm run db:seed  --prefix easy-ecole-backend   # seed complet de démonstration
   ```
5. **Lancer tout le projet** (backend + frontend) depuis la racine : `npm run dev`.
   Backend : http://localhost:3000 (Swagger : http://localhost:3000/swagger) · Frontend : http://localhost:4200.
6. **Comptes de démo** : voir [section 10](#10-comptes-de-démonstration).

---

## 5. Scripts utiles

### Backend (`easy-ecole-backend/package.json`)
| Script | Commande | Rôle |
|--------|----------|------|
| `dev` | `nodemon src/app.ts` | Serveur en mode développement |
| `start:server` | `ts-node src/app.ts` | Serveur (TypeScript direct) |
| `types` / `build` | `tsc` / `babel` | Typage / compilation |
| `db:create` / `db:sync` | `ts-node src/core/scripts/sync-database.ts` | Création/synchronisation des tables |
| `db:seed` | `ts-node src/core/scripts/seed.ts` | Seed complet (force, recrée les tables) |
| `db:reset` / `db:setup` | `ts-node src/core/scripts/reset-database.ts` | Reset complet de la base |
| `db:seed-accounts` | `ts-node src/core/scripts/seed-accounts.ts` | Comptes de démonstration |
| `db:seed-bulletins` / `db:seed-esa` / `db:seed-chat` | scripts ciblés | Données spécifiques bulletins / ESA / chat |
| `db:seed-ged` / `db:seed-ged-demo` / `db:seed-ged-full` | `src/modules/ged/seed.ts` et démos | Socle GED + démos |
| `db:seed-docgen` | `src/modules/docgen/seed/seed.ts` | Types et templates de documents |
| `db:sync-reporting` | `ts-node src/core/scripts/sync-reporting.ts` | Vue de reporting (à exécuter après le seed) |
| `test` | jest | Tests unitaires |

### Racine du projet
- `npm run dev` — backend + frontend en parallèle (concurrently).
- `npm run backend` / `npm run frontend` — lance une seule des deux parties.

---

## 6. Authentification, rôles et permissions

### Authentification
- **JWT** (access + refresh), mots de passe **bcrypt**.
- Middlewares appliqués sur les routes : `Authenticate` (vérifie le token), `Authorize(roles...)` (vérifie le rôle applicatif), `InscriptionComplete` (contexte de session d'inscription).

### Deux niveaux de permissions
1. **Rôle applicatif** — champ `role` sur `AutUtilisateur` :
   `admin`, `institution`, `enseignant`, `apprenant`, `ressources_humaines`, `caissier_banque`, `cabinet_comptable`, `comite_orientation`, `parent`.
2. **RBAC fin (menu + actions)** — tables `aut_roles`, `aut_permissions`, `aut_role_permissions`, `aut_user_roles` :
   - Seed au démarrage : `RoleSeed` (rôles Super Admin, Directeur, Comptable, Enseignant, Apprenant, Parent, Surveillant, Bibliothécaire) et `PermissionSeed` ;
   - Permissions de type `menu.<domaine>.<page>` (ex. `menu.inscription.sessions`) et `action.<module>.<entité>.<opération>` (ex. `action.inscription.demande.valider`) ;
   - Le **menu** frontend est piloté par ces permissions (module `menu`).

---

## 7. Documentation par module

> Chaque module : rôle produit, fonctionnalités, tables (préfixe), API, pages frontend, interdépendances.

### 7.1 Auth & Utilisateurs — `auth` (préfixe `aut_`)

**Rôle** : référentiel central des utilisateurs et de la sécurité.

- **Fonctionnalités** : comptes et profils par type d'acteur (institution, enseignant, apprenant, caissier, banque, comité d'orientation), adresses, rôles et permissions RBAC, connexion JWT, gestion des mots de passe (bcrypt).
- **Tables principales** : `aut_utilisateurs`, `aut_institutions`, `aut_enseignants`, `aut_apprenants`, `aut_caissiers_banque`, `aut_banques`, `aut_comites_orientation`, `aut_adresses_*`, `aut_roles`, `aut_permissions`, `aut_role_permissions`, `aut_user_roles`, `aut_user_permissions`.
- **API** : `/auth` (login, refresh, profil…).
- **Dépendances** : référencé par pratiquement tous les modules (`utilisateurId`, `createdBy`, `validePar`…).

### 7.2 Établissement — `etablissement` (préfixe `eta_`)

**Rôle** : identité de l'établissement (multi-établissement).

- **Fonctionnalités** : création et configuration de l'établissement (nom, code, type, pays, ville, devise, actif).
- **Tables principales** : `eta_etablissements`.
- **API** : `/etablissements`.
- **Dépendances** : référence cible de `etablissementId` dans de nombreuses tables (`aut_utilisateurs`, cours, classes, parcours, sessions, demandes, cursus…).

### 7.3 Orientation — `orientation` (préfixe `ori_`)

**Rôle** : accompagnement des candidats avant l'inscription.

- **Fonctionnalités** : demandes d'orientation, catalogue de parcours conseillés, catégories et niveaux d'étude, matières prérequises, débouchés, prérequis par parcours, parcours choisis et panier, réponses d'orientation.
- **Tables principales** : `ori_demandes`, `ori_parcours`, `ori_categories`, `ori_niveaux_etude`, `ori_matieres_prerequis`, `ori_prerequis_parcours`, `ori_debouches`, `ori_parcours_choisis`, `ori_paniers`, `ori_reponses`.
- **API** : `/orientation`.
- **Pages frontend** : `features/modules/orientation` (demandes, parcours).

### 7.4 Inscription & Pédagogie — `inscription` (préfixe `ins_`) ⭐ module central

**Rôle** : cœur pédagogique et administratif — le plus gros module du produit.

- **Fonctionnalités** :
  - *Cadre* : sessions/années académiques, parcours de formation, salles de classe, emplois du temps, semestres académiques ;
  - *Catalogue* : cours/unités d'enseignement (UE), MCC (modalités de contrôle des connaissances), règles d'évaluation, sessions d'examen ;
  - *Inscription* : demandes d'inscription (avec pièces justificatives via dossiers), préinscriptions, cursus apprenants, étapes d'inscription, quitus, cartes et effectifs ;
  - *Financier étudiant* : frais par parcours, échéances, bordereaux de paiement, validation des bordereaux ;
  - *Évaluation* : notes (évaluations), absences, équivalences et dispenses, publications de notes, délibérations ;
- **Tables principales** : `ins_sessions`, `ins_parcours`, `ins_classes`, `ins_cours`, `ins_mcc`, `ins_regles_evaluation`, `ins_emplois_du_temps`, `ins_salles`, `ins_semestres_academiques`, `ins_demandes`, `ins_dossiers_demandes`, `ins_preinscriptions`, `ins_cursus`, `ins_etapes_inscription`, `ins_quitus`, `ins_frais_parcours`, `ins_echeances`, `ins_bordereaux`, `ins_notes_evaluation`, `ins_absences`, `ins_equivalences`, `ins_dispenses`, `ins_publications_notes`, `ins_deliberations`, `ins_sessions_examens`, `ins_rattrapages…` (+ tables de liaison `ins_cours_choisis`).
- **API** : `/inscription` (sessions, parcours, salles, frais-parcours, demandes, effectifs, bordereaux, validation-bordereaux, dossiers, hierarchy, publications-notes… — contient aussi les routes **bulletins**, voir 7.6).
- **Pages frontend** : `features/modules/inscription` + `features/modules/cours` (emplois du temps, enseignants, UE, cahiers de texte, présences, notes).
- **Dépendances** : `aut_*` (acteurs), `ori_*` (prérequis), `eta_etablissements`, alimente `bulletins`, `scolarite`, `reporting`.

### 7.5 Scolarité — `scolarite` (préfixe `sco_`)

**Rôle** : vie administrative et disciplinaire des apprenants après l'inscription.

- **Fonctionnalités** : demandes de documents (certificats, attestations…), registres académiques, réclamations, sanctions académiques et disciplinaires, conseils de classe, décisions de passage, demandes de réorientation, calendrier d'événements, diplômes, VAE (validation des acquis), progression pédagogique, bibliothèque (livres).
- **Tables principales** : `sco_demandes_documents`, `sco_registres_academiques`, `sco_reclamations`, `sco_sanctions_discipline`, `sco_sanctions_academiques`, `sco_conseils_classe`, `sco_decisions_passage`, `sco_demandes_reorientation`, `sco_evenements_calendrier`, `sco_diplomes`, `sco_demandes_vae`, `sco_progressions_pedagogiques`, `sco_livres`.
- **API** : `/scolarite` (registres, reorientation, reclamations, calendrier, decisions-passage, sanctions, conseils…).
- **Pages frontend** : `features/modules/scolarite`.

### 7.6 Bulletins & Délibérations — `bulletins` (préfixe `ins_`)

**Rôle** : évaluation finale et décisions de jury. *Le module n'a pas de préfixe propre : ses tables utilisent `ins_` (constante `TABLE_PREFIX = 'ins_'` dans `Bulletin.ts`).*

- **Fonctionnalités** : génération des bulletins, calcul des moyennes par UE (services `CalculMoyenneUeService`, `MoteurCalculService`, compensation, rattrapage), échelles de notes, audits des notes (journal), délibérations et résultats, jury (membres), passation, suivi des UE, gestion des dettes académiques, historique des décisions, génération de PV.
- **Tables principales** : `ins_bulletins`, `ins_lignes_bulletins`, `ins_deliberations`, `ins_resultats_deliberation`, `ins_jury_membres`, `ins_echelles_notes`, `ins_audit_notes`, `ins_passations`, `ins_suivis_ue`, `ins_dettes_academiques`, `ins_historiques_decisions`.
- **API** : montées sous `/inscription` (via `BulletinRouter` : bulletins, moyennes, audit-notes, parametres-notation, deliberations-jury, absences…) et `/publications-notes`.
- **Pages frontend** : `features/modules/bulletins`.
- **Dépendances** : `ins_*` (cours, MCC, notes), `aut_*` (enseignants, jury), `scolarite` (conseils).

### 7.7 Stages — `stage` (préfixe `stg_`)

**Rôle** : gestion des stages en entreprise (conventions).

- **Fonctionnalités** : offres de stage, demandes et candidatures, conventions de stage (avec organismes), affectations/participations aux sessions de stage.
- **Tables principales** : `stg_offres`, `stg_demandes`, `stg_conventions`, `stg_sessions`, `stg_participations…`.
- **API** : `/stages`.
- **Pages frontend** : `features/modules/stages`.

### 7.8 Ressources Humaines — `rh` (préfixe `rh_`)

**Rôle** : gestion du personnel de l'établissement.

- **Fonctionnalités** : employés (profils liés à `aut_utilisateurs`), catégories professionnelles, grilles salariales, contrats (génériques et contrats enseignants), planification du personnel, heures supplémentaires, prêts et remboursements, prestataires et indemnités, demandes de congés et soldes, périodes de paie, bulletins de paie (avec lignes), pointage.
- **Tables principales** : `rh_employes`, `rh_categories_professionnelles`, `rh_grilles_salariales`, `rh_contrats`, `rh_contrats_enseignant`, `rh_plannings_personnel`, `rh_heures_supplementaires`, `rh_prets`, `rh_remboursements_pret`, `rh_prestataires`, `rh_indemnites_prestataire`, `rh_demandes_conge`, `rh_soldes_conge`, `rh_periodes_paie`, `rh_bulletins_paie`, `rh_lignes_bulletin`, `rh_pointages…`.
- **API** : `/rh` (employes, paie, lignes-bulletin…).
- **Pages frontend** : `features/modules/rh` + `features/modules/pointage`.

### 7.9 Comptabilité & Finances — `comptabilite` (préfixe `cpt_`)

**Rôle** : comptabilité générale et suivi des frais étudiants (double référentiel avec `ins_` pour les frais).

- **Fonctionnalités** : plan comptable (comptes), exercices comptables, écritures et journaux comptables, rapprochement bancaire, comptes bancaires et relevés (avec lignes), paramètres de frais, frais par parcours, réductions de frais, pénalités de retard, lignes de frais par étudiant, états financiers, dashboard comptable. Un seed de démarrage (`seedComptabilite`, `seedParametresFrais`) alimente le socle au lancement de l'API.
- **Tables principales** : `cpt_comptes`, `cpt_exercices`, `cpt_ecritures`, `cpt_journaux`, `cpt_rapprochements`, `cpt_comptes_bancaires`, `cpt_releves_bancaires`, `cpt_lignes_releve`, `cpt_parametres_frais`, `cpt_frais_parcours`, `cpt_reductions_frais`, `cpt_penalites_retard`, `cpt_lignes_frais_etudiant`, `cpt_etats_financiers…`.
- **API** : `/comptabilite`.
- **Pages frontend** : `features/modules/comptabilite`.
- **Dépendances** : `ins_*` (frais, paiements), `aut_*` (caissiers, banques), `achats`/`stock` (factures fournisseurs).

### 7.10 Achats — `achats` (préfixe `ach_`)

**Rôle** : cycle d'achat avec workflow de validation à plusieurs niveaux.

- **Fonctionnalités** : demandes d'achat, catégories d'achat, budgets, engagements, commandes, réceptions, factures proforma des fournisseurs et validation à étapes (`ach_validations`), fournisseurs.
- **Tables principales** : `ach_demandes`, `ach_categories`, `ach_budgets`, `ach_engagements`, `ach_commandes`, `ach_receptions`, `ach_factures_proforma`, `ach_validations`, `ach_fournisseurs…`.
- **API** : `/achats`.
- **Pages frontend** : `features/modules/achats`.
- **Dépendances** : `stk_*` (articles), `stock` (bon de commande), `comptabilite` (paiement), `ged` (archivage factures).

### 7.11 Stock — `stock` (préfixe `stk_`)

**Rôle** : gestion des articles, mouvements et inventaires.

- **Fonctionnalités** : articles (avec emprise site/salle), catégories d'articles, sites, mouvements d'entrée/sortie, corrections de stock, besoins et demandes de prix fournisseurs, bons de commande (avec lignes), inventaires (avec lignes et écarts), rebuts, transferts entre sites, fournisseurs.
- **Tables principales** : `stk_articles`, `stk_categories_article`, `stk_sites`, `stk_mouvements`, `stk_corrections`, `stk_besoins`, `stk_demandes_prix`, `stk_bons_commande`, `stk_lignes_bon_commande`, `stk_inventaires`, `stk_lignes_inventaire`, `stk_rebuts`, `stk_transferts`, `stk_fournisseurs`.
- **API** : `/stocks`.
- **Pages frontend** : `features/modules/stocks`.
- **Dépendances** : `achats`, `immobilisation` (sites, salles), `ged` (bons de commande archivés).

### 7.12 Immobilisations & Patrimoine — `immobilisation` (préfixe `imm_`)

**Rôle** : gestion du patrimoine physique de l'établissement.

- **Fonctionnalités** : immobilisations (avec QR code), catégories (durée de vie, mode d'amortissement), sites, bâtiments, localisations et départements, acquisitions, amortissements, maintenances (correctives et programmées), affectations, sorties provisoires, cessions/rebuts, assurances, inventaires (avec lignes et états), reporting patrimoine.
- **Tables principales** : `imm_immobilisations`, `imm_categories`, `imm_sites`, `imm_batiments`, `imm_localisations`, `imm_departements`, `imm_acquisitions`, `imm_amortissements`, `imm_maintenances`, `imm_maintenances_programmees`, `imm_affectations`, `imm_sorties_provisoires`, `imm_cessions`, `imm_rebuts`, `imm_assurances`, `imm_inventaires`, `imm_lignes_inventaire`.
- **API** : `/immobilisations`.
- **Pages frontend** : `features/modules/immobilisations`.
- **Dépendances** : `stock` (sites), `ged` (inventaires archivés).

### 7.13 Marchés publics — `marche` (préfixe `mar_`)

**Rôle** : pilotage des marchés publics de l'établissement.

- **Fonctionnalités** : planifications de marchés, manifestations d'intérêt, appels d'offres, contrats de marché, avenants.
- **Tables principales** : `mar_planifications`, `mar_manifestations_interet`, `mar_appels_offre`, `mar_contrats`, `mar_avenants`.
- **API** : `/marche`.
- **Pages frontend** : `features/modules/marche`.
- **Dépendances** : `achats`/`stock`/`immobilisation` (objets des marchés).

### 7.14 Communication — `communication` (préfixe `com_`)

**Rôle** : vie étudiante et communication interne.

- **Fonctionnalités** : messagerie, actualités/annonces, suggestions et réclamations (avec réponses), communications générales.
- **Tables principales** : `com_messages`, `com_actualites`, `com_suggestions`, `com_reponses_suggestion`, `com_communications…`.
- **API** : `/communication`.
- **Pages frontend** : `features/modules/communication`.
- **Dépendances** : `aut_utilisateurs` (expéditeurs/destinataires).

### 7.15 GED — Archivage numérique — `ged` (préfixe `ged_`)

**Rôle** : archivage, classification et sécurisation des documents.

- **Fonctionnalités** : dossiers arborescents (avec `parentId`), documents (avec versionnement `parentDocumentId`), domaines documentaires, types documentaires (confidentialité par défaut, durée d'utilité administrative), tags, permissions de confidentialité par rôle (public/interne/restreint/confidentiel), processus générateurs (paie, factures, bons de commande…), courriers, destructions (élimination), notifications, contrôle d'intégrité, configuration de stockage, sessions GED, dashboard, arborescence académique.
- **Tables principales** : `ged_folders`, `ged_documents`, `ged_domaines`, `ged_types_document`, `ged_tags`, `ged_document_tags`, `ged_role_permissions`, `ged_processus_generateurs`, `ged_courriers`, `ged_destructions`, `ged_storage_configs…`.
- **API** : `/ged` (folders, documents, domains, document-types, tags, role-permissions, processus, courriers, disposal, integrity, storage-config, sessions, dashboard…).
- **Pages frontend** : `features/modules/ged`.
- **Seeds** : `db:seed-ged` (socle), `db:seed-ged-demo`, `db:seed-ged-full` (démos).
- **Dépendances** : `aut_utilisateurs` (créateurs, permissions), tous les modules (documents métier archivés).

### 7.16 Gestion documentaire — `docgen` (préfixe `docgen_`)

**Rôle** : génération et vérification de documents officiels.

- **Fonctionnalités** : catalogue de types de documents (admissions ADM001…, inscriptions INS001…, scolarité SCO…, examens EXM…, notes NOT…, etc.), templates de documents (Word/PDF), génération de documents (avec références et matricules), signatures électroniques, workflows de validation, cachets, **vérification publique d'un document par matricule + référence**.
- **Tables principales** : `docgen_types`, `docgen_templates`, `docgen_documents`, `docgen_signatures`, `docgen_workflows`, `docgen_references`, `docgen_cachets`.
- **API** : `/docgen` + endpoint public `GET /verification/document/:matricule/:reference`.
- **Pages frontend** : `features/modules/docgen`.
- **Seeds** : `db:seed-docgen` (types + templates).
- **Dépendances** : `aut_*` (signataires), `ins_*` (étudiants, cursus).

### 7.17 E-Learning — `elearning` (préfixe `elearning_`)

**Rôle** : plateforme de formation en ligne intégrée.

- **Fonctionnalités** : cours en ligne (liés aux cours du cursus), modules et supports (PDF/vidéo, avec compression), quiz et réponses, devoirs et soumissions, salons de discussion temps réel (chat Socket.IO), messages, notifications, commentaires sur supports, progression par apprenant, certificats, arborescence pédagogique, envoi de courriels/liens de partage, flux SSE.
- **Tables principales** : `elearning_cours`, `elearning_modules`, `elearning_supports`, `elearning_quiz`, `elearning_reponses_quiz`, `elearning_devoirs`, `elearning_soumissions`, `elearning_salons`, `elearning_participants`, `elearning_messages`, `elearning_notifications`, `elearning_commentaires`, `elearning_progressions`, `elearning_certificats`, `elearning_mails`.
- **API** : `/elearning` + `/events` (SSE) + Socket.IO (chat).
- **Pages frontend** : `features/modules/elearning`.
- **Dépendances** : `ins_cours` (cours référents), `aut_utilisateurs` (apprenants, enseignants). Note : les FK `coursId`, `createdById`, `utilisateurId` sont déclarées sans contrainte (`constraints: false`).

### 7.18 Qualité — `qualite` (préfixe `qua_`)

**Rôle** : système de management de la qualité (préparation ISO 21001).

- **Fonctionnalités** : non-conformités, actions correctives, audits (avec pistes), revues de direction (avec décisions), enquêtes de satisfaction (avec réponses).
- **Tables principales** : `qua_non_conformites`, `qua_actions_correctives`, `qua_audits`, `qua_audit_pistes`, `qua_revues_direction`, `qua_decisions_revue`, `qua_enquetes_satisfaction`, `qua_reponses_satisfaction`.
- **API** : `/qualite`.
- **Pages frontend** : `features/modules/qualite`.
- **Dépendances** : `aut_utilisateurs` (auditeurs, décideurs, répondants).

### 7.19 Espace Parents — `parent` (préfixe `par_`)

**Rôle** : espace dédié aux parents d'apprenants.

- **Fonctionnalités** : lien parent ↔ enfant(s) (`par_parents_enfants`), suivi de la scolarité de l'enfant (notes, absences, paiements — via lectures sur les modules pédagogiques).
- **Tables principales** : `par_parents_enfants`.
- **API** : `/parent`.
- **Pages frontend** : `features/modules/parent`.
- **Dépendances** : `aut_utilisateurs` (parent et apprenant liés).

### 7.20 Reporting — `reporting`

**Rôle** : tableaux de bord et vues de synthèse pour la direction.

- **Fonctionnalités** : vues de reporting matérialisées (effectifs, notes, paiements), dashboards par pôle. Les vues sont créées via `db:sync-reporting` **après** le seed.
- **API** : `/reporting`.
- **Pages frontend** : `features/modules/reporting`.
- **Dépendances** : lecture sur `ins_*`, `aut_*`, `cpt_*`…

### 7.21 Menu & Configuration — `menu`

**Rôle** : menu applicatif piloté par les permissions RBAC.

- **Fonctionnalités** : construction dynamique du menu selon les droits du rôle (`menu.*`), configuration frontend.
- **API** : `/menu`.
- **Dépendances** : `aut_*` (permissions).

---

## 8. Parcours métier de bout en bout

### 8.1 Cycle de vie d'un étudiant
1. **Orientation** : le candidat dépose une demande d'orientation (`ori_`), choix de parcours selon les prérequis (`ori_prerequis_parcours`).
2. **Inscription** : demande avec dossier et pièces (`ins_demandes`, `ins_dossiers_demandes`) → préinscription (`ins_preinscriptions`) → frais et échéances (`ins_frais_parcours`, `ins_echeances`).
3. **Paiement** : génération du bordereau (`ins_bordereaux`) → encaissement (espèces ou Mobile Money CinetPay) → validation comptable → validation du bordereau.
4. **Intégration** : affectation aux classes/sessions (`ins_classes`, `ins_sessions`), création du cursus (`ins_cursus`) et rattachement aux cours (UE) + MCC (`ins_cours`, `ins_mcc`).
5. **Cours & évaluations** : emplois du temps, présences, absences, notes (`ins_notes_evaluation`), équivalences/dispenses éventuelles.
6. **Bulletin** : calcul des moyennes par UE → bulletin (`ins_bulletins`) → délibération de jury → décision de passage / rattrapage (services bulletins + `scolarite`).
7. **Diplomation** : quitus (`ins_quitus`), publications de notes, certificats/diplômes (`scolarite`, `docgen`), archivage au GED, vérification publique d'authenticité (`/verification/document/:matricule/:reference`).

### 8.2 Cycle fournisseur & patrimoine
- **Besoin** (`stk_besoins`) → **demande d'achat** (`ach_demandes`) → **budget/engagement** (`ach_budgets`, `ach_engagements`) → **commande** (`stk_bons_commande`/`ach_commandes`) → **réception** (`ach_receptions`) → **facture proforma + validation multi-étapes** (`ach_factures_proforma`, `ach_validations`) → **paiement comptabilité** (`cpt_*`) → **archivage GED**.
- **Marchés publics** : planification → manifestation d'intérêt → appel d'offres → contrat → avenants (`mar_*`).
- **Patrimoine** : acquisition → amortissement → affectation → maintenance (programmée/corrective) → assurance → inventaire → sortie provisoire / cession / rebut (`imm_*`).

### 8.3 Cycles RH & Qualité
- **RH** : recrutement → contrat (`rh_contrats`, `rh_contrats_enseignant`) → planning/heures supplémentaires → paie (périodes, bulletins avec lignes) → congés (demandes + soldes) → prêts/remboursements → prestataires.
- **Qualité** : non-conformité → action corrective → audit (avec pistes) → revue de direction → décisions ; enquêtes de satisfaction → réponses (boucle ISO 21001).

---

## 9. Base de données

- **SGBD** : MySQL (Sequelize 6, `mysql2`), base `easyecole`, config `src/core/config/sequelize.json`.
- **Volume** : ~280 tables. Un fichier modèle TS par table, relations déclarées dans `models/_associations.ts` de chaque module.
- **Conventions de préfixes** :

| Préfixe | Module | Préfixe | Module |
|---------|--------|---------|--------|
| `aut_` | auth | `stk_` | stock |
| `eta_` | etablissement | `imm_` | immobilisation |
| `ori_` | orientation | `mar_` | marche |
| `ins_` | inscription **et bulletins** | `com_` | communication |
| `sco_` | scolarite | `ged_` | ged |
| `stg_` | stage | `docgen_` | docgen |
| `rh_` | rh | `elearning_` | elearning |
| `cpt_` | comptabilite | `qua_` | qualite |
| `ach_` | achats | `par_` | parent |
| `reporting_` | reporting (vues) | `menu_` | menu (config) |

- **Tables de liaison (many-to-many)** : ex. `aut_role_permissions`, `aut_user_roles`, `aut_user_permissions`, `ins_cours_choisis`, `ins_dossiers_demandes`, `ged_document_tags`.
- **Particularités** : les tables dessertes par le module `bulletins` utilisent le préfixe `ins_` ; certains noms de modèles existent en double (FraisParcours, ReductionFrais, PenaliteRetard dans `ins_` et `cpt_`) ; le module `elearning` déclare ses FK sans contraintes réelles (`constraints: false`).
- **Référence complète** : voir [LIAISONS-TABLES-BDD.md](LIAISONS-TABLES-BDD.md) — relations détaillées table par table, dépendances inter-modules et ordre de peuplement.

---

## 10. Comptes de démonstration

Le script `db:seed-accounts` (`src/core/scripts/seed-accounts.ts`) crée des comptes types ; références :

| Identifiant | Rôle | Mot de passe (exemple) |
|-------------|------|------------------------|
| `admin` | admin | `Admin@2026!` |
| `institution-tepitech` | institution | `Inst@2026!` |
| `prof-histoire` | enseignant | `Prof@2026!` |

> Les mots de passe sont hachés en bcrypt ; ces comptes servent uniquement en environnement de développement/démo.

---

## 11. Documents de référence

| Document | Contenu |
|----------|---------|
| [LIAISONS-TABLES-BDD.md](LIAISONS-TABLES-BDD.md) | Relations entre toutes les tables, ordre de peuplement |
| [../ARCHITECTURE.md](../ARCHITECTURE.md) | Modules, pages, routes et APIs par pôle |
| [../API_ENDPOINTS.md](../API_ENDPOINTS.md) | Inventaire des endpoints de l'API |
| [../PLAN-PROJET.md](../PLAN-PROJET.md) | Plan projet et organisation du travail |
| [01-PEDAGOGIQUE.md](01-PEDAGOGIQUE.md) → [11-GAPS-ISO.md](11-GAPS-ISO.md) | Docs par pôle (processus, pages) |
| [ged-fonctionnement-complet.md](ged-fonctionnement-complet.md) | Fonctionnement détaillé de la GED |
| [00-INDEX.md](00-INDEX.md) | Index de la documentation par pôles |