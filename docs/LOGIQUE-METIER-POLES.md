# EasyEcole — Logique Métier par Pôle et Relations Inter-Pôles

> Ce document décrit **ce que fait** le produit : la logique métier gérée dans chaque pôle
> (processus, règles de gestion, cycles de vie, statuts, calculs) et les **relations entre les pôles**
> (données échangées, flux, dépendances et impacts).
>
> Il complète [DOCUMENTATION-PRODUIT.md](DOCUMENTATION-PRODUIT.md) (vue produit, stack, modules) et
> [LIAISONS-TABLES-BDD.md](LIAISONS-TABLES-BDD.md) (relations techniques entre tables).

---

## Table des matières

1. [Cartographie des pôles et flux globaux](#1-cartographie-des-pôles-et-flux-globaux)
2. [Pôle Pédagogique](#2-pôle-pédagogique)
3. [Pôle Financier](#3-pôle-financier)
4. [Pôle Ressources Humaines](#4-pôle-ressources-humaines)
5. [Pôle Communication](#5-pôle-communication)
6. [Pôle GED (archivage numérique)](#6-pôle-ged-archivage-numérique)
7. [Pôle E-Learning](#7-pôle-e-learning)
8. [Pôle DocGen (documents officiels)](#8-pôle-docgen-documents-officiels)
9. [Pôle Qualité](#9-pôle-qualité)
10. [Pôle Parents](#10-pôle-parents)
11. [Relations entre les pôles](#11-relations-entre-les-pôles)
12. [Règles transverses](#12-règles-transverses)

---

## 1. Cartographie des pôles et flux globaux

### 1.1 Les pôles et leurs processus clés

| Pôle | Processus métier gérés |
|------|------------------------|
| **Pédagogique** | Orientation, inscription, paiements étudiants, exécution des cours, notes et absences, bulletins et délibérations, scolarité (documents, réclamations, sanctions, conseils), stages |
| **Financier** | Comptabilité générale, frais étudiants, achats et validations, stocks, immobilisations, marchés publics |
| **RH** | Emplois, contrats, planification, paie, congés, prêts, prestataires, pointage |
| **Communication** | Messagerie interne, actualités, suggestions et réclamations de la vie étudiante |
| **GED** | Archivage, classement, confidentialité, courriers, destruction |
| **E-Learning** | Cours en ligne, supports, quiz, devoirs, chat, certificats |
| **DocGen** | Génération de documents officiels, signatures, workflows, vérification publique |
| **Qualité** | Non-conformités, actions correctives, audits, revues de direction, enquêtes |
| **Parents** | Suivi de la scolarité de l'enfant |
| **Transverse** | Identité & accès (Auth), établissement, reporting, menu |

### 1.2 Les quatre flux majeurs du produit

```
FLUX 1 — Le candidat devient diplômé (Pédagogique)
  Orientation → Demande d'inscription → Dossier (pièces) → Bordereau de paiement →
  Paiement validé (CinetPay / caisse) → Préinscription → Cours & notes → Bulletin →
  Délibération / Jury → Décision (passage, rattrapage) → Quitus → Diplôme → GED/DocGen

FLUX 2 — L'argent (Pédagogique → Financier → GED)
  Frais par parcours → Échéances → Bordereaux validés → Lignes de frais étudiant →
  Écritures comptables / journaux → Rapprochement bancaire → États financiers
  Les factures fournisseurs suivent : Achats → Validation → Paiement → Écritures → Archivage

FLUX 3 — Les biens et services (Financier)
  Besoin (stock) → Demande d'achat → Budget/Engagement → Commande → Réception →
  Facture proforma → Validation multi-étapes → Paiement (compta)
  Acquisition (immo) → Amortissement → Affectation → Maintenance → Assurance →
  Inventaire → Cession/Rebut/Sortie provisoire
  Marché public : Planification → Manifestation d'intérêt → Appel d'offres → Contrat → Avenant

FLUX 4 — Les personnes (Pédagogique ↔ RH)
  Enseignants (Auth) → Emplois du temps → Contrats enseignants → Planning → Heures supp.
  → Période de paie → Bulletin de paie ; Congés ; Prêts ; Prestataires → Indemnités
```

---

## 2. Pôle Pédagogique

### 2.1 Orientation (`ori_*`)

**Logique métier**
- Un **candidat** (visiteur ou utilisateur `comite_orientation`) formule une **demande d'orientation** : profils, niveaux d'étude, matières prérequises.
- L'établissement propose un **catalogue de parcours** avec, pour chacun : **prérequis** (matières exigées), **débouchés** professionnels, appartenance à une **catégorie** et à un **niveau d'étude**.
- Le candidat sélectionne des parcours (ajout au **panier** → `parcours_choisis`) sous condition que ses matières couvrent les prérequis (*règle : un parcours dont les prérequis ne sont pas satisfaits n'est pas proposé/accepté*).
- Le comité d'orientation traite la demande et émet une **réponse d'orientation** qui nourrit directement le processus d'inscription (le parcours retenu devient la cible de la demande d'inscription).

**Relations** : alimente `inscription` (parcours choisi → demande d'inscription) ; consomme `auth` (candidats, comités).

### 2.2 Inscription (`ins_*`)

**Logique métier — cycle complet**

1. **Cadre académique** : l'établissement définit des **sessions/années académiques**, des **parcours de formation**, des **classes**, des **salles de classe** et des **emplois du temps** ; découpe l'année en **semestres académiques**.
2. **Catalogue pédagogique** : pour chaque cours (UE), on définit la **MCC** (modalités de contrôle des connaissances : pondérations par type d'évaluation et période) et les **règles d'évaluation** ; les sessions d'examen sont planifiées.
3. **Demande d'inscription** : le candidat dépose une demande rattachée à une session et un parcours, avec un **dossier** de pièces justificatives (`dossiers` ⇄ `demandes`, table de liaison).
   - *Règle* : le dossier conditionne la validation de la demande ; un dossier incomplet bloque l'admission.
   - Statuts parcourus : soumise → (validée / rejetée) → préinscrite → inscrite (après paiement).
4. **Engagement financier** : pour chaque parcours existent des **frais** (`ins_frais_parcours`). À la validation de la demande, le système génère des **échéances** de paiement, puis des **bordereaux de paiement**.
   - *Règle* : le **bordereau doit être validé** (caisse ou comptabilité) pour que l'inscription soit définitive ; la **validation du bordereau** est un acte comptable qui rejoue sur le pôle Financier (lignes de frais, écritures).
5. **Cursus** : l'apprenant inscrit se voit créer un **cursus** dans le parcours ; il **choisit ses cours** (`ins_cours_choisis`, liaison many-to-many apprenant ⇄ cours), avec possibilité d'**équivalences** (cours déjà validé ailleurs) et de **dispenses** (UE non requise), toutes deux **validées par l'administration** (acteur `validePar`, date de validation, justificatif).
6. **Fin de cycle** : l'apprenant obtient un **quitus** (attestation de situation à jour) ; les **étapes d'inscription** tracent l'avancement du dossier ; les **publications de notes** rendent les résultats visibles.

### 2.3 Exécution pédagogique

- **Cours / UE** : les enseignements sont planifiés (emplois du temps, salles) ; les **présences** sont relevées ; les **absences** sont enregistrées et consultables (elles alimentent la discipline et le suivi scolaire).
- **Notes** : l'enseignant saisit les **notes d'évaluation** conformément à la MCC ; chaque note est rattachée à un cours, un apprenant, une période d'évaluation.
  - *Règle* : la moyenne d'UE est calculée **à partir des pondérations de la MCC** (services de calcul dédiés, voir bulletins).
- **Rattrapages** : les sessions de rattrapage concernent les apprenants n'ayant pas validé une UE ; les résultats sont réintégrés au calcul de la moyenne (service `CalculRattrapageService`).

### 2.4 Bulletins & délibérations (`ins_*` — module `bulletins`)

**Logique métier — les règles de calcul et de décision**

1. **Échelles de notes** : l'établissement configure des barèmes (`echelles_notes`) convertissant les notes brutes en mentions/appréciations.
2. **Moyennes** : computation par UE puis par période via `MoteurCalculService` (pondérations MCC) ; **compensation** entre UE (`CalculCompensationService`) : une UE faible peut être compensée si la moyenne générale le permet — politique configurable.
3. **Bulletins** : génération (`GenerationBulletinService`) ligne par ligne (`lignes_bulletin`) : UE, notes, crédits, mentions ; le bulletin reprend aussi les absences et le suivi des UE (`suivi_ue`).
4. **Délibérations & jury** : après les examens, le jury se réunit : **membres** avec rôles (`president`, `membre`, `secretaire`) et **présence** ; la **délibération** produit des **résultats** par apprenant (admis / ajourné / rattrapage / redoublement) et des **PV** de jury (`GenerateurPVService`).
   - *Règle* : une décision de jury est **tracée** dans `historique_decisions` (aucune décision administrative ne se fait sans trace) ; les **dettes académiques** (UE non validées définitivement) sont gérées (`GestionDetteService`) et suivies semestre après semestre.
5. **Audit des notes** : toute modification de note est journalisée (`audit_notes`) — qui, quoi, quand → traçabilité pédagogique.

**Relations** : consomme `inscription` (notes, MCC, cours) et `scolarite` (conseils de classe) ; produit les données consommées par `reporting` et `docgen` (bulletins, PV).

### 2.5 Scolarité & vie étudiante (`sco_*`)

- **Demandes de documents** : l'apprenant demande un certificat/attestation ; le service scolaire traite, le document généré peut être archivé au **GED** et émis via **DocGen**.
- **Réclamations** : dépôt par l'apprenant, traitement par le service (statuts ouverte/traitée).
- **Discipline** : **sanctions disciplinaires** (comportement) et **sanctions académiques** (résultats) ; les **conseils de classe** se prononcent (ex. passage) et produisent des **décisions de passage** ; les **réorientations** sont des demandes traitées par la direction.
- **Registres académiques** : registres officiels (inscriptions, délibérations) tenus par le service.
- **Reconnaissance** : **VAE** (validation des acquis de l'expérience) et **diplômes** délivrés en fin de cursus.
- **Vie étudiante** : calendrier d'événements, bibliothèque avec catalogue de **livres** ; **progression pédagogique** suivie par apprenant.

### 2.6 Stages (`stg_*`)

- Les **offres de stage** sont publiées (entreprises, sujets, périodes).
- Les apprenants **postulent** ; l'administration traite les demandes et établit des **conventions de stage** entre l'établissement, l'entreprise et l'apprenant.
- Les **sessions de stage** (périodes) regroupent les participants/affectations ; le suivi (présence, rapports) est rattaché au dossier de l'apprenant.

---

## 3. Pôle Financier

### 3.1 Comptabilité générale (`cpt_*`)

- **Plan comptable** : les **comptes** (classes, libellés) sont définis par l'établissement (éventuellement avec un cabinet comptable — rôle `cabinet_comptable`).
- **Exercices comptables** : les opérations sont rattachées à un exercice (année close, verrouillable).
- **Écritures & journaux** : chaque opération produit des **écritures** (débit/crédit) ventilées dans des **journaux** (achats, ventes, banque, caisse…) ; principe de la partie double.
- **Banque** : les **comptes bancaires** reçoivent des **relevés** (avec lignes) ; le **rapprochement bancaire** rapproche les écritures des lignes de relevé (`RapprochementController`) — tout écart est identifié et traité.
- **États financiers** : synthèses (grand livre, balance, résultat) produites par `EtatsFinanciersController` ; tableau de bord comptable (`ComptabiliteDashboardController`).

### 3.2 Frais étudiants

- **Paramètres de frais** (`cpt_parametres_frais`) : barèmes génériques (par niveau, type de frais…) configurés en démarrage du serveur (seed `seedParametresFrais`).
- **Frais par parcours** : référentiel partagé avec le pôle Pédagogique (`ins_frais_parcours`) — *la source de vérité des frais d'inscription est pédagogique, la comptabilité la consomme*.
- **Réductions de frais** : bourses, exonérations, cas sociaux → appliquées sur les lignes de frais de l'étudiant.
- **Pénalités de retard** : calculées selon les règles de l'établissement (montant, délai, taux) sur les échéances non honorées.
- **Lignes de frais étudiant** : détail par étudiant (frais + réductions − pénalités + paiements) ; c'est la **facture interne** de l'étudiant, rapprochée des bordereaux validés.

### 3.3 Achats (`ach_*`)

**Workflow de validation**

```
Demande d'achat → Catégorie + Budget → Engagement → Commande → Réception
→ Facture proforma fournisseur → Validations successives (ach_validations)
→ Paiement (comptabilité) → Archivage GED
```

- La **demande** précise l'article/la catégorie, la quantité, le budget.
- Les **validations** sont des étapes contrôlées (plusieurs validateurs successifs possibles) : *règle* — une facture n'est payée que si toutes les validations requises sont obtenues.
- Les **fournisseurs** sont partagés avec le pôle Stock.

### 3.4 Stock (`stk_*`)

- **Articles** : chaque article a un stock courant (`stock_actuel`), un **stock minimum** (seuil d'alerte), un statut de vie (`actif`, `obsolete`, `reforme`, `en_rupture`) et un rattachement possible à un site / une salle de classe.
- **Mouvements** : entrées/sorties (`entree`/`sortie`) ; chaque mouvement met à jour le stock de l'article — *règle : il ne peut pas y avoir de mouvement sans mise à jour du stock actuel*.
- **Corrections** : écart constaté → `quantite_avant` / `quantite_apres` + motif + date.
- **Besoins** : un besoin (`article`, `quantite_requise`, urgence `basse/moyenne/haute/critique`) est **approuvé ou refusé** ; c'est le point d'entrée du cycle d'achat.
- **Demandes de prix** : pour un article, on demande des prix aux fournisseurs ; l'offre **retenue ou refusée**.
- **Bons de commande** : avec lignes (quantité, prix unitaire) ; statuts `en_attente` → `livree` / `annulee` ; le **montant total** est calculé.
- **Inventaires** : `quantite_theorique` vs `quantite_reelle` → **écart** calculé et commenté ; l'inventaire passe `en_cours` → `cloture`.
- **Rebut & transfert** : rebuts motivés (coût estimé) ; transferts entre sites (`source` → `destination`, motif, `valide`/`annule`).

### 3.5 Immobilisations (`imm_*`)

**Cycle de vie d'une immobilisation**

```
Catégorie (durée de vie, taux, mode d'amortissement)
  → Acquisition (achat / don / transfert, montant, date) 
  → Amortissement (par année : montant amorti, valeur résiduelle, date de calcul)
  → Affectation (site / département / localisation / responsable, date)
  → Maintenance (préventive/corrective ; coût, prestataire) + Maintenance programmée
    (périodicité, prochaine échéance — pilotée en tâche)
  → Assurance (police unique, assureur, prime, dates début/fin, statut active/expirée/résiliée)
  → Inventaire (état déclaré vs état constaté : neuf/bon/moyen/mauvais/réformé, commentaire)
  → Sortie provisoire (retour prévu → retour effectif ; en_cours → retourne)
  → Cession ou Rebut (motif, prix de cession, destinataire, approbation : approuvé/refusé)
```

- Chaque immobilisation porte une **référence unique** et un **QR code** (étiquetage physique).
- Les **sites**, **bâtiments**, **localisations** et **départements** structurent le patrimoine.

### 3.6 Marchés publics (`mar_*`)

- **Planification** : les marchés à lancer sont planifiés (objet, période, estimation).
- **Manifestation d'intérêt** : consultation des fournisseurs potentiels.
- **Appel d'offres** : publication, dépouillement.
- **Contrat de marché** : attribué au titulaire ; **avenants** pour modifications (montant, délais).

---

## 4. Pôle Ressources Humaines (`rh_*`)

**Logique métier**
- **Emplois** : employés référencés (profil utilisateur `auth`) avec **catégories professionnelles** et **grilles salariales** (barèmes par catégorie).
- **Contrats** : contrats de travail (type, dates, salaire) dont **contrats enseignants** (spécifiques au corps enseignant — le lien avec le Pôle Pédagogique est direct : un enseignant a la fois un compte `auth` (rôle `enseignant`), un contrat RH et des cours dans l'emploi du temps).
- **Planification** : planning du personnel par période ; **heures supplémentaires** comptabilisées (quantité, taux, validation).
- **Paie** : **périodes de paie** → **bulletins de paie** avec **lignes** (rubriques : salaire de base, primes, heures supp., retenues…) ; le bulletin de paie peut être archivé au **GED** (processus `PAIE`).
- **Congés** : **demandes de congé** traitées selon le **solde de congé** restant (*règle : une demande ne peut être approuvée au-delà du solde*).
- **Prêts** : prêts accordés au personnel → **remboursements** échelonnés (montant, échéance).
- **Prestataires** : prestataires (externes) → **indemnités** versées (montant, période).
- **Pointage** : relevés de présence du personnel servant au calcul de la paie (frontend `pointage`).

---

## 5. Pôle Communication (`com_*`)

- **Messagerie** : messages entre utilisateurs (expéditeur, destinataires, lecture).
- **Actualités** : annonces de la vie étudiantine (date, catégorie) publiées par l'administration.
- **Suggestions / Réclamations** : les apprenants déposent une suggestion (type : `Amélioration`, `Réclamation`), l'administration répond (`reponses` à la suggestion, statut `ouverte` → `traitee`).

---

## 6. Pôle GED — Archivage numérique (`ged_*`)

**Logique métier**

1. **Référentiel documentaire** : les **domaines** (SCOL, RH, FIN, REC, GOUV, PAT, EXT) structurent la classification ; chaque **type documentaire** définit une **confidentialité par défaut** et une **durée d'utilité administrative (DUA)** en années — ou une conservation **permanente**.
2. **Classement** : **dossiers** en arborescence (`parentId`) ; **documents** versionnés (`parentDocumentId`) classés dans les dossiers, avec **tags** (many-to-many).
3. **Confidentialité par rôle** : chaque niveau de confidentialité (`public`, `interne`, `restreint`, `confidentiel`) est associé aux rôles autorisés :
   - `public` : tous les rôles ;
   - `interne` : tous sauf apprenant ;
   - `restreint` : institution + admin ;
   - `confidentiel` : admin uniquement.
   - *Règle : un utilisateur ne voit que les documents dont le niveau est autorisé pour son rôle.*
4. **Processus générateurs** : documents produits par les modules (paie, factures, bons de commande…) identifiés par process (`module_source`) → archivage automatique ciblé.
5. **Courriers** : courriers entrants/sortants enregistrés (référence, sens, traitement).
6. **Destruction/élimination** : à l'issue de la DUA, les documents sont éligibles à la destruction (avec contrôle d'intégrité et traçabilité).
7. **Intégrité & notifications** : contrôle d'intégrité des fichiers ; notifications d'archivage aux parties prenantes ; sessions GED (traçage des accès).

**Relations** : consomme `auth` (rôles, créateurs) ; reçoit les documents de tous les modules métier (factures, contrats, bulletins, PV, dossiers étudiants).

---

## 7. Pôle E-Learning (`elearning_*`)

**Logique métier**
- **Cours en ligne** : rattachés aux **cours du cursus pédagogique** (`coursId` → `ins_cours`) — *règle : un cours en ligne n'existe que s'il correspond à une UE du catalogue* ; statut `actif`.
- **Modules & supports** : chaque cours en ligne est découpé en **modules** ordonnés contenant des **supports** (PDF, vidéo avec durée, taille, version compressée).
- **Quiz & devoirs** : quiz (questions/choix) avec **réponses** enregistrées ; **devoirs** avec **soumissions** des apprenants (date, fichier).
- **Interaction temps réel** : **salons de discussion** par cours (chat Socket.IO) avec **participants** et **messages** (lu/non lu) ; **notifications** ; **commentaires** sur les supports.
- **Suivi** : **progression** par apprenant (modules consultés, quiz passés) ; **certificats** délivrés en fin de parcours en ligne.
- **Partage** : envoi par **couplage mail** (email + date d'envoi) des supports.

> Particularité technique : les clés vers `ins_cours` et `auth` sont déclarées **sans contrainte** (`constraints: false`) — les liens sont métier et non techniques.

---

## 8. Pôle DocGen — Documents officiels (`docgen_*`)

**Logique métier**
- **Catalogue de types** : documents classés par catégorie avec code métier (ex. `ADM001` fiche de candidature, `INS003` certificat d'inscription, `NOT002` relevé de notes, `SCO001` certificat de scolarité…) ; chaque type précise :
  - le **module source** (orientation, inscription, scolarité, RH, comptabilité…) qui produit ce document ;
  - si une **signature** est requise ;
  - la **DUA** (durée de conservation) ;
  - si le document est **généré automatiquement**.
- **Templates** : gabarits (Word/PDF) associés aux types.
- **Génération** : un document généré porte une **référence** unique et est lié à un **matricule** (étudiant, employé…) ; **signatures** (signataire, date, statut), **workflows** de validation, **cachets** apposés.
- **Vérification publique** : endpoint `/verification/document/:matricule/:reference` — *règle : n'importe quel tiers peut authentifier un document (annuaire, employeur) sans compte* ; l'authenticité repose sur le couple matricule/référence.

**Relations** : consomme `auth` + `inscription` (identités, matricules) ; produit des documents archivables au **GED** (types documentaires correspondants).

---

## 9. Pôle Qualité (`qua_*`)

**Logique métier — boucle d'amélioration continue (ISO 21001)**

```
Non-conformité détectée → Action corrective (traitement, responsable, échéance)
→ Vérification de l'efficacité → Clôture

Audit (programmé) → Pistes d'audit (constats) → Actions éventuelles

Revue de direction (périodique) → Décisions de revue → Mise en œuvre suivie

Enquête de satisfaction (apprenants, parents, personnel) → Réponses
→ Analyse → Axes d'amélioration
```

- Les **non-conformités** et **actions correctives** tracent chaque écart (source, gravité, traitement).
- Les **audits** (interne/externe) produisent des **pistes** (points forts, points sensibles).
- Les **revues de direction** examinent les indicateurs et prennent des **décisions** (engagements, ressources).
- Les **enquêtes de satisfaction** recueillent les **réponses** des publics — entrée directe des attentes dans la revue de direction.

---

## 10. Pôle Parents (`par_*`)

- Chaque **parent** (compte `auth`, rôle `parent`) est relié à un ou plusieurs **enfants** (apprenants) via `par_parents_enfants`.
- *Règle : un parent ne voit que les données des apprenants qui lui sont liés* (notes, absences, paiements, bulletins).
- Le pôle est avant tout un **pôle de lecture** : il consomme la donnée des pôles Pédagogique et Financier sans la modifier.

---

## 11. Relations entre les pôles

### 11.1 Matrice des dépendances métier

| Pôle | Dépend de | Nourrit |
|------|-----------|---------|
| Pédagogique | Auth (acteurs), Établissement (racine) | Financier (frais, bordereaux), DocGen (documents), GED (archives), Reporting |
| Financier | Pédagogique (frais étudiants, bordereaux), Stock/Achats (factures), Auth (comptables, caissiers) | GED (factures, contrats), Reporting |
| RH | Auth (personnel) | Financier (paie → écritures), GED (bulletins de paie), Pédagogique (enseignants) |
| Communication | Auth (auteurs) | — |
| GED | Auth (rôles), tous les modules (documents reçus) | — |
| E-Learning | Pédagogique (UE référentes), Auth (apprenants, enseignants) | Reporting (progression) |
| DocGen | Auth + Pédagogique (matricules, cursus) | GED (documents générés archivés) |
| Qualité | Auth (auditeurs, répondants), tous les processus (objets de contrôle) | Reporting (indicateurs) |
| Parents | Auth (liens parent-enfant) | — |
| Reporting | Tous (lecture) | — |

### 11.2 Relations détaillées

#### Pédagogique ⇄ Financier — le flux « frais étudiants »
- **Quoi** : les frais d'inscription sont définis dans le pôle Pédagogique (`ins_frais_parcours`) ; les paramètres généraux (barèmes) sont dans Financier (`cpt_parametres_frais`) ; les **réductions** et **pénalités** sont des règles financières appliquées aux dossiers pédagogiques.
- **Comment ça circule** : demande validée → **échéances** (`ins_echeances`) → **bordereaux** (`ins_bordereaux`) → paiement → **validation du bordereau** (acte comptable) → **lignes de frais étudiant** (`cpt_lignes_frais_etudiant`) → **écritures** comptables.
- **Impacts** : un étudiant avec bordereaux non validés ne peut pas être inscrit définitivement ; les encaissements étudiants alimentent les journaux de caisse/banque et donc les états financiers ; le **quitus** est délivré quand la situation financière est apurée.

#### Pédagogique ⇄ DocGen ⇄ GED — la chaîne documentaire
- Le pôle Pédagogique demande des documents officiels (certificats, relevés, PV) → **DocGen** les génère avec référence unique et signature requise selon le type → les documents générés et les pièces administratives sont **archivés au GED** dans les dossiers de l'étudiant.
- *Règle de cohérence* : un PV de jury généré par DocGen et archivé au GED fait foi pour la scolarité (registres).

#### Pédagogique ⇄ E-Learning — le socle « cours »
- Les **cours en ligne** sont adossés aux **UE du catalogue pédagogique** (`elearning_cours.coursId` → `ins_cours`). *Conséquence* : un cours en ligne hérite du public concerné (classe/parcours) et les notes de quiz/devoirs peuvent être versées dans le dispositif d'évaluation de l'UE (décision métier de l'établissement).
- Les apprenants et enseignants sont les mêmes comptes `auth` que dans le pôle Pédagogique.

#### Pédagogique ⇄ RH — le corps enseignant
- Un enseignant est : un compte **Auth** (rôle `enseignant`, profil AutEnseignant) + un **contrat enseignant** RH (+ planning, heures supplémentaires, paie) + des **cours/UE** dans l'emploi du temps + éventuellement membre des **jurys**.
- *Impact* : la paie des enseignants (heures supp., vacations) consomme les données pédagogiques (charges de cours) ; le planning RH doit être cohérent avec l'emploi du temps pédagogique.

#### Pédagogique ⇄ Parents
- `par_parents_enfants` crée le lien de **droit d'accès** ; le parent consulte les notes, absences, paiements et bulletins de ses enfants **sans droit d'écriture**.
- *Règle* : un lien parent-enfant ne peut référencer que des comptes valides (parent réel + apprenant inscrit).

#### Financier ⇄ Achats ⇄ Stock ⇄ Immobilisations ⇄ Marchés — le cycle « biens et services »
- **Stock ↔ Achats** : le besoin stocké (`stk_besoins`) déclenche la demande d'achat ; les fournisseurs sont partagés ; la réception crée une entrée en stock ; le bon de commande référence les articles.
- **Achats → Comptabilité** : la facture proforma validée (workflow `ach_validations`) devient une écriture fournisseurs (dette) puis un paiement (banque/caisse).
- **Immobilisations ↔ Achats/Marchés** : une acquisition peut provenir d'un bon de commande (achat) ou d'un marché public (contrat) ; les cessions/rebuts peuvent être tracés comptablement.
- **Marchés → Achats/Immo** : le contrat de marché encadre les achats structurants de l'établissement.

#### GED ⇄ tous les modules — l'archivage transverse
- Chaque module produit des documents à valeur de preuve : **RH** (contrats, bulletins de paie — process `PAIE`, `POINTAGE`, `CONTRAT_ENSEIGNANT`), **Achats/Stock** (factures — process `FACTURE`, bons de commande — `BON_COMMANDE`, réceptions — `RECEPTION`), **Pédagogique** (PV, bulletins, diplômes), **DocGen** (documents générés).
- *Règle* : la confidentialité GED s'applique au moment de la consultation ; la DUA pilote l'élimination.

#### Qualité ⇄ tous les processus
- Les **non-conformités** peuvent être déclarées sur n'importe quel processus (scolarité, paie, achat…) — le module Qualité référence l'objet concerné.
- Les **enquêtes de satisfaction** interrogent les publics de tous les pôles.
- Les **revues de direction** examinent les indicateurs de Reporting (qui agrège tous les pôles).

#### Reporting ⇄ tous
- Les vues de reporting agrègent : effectifs et notes (Pédagogique), paiements et soldes (Financier), paie (RH), progression (E-Learning), qualité (audits/NC)…
- *Règle* : les vues sont matérialisées — elles doivent être **rafraîchies** (`db:sync-reporting`) après chaque (re)seed.

---

## 12. Règles transverses

- **Identité unique** : tous les acteurs (personnel, enseignants, apprenants, parents, comités, caissiers) sont des comptes du pôle Auth ; les profils métier (AutEnseignant, AutApprenant…) étendent le compte.
- **RBAC** : permissions `menu.*` (visibilité des pages) et `action.*` (droits d'exécution) ; le menu applicatif est construit dynamiquement selon les droits du rôle.
- **Multi-établissement** : `eta_etablissements` est la racine ; les enregistrements métier peuvent être rattachés via `etablissementId`.
- **Traçabilité** : décisions administratives (équivalences, dispenses, jury, validations d'achat) enregistrent l'acteur (`validePar`, approbateur), la date et le justificatif.
- **Traçabilité des notes** : journal d'audit des modifications de notes (intégrité de la notation).
- **Génération de données de démo** : `db:seed` peuple le système dans l'ordre des dépendances (voir LIAISONS-TABLES-BDD.md §23) ; les seeds de modules (GED, DocGen, comptes) sont documentés dans [DOCUMENTATION-PRODUIT.md](DOCUMENTATION-PRODUIT.md) §5.

---

> Documents liés : [LIAISONS-TABLES-BDD.md](LIAISONS-TABLES-BDD.md) (relations table par table), [DOCUMENTATION-PRODUIT.md](DOCUMENTATION-PRODUIT.md) (vue produit et modules), [../ARCHITECTURE.md](../ARCHITECTURE.md) (pages/routes/API).