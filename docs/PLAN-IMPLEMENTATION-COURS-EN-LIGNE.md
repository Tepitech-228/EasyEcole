# TODO d'implémentation — Pôle « Cours en ligne » (E-Learning)

> **Périmètre strict** : le pôle cours en ligne uniquement.
> **Hors périmètre (reste tel quel)** : inscription, frais de scolarité, notes classiques, bulletins, documents, comptabilité — ces modules ne sont ni modifiés ni refondus. Le pôle e-learning **s'appuie** sur eux (réutilisation), il ne les touche pas.
> **Analyse d'écart source** : `docs/ANALYSE-COURS-EN-LIGNE.md` (état des lieux, 14 écarts E1→E14).
> **Date** : 2026-10-21 · **Périmètre technique** : `easy-ecole-backend/src/modules/elearning/` + `easy-ecole-web/src/app/features/modules/elearning/` et `.../pole-elearning/`.

---

## 0. Comment lire ce document

Ce document est le **TODO de développement** du chantier. Il est organisé en **9 lots (L0 → L8)** exécutables dans l'ordre indiqué.

Chaque lot contient :
- les **tâches** (cases à cocher) ;
- les **fichiers** à modifier (chemins exacts) ;
- les **critères d'acceptation** (vérifiables, testables) ;
- les **points d'attention** (pièges connus, contraintes de l'existant).

Convention de priorité : 🔴 **bloquant** (empêche la livraison), 🟠 **important**, ⚪ **secondaire**.

---

## 1. Processus cible (arbitrage métier retenu)

Le flux de référence est désormais le suivant — **il conditionne tous les lots** :

```
   ┌─ 1. INSCRIPTION ────────────────────────────────────────────────────────────┐
   │  L'étudiant choisit sa période :  MATIN (jour) | SOIR | EN LIGNE           │
   │  → aut_apprenants.periode                                               │
   └──────────────────────────────────────────────────────────────────────────┘
                                     │
   ┌─ 2. RECOUVREMENT ─────────────────────────────────────────────────────────┐
   │  L'agent de recouvrement SAISIT LE MONTANT alloué à l'étudiant            │
   │  → une « enveloppe budgétaire » est ouverte pour l'année en cours        │
   │  → traceability : mouvement de crédit au portefeuille de crédits existant│
   └──────────────────────────────────────────────────────────────────────────┘
                                     │
   ┌─ 3. SÉLECTION ────────────────────────────────────────────────────────────┐
   │  L'étudiant (période = en_ligne) parcourt le catalogue et CHOISIT SES UE   │
   │  dans la limite de la somme saisie.                                       │
   │  Le serveur refuse tout dépassement (refus motivé).                       │
   └──────────────────────────────────────────────────────────────────────────┘
                                     │
   ┌─ 4. COMITÉ ────────────────────────────────────────────────────────────────┐
   │  La sélection est soumise au comité → dossier soumis au comité            │
   │  (POST /inscription/comite-validations/dossiers/:id/decider)              │
   └──────────────────────────────────────────────────────────────────────────┘
                                     │
   ┌─ 5. VALIDATION ───────────────────────────────────────────────────────────┐
   │  Décision : accepté (consommation imputée sur l'enveloppe, accès ouverts)│
   │              ou refusé (retour à l'étudiant, enveloppe non débitée)       │
   └──────────────────────────────────────────────────────────────────────────┘
                                     │
   ┌─ 6. PARCOURS COMPLET ─────────────────────────────────────────────────────┐
   │  L'étudiant « en_ligne » n'accède QU'À ce pôle :                          │
   │  supports, devoirs, examens, quiz, progression, certificats.              │
   │  Ni dépôt de bordereaux, ni achat d'autres UE, ni import de devoirs      │
   │  traités, ni autres pôles non nécessaires.                                │
   └──────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Machine à états d'une sélection de cours

| État | Signification | Transitions possibles |
|---|---|---|
| `propose` | l'étudiant a choisi le cours, coût **figé** | → `en_attente_comite`, → `retiree` |
| `en_attente_comite` | soumis au comité | → `valide_payee`, → `rejete` |
| `valide_payee` | validée, consommation imputée sur l'enveloppe | → `acces_ouvert`, → `remboursee` (réversibilité) |
| `acces_ouvert` | supports et devoirs déblocés | → `terminee` |
| `rejete` / `retiree` / `remboursee` | terminaux, enveloppe non débitée | — |

**Invariant de gestion** : le débit de l'enveloppe n'a lieu **qu'à la validation par le comité** (étape 5). Entre la sélection et la validation, l'enveloppe affiche une **réservation** (montant réservé) et non une consommation.

### 1.2 Qui fait quoi

| Acteur | Rôle existant | Ce qu'il fait dans le pôle |
|---|---|---|
| Étudiant | `apprenant` (période `en_ligne`) | consulte le catalogue, choisit ses UE, dépose les devoirs, passe l'examen |
| Service de recouvrement | `caissier_banque`, `esa_compta`, `secretaire` | **saisit le montant** de l'enveloppe, annule/reverse un encaissement |
| Comité | `comite_orientation` | **valide ou refuse** la sélection |
| Enseignant / Professeur | `enseignant` | publie les supports et les devoirs, corrige, saisit l'observation |
| Chargé de support | **à créer** (`charge_support`) | prépare et publie les contenus, organise les examens |
| Pilotage | `admin`, `institution` | paramètre les tarifs, active/désactive les cours, consulte le journal |

---

## 2. Failles et écarts à corriger (rappel opérationnel)

| # | Constat vérifié | Où | Lot correctif |
|---|---|---|---|
| F1 | **Supports servis sans authentification** (diffusion statique `/media/videos`) | `easy-ecole-backend/src/app.ts` l. 125 | **L4** |
| F2 | Aucune notion de prix, de crédit, de solde, de sélection dans tout le module | `src/modules/elearning/**` | L1 → L3 |
| F3 | `SupportController.getAll/get` ne filtrent rien ; `DevoirController` ne refuse que « APPRENANT interdit » | `controllers/SupportController.ts`, `controllers/DevoirController.ts` | L4 |
| F4 | Aucun journal d'audit | module e-learning | **L7** |
| F5 | `aut_apprenants.periode` n'est exploitée nulle part pour conditionner l'accès | `src/modules/inscription/**` | **L8** |
| F6 | Notes de devoirs stockées à côté de la soumission, jamais consolidées vers les bulletins | `models/SoumissionDevoir.ts` | **L5** |
| F7 | `elearning_cours.coursId` est un varchar sans clé étrangère vers `ins_cours` (UE) | `models/CoursEnLigne.ts` | L0 |
| F8 | Devoirs sans semestre ni année académique | `models/Devoir.ts` | L5 |
| F9 | Rôle « chargé de support » inexistant (14 rôles, aucun dédié) | `src/core/enums/RolesUtilisateur.ts` | **L7** |

---

## 3. Modèle de données cible

> Principe : **tout ce qui est nouveau vit dans le module e-learning** (préfixe `elearning_`), et **rien de nouveau n'est créé dans les modules inscription / comptabilité**. Les liens vers l'existant se font par **clé étrangère** ou par **référence d'identifiant**.

### 3.1 Tables nouvelles (à créer)

| Table | Rôle | Colonnes principales |
|---|---|---|
| `elearning_tarifs_credit` | Historique du tarif du crédit (non-rétroactivité) | `id`, `cle`, `valeur`, `unite`, `dateEffet`, `anneeAcademiqueId`, `actif` |
| `elearning_encaissements` | Saisie du montant par le service de recouvrement | `id`, `dossierEtudiantId`, `utilisateurId`, `anneeAcademiqueId`, `montant`, `reference`, `dateEncaissement`, `agentId`, `statut` (`saisi`/`valide`/`annule`), `mouvementPortefeuilleId`, `commentaire` |
| `elearning_enveloppes` | Enveloppe budgétaire de l'étudiant (ligne de commande du budget) | `id`, `dossierEtudiantId`, `utilisateurId`, `anneeAcademiqueId`, `montantAlloue`, `montantReserve`, `montantConsomme`, `statut` (`ouverte`/`suspendue`/`cloturee`), `dateCloture` |
| `elearning_selections_cours` | Choix d'UE par l'étudiant | `id`, `enveloppeId`, `utilisateurId`, `dossierEtudiantId`, `coursId` (→ `elearning_cours.id`), `ueId` (→ `ins_cours.id`, nullable), `anneeAcademiqueId`, `credits`, `coutFige`, `statut`, `dateProposition`, `dateValidation`, `validePar`, `mouvementPortefeuilleId` |
| `elearning_audit` | Journal des opérations (traçabilité métier) | `id`, `acteurId`, `acteurRole`, `action`, `entite`, `entiteId`, `payload` (JSON), `dateEvenement` |

### 3.2 Colonnes à ajouter

| Table | Colonnes ajoutées | Contrainte |
|---|---|---|
| `elearning_cours` | `code` (unique + année), `filiereId`, `niveauEtudeId`, `anneeAcademiqueId`, `nbCredits`, `coutUnitaire`, `coutTotal` (calculé serveur), `chargeSupportId`, `professeurId`, `datePublication` | `statut` → ENUM(`brouillon`,`publie`,`desactive`) — migration non destructive (valeurs existantes `actif` → `publie`) |
| `elearning_supports` | `anneeAcademiqueId`, `accessibilite` (`libre`/`paye`) | index sur `moduleId` |
| `elearning_modules` | `anneeAcademiqueId` | support commun aux 2 semestres, une version par année |
| `elearning_devoirs` | `semestre` (1/2), `anneeAcademiqueId`, `statut` (`brouillon`/`publie`), `datePublication`, `poids`, `consignes`, `listeNoteEvaluationId` | **règle serveur : 2 devoirs par cours et par année** |
| `elearning_soumissions_devoirs` | `dateCorrection`, `corrigePar`, `observation`, `noteEvaluationId`, `listeNoteEvaluationId` | pont vers le dispositif de notes existant |

### 3.3 Actifs réutilisés (aucune modification)

| Actif | Usage dans le chantier |
|---|---|
| `cpt_portefeuille_credit` (66 lignes) | **Traçabilité** : chaque encaissement de l'enveloppe et chaque consommation validée y inscrit un mouvement signé (`credit` / `consommation`) + `soldeCourant`. Aucune modification de schéma, aucun changement de sémantique (le dispositif actuel ne sert qu'au « surplus bordereau »). |
| `cpt_parametres_frais` | Exposition du tarif courant (clé `elearning_prix_credit`) pour les screens d'administration ; l'historique reste dans `elearning_tarifs_credit`. |
| `ins_dossiers_etudiants` | Ancre de l'enveloppe (`dossierEtudiantId`) — cohérent avec le portefeuille de crédits. |
| `ins_cours` | UE visées par le catalogue e-learning (`ueId`). |
| `ins_cursus_apprenants` | **Prérequis des notes** : `ins_cours_participants.cursusApprenantId` est `NOT NULL` → un étudiant `en_ligne` doit disposer d'un cursus (voir D9). |
| `ins_listes_notes_evaluation` + `ins_notes_evaluation` + `ins_types_note_evaluation` | Consolidation des notes de devoirs et d'examens (catégories `devoir` / `examen` déjà présentes). |
| `ins_semestres_academiques` | **Table vide en base** → la dimension « semestre » est portée par `elearning_devoirs.semestre` (1/2) et non par la table (voir D10). |
| `aut_apprenants.periode` | Conditionnement de l'accès (L8). |
| Mécanique rôles + permissions + menus (`CheckPermission`, bypass ADMIN) | Nouveau rôle et nouvelles permissions (L7). |

---

## 4. API cible (backend)

Montage conservé : `/api/v1/elearning` (`src/modules/elearning/ElearningRoutes.ts`).

### 4.1 Catalogue, enveloppe, sélection (étudiant)

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| GET | `/elearning/catalogue` | apprenant | Cours publiés de l'année en cours, **avec crédits, coût, et état de sélection** de l'étudiant |
| GET | `/elearning/enveloppe` | apprenant | Enveloppe de l'année : alloué, réservé, consommé, **solde disponible** |
| GET | `/elearning/selections` | apprenant | Sélections de l'étudiant + état d'avancement |
| POST | `/elearning/selections` | apprenant | **Choisir des cours** — contrôle serveur du plafond, refus motivé si dépassement |
| DELETE | `/elearning/selections/:id` | apprenant | Retirer un cours proposé (non validé) |
| POST | `/elearning/selections/:id/soumettre` | apprenant | Passer la sélection au comité |

### 4.2 Recouvrement (saisie du montant)

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| GET | `/elearning/encaissements` | recouvrement | Liste des saisies (filtres : année, statut) |
| POST | `/elearning/encaissements` | recouvrement | **Saisir le montant** → crée/approvisionne l'enveloppe + mouvement de crédit |
| PUT | `/elearning/encaissements/:id/valider` | recouvrement | Valider la saisie (montant définitif) |
| PUT | `/elearning/encaissements/:id/annuler` | recouvrement | **Réversibilité** : annulation → reblocage des accès + mouvement d'ajustement |
| GET | `/elearning/enveloppes` | recouvrement / admin | Enveloppes de l'année (suivi des budgets) |

### 4.3 Comité

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| GET | `/elearning/comite/selections` | comité | Sélections en attente de décision |
| POST | `/elearning/comite/selections/:id/decider` | comité | Décision (accepter/refuser + motif) → imputation sur l'enveloppe |
| GET | `/elearning/audit` | admin / institution | Journal des opérations (L7) |

> Le **dossier d'inscription** continue de suivre la voie existante : `POST /inscription/comite-validations/dossiers/:id/decider` (`controllers/ComiteValidationController.ts` l. 348-355). Le pôle e-learning **ne remplace pas** ce dispositif : il s'y branche (voir D8).

### 4.4 Contenus (accès payant) — correction de la faille F1

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| GET | `/elearning/supports/:id/fichier` | apprenant | **Point d'entrée authentifié** pour servir le fichier (remplace la diffusion statique) |
| GET | `/elearning/modules/:id/supports` | apprenant | Supports d'un module, filtrés selon l'accès de l'étudiant |
| GET | `/elearning/cours/:id/acces` | apprenant | Droit d'accès de l'étudiant sur le cours (payé + sélectionné + période) |
| GET | `/elearning/devoirs/:id/sujet` | apprenant | Sujet du devoir (uniquement si publié et accessible) |
| POST | `/elearning/devoirs/:id/soumettre` | apprenant | Dépôt du devoir (déjà existant, à garder) |

### 4.5 Devoirs, examens, notes

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| GET/POST/PUT | `/elearning/devoirs` | enseignant, chargé de support | Publication des devoirs semestriels (règle des 2 devoirs/an contrôlée serveur) |
| PUT | `/elearning/devoirs/:id/corriger/:soumissionId` | enseignant | Note + observation → **consolidation** dans `ins_notes_evaluation` |
| GET | `/elearning/examens` | habilités | Sessions d'examen du cours |
| POST | `/elearning/examens` | admin, chargé de support | Dépôt d'un sujet **confidentiel** |
| GET | `/elearning/examens/:id/sujet` | habilités (jamais apprenant) | Sujet d'examen confidentiel |
| GET | `/elearning/examens/:id/impression` | habilités | Version imprimable du sujet |
| POST | `/elearning/examens/:id/notes` | habilités | Saisie de la note après passage → `ins_notes_evaluation` (type `examen`) |

---

## 5. Écrans (frontend)

### 5.1 Module `elearning` (à enrichir)

| Écran | Action | Fichiers |
|---|---|---|
| Catalogue tarifé | coût, crédits, état de sélection, bouton « Choisir » | `pages/catalogue-elearning-page/*` |
| Panneau « Mon budget e-learning » | alloué / réservé / consommé / **solde**, historique des saisies | **nouveau** `pages/budget-elearning-page/*` |
| Mes sélections | liste, coût, retrait possible, soumission au comité | **nouveau** `pages/mes-selections-page/*` |
| Fiche cours | crédits, coût, contenu verrouillé si non payé | `pages/cours-details-page/*` |
| Support verrouillé | message « cours non acquis » + redirection vers le catalogue | `components/support-card/*`, `pages/cours-videos-page/*`, `pages/cours-pdfs-page/*` |
| Devoirs semestriels | S1/S2, dépôt PDF, correction + observation | `pages/devoirs-page/*`, `pages/devoir-detail-page/*` |
| Espace examen | convocation, sujet confidentiel (non affiché), saisie de note (habilités) | **nouveau** `pages/examens-page/*` |
| Journal d'audit | consultation (admin) | **nouveau** `pages/audit-elearning-page/*` |

### 5.2 Module `pole-elearning` (accueil étudiant)

| Écran | Action | Fichiers |
|---|---|---|
| Accueil | budget disponible, cours proposés, prochaines échéances | `pages/pole-elearning-home/*` |

### 5.3 Restriction d'accès (L8)

| Emplacement | Action |
|---|---|
| `src/app/core/guards/` | **nouveau** `periode-en-ligne.guard.ts` : redirige vers `/pole-elearning` tout étudiant `periode='en_ligne'` qui tente d'accéder à un autre pôle |
| `src/app/app-routing.module.ts` | déclaration du guard sur leslazy routes hors pôle e-learning |
| `src/app/features/modules/inscription/pages/comite-validation-page/*` | affichage de la période déjà présent (l. 166, 398) — **ne rien changer** |
| `src/app/features/pages/dashboard-page/dashboard-page.component.ts` | redirection `en_ligne → /pole-elearning` déjà présente (l. 121-123) — **ne rien changer** |

---

## 6. Backlog détaillé

### L0 — Socle données et paramétrage 🟠 (~3 j)

**Objectif** : poser le modèle de données sans casser l'existant. Prérequis de tous les autres lots.

- [ ] Migration non destructive `elearning_cours` : `code`, `filiereId`, `niveauEtudeId`, `anneeAcademiqueId`, `nbCredits`, `coutUnitaire`, `coutTotal`, `chargeSupportId`, `professeurId`, `datePublication`, `statut` ENUM(`brouillon`,`publie`,`desactive`)
  - *Fichiers* : `easy-ecole-backend/src/modules/elearning/models/CoursEnLigne.ts` + script de migration du projet
  - *Attention* : les 2 lignes existantes ont `statut='actif'` → migrer vers `publie` **avant** de poser l'ENUM ; ne pas supprimer la colonne.
- [ ] Migration `elearning_supports` : `anneeAcademiqueId`, `accessibilite`
- [ ] Migration `elearning_modules` : `anneeAcademiqueId`
- [ ] Création des tables `elearning_tarifs_credit`, `elearning_encaissements`, `elearning_enveloppes`, `elearning_selections_cours`, `elearning_audit` + modèles Sequelize dans `src/modules/elearning/models/`
- [ ] Enregistrement des modèles et des associations dans `src/modules/elearning/models/_associations.ts`
- [ ] Clé étrangère optionnelle `elearning_cours.coursId → ins_cours.id` (nullable, non bloquante — arbitrage D1)
- [ ] Seed du tarif courant : `cpt_parametres_frais` (clé `elearning_prix_credit`) + 1 ligne `elearning_tarifs_credit` (date d'effet = début de l'année)
  - *Fichiers* : `src/modules/comptabilite/seed-parametres-frais.ts` (pattern existant) + seed du module e-learning
- [ ] Garantir que le coût total est **calculé côté serveur** (jamais accepté depuis le client)

**Critères d'acceptation**
- [ ] La migration s'applique sur une base contenant les 2 cours et 3 modules existants, sans perte et sans erreur.
- [ ] `GET /api/v1/elearning/cours` répond toujours 200 (aucune régression) et renvoie désormais `code`, `nbCredits`, `coutTotal`, `statut` typé.
- [ ] Un cours sans année académique et sans coût reste exploitable (valeurs par défaut), il est simplement **absent du catalogue étudiant** (non publié).
- [ ] Un changement de tarif **ne modifie pas** le `coutTotal` déjà figé d'une sélection validée.

---

### L1 — Tarification, catalogue et cycle de vie 🟠 (~4 j)

- [ ] Service de calcul du coût : `coutTotal = nbCredits × coutUnitaire`, recalculé à chaque modification du tarif **uniquement pour les cours non figés**
- [ ] Historisation : toute modification du tarif écrit une ligne dans `elearning_tarifs_credit` (date d'effet)
- [ ] Cycle de vie du cours : `brouillon → publie → desactive`
  - `brouillon` : invisible du catalogue, non sélectionnable
  - `publie` : visible au catalogue, sélectionnable, coût affiché
  - `desactive` : invisible du catalogue, **les accès déjà acquis sont conservés**
- [ ] `GET /elearning/catalogue` : uniquement les cours `publie` de l'année académique courante, avec `credits`, `coutTotal`, `accessibilite`
- [ ] Mise à jour de l'écran catalogue : affichage crédits + coût + badge « acquis / à choisir »
- [ ] Fiche cours enrichie : code, filière, niveau, année, crédits, coût, professeur, chargé de support, statut

**Critères d'acceptation**
- [ ] Un cours `brouillon` n'apparaît nulle part côté étudiant.
- [ ] Un cours `desactive` disparaît du catalogue mais reste lisible par un étudiant qui l'a acquis.
- [ ] Le coût affiché dans le catalogue est **identique** à celui retourné par l'API (source unique : serveur).
- [ ] Modifier le tarif ne change pas le coût figé d'une sélection validée (test de non-rétroactivité).

---

### L2 — Enveloppe budgétaire et saisie du recouvrement 🔴 (~5 j)

**Objectif** : le service de recouvrement saisit le montant, l'étudiant dispose d'un budget.

- [ ] Création d'une enveloppe à la première saisie de l'année (`elearning_enveloppes`, 1 ligne par étudiant et par année)
- [ ] `POST /elearning/encaissements` : saisie du montant par le recouvrement
  - contrôle : `montant > 0`, étudiant `periode = 'en_ligne'`, dossier étudiant existant
  - effet : mise à jour de `montantAlloue` de l'enveloppe + **mouvement de crédit** dans `cpt_portefeuille_credit` (type `credit`, `commentaire = 'Enveloppe cours en ligne'`, `soldeCourant` recalculé)
- [ ] `PUT /elearning/encaissements/:id/valider` : le montant devient définitif
- [ ] `PUT /elearning/encaissements/:id/annuler` : **réversibilité** — mouvement d'ajustement négatif, enveloppe recalculée, accès rebloqués si le solde passe sous le seuil
- [ ] `GET /elearning/enveloppe` (étudiant) : alloué, réservé, consommé, **solde disponible**
- [ ] Écran « Mon budget e-learning » (étudiant) : jauge de consommation + historique des mouvements
- [ ] Écran de saisie (recouvrement) : recherche étudiant + saisie du montant + référence + historique
- [ ] Journalisation de chaque saisie/annulation (`elearning_audit`) — cf. L7 pour le canal d'affichage

**Critères d'acceptation**
- [ ] Après saisie d'un montant M, l'étudiant voit un solde disponible = M.
- [ ] Deux saisies successives s'additionnent (M1 puis M2 → solde M1+M2).
- [ ] Une annulation de saisie restitue exactement le montant et **rebloque** les cours devenus inaccessibles.
- [ ] Le mouvement de crédit est visible dans `cpt_portefeuille_credit` avec le bon `soldeCourant` (pas de double solde ailleurs).
- [ ] Un étudiant qui n'est pas en période `en_ligne` ne peut pas avoir d'enveloppe (refus explicite).

---

### L3 — Sélection des UE et contrôle budgétaire 🔴 (~6 j)

**Objectif** : l'étudiant choisit ses UE dans la limite de la somme saisie.

- [ ] `POST /elearning/selections` : choisir un ou plusieurs cours
  - refus **motivé** si `Σ(coût des cours déjà réservés) + coût du nouveau cours > solde disponible`
  - message explicite : montant manquant, cours refusés, plafond atteint
  - coût **figé** au moment de la proposition (`coutFige`) → insensible à un changement de tarif ultérieur
  - le montant passe en **réservé** (pas encore consommé)
- [ ] `DELETE /elearning/selections/:id` : retrait d'un cours proposé (libère la réservation)
- [ ] `POST /elearning/selections/:id/soumettre` : passage au comité
- [ ] Écrans : « Mes sélections » (liste, coût, état, retrait, soumission) + bouton « Choisir » dans le catalogue
- [ ] Compteur de budget visible dans l'en-tête du catalogue et de la page « Mes cours »
- [ ] Refus des doublons (un cours ne peut être sélectionné qu'une fois par étudiant et par année)

**Critères d'acceptation**
- [ ] Sélection acceptée si le total reste dans la limite ; refus avec motif sinon (aucune écriture partielle).
- [ ] Le retrait d'un cours libère immédiatement la réservation.
- [ ] Le coût figé ne bouge pas si le tarif change entre la sélection et la validation.
- [ ] Un même cours ne peut pas être proposé deux fois.
- [ ] La somme des réservations ne peut jamais dépasser le solde (invariant testé).

---

### L4 — Encaissement, validation par le comité et déblocage des accès 🔴 (~5 j)

**Objectif** : la validation par le comité consomme le budget et ouvre les accès.

- [ ] `POST /elearning/comite/selections/:id/decider` (comité) : accepter / refuser (motif obligatoire en cas de refus)
  - **acceptation** : statut `valide_payee`, `montantReserve → montantConsomme`, **mouvement de consommation** dans `cpt_portefeuille_credit` (type `consommation`, montant négatif), statut `acces_ouvert`
  - **refus** : statut `rejete`, libération de la réservation, aucun débit
- [ ] Branchement sur le dossier d'inscription : le comité traite le dossier via le dispositif existant (`POST /inscription/comite-validations/dossiers/:id/decider`) ; la décision de dossier conditionne la consommation définitive de l'enveloppe (cf. D8)
- [ ] **Correction de la faille F1** :
  - [ ] endpoint authentifié `GET /elearning/supports/:id/fichier` qui vérifie le droit d'accès avant de servir le fichier
  - [ ] retrait de la diffusion statique `app.use('/media/videos', express.static(...))` (`src/app.ts` l. 125) **ou** déplacement des supports e-learning hors de ce dossier
  - [ ] vérification que le chemin de fichier ne peut pas être deviné (pas d'URL de fichier brut en réponse)
- [ ] Contrôle d'accès systématique sur **tous** les endpoints de contenu : `cours`, `modules`, `supports`, `devoirs`, `progression`, `certificats`, `quiz`
  - un étudiant non payé **ou** non sélectionné **ou** hors période `en_ligne` → `403` motivé
- [ ] Rôle de gestion (enseignant, chargé de support, admin) : accès aux contenus regardless du paiement (hors exception `APPRENANT`)

**Critères d'acceptation**
- [ ] Un étudiant qui n'a pas payé reçoit `403` sur le support, le devoir, la progression et le certificat d'un cours non acquis.
- [ ] L'URL brute du fichier support (`/media/videos/xxx.mp4`) **ne renvoie plus** le fichier (404/403) — test de non-fuite.
- [ ] Après validation par le comité, l'étudiant accède immédiatement aux supports de ses cours validés.
- [ ] Après refus, l'accès reste fermé et le budget n'est pas débité.
- [ ] Le solde de l'enveloppe reflète exactement : `alloué − consommé − réservé`.

---

### L5 — Devoirs semestriels et consolidation des notes 🟠 (~6 j)

**Objectif** : 2 devoirs par cours et par année (S1 + S2), sujets publiés, dépôt PDF, correction + observation, notes reprises dans les bulletins.

- [ ] `elearning_devoirs` : `semestre` (1/2), `anneeAcademiqueId`, `statut`, `datePublication`, `poids`, `consignes`
- [ ] Règle serveur : **2 devoirs maximum par cours et par année** (1 par semestre) — refus motivé au-delà
- [ ] Publication d'un devoir : titre, description, consignes, sujet PDF, date limite, poids
- [ ] Dépôt côté étudiant : fichier PDF, dans le délai ; au-delà, dépôt refusé avec motif
- [ ] Correction côté enseignant : note + **observation** ; `elearning_soumissions_devoirs.dateCorrection` / `corrigePar`
- [ ] **Consolidation vers le dispositif de notes existant** :
  - [ ] types d'évaluation : utiliser les catégories existantes `devoir` et `examen` (`ins_types_note_evaluation` : `devoir` id 2, `examen` id 3) ; créer les variantes « Devoir 1 » / « Devoir 2 » si la distinction de semestre doit être visible dans les bulletins (arbitrage D10)
  - [ ] pour chaque cours + année + type : une `ins_listes_notes_evaluation` (`coursId`, `typeNoteEvaluationId`, `anneeAcademiqueId`, `poids`, `statutGestion`)
  - [ ] pour chaque étudiant : un `ins_cours_participants` (`utilisateurId`, `coursId`, `cursusApprenantId` — **requis `NOT NULL`**, cf. D9)
  - [ ] une `ins_notes_evaluation` par note (`listeNoteEvaluationId`, `coursParticipantId`, `note`, `statut`)
  - [ ] la note consolidée porte `listeNoteEvaluationId` / `noteEvaluationId` dans `elearning_soumissions_devoirs` (traçabilité dans les deux sens)
- [ ] Écrans : devoirs groupés par semestre, dépôt, consultation de la correction et de l'observation

**Critères d'acceptation**
- [ ] Le 3ᵉ devoir de l'année pour un même cours est refusé (message explicite).
- [ ] Une note saisie dans le pôle e-learning est **visible dans le dispositif de notes** et reportée dans le bulletin de l'étudiant.
- [ ] L'observation de correction est lisible par l'étudiant.
- [ ] Un dépôt hors délai est refusé avec un motif clair.
- [ ] Le module `notes`/`bulletins` n'a subi **aucune modification de schéma**.

---

### L6 — Examens présentiels confidentiels 🟠 (~5 j)

- [ ] `elearning_examens` (nouvelle table) : `coursId`, `anneeAcademiqueId`, `semestre`, `dateExamen`, `lieu`, `duree`, `sujet` (fichier), `statut`, `sessionExamenId` (rattachement facultatif à `ins_sessions_examens`)
- [ ] Dépôt du sujet par l'admin / le chargé de support uniquement
- [ ] **Confidentialité** : un étudiant ne peut **jamais** obtenir le sujet — ni par endpoint, ni par URL devinée, ni par le catalogue, ni par la liste des fichiers
- [ ] Endpoint de consultation réservé aux habilités (`GET /elearning/examens/:id/sujet`)
- [ ] Version **imprimable** du sujet (`GET /elearning/examens/:id/impression`)
- [ ] Saisie de la note après passage → consolidation `ins_notes_evaluation` (type `examen`)
- [ ] Écran de convocation côté étudiant (date, lieu, consigne) **sans** le sujet

**Critères d'acceptation**
- [ ] Un appel étudiant sur `/elearning/examens/:id/sujet` renvoie `403`.
- [ ] Un appel étudiant sur `/elearning/examens/:id/impression` renvoie `403`.
- [ ] L'URL brute du fichier sujet est inatteignable.
- [ ] Un utilisateur habilité peut imprimer le sujet.
- [ ] La note d'examen apparaît dans le bulletin de l'étudiant.

---

### L7 — Rôle « chargé de support », permissions et journal d'audit 🟠 (~4 j)

- [ ] Nouveau rôle `charge_support` dans `src/core/enums/RolesUtilisateur.ts` (15ᵉ rôle) — arbitrage D3
- [ ] Permissions dédiées (semis dans `src/core/data/reference-data.ts`, l. 175-181 et 531-536) :
  - `menu.elearning.contenus` (publier supports et devoirs)
  - `menu.elearning.examens` (déposer les sujets, organiser les sessions)
  - `action.elearning.cours.creer` / `.modifier` / `.publier` / `.desactiver`
  - `action.elearning.devoir.noter`
  - `action.elearning.examen.noter`
- [ ] Entrées de menu dédiées pour le chargé de support (dépôt de supports, publication de devoirs, organisation des examens)
- [ ] Table `elearning_audit` alimentée sur **les** événements : création/publication/désactivation d'un cours, saisie et annulation d'un encaissement, proposition/retrait/soumission d'une sélection, décision du comité, déblocage/reblocage d'un accès, correction d'un devoir, saisie d'une note, publication d'un sujet d'examen
- [ ] Écran de consultation du journal (admin / institution), filtrable par étudiant, cours, action et date
- [ ] Règles d'accès : les opérations de gestion (publier, noter, déposer) sont refusées à l'étudiant, y compris `en_ligne`

**Critères d'acceptation**
- [ ] Un compte `charge_support` peut publier un support et un devoir, et ne peut pas valider une sélection.
- [ ] Un étudiant ne peut appeler aucune des routes de gestion (403).
- [ ] Chaque opération listée ci-dessus laisse **une** ligne de journal horodatée avec l'acteur.
- [ ] Le journal est consultable et filtrable.

---

### L8 — Conditionnement « période = en_ligne » et restriction des pôles 🔴 (~3 j)

**Objectif** : l'étudiant `en_ligne` n'accède qu'au pôle e-learning.

- [ ] Garde frontend **nouveau** : `src/app/core/guards/periode-en-ligne.guard.ts`
  - si l'utilisateur est `apprenant` et `apprenant.periode === 'en_ligne'` et la route n'est pas dans le périmètre autorisé → redirection vers `/pole-elearning` (avec message explicite)
- [ ] Périmètre autorisé pour un étudiant `en_ligne` : pôle e-learning, profil, notifications, messagerie interne, et les écrans strictement nécessaires au parcours (catalogue, budget, sélections, mes cours, devoirs, examens)
- [ ] Application du garde dans `src/app/app-routing.module.ts` sur les routes hors périmètre
- [ ] Filtrage **serveur** du menu : `src/modules/menu/MenuRoutes.ts` — pour un étudiant `en_ligne`, ne renvoyer que le pôle e-learning
- [ ] Middleware backend `BlocagePolesEnLigne` appliqué après `Authenticate` (`src/app.ts`) : liste blanche d'routes (e-learning, profil, notifications) ; les autres renvoient `403` motivé
  - *Attention* : le middleware ne doit toucher **à aucun contrôleur** des autres modules ; il s'applique à la porte d'entrée.
- [ ] Garde serveur inverse : le pôle e-learning **exige** la période `en_ligne` pour les étudiants (les rôles de gestion sont exemptés)
- [ ] Interdiction explicite pour l'étudiant `en_ligne` : dépôt de bordereaux, achat d'autres UE, import de devoirs traités, et tout autre pôle non nécessaire
- [ ] État des lieux desfixtures : **aucun** étudiant `en_ligne` n'existe en base (80 `NULL`, 28 `matin`, 28 `soir`) → la recette doit créer des fixtures `en_ligne`

**Critères d'acceptation**
- [ ] Un étudiant `en_ligne` qui saisit l'URL d'un autre pôle est redirigé vers `/pole-elearning` (front) et refusé en API (403).
- [ ] Le menu d'un étudiant `en_ligne` ne contient que le pôle e-learning.
- [ ] Un étudiant `matin` ou `soir` n'accède pas aux écrans e-learning réservés aux étudiants `en_ligne` (écran générique exclu).
- [ ] Un enseignant, un admin ou un chargé de support accèdent au pôle e-learning sans être en période `en_ligne`.
- [ ] Les flux des étudiants `matin` / `soir` sont **inchangés** (aucune régression sur les scénarios E2E existants).

---

## 7. Recette E2E à produire

Socle existant réutilisé tel quel : `e2e-a-z-lib.cjs` (`call()`, `check()`, `summary()`, `tokenFor()`, fixtures SQL + purge, journalisation). **Aucune modification de `src/`** par les tests.

| # | Scénario | Fichier | Points vérifiés |
|---|---|---|---|
| 1 | Tarification et cycle de vie | `e2e-elearning-tarification.cjs` | coût calculé, changement de tarif, non-rétroactivité, brouillon/publie/désactivé |
| 2 | Enveloppe et saisie recouvrement | `e2e-elearning-enveloppe.cjs` | saisie du montant, solde, annulation, réversibilité, mouvement portefeuille |
| 3 | Sélection et contrôle budgétaire | `e2e-elearning-selection-budget.cjs` | dans la limite / au-delà (refus motivé), retrait, doublon, coût figé |
| 4 | Accès aux contenus payants | `e2e-elearning-acces-contenus.cjs` | non payé → 403 ; payé et sélectionné → 200 ; URL brute → refus |
| 5 | Décision du comité et déblocage | `e2e-elearning-comite-deblocage.cjs` | acceptation (débit + déblocage), refus (pas de débit), solde exact |
| 6 | Devoirs semestriels et consolidation | `e2e-elearning-devoirs-notes.cjs` | 2 devoirs/an, dépôt, correction, observation, note visible dans le dispositif de notes |
| 7 | Examen confidentiel | `e2e-elearning-examen-confidentiel.cjs` | dépôt, refus étudiant, impression, saisie de note |
| 8 | Conditionnement période | `e2e-elearning-periode.cjs` | `matin`/`soir` exclus, `en_ligne` accepté, restriction des pôles, menu filtré |
| 9 | **Parcours complet** (bout en bout) | `e2e-elearning-parcours-complet.cjs` | enchaînement inscription → recouvrement → sélection → comité → validation → accès exclusif |

**Règles de recette**
- Chaque scénario purge ses données et ne laisse aucun orphelin (cf. OBS-01 : la suppression d'un utilisateur laisse des demandes orphelines en `ON DELETE SET NULL` — même vigilance sur les tables e-learning).
- Les fixtures `en_ligne` doivent être créées en SQL (aucun étudiant `en_ligne` n'existe en base).
- Intégrer les nouveaux scénarios à l'orchestrateur `e2e-parcours-a-z.cjs` (option `--scenarios=...`).

---

## 8. Arbitrages

### 8.1 Décisions déjà tranchées par le métier

| # | Décision | Conséquence technique |
|---|---|---|
| M1 | L'étudiant choisit `en_ligne` **parmi** jour/soir | `aut_apprenants.periode` reste l'unique source de vérité |
| M2 | Le **service de recouvrement saisit le montant** | Le montant n'est pas un tarif automatique : c'est une saisie libre d'enveloppe |
| M3 | L'étudiant **choisit ses UE dans la limite de la somme saisie** | Contrôle de plafond serveur, refus motivé |
| M4 | **Passage au comité** avant tout accès | La consommation du budget n'a lieu qu'à la validation |
| M5 | En `en_ligne`, **accès exclusif au pôle e-learning** | Restriction des pôles + garde serveur (L8) |

### 8.2 Arbitrages techniques restants

| # | Question | Recommandation | Impact si non tranché |
|---|---|---|---|
| **D1** | Le cours e-learning est-il une UE (1-1) ou un regroupement d'UE ? | `elearning_cours` reste maître ; `ueId` (vers `ins_cours`) est une FK **optionnelle** | Redondance filière/niveau/année entre deux tables |
| **D2** | Source de vérité du paiement | **Aucun second solde** : l'enveloppe e-learning est la référence du pôle ; `cpt_portefeuille_credit` sert de **journal de mouvements** | Deux soldes qui divergent |
| **D3** | « Chargé de support » : rôle dédié ou enseignant délégué ? | Rôle dédié `charge_support` | Permissions diluées, responsabilité non identifiée |
| **D4** | Organisation de l'examen présentiel des étudiants `en_ligne` (lieu, convocation) | Rattacher la session au cours e-learning + année, sans supposer le dispositif présentiel existant | §4 non livrable |
| **D5** | Tarif du crédit : global ou différencié ? | Global + versioning (`elearning_tarifs_credit`), différenciation possible plus tard | Refonte du modèle de sélection |
| **D6** | Report de budget non consommé ? | Oui — le solde restant reste disponible sur l'année | Refonte du modèle de solde |
| **D7** | Versionnement des supports par année | Oui, `anneeAcademiqueId` sur `elearning_supports` et `elearning_modules` | Collision entre années |
| **D8** 🆕 | La décision du comité porte sur **le dossier d'inscription** ou sur **la sélection e-learning** ? | Les deux, articulés : le comité décide du dossier via le dispositif existant ; la sélection e-learning est **soumise** et sa consommation n'est définitive qu'après acceptation du dossier | Décision de comité qui ne débloque pas (ou débloque trop tôt) |
| **D9** 🆕 | Un étudiant `en_ligne` a-t-il un **cursus** (`ins_cursus_apprenants`) ? | Oui : `ins_cours_participants.cursusApprenantId` est `NOT NULL`, il est **indispensable** à la consolidation des notes. Créer un cursus « en ligne » (classe/année dédiées) ou rendre la FK nullable | Notes e-learning non consolidables dans les bulletins |
| **D10** 🆕 | Unité du montant saisi par le recouvrement | **Monétaire (FCFA)** pour l'enveloppe et les coûts ; les « crédits » restent un indicateur de la fiche cours (conversion via le tarif paramétré) | Comparaison impossible entre enveloppe et coût |
| **D11** 🆕 | Types d'évaluation « Devoir 1 » / « Devoir 2 » distincts ? | Créer deux types dans `ins_types_note_evaluation` (catégorie `devoir`) pour rendre le semestre visible dans les bulletins, si le métier le souhaite | Les deux devoirs du même cours se confondent dans les moyennes |

---

## 9. Séquence, jalons et charge

| Ordre | Lot | Durée | Blocant ? | Prérequis |
|---|---|---|---|---|
| 1 | **L0** Socle données | 3 j | 🟠 | — |
| 2 | **L1** Tarification et catalogue | 4 j | 🟠 | L0 |
| 3 | **L2** Enveloppe + saisie recouvrement | 5 j | 🔴 | L0, L1 |
| 4 | **L3** Sélection et contrôle budgétaire | 6 j | 🔴 | L2 |
| 5 | **L4** Comité, déblocage, **correction de la faille** | 5 j | 🔴 | L3 |
| 6 | **L5** Devoirs + consolidation des notes | 6 j | 🟠 | L0 (D9, D11) |
| 7 | **L6** Examens confidentiels | 5 j | 🟠 | L4 |
| 8 | **L7** Rôle chargé de support + audit | 4 j | 🟠 | L0 (parallélisable) |
| 9 | **L8** Conditionnement `en_ligne` | 3 j | 🔴 | L4 (parallélisable) |

> **Ordre imposé par le processus arbitré** : L2 (recouvrement) **avant** L3 (sélection), inverse de l'ordre initialement envisagé dans l'analyse d'écart (où l'encaissement intervenait après la sélection). L'enveloppe doit exister avant que l'étudiant puisse choisir.

**Vagues de livraison**

| Vague | Contenu | Seuil |
|---|---|---|
| **V0** — Cadrage | Arbitrages D1 → D11 tranchés, modèle gelé, migrations préparées | 2 j |
| **V1** — Socle | L0 + L1 | 1 sem. |
| **V2** — Monétisation | L2 + L3 + L4 (dont la correction de la faille de diffusion) | 1,5 sem. — **seuil minimal de livraison** |
| **V3** — Pédagogie | L5 | 1 sem. |
| **V4** — Examens | L6 | 1 sem. |
| **V5** — Gouvernance | L7 + L8 | 0,5 sem. |

**Charge totale** : ~41 jours-homme (≈ 8 à 9 semaines-homme). Le socle technique existant est réutilisé à ~70 % (arborescence, quiz, progression, chat, certificats, upload, notifications).

---

## 10. Définition de « terminé » (globale)

- [ ] Les 9 lots sont livrés et leurs critères d'acceptation respectés.
- [ ] Les 9 scénarios E2E sont au vert, intégrés à `e2e-parcours-a-z.cjs`.
- [ ] La faille de diffusion des supports est fermée (test d'URL brute négatif).
- [ ] Un étudiant `en_ligne` parcourt le flux complet **sans jamais** accéder à un autre pôle.
- [ ] Les notes e-learning apparaissent dans le bulletin sans modification du module `bulletins`.
- [ ] Le journal `elearning_audit` retrace toutes les opérations de gestion.
- [ ] Les scénarios E2E historiques restent au vert (134 ✅ / 5 ❌ dus à BUG-01, cf. `docs/RAPPORT-BUGS-E2E-2026-10-21.md`) — **aucune régression**.
- [ ] Documentation à jour : `docs/ANALYSE-COURS-EN-LIGNE.md` (écarts), ce document (TODO), `docs/06-ELEARNING.md` (périmètre fonctionnel).

---

## 11. Hors périmètre — rappel

Ce chantier **ne modifie pas** : l'inscription, les frais de scolarité, les notes classiques, les bulletins, les documents, la comptabilité, la détection de présence, le rattrapage, les autres pôles.
Toute évolution de ces modules imposée par le chantier doit être **demandée explicitement** et faire l'objet d'un lot séparé.
