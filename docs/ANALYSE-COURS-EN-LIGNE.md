# Analyse d'écart et plan de réalisation — Pôle « Cours en ligne » (E-Learning)

> **Périmètre strict** : le pôle cours en ligne uniquement.
> **Hors périmètre (reste tel quel)** : inscription, frais de scolarité, notes classique, bulletins, documents, comptabilité — aucun de ces modules n'est modifié dans le cadre de ce chantier.
> Date : 2026-10-21 · Sources : code `easy-ecole-backend` + `easy-ecole-web`, base `easyecole` (318 tables), recette E2E du 2026-10-21.

---

## 1. Synthèse pour la direction

Le pôle **cours en ligne existe et fonctionne techniquement**, mais il est aujourd'hui un simple **catalogue de contenus** : création de cours, dépôt de vidéos/PDF, devoirs, quiz, progression, chat. **Aucune des trois exigences économiques du cahier des charges n'est en place** :

| Exigence du cahier des charges | État actuel | Verdict |
|---|---|---|
| Tarification par crédits (§9.1, §9.2) | Aucun crédit, aucun prix sur un cours e-learning | **Absent** |
| Contrôle budgétaire de la sélection (§5, §9.4) | Aucune notion de solde, de sélection, de coût | **Absent** |
| Verrouillage des contenus payés (§2, §7, §8.7) | Supports et devoirs accessibles à tout étudiant authentifié | **Absent — faille ouverte** |
| Deux devoirs semestriels par cours (§3, §4) | Devoirs génériques, sans semestre ni année | **Absent** |
| Examen présentiel confidentiel (§4) | Aucun traitement dans le pôle e-learning | **Absent** |
| Notes rattachées aux bulletins (§6) | Note stockée à côté de la soumission, jamais consolidée | **Absent** |
| Rôle « chargé de support » (§7) | 14 rôles, aucun ne correspond | **Absent** |
| Journalisation des opérations (§8.10) | Aucune trace | **Absent** |
| Conditionnement à la période « en ligne » | `aut_apprenants.periode` existe mais n'est exploitée nulle part | **Absent** |

**Estimation de charge** : 7 lots, ~4 à 5 semaines-homme de développement sur la base du code existant (le socletechnique est réutilisable à ~70 %). **Le lot 2 (contrôle budgétaire) est le point de bascule** : sans lui, le pôle ne peut pas être facturé.

---

## 2. État des lieux technique (constats)

### 2.1 Backend — module `src/modules/elearning/` (monté sur `/api/v1/elearning`)

| Table | Colonnes | Lignes | Manquants vs cahier des charges |
|---|---|---|---|
| `elearning_cours` | `coursId` (varchar), `titre`, `description`, `image`, `statut` (libre, défaut `actif`), `enseignantId`, `format` (video/pdf/mixte) | 2 | code, filière, niveau, année académique, nb crédits, prix du crédit, coût total, chargé de support, statut typé (brouillon/publié/désactivé) |
| `elearning_modules` | `coursId`, `titre`, `description`, `ordre`, `dateDisponible` | 3 | aucun (support commun aux 2 semestres : conforme) |
| `elearning_supports` | `moduleId`, `type`, `fichierOriginal`, `fichierCompresse`, `dureeVideo`, `taille` | 3 | rattachement année académique, **contrôle d'accès payant** |
| `elearning_devoirs` | `titre`, `description`, `dateLimite`, `fichier`, `coursId`, `enseignantId` | 0 | semestre, année académique, publication, règle 2 devoirs/cours/année |
| `elearning_soumissions_devoirs` | `fichier`, `note` (float), `commentaire`, `dateSoumission`, `devoirId`, `apprenantId` | 0 | rattachement année/semestre/type d'évaluation pour consolidation bulletins |

Points d'attention relevés :

1. **Aucune occurrence de « paiement / payé / crédit / solde / sélection » dans tout le module e-learning.** Le contrôle budgétaire décrit au §5 n'a aucun support technique.
2. **Les supports ne sont servis que par le middleware statique `/media/videos`** (`src/app.ts` l. 125), donc **sans aucune authentification**. Un contrôle d'accès au niveau applicatif ne suffira pas : le diffusion des fichiers devra passer par un point d'entrée authentifié.
3. **Contrôles de rôle quasi inexistants** : `DevoirController` vérifie seulement « APPRENANT interdit » (l. 82, 118, 143) ; `SupportController.getAll/get` ne filtrent rien (l. 4-22). Le rôle « chargé de support » n'existe pas dans `RolesUtilisateur` (14 rôles, aucunuhan elearning dédié).
4. **Aucun journal d'audit** dans le module (0 occurrence de `audit`/`journal`).
5. Le lien `elearning_cours.coursId` est un **varchar** pointant vers `ins_cours.id` (UE) : aucune intégrité référentielle, pas de clé étrangère.
6. L'arborescence du catalogue (`ArborescenceElearningService`) sait déjà rattacher les cours e-learning aux UE / parcours / niveaux / classes : c'est un acquis réutilisable.

### 2.2 Frontend — `easy-ecole-web/src/app/features/modules/`

- **`/elearning`** (module lazy) : `dashboard` (Mes cours), `videos`, `pdfs`, `quiz/*`, `progression`, `certificats`, `devoirs`, `devoirs/:id`, `catalogue` (arborescence), `admin/gestion`, `:id` (détail), `:id/player`, `:id/chat`, `:id/upload`.
- **`/pole-elearning`** : page d'accueil student'sp dedicated (une seule page, redirection vers `/elearning/dashboard`).
- Aucun écran de **catalogue tarifé**, de **sélection de cours**, de **paiement**, de **solde**, ni de **saisie de note d'examen**.
- Aucun garde conditionnant l'accès à la période de l'étudiant.
- Menus et permissions e-learning déjà semés dans `src/core/data/reference-data.ts` (l. 175-181, 531-536) — la mécanique de permissions est prête à être enrichie.

### 2.3 Actifs réutilisables (ne pas reconstruire)

- Dispositif de **frais et de portefeuille de crédits** : `cpt_parametres_frais` (paramètre clé/valeur/module/type), `cpt_portefeuille_credit` (66 lignes : type credit/consommation/ajustement, `montant`, `soldeCourant`, `bordereauId`), `ins_frais_scolarites`, `ins_paiements_inscription`.
- Dispositif de **notes et de bulletins** : `ins_notes_evaluation`, `ins_listes_notes_evaluation`, `ins_publications_notes`, `ins_types_note_evaluation`, `ins_audit_notes`, `rpt_notes_moyennes`.
- **Période de l'étudiant** : `aut_apprenants.periode` = enum(`matin`, `soir`, `en_ligne`).
- Mécanique **rôles + permissions + menus** (seed + `CheckPermission` + bypass ADMIN) et **arborescence e-learning**.

> **Conséquence directe de la consigne « les autres restent tels quel »** : le paiement e-learning doit **consommer le portefeuille de crédits existant**, pas créer un second dispositif de facturation. De même, les notes de devoirs/examens e-learning doivent **atterrir dans le dispositif de notes existant** pour être reprises dans les bulletins, sans refonte du module notes.

---

## 3. Écarts fonctionnels détaillés

| # | Exigence | Écart | Criticité |
|---|---|---|---|
| E1 | §9.1 Fiche cours complète (code, filière, niveau, année, crédits, prix, chargé de support, professeur, statut) | 11 attributs sur 16 absents ou non typés | **Bloquant** |
| E2 | §9.2 Coût = crédits × prix du crédit, calculé automatiquement | Aucun champ, aucun calcul | **Bloquant** |
| E3 | §9.2 Tarif changeable sans rétroactivité sur paiements/sélections | Pas de tarif, pas d'historique | **Bloquant** |
| E4 | §9.3 / §9.5 Brouillon → publié → désactivé, historique préservé | `statut` est un texte libre | Élevé |
| E5 | §5 / §9.4 Contrôle budgétaire de la sélection multi-cours | Entièrement absent | **Bloquant** |
| E6 | §2 / §8.7 Verrouillage des supports et devoirs non payés | Absent + fichiers servis en statique | **Bloquant (faille)** |
| E7 | §5.1-5.2 Enregistrement du paiement par l'agent de recouvrement et mise à jour du solde | Aucun flux | Élevé |
| E8 | §3 Deux devoirs/an (S1 + S2), sujet PDF publié, dépôt PDF, correction + observation | Devoirs génériques sans semestre/année/publication | Élevé |
| E9 | §4 Examen présentiel : sujet confidentiel, téléversé par l'admin, consultable par habilités, imprimable, jamais par l'étudiant, note saisie après passage | Aucun traitement dans le pôle | Élevé |
| E10 | §6 Notes rattachées étudiant / cours / semestre / année / type d'évaluation | Note locale à la soumission, jamais consolidée | Élevé |
| E11 | §7 Rôle « chargé de support » | Rôle inexistant, permissions e-learning à enrichir | Moyen |
| E12 | §8.10 Journalisation des opérations importantes | Aucune trace | Élevé |
| E13 | Conditionnement « période = en_ligne » | Donnée existante non exploitée | Moyen |
| E14 | §9.3 Publication → apparition au catalogue, credits et coût affichés | Catalogue sans coût ni filtre de statut | Moyen |

---

## 4. Découpage en lots et priorisation

### Lot 0 — Socle données et paramétrage (S / ~3 j) — **Préalable à tout**
- Compléter `elearning_cours` : `code`, `filiereId`, `niveauEtudeId`, `anneeAcademiqueId`, `nbCredits`, `prixCredit`, `coutTotal` (calculé côté serveur), `chargeSupportId`, `professeurId`, `statut` typé, `anneeAcademiqueId` sur `elearning_supports`.
- Historiser le tarif du crédit (date d'effet) pour satisfaire la non-rétroactivité.
- Transformer `elearning_cours.coursId` en véritable clé étrangère vers `ins_cours` (optionnelle, non bloquante).
- Créer `elearning_selections_cours` (etudiant, cours, année, crédits, **coût figé**, statut, référence de paiement).
- Migration non destructive : les 2 cours et 3 modules existants restent exploitables (valeurs par défaut).

### Lot 1 — Tarification, catalogue et cycle de vie (M / ~4 j) — **Important**
- Paramètre « prix du crédit » (via `cpt_parametres_frais` ou table dédiée versionnée).
- Calcul automatique du coût, recalcul si le tarif change, sans toucher aux sélections validées.
- Workflow brouillon → publié → désactivé ; filtre du catalogue sur les cours publiés et l'année académique ; affichage crédits + coût.

### Lot 2 — Sélection et contrôle budgétaire (L / ~6 j) — **BLOQUANT, priorité 1**
- Solde disponible de l'étudiant (lecture du portefeuille de crédits existant).
- Sélection multi-cours : totalisation, comparaison au solde, refus motivé, retrait de cours, paiement complémentaire demandé.
- Verrouillage effectif : supports et devoirs accessibles **uniquement** si le cours est payé **et** sélectionné — y compris sur le canal de diffusion des fichiers (point technique à trancher : endpoint authentifié ou URL signée).

### Lot 3 — Encaissement et déblocage (M / ~4 j) — **BLOQUANT, priorité 1**
- Enregistrement du paiement par l'agent de recouvrement, mise à jour du solde, bascule automatique des sélections en « payé », déblocage des accès.
- Réversibilité : annulation de paiement → reblocage, avec trace.

### Lot 4 — Devoirs semestriels et consolidation des notes (L / ~6 j) — **Important**
- Semestre + année académique + publication des devoirs ; règle « 2 devoirs par cours et par année » contrôlée côté serveur.
- Dépôt PDF par l'étudiant, correction + observation par le professeur, note conservée.
- **Pont vers le dispositif de notes existant** (types DEVOIR 1 / DEVOIR 2) pour que les bulletins intègrent les résultats e-learning.

### Lot 5 — Examens présentiels confidentiels (M / ~5 j) — **Important**
- Sujet d'examen téléversé par l'admin, **jamais** exposé à l'étudiant (y compris par URL), consultable par les utilisateurs habilités, **imprimable**.
- Organisation de la session d'examen rattachée au cours e-learning et à l'année académique.
- Saisie de la note après passage par un utilisateur habilité, type d'évaluation EXAMEN.

### Lot 6 — Rôle « chargé de support », permissions et audit (M / ~4 j) — **Important**
- Nouveau rôle `charge_support` (ou permission déléguée — **à arbitrer**) + entrées de menu dédiées (déposer/publier supports et devoirs).
- Journalisation des événements : paiement, sélection, déblocage, correction, note, publication, désactivation.

### Lot 7 — Conditionnement « période en ligne » (S / ~2 j) — **Important**
- Le pôle n'est proposé qu'à l'étudiant dont `aut_apprenants.periode = 'en_ligne'` (garde d'interface + contrôle serveur), conformément à la demande explicite.

**Séquence recommandée : Lot 0 → 1 → 2 → 3 → 4 → 5, avec 6 et 7 en parallèle à partir du Lot 0** (6 alimente tous les lots, 7 est indépendant).

---

## 5. Points d'arbitrage (décisions attendues du métier)

| # | Question | Recommandation technique | Impact si non tranché |
|---|---|---|---|
| D1 | Le cours e-learning est-il une UE (1-1) ou un regroupement d'UE ? | `elearning_cours` reste maître pour le e-learning ; le rattachement à `ins_cours` devient une clé étrangère **optionnelle** | Redondance de données filière/niveau/année entre deux tables |
| D2 | Quelle source de vérité pour le paiement ? | **Réutiliser** `cpt_portefeuille_credit` (portefeuille existant) ; l'e-learning ne stocke que le lien vers l'opération | Double dispositif de solde, incohérences comptables |
| D3 | Qui est « chargé de support » : un rôle dédié ou un enseignant délégué ? | Rôle dédié `charge_support` + permissions ; plus simple à auditer | Permissions diluées, pas de responsabilité identifiée |
| D4 | Comment se passe l'examen présentiel des étudiants « en ligne » (lieu, convocation, whoOrganise) ? | Prévoir un rattachement de la session d'examen au cours e-learning et à l'année, sans supposer le dispositif | §4 non livrable |
| D5 | Le tarif du crédit est-il global ou différencié (par filière/niveau/année) ? | Global + versioning, différenciation possible plus tard | Refonte du modèle de sélection |
| D6 | Un étudiant paye-t-il un cours, ou accumule-t-il des crédits/reportables ? | Le cahier des charges décrit un solde → **crédits reportables**, le solde restant après sélection reste disponible | Refonte du modèle de solde |
| D7 | Le support « commun aux deux semestres » doit-il être versionné par année ? | Oui, rattachement année académique, une version courante | Collision entre années |

---

## 6. Risques

| Risque | Probabilité | Impact | Parade |
|---|---|---|---|
| Fuite de contenus payants (diffusion statique `/media/videos`) | **Élevée** | Fort — contenu premium accessible gratuitement | Traiter dans le Lot 2, en priorité absolue |
| Deux sources de vérité sur le cours (UE vs e-learning) | Élevée | Moyen — incohérences d'affichage | Décision D1 avant le Lot 0 |
| Rupture de lien avec les bulletins (notes non consolidées) | Moyenne | Fort — résultats e-learning invisibles en fin d'année | Pont vers `ins_notes_evaluation` prévu au Lot 4 |
| Sous-estimation de la charge « audit + permissions » | Moyenne | Moyen | Lot 6 mené en parallèle, pas en fin de projet |
| Absence de données de référence (2 cours, 0 devoir) | Certaine | Moyen | Jeu de fixtures de recette (section 7) |
| Contournement par l'API si le verrou n'est que front | Moyenne | Fort | Contrôle serveur systématique sur chaque endpoint de contenu |

---

## 7. Recette (E2E) à construire

Reprise de la methodology existante (`e2e-a-z-lib.cjs`, style `check()` / `summary()`, fixtures SQL + purge, **sans modification de `src`**).

Scénarios à produire :
1. `e2e-elearning-tarification.cjs` — création d'un cours avec crédits, calcul du coût, changement de tarif, non-rétroactivité sur une sélection validée.
2. `e2e-elearning-selection-budget.cjs` — solde suffisant / insuffisant, refus motivé, retrait de cours, paiement complémentaire, déblocage après paiement.
3. `e2e-elearning-acces-contenus.cjs` — étudiant non payé : accès refusé aux supports et aux devoirs ; étudiant payé et sélectionné : accès autorisé ; contrôle du canal de diffusion des fichiers.
4. `e2e-elearning-devoirs-notes.cjs` — 2 devoirs par semestre, dépôt, correction, observation, consolidation dans le dispositif de notes.
5. `e2e-elearning-examen-confidentiel.cjs` — dépôt du sujet, confidentialité (étudiant = refus), impression par l'admin, saisie de note.
6. `e2e-elearning-periode.cjs` — étudiant `matin`/`soir` sans accès au pôle, étudiant `en_ligne` avec accès.

Chaque scénario doit purge ses données et ne pas laisser d'orphelin (cf. `OBS-01` : suppression d'un utilisateur laisse des demandes orphelines en `ON DELETE SET NULL` — même vigilance sur les tables e-learning).

---

## 8. Feuille de route proposée

| Vague | Durée indicative | Livrables |
|---|---|---|
| **V0 — Cadrage** | 2 j | Arbitrages D1→D7 tranchés, modèle de données gelé, migrations préparées |
| **V1 — Socle** | 1 sem. | Lots 0 + 1 (données, tarifs, catalogue, cycle de vie) |
| **V2 — Monétisation** | 1,5 sem. | Lots 2 + 3 (sélection, contrôle budgétaire, encaissement, verrouillage) + correctif de fuite |
| **V3 — Pédagogie** | 1 sem. | Lot 4 (devoirs semestriels + consolidation notes) |
| **V4 — Examens** | 1 sem. | Lot 5 (sujets confidentiels + impression + notes) |
| **V5 — Gouvernance** | 0,5 sem. | Lots 6 + 7 (rôle chargé de support, audit, conditionnement période) |

** jalon de recette :** la V2 rend le pôle monétisable et sécurisé — c'est le seuil minimal de livraison d'un « cours en ligne » conforme au cahier des charges.

---

## 9. Ce qui a été fait en amont (contexte)

Le socle de recette E2E est prêt et réutilisable tel quel pour ce chantier :
- `e2e-a-z-lib.cjs` — socle commun (JWT, MySQL, appels HTTP journalisés, fixtures SQL, purge).
- `e2e-creation-utilisateur.cjs`, `e2e-session-creation.cjs`, `e2e-demandes-documents.cjs`, `e2e-fonctionnalite-generale.cjs` — 4 scénarios au vert (134 contrôles OK) sauf 5 échecs imputables à BUG-01.
- `e2e-parcours-a-z.cjs` — orchestrateur (tableau de bord + rapport horodaté).
- Diagnostic des anomalies applicatives : `docs/RAPPORT-BUGS-E2E-2026-10-21.md` (BUG-01 → BUG-08 + OBS-01).
