# Architecture EasyEcole

> Documentation complète des modules, pages, routes et APIs.
> Généré le 24/07/2026

---

## Navigation rapide

1. [Pôle Pédagogique](#1-pole-pedagogique)
2. [Pôle Financier](#2-pole-financier)
3. [Ressources Humaines](#3-ressources-humaines)
4. [Communication & Collaboration](#4-communication--collaboration)
5. [Archivages Numériques](#5-archivages-numeriques)
6. [E-Learning](#6-e-learning)
7. [Espace Parents](#7-espace-parents)
8. [Administration & Système](#8-administration--systeme)
9. [Gestion documentaire](#9-gestion-documentaire)

---

## 1. Pôle Pédagogique

### Groupe : Admission & Inscription

#### Module inscription (backend: `modules/inscription`, frontend: `features/modules/inscription`)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Sessions | `/inscription/sessions` | Gestion des sessions/années académiques | `GET/POST/PUT/DELETE /inscription/sessions` | CRUD sessions |
| Parcours | `/inscription/parcours` | Gestion des parcours de formation | `GET/POST/PUT/DELETE /inscription/parcours` | CRUD parcours |
| Salles de classe | `/inscription/salles-de-classe` | Gestion des salles | `GET/POST/PUT/DELETE /inscription/salles` | CRUD salles |
| Frais par parcours | `/inscription/frais-parcours` | Configuration des frais par parcours | `GET/POST/PUT/DELETE /inscription/frais-parcours` | CRUD frais |
| Demandes | `/inscription/demandes` | Demandes d'inscription | `GET/POST/PUT/DELETE /inscription/demandes` | CRUD demandes, changement statut |
| Effectifs inscrits | `/inscription/effectifs` | Liste des inscrits par session | `GET /inscription/effectifs` | Filtres, export |
| Mes bordereaux | `/inscription/bordereaux` | Bordereaux de paiement | `GET/POST /inscription/bordereaux` | Génération, impression |
| Valid. bordereaux | `/inscription/validation-bordereaux` | Validation des bordereaux | `GET/PUT /inscription/bordereaux/:id/valider` | Validation comptable |

#### Module orientation (backend: `modules/orientation`, frontend: `features/modules/orientation`)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Demandes orientation | `/orientation/demandes` | Demandes d'orientation | `GET/POST/PUT/DELETE /orientation/demandes` | CRUD, traitement |
| Parcours orientation | `/orientation/parcours` | Parcours d'orientation | `GET/POST/PUT/DELETE /orientation/parcours` | CRUD parcours |

### Groupe : Traitement de données

#### Module inscription (suite)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Dossiers étudiants | `/inscription/dossiers` | Gestion des dossiers étudiants | `GET/POST/PUT/DELETE /inscription/dossiers` | CRUD, pièces jointes |
| Arborescence dossiers | `/inscription/hierarchy` | Hiérarchie des dossiers | `GET /inscription/hierarchy` | Vue arborescente |

#### Module scolarite (backend: `modules/scolarite`, frontend: `features/modules/scolarite`)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Registres | `/scolarite/registres` | Registres académiques | `GET/POST /scolarite/registres` | Consultation, édition |
| Réorientation | `/scolarite/reorientation` | Demandes de réorientation | `GET/POST/PUT /scolarite/reorientation` | CRUD, validation |
| Mes réclamations | `/scolarite/mes-reclamations` | Réclamations (apprenant) | `GET/POST /scolarite/reclamations` | CRUD réclamations |
| Traiter réclam. | `/scolarite/traiter-reclamations` | Traitement des réclamations | `GET/PUT /scolarite/reclamations/:id` | Changement statut |

#### Module bulletins (backend: `modules/bulletins`, frontend: `features/modules/bulletins`)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Équivalences | `/bulletins/equivalences` | Gestion des équivalences | `GET/POST/PUT/DELETE /bulletins/equivalences` | CRUD équivalences |
| Dispenses | `/bulletins/dispenses` | Gestion des dispenses | `GET/POST/PUT/DELETE /bulletins/dispenses` | CRUD dispenses |

### Groupe : Planning

#### Module cours (frontend: `features/modules/cours`)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Emplois du temps | `/cours/emplois-du-temps` | Planning des cours | `GET/POST/PUT /cours/emplois-du-temps` | CRUD, vue hebdo |
| Enseignants | `/cours/enseignants` | Liste des enseignants | `GET /cours/enseignants` | Consultation |
| Unités d'enseignement | `/cours/cours` | Gestion des UE/cours | `GET/POST/PUT/DELETE /cours/cours` | CRUD UE |
| Cahiers de texte | `/cours/cahiers-de-texte` | Cahiers de texte | `GET/POST/PUT /cours/cahiers-de-texte` | CRUD, suivi |
| Présences | `/cours/presences` | Gestion des présences | `GET/POST/PUT /cours/presences` | Saisie, consultation |
| Notes | `/cours/notes` | Gestion des notes | `GET/POST/PUT /cours/notes` | Saisie, consultation |

#### Module scolarite (suite)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Calendrier | `/scolarite/calendrier` | Calendrier des événements | `GET /scolarite/calendrier` | Vue calendrier |
| Décisions passage | `/scolarite/decisions-passage` | Décisions de passage | `GET/POST/PUT /scolarite/decisions-passage` | Validation |

#### Module bulletins (suite)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Sessions examens | `/bulletins/sessions` | Sessions d'examen | `GET/POST/PUT/DELETE /bulletins/sessions` | CRUD sessions |
| Rattrapages | `/bulletins/rattrapages` | Sessions de rattrapage | `GET/POST/PUT /bulletins/rattrapages` | CRUD, organisation |

### Groupe : Formation (déjà couvert par cours ci-dessus)

### Groupe : Évaluation & Suivi

#### Module bulletins (suite)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Bulletins | `/bulletins` | Génération des bulletins | `GET/POST /bulletins` | Génération, consultation |
| Moyennes | `/bulletins/moyennes` | Calcul des moyennes | `GET /bulletins/moyennes` | Consultation |
| Audit notes | `/bulletins/audit-notes` | Journal des modifications de notes | `GET /bulletins/audit-notes` | Consultation |
| Paramètres notation | `/bulletins/parametres-notation` | Configuration notation | `GET/POST/PUT /bulletins/echelles` | CRUD échelles |
| Délibérations & Jury | `/bulletins/deliberations-jury` | Conseil de classe et jury | `GET/POST/PUT /bulletins/deliberations` | CRUD, validation |
| Absences | `/bulletins/absences` | Gestion des absences | `GET/POST /bulletins/absences` | Saisie, consultation |

#### Module scolarite (suite)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Sanctions & Discipline | `/scolarite/sanctions-discipline` | Sanctions académiques/discipline | `GET/POST/PUT /scolarite/sanctions` | CRUD sanctions |
| Conseils classe | `/scolarite/conseils` | Conseil de classe | `GET/POST/PUT /scolarite/conseils` | CRUD, décisions |

### Groupe : Vie Étudiante

#### Module communication (backend: `modules/communication`, frontend: `features/modules/communication`)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Annonces | `/communication/annonces` | Annonces et actualités | `GET/POST/PUT/DELETE /communication/actualites` | CRUD annonces |
| Vie estudiantine | `/communication` | Vie étudiante | `GET /communication` | Fil d'actualité |
| Suggestions | `/communication/suggestions` | Boîte à suggestions | `GET/POST/PUT /communication/suggestions` | CRUD, traitement |

### Groupe : Insertion Professionnelle

#### Module stages (backend: `modules/stage`, frontend: `features/modules/stages`)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Offres stage | `/stages/offres` | Offres de stage | `GET/POST/PUT/DELETE /stage/offres` | CRUD offres |
| Demandes stage | `/stages/demandes` | Demandes de stage | `GET/POST/PUT /stage/demandes` | CRUD, suivi |
| Entreprises | `/stages/entreprises` | Fiche entreprises partenaires | `GET/POST/PUT/DELETE /stage/entreprises` | CRUD entreprises |

---

## 2. Pôle Financier

### Groupe : Finance

#### Module comptabilite (backend: `modules/comptabilite`, frontend: `features/modules/comptabilite`)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Dashboard compta | `/comptabilite/dashboard` | Tableau de bord comptable | `GET /comptabilite/dashboard` | KPIs, soldes |
| Plan comptable | `/comptabilite/plan-comptable` | Plan comptable | `GET/POST/PUT/DELETE /comptabilite/comptes` | CRUD comptes |
| Balance | `/comptabilite/balance` | Balance comptable | `GET /comptabilite/balance` | Filtres période |
| Grand Livre | `/comptabilite/grand-livre` | Grand livre | `GET /comptabilite/grand-livre` | Filtres compte |
| Écritures | `/comptabilite/ecritures` | Journal des écritures | `GET/POST/PUT/DELETE /comptabilite/ecritures` | CRUD écritures |
| Comptes bancaires | `/comptabilite/comptes-bancaires` | Comptes bancaires | `GET/POST/PUT/DELETE /comptabilite/comptes-bancaires` | CRUD comptes |
| Relevés bancaires | `/comptabilite/releves-bancaires` | Relevés bancaires | `GET/POST/PUT/DELETE /comptabilite/releves-bancaires` | CRUD, consultation lignes |
| Rapprochement | `/comptabilite/rapprochement` | Rapprochement bancaire | `GET/POST/DELETE /comptabilite/rapprochement` | Lettrage/délettrage |

#### Module inscription (suite - paiements)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Paiements | `/inscription/paiements` | Gestion des paiements | `GET/POST /inscription/paiements` | Encaissement, historique |
| Échéances | `/inscription/echeances` | Échéancier des frais | `GET/POST /inscription/echeances` | Suivi, relances |

### Groupe : Marches

#### Module marche (backend: `modules/marche`, frontend: pas encore créé)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Planifications | `/marche/planifications` | Planification des marchés | `GET/POST/PUT/DELETE /marche/planifications` | CRUD planifications |
| AMI | `/marche/ami` | Manifestations d'intérêt | `GET/POST/PUT/DELETE /marche/ami` | CRUD, soumettre, retenir |
| Appels d'offres | `/marche/ao` | Appels d'offres | `GET/POST/PUT/DELETE /marche/ao` | CRUD, lancer, attribuer |
| Contrats | `/marche/contrats` | Contrats de marché | `GET/POST/PUT/DELETE /marche/contrats` | CRUD, signer |
| Avenants | `/marche/avenants` | Avenants aux contrats | `GET/POST/PUT/DELETE /marche/avenants` | CRUD avenants |

### Groupe : Achats

#### Module achats (backend: `modules/achats`, frontend: `features/modules/achats`)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Demandes achat | `/achats/demandes` | Demandes d'achat | `GET/POST/PUT/DELETE /achats/demandes` | CRUD, workflow validation |
| Validations | `/achats/validations` | Validation des demandes | `GET/PUT /achats/validations` | Approuver/rejeter |
| Commandes | `/achats/commandes` | Bons de commande | `GET/POST/PUT/DELETE /achats/commandes` | CRUD commandes |
| Réceptions | `/achats/receptions` | Réception des commandes | `GET/POST/PUT /achats/receptions` | CRUD réceptions |
| Factures | `/achats/factures` | Factures fournisseurs | `GET/POST/PUT/DELETE /achats/factures` | CRUD factures |
| Fournisseurs | `/achats/fournisseurs` | Gestion des fournisseurs | `GET/POST/PUT/DELETE /achats/fournisseurs` | CRUD fournisseurs |
| Budgets | `/achats/budgets` | Budgets achats | `GET/POST/PUT/DELETE /achats/budgets` | CRUD budgets, suivi |

### Groupe : Stocks

#### Module stocks (backend: `modules/stock`, frontend: `features/modules/stocks`)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Articles | `/stocks/articles` | Gestion des articles | `GET/POST/PUT/DELETE /stock/articles` | CRUD articles |
| Catégories | `/stocks/categories` | Catégories d'articles | `GET/POST/PUT/DELETE /stock/categories` | CRUD catégories |
| Mouvements | `/stocks/mouvements` | Mouvements de stock | `GET/POST /stock/mouvements` | Entrée/sortie |
| Besoins | `/stocks/besoins` | Besoins en stock | `GET/POST /stock/besoins` | CRUD besoins |
| Demandes de prix | `/stocks/demandes-prix` | Demandes de prix | `GET/POST /stock/demandes-prix` | CRUD demandes |
| Transferts | `/stocks/transferts` | Transferts entre dépôts | `GET/POST /stock/transferts` | CRUD transferts |
| Corrections | `/stocks/corrections-stock` | Correction d'inventaire | `GET/POST /stock/corrections` | CRUD corrections |
| Rebuts | `/stocks/rebuts` | Mise au rebut | `GET/POST /stock/rebuts` | CRUD rebuts |
| Inventaires | `/stocks/inventaires` | Inventaire physique | `GET/POST /stock/inventaires` | CRUD inventaires |
| Fournisseurs | `/stocks/fournisseurs` | Fournisseurs stock | `GET/POST/PUT/DELETE /stock/fournisseurs` | CRUD fournisseurs |
| Reportings | `/stocks/reportings` | Rapports stocks | `GET /stock/reportings` | KPIs, alertes |
| Cycle de vie | `/stocks/cycle-vie` | Cycle de vie articles | `GET /stock/articles/:id/cycle` | Historique complet |

### Groupe : Immobilisations

#### Module immobilisations (backend: `modules/immobilisation`, frontend: `features/modules/immobilisations`)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Immobilisations | `/immobilisations` | Gestion des immobilisations | `GET/POST/PUT/DELETE /immobilisation/immobilisations` | CRUD immobilisations |
| Sites | `/immobilisations/sites` | Sites de l'établissement | `GET/POST/PUT/DELETE /immobilisation/sites` | CRUD sites |
| Catégories | `/immobilisations/categories` | Catégories d'immobilisations | `GET/POST/PUT/DELETE /immobilisation/categories` | CRUD catégories |
| Affectations | `/immobilisations/affectations` | Affectations du personnel | `GET/POST /immobilisation/affectations` | CRUD affectations |
| Assurances | `/immobilisations/assurances` | Assurances des biens | `GET/POST/PUT/DELETE /immobilisation/assurances` | CRUD assurances |
| Sorties provisoires | `/immobilisations/sorties-provisoires` | Sorties provisoires | `GET/POST /immobilisation/sorties` | CRUD sorties |
| Cessions | `/immobilisations/cessions` | Cessions d'immobilisations | `GET/POST /immobilisation/cessions` | CRUD cessions |
| Rebuts | `/immobilisations/rebuts` | Mise au rebut d'immobilisations | `GET/POST /immobilisation/rebuts` | CRUD rebuts |
| Maintenance | `/immobilisations/maintenances` | Maintenance des biens | `GET/POST/PUT /immobilisation/maintenances` | CRUD maintenances |
| Inventaires | `/immobilisations/inventaires` | Inventaires physiques | `GET/POST /immobilisation/inventaires` | CRUD inventaires |
| Reportings | `/immobilisations/reportings` | Rapports immobiliers | `GET /immobilisation/reportings` | KPIs, amortissements |

---

## 3. Ressources Humaines

### Groupe : RH

#### Module rh (backend: `modules/rh`, frontend: `features/modules/rh`)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Dashboard RH | `/rh` | Tableau de bord RH | `GET /rh/dashboard` | KPIs, alertes |
| Employés | `/rh/employes` | Gestion des employés | `GET/POST/PUT/DELETE /rh/employes` | CRUD employés |
| Offres d'emploi | `/rh/offres-emploi` | Offres d'emploi | `GET/POST/PUT/DELETE /rh/offres` | CRUD offres |
| Candidatures | `/rh/candidatures` | Candidatures reçues | `GET/POST/PUT /rh/candidatures` | CRUD, suivi |
| Catégories professionnelles | `/rh/categories-professionnelles` | Catégories pro | `GET/POST/PUT/DELETE /rh/categories` | CRUD catégories |
| Grilles salariales | `/rh/grilles-salariales` | Grilles de salaire | `GET/POST/PUT/DELETE /rh/grilles` | CRUD grilles |
| Paramètres paie | `/rh/parametres-paie` | Configuration paie | `GET/POST/PUT /rh/parametres-paie` | Rubriques, périodes |
| Paie | `/rh/paie` | Bulletins de paie | `GET/POST /rh/paie` | Génération, historique |
| Heures supplémentaires | `/rh/heures-supplementaires` | HS personnel | `GET/POST /rh/heures-supplementaires` | CRUD HS |
| Prêts / Avances | `/rh/prets` | Prêts aux employés | `GET/POST/PUT /rh/prets` | CRUD prêts |
| Prestataires | `/rh/prestataires` | Prestataires externes | `GET/POST/PUT/DELETE /rh/prestataires` | CRUD prestataires |
| Indemnités prestataires | `/rh/indemnites-prestataires` | Indemnités prestataires | `GET/POST/PUT /rh/indemnites` | CRUD indemnisations |
| Prestations | `/rh/prestations` | Prestations enseignant | `GET/POST /rh/prestations` | CRUD prestations |
| Contrats | `/rh/contrats-enseignant` | Contrats enseignants | `GET/POST/PUT/DELETE /rh/contrats` | CRUD contrats |
| Formations | `/rh/formations` | Formations du personnel | `GET/POST/PUT/DELETE /rh/formations` | CRUD formations |
| Évaluations | `/rh/evaluations` | Évaluations du personnel | `GET/POST/PUT /rh/evaluations` | CRUD évaluations |
| Planning personnel | `/rh/planning-personnel` | Planning du personnel | `GET/POST /rh/planning` | CRUD planning |
| Reportings RH | `/rh/reportings` | Rapports RH | `GET /rh/reportings` | KPIs, effectifs |
| Demandes de congé | `/rh/demandes-conge` | Demandes de congés | `GET/POST/PUT /rh/demandes-conge` | CRUD, workflow validation |
| Soldes de congé | `/rh/soldes-conge` | Suivi des soldes | `GET/POST /rh/soldes-conge` | Initialisation, consultation |

### Groupe : Pointage

#### Module pointage (frontend: `features/modules/pointage`)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Terminal | `/pointage` | Terminal de pointage | `POST /pointage` | Pointage entrée/sortie |
| Historique | `/pointage/historique` | Historique des pointages | `GET /pointage` | Consultation, filtres |
| Shifts | `/pointage/shifts` | Gestion des shifts | `GET/POST/PUT/DELETE /pointage/shifts` | CRUD shifts |
| Absences | `/pointage/absences` | Gestion des absences | `GET /pointage/absences` | Consultation |
| Planning | `/pointage/planning` | Planning de pointage | `GET/POST /pointage/planning` | CRUD planning |
| Rapports | `/pointage/rapports` | Rapports de pointage | `GET /pointage/rapports` | Statistiques |

---

## 4. Communication & Collaboration

### Groupe : Communication

#### Module communication (suite)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Discussions | `/communication/discussions` | Messagerie interne | `GET/POST /communication/discussions` | CRUD messages |
| Notifications | `/communication/notifications` | Centre de notifications | `GET /communication/notifications` | Consultation |

### Groupe : Reporting

#### Module reporting (backend: `modules/reporting`, frontend: `features/modules/reporting`)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Dashboard | `/reporting` | Tableau de bord global | `GET /reporting/dashboard` | KPIs généraux |
| Effectifs | `/reporting/effectifs` | Rapports effectifs | `GET /reporting/effectifs` | Statistiques |
| Notes | `/reporting/notes` | Rapports notes | `GET /reporting/notes` | Statistiques |
| Paiements | `/reporting/paiements` | Rapports financiers | `GET /reporting/paiements` | Statistiques |
| RH | `/reporting/rh` | Rapports RH | `GET /reporting/rh` | Statistiques |

---

## 5. Archivages Numériques

### Groupe : Documents

#### Module ged (backend: `modules/ged`, frontend: `features/modules/ged`)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Catalogue | `/ged/catalog` | Catalogue documentaire | `GET /ged/documents` | Recherche, filtres |
| Recherche avancée | `/ged/search` | Recherche plein texte | `GET /ged/documents/search` | Recherche, facettes |
| Dossiers | `/ged/folders` | Dossiers virtuels | `GET/POST/PUT/DELETE /ged/folders` | CRUD dossiers |

### Groupe : Traitement

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Téléverser | `/ged/upload` | Upload de documents | `POST /ged/documents/upload` | Upload fichiers |
| Batch upload | `/ged/batch-upload` | Upload par lot | `POST /ged/documents/batch` | Upload multiple |
| Saisie | `/ged/saisie` | Saisie de documents | `POST /ged/documents` | CRUD documents |

### Groupe : Organisation

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Conservation | `/ged/conservation` | Gestion de la conservation | `GET/POST /ged/documents/conservation` | Durées, archivage |
| Bordereaux | `/ged/disposal` | Bordereaux d'élimination | `GET/POST /ged/disposal` | CRUD bordereaux |
| Archives | `/ged/archives` | Archives | `GET /ged/documents/archives` | Consultation |
| Fusion | `/ged/merge` | Fusion de documents | `POST /ged/documents/merge` | Fusion PDF |

---

## 6. E-Learning

### Groupe : Formation

#### Module elearning (backend: `modules/elearning`, frontend: `features/modules/elearning`)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Mes cours | `/elearning/dashboard` | Dashboard e-learning | `GET /elearning/cours` | Liste cours inscrits |
| Cours vidéos | `/elearning/videos` | Cours en vidéo | `GET /elearning/cours/:id/videos` | Lecture streaming |
| Cours PDF | `/elearning/pdfs` | Supports PDF | `GET /elearning/cours/:id/supports` | Consultation, download |
| Quiz | `/elearning/quiz` | Quiz en ligne | `GET/POST /elearning/quiz` | Passage, correction |
| Progression | `/elearning/progression` | Suivi progression | `GET /elearning/progression` | Statistiques |
| Certificats | `/elearning/certificats` | Certificats obtenus | `GET /elearning/certificats` | Téléchargement |
| Devoirs | `/elearning/devoirs` | Devoirs à rendre | `GET/POST /elearning/devoirs` | Dépôt, notation |

### Groupe : Administration

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Gestion e-learning | `/elearning/admin/gestion` | Administration elearning | `GET/POST/PUT /elearning/admin` | CRUD cours, supports |

---

## 7. Espace Parents

### Groupe : Suivi

#### Module parent (backend: `modules/parent`, frontend: `features/modules/parent`)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Tableau de bord | `/parent` | Dashboard parent | `GET /parent/dashboard` | Infos enfants |
| Notes | `/parent/notes` | Notes des enfants | `GET /parent/notes` | Consultation |
| Absences | `/parent/absences` | Absences des enfants | `GET /parent/absences` | Consultation |

### Groupe : Informations

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Emploi du temps | `/parent/emploi-du-temps` | EDT des enfants | `GET /parent/emploi-du-temps` | Consultation |
| Paiements | `/parent/paiements` | Paiements effectués | `GET /parent/paiements` | Consultation |
| Documents | `/parent/documents` | Documents scolaires | `GET /parent/documents` | Téléchargement |

---

## 8. Administration & Système

### Groupe : Administration

#### Module administration (frontend: `features/modules/administration`)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Utilisateurs | `/administration/utilisateurs` | Gestion des utilisateurs | `GET/POST/PUT/DELETE /auth/utilisateurs` | CRUD utilisateurs |
| Rôles | `/parametres/roles` | Gestion des rôles | `GET/POST/PUT/DELETE /auth/roles` | CRUD rôles |
| Permissions | `/parametres/permissions` | Gestion des permissions | `GET/POST /auth/permissions` | Attribution |
| QR Codes | `/administration/qr-codes` | QR Codes utilisateurs | `GET /auth/qr-codes` | Génération |
| Cartes | `/administration/cartes` | Cartes étudiant/personnel | `GET/POST /auth/cartes` | CRUD cartes |
| Journal audit | `/administration/audit-logs` | Journal d'audit | `GET /auth/audit-logs` | Consultation filtres |
| Configuration | `/administration/configuration` | Configuration système | `GET/POST /auth/configuration` | Paramètres globaux |

### Groupe : Paramètres

#### Module parametres (frontend: `features/modules/parametres`)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Mon profil | `/parametres/profil` | Profil utilisateur | `GET/PUT /auth/utilisateurs/:id` | Modification profil |
| Mon compte | `/parametres/compte` | Paramètres compte | `GET/PUT /auth/compte` | Email, mot de passe |
| École | `/parametres/ecole` | Configuration établissement | `GET/PUT /etablissement` | Infos établissement |
| Année scol. | `/parametres/annees-scolaires` | Années académiques | `GET/POST/PUT /inscription/annees` | CRUD années |
| Frais | `/parametres/frais` | Configuration frais | `GET/POST/PUT /inscription/frais` | CRUD frais généraux |
| Notifications | `/parametres/notifications` | Préférences notifications | `GET/PUT /auth/notifications` | Configuration |
| Système | `/parametres/systeme` | Configuration système | `GET /auth/systeme` | Informations |
| Sauvegardes | `/parametres/sauvegardes` | Sauvegardes BD | `GET/POST /auth/sauvegardes` | Création, restauration |

---

## 9. Gestion documentaire

### Groupe : Configuration

#### Module docgen (backend: `modules/docgen`, frontend: `features/modules/docgen`)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Types de documents | `/docgen/types` | Types documentaires | `GET/POST/PUT/DELETE /docgen/types` | CRUD types |
| Modèles | `/docgen/templates` | Modèles de documents | `GET/POST/PUT/DELETE /docgen/templates` | CRUD templates |
| Cachet électronique | `/docgen/cachet` | Cachet électronique | `GET/POST /docgen/cachet` | Configuration |
| Workflows | `/docgen/workflows` | Workflows de validation | `GET/POST/PUT/DELETE /docgen/workflows` | CRUD workflows |

### Groupe : Documents

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Tous les documents | `/docgen/documents` | Documents générés | `GET/POST /docgen/documents` | Consultation, recherche |
| Générer | `/docgen/generer` | Génération de documents | `POST /docgen/generer` | Génération PDF |

#### Module scolarite (suite)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Diplômes | `/scolarite/diplomes` | Gestion des diplômes | `GET/POST /scolarite/diplomes` | CRUD diplômes |

### Groupe : Demandes

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Demandes docs | `/scolarite/demandes-documents` | Demandes de documents | `GET/POST /scolarite/demandes-docs` | CRUD demandes |
| Traiter demandes | `/scolarite/traiter-demandes` | Traitement des demandes | `GET/PUT /scolarite/demandes-docs/:id` | Validation |
| Demandes VAE | `/scolarite/demandes-vae` | Validation des acquis | `GET/POST /scolarite/vae` | CRUD VAE |

### Groupe : Signatures

#### Module docgen (suite)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Signatures | `/docgen/signatures` | Gestion des signatures | `GET/POST /docgen/signatures` | CRUD signatures |
| Signature direction | `/docgen/signatures/direction` | Signature direction | `GET/POST /docgen/signatures/direction` | Signature officielle |

---

## Modules complémentaires

### Module Qualité (backend: `modules/qualite`, frontend: `features/modules/qualite`)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Non-conformités | `/qualite/non-conformites` | Gestion des NC | `GET/POST/PUT/DELETE /qualite/non-conformites` | CRUD, traitement |
| Audits | `/qualite/audits` | Audits qualité | `GET/POST/PUT/DELETE /qualite/audits` | CRUD, planification |
| Revues direction | `/qualite/revues-direction` | Revues de direction | `GET/POST/PUT/DELETE /qualite/revues-direction` | CRUD, PV |
| Enquêtes satisfaction | `/qualite/enquetes-satisfaction` | Enquêtes satisfaction | `GET/POST/PUT/DELETE /qualite/enquetes` | CRUD, réponses |
| Actions correctives | `/qualite/actions-correctives` | Plan d'actions | `GET/POST/PUT/DELETE /qualite/actions` | CRUD, suivi |

### Module Auth (backend: `modules/auth`, frontend: `features/modules/auth`)

| Page | Route | Description | API Backend | Actions |
|------|-------|-------------|-------------|---------|
| Connexion | `/auth/connexion` | Page de login | `POST /auth/login` | Authentification |
| Inscription | `/auth/inscription` | Création de compte | `POST /auth/register` | Inscription |
| Mot de passe oublié | `/auth/forgot-password` | Réinitialisation | `POST /auth/forgot-password` | Envoi email |
| Reset password | `/auth/reset-password` | Nouveau mot de passe | `POST /auth/reset-password` | Réinitialisation |
| OTP | `/auth/otp` | Vérification 2FA | `POST /auth/verify-otp` | Code OTP |
| Confirm email | `/auth/confirm-email` | Confirmation email | `POST /auth/confirm-email` | Validation |

### Module Etablissement (backend: `modules/etablissement`)

Pas de frontend dédié — les fonctionnalités sont accessibles via `Paramètres > École` (`/parametres/ecole`).

---

## Légende des statuts

| Statut | Signification |
|--------|---------------|
| ✅ Pages livrées | Frontend + backend complets |
| ⚠️ Frontend manquant | Backend existe, pages frontend à créer |
| 🔧 Backend manquant | Frontend existe, backend à créer |
| 📝 À vérifier | Existence à confirmer |
