# PLAN DE PROJET — EasyEcole

**Système de gestion académique & ERP comptable**
Dernière mise à jour : 02/08/2026 (+ Programme RH paie/HAO) — Statut : en exécution

---

## 1. Synthèse de l'avancement

| # | Lot | Sujet | Statut | Commit |
|---|---|---|---|---|
| 0 | Stabilisation | .gitignore, fondations, GED, compta, inscription, frontend, scripts | LIVRE | 678b98c → 98a41e2 |
| 2 | Salles paramétrables | Affectation classe / filière / établissement / "à tout", filtres combinés | LIVRE | 14e3375 |
| 3 | Scan QR / pointage | Vérification paiement au scan, sons distincts (bip aigu / double-bip grave) | LIVRE | 788d3cd |
| 1 | Quick wins | Page dossiers arborescente, notes < 10 en rouge | LIVRE | 9377fc7 |
| 4 | Alertes échéances | Cron quotidien + notifications + widget dashboard étudiant | LIVRE | 4c89c36 |
| 5 | Registres académiques | Filière/niveau, génération auto depuis délibération, arbre | LIVRE | 4a3f0fe |
| 6 | Clôture de semestre | Semestre persistant, gel des notes, passation | EN COURS (IA externe) | — |
| S0-S4 | États financiers SYSCOHADA | Dossier complet 60+ pages (bilan, CR, TAFIRE, ETATC) | A PLANIFIER | — |
| F1-F3 | Compta complémentaire | Clôture exercice, flux trésorerie/SIG/KPIs, connexions + TVA | A PLANIFIER | — |
| R1-R5 | Programme RH | Paie prestataires (pointages → heures → HAO), charges Togo, congés, suivi quota | A PLANIFIER | — |
| EL1-EL3 | E-Learning arborescent | Rattachement hiérarchique + catalogue en arbre Année → Parcours → Filière → Niveau | A PLANIFIER | — |
| 7 | Arborescence généralisée | Effectifs, présences, notes, enseignants | A PLANIFIER | — |

---

## 2. Vision d'ensemble

- **P1 — Programme pédagogique** : Lots 0 à 7 (gestion académique complète).
- **P2 — Programme ERP comptable SYSCOHADA** : états financiers conformes à la norme OHADA, générés automatiquement (priorité actuelle du programme comptable).
- **P3 — Améliorations transverses** : arborescence partout, sécurité des fichiers.
- **P4 — Programme RH (Togo)** : paie des enseignants prestataires, Heures Hors Activité Ordinaire (HAO), congés, charges sociales — tout paramétrable depuis l'application.
- **P5 — Programme E-Learning** : module en ligne rendu **arborescent** (Année → Parcours → Filière → Niveau → Cours) pour toutes ses entités (cours, devoirs, quiz, supports, certificats, progression).

---

## 3. ERP école — modules comptables et RH attendus

Pour une école, l’ERP doit couvrir deux grands axes :
- la gestion financière et comptable de l’établissement,
- la gestion des ressources humaines et de la paie.

### 3.1 Modules comptables

1. Plan comptable paramétrable
   - classes comptables OHADA/SYSCOHADA,
   - comptes de trésorerie, dettes, charges, produits, capitaux propres.
2. Gestion des exercices comptables
   - ouverture/fermeture d’exercice,
   - clôture automatique,
   - report à nouveau.
3. Écritures comptables et journal
   - saisie manuelle ou automatique,
   - journal général,
   - grand livre,
   - balance.
4. États financiers
   - bilan,
   - compte de résultat,
   - TAFIRE,
   - annexes et notes réglementaires.
5. Trésorerie et banque
   - comptes bancaires,
   - relevés bancaires,
   - rapprochements,
   - suivi de la trésorerie.
6. Gestion des paiements et frais scolaires
   - frais d’inscription,
   - échéances,
   - quittances,
   - relances,
   - dettes et régularisations.
7. Achats et fournisseurs
   - factures fournisseurs,
   - engagements,
   - paiements fournisseurs,
   - rapprochements.
8. Immobilisations
   - inventaire,
   - amortissement,
   - suivi des biens.

### 3.2 Modules RH et paie

1. Référentiel RH
   - employés,
   - enseignants,
   - contrats,
   - postes,
   - statuts,
   - catégories professionnelles.
2. Gestion des absences et congés
   - demandes de congé,
   - validation RH,
   - suivi des soldes.
3. Pointage et présence
   - pointages des enseignants,
   - contrôle des présences,
   - intégration aux calculs de paie.
4. Paie et bulletins
   - bulletin de paie automatique,
   - salaires, primes, heures supplémentaires,
   - avances, prêts, retenues.
5. HAO / prestations
   - heures hors activité ordinaire,
   - calculs paramétrables,
   - génération des écritures comptables associées.
6. Charges sociales et conformité
   - CNSS,
   - IR,
   - charges patronales,
   - reporting fiscal et social.
7. Recrutement et formations
   - candidatures,
   - entretiens,
   - évaluations,
   - formations suivies.
8. Reporting RH
   - masse salariale,
   - effectifs,
   - absences,
   - congés,
   - tableaux de bord.

### 3.3 Ce que l’ERP doit apporter concrètement

- automatiser la comptabilité à partir des événements métier : paiements, paie, achats, prestations,
- éviter la saisie manuelle dans plusieurs outils,
- offrir un tableau de bord de suivi financier et RH,
- garantir la traçabilité des opérations,
- permettre l’export PDF/Excel pour les responsables et la direction.

---

## 4. Programme pédagogique

### Lot 6 — Clôture de semestre & passation (EN COURS, confié à une IA externe)

**Cadrage produit validé :**
- Pas de redoublants ; les UE non validées **suivent l'étudiant** (dettes académiques).
- La clôture **gèle la saisie des notes**.

**Briques prévues :**
1. Semestre en cours **persistant** (par parcours × année académique), fin de l'heuristique de date.
2. Workflow de clôture : gel des notes → calcul des validations d'UE → génération des dettes → récapitulatif.
3. Lancement du semestre suivant : cours affichés = parcours ∩ semestre en cours.
4. Écran étudiant : UE validées en vert, non validées en rouge (réutilise l'existant).
5. Sécurités : clôture irréversible sans droit, blocage si notes en brouillon, permissions.

**À la livraison :** revue qualité complète (code-review), vérification tsc, correction des écarts, commit propre.

---

### Lot 7 — Arborescence généralisée (A PLANIFIER)

Principe : remplacer les tableaux plats par des arbres de navigation avec compteurs (même pattern que la page "Dossiers").

**Sous-lot A — Étudiants (2-3 j) :**
| Page actuelle | Arbre cible |
|---|---|
| Effectifs inscrits | Année → Filière → Classe → Étudiant |
| Présences (liste + saisie) | Classe → Cours → Séance → Étudiant |
| Notes (liste + saisie) | Filière → Semestre → UE → Étudiant |
| Cahiers de texte | Classe → Cours → Chapitres → Séances |

**Sous-lot B — Enseignants (2-3 j) :**
| Page actuelle | Arbre cible |
|---|---|
| Liste des enseignants | Filière → Cours enseignés → Enseignant |
| Emplois du temps | Semestre → Semaine → Cours |

Estimation : 4-6 j — Tokens : ~100-150k — Risque : faible.

---

## 4. Programme ERP Comptable — États financiers SYSCOHADA (PRIORITÉ)

### Contexte

La norme SYSCOHADA (OHADA) impose un dossier d'états financiers qui, imprimé, dépasse 60 pages. La priorité est de sortir un livrable opérationnel, cohérent avec l'existant, avant d'entrer dans la complexité de l'ETATC complet.

| État | Pages (env.) | État actuel dans l'app |
|---|---:|---|
| Bilan (format officiel) | 4-6 | Partiel, format simplifié |
| Compte de résultat (par nature) | 3-4 | Partiel, format simplifié |
| TAFIRE (ressources et emplois) | 2-3 | Manquant |
| ETATC (~25-30 notes annexes) | 40-60 | Manquant |

**Acquis vérifiés dans le code :**
- Écritures automatiques depuis les événements métier (paiements étudiants, inscriptions, paie, prestations, achats, immobilisations).
- Bilan et compte de résultat déjà calculés à partir des écritures, avec exports PDF/Excel.
- Plan comptable paramétrable, classes 1 à 9.

### Livrables attendus
- Un état financier de synthèse exportable au format PDF.
- Un dossier de clôture comptable consultable à l'écran et téléchargeable.
- Un jeu de données cohérent entre écritures, balances et états financiers.

### Lot S0 — Référentiel SYSCOHADA (~1 j, ~30-50k tokens)
- Valider la structure du plan comptable par rapport aux classes 1 à 9 et aux postes OHADA de base.
- Définir les postes de synthèse nécessaires au bilan, au compte de résultat et au TAFIRE.
- Clarifier ce qui est calculé automatiquement et ce qui reste paramétrable par l'utilisateur.

### Lot S1 — Bilan + Compte de résultat format officiel (~2-3 j, ~60-100k tokens)
- Refonte des générateurs PDF avec un format OHADA plus proche du standard officiel.
- Ajouter en-têtes réglementaires, numérotation des postes et présentation par grandes masses.
- Critère de fin : les documents sont cohérents, lisibles, exportables et conformes au niveau de synthèse attendu.

### Lot S2 — TAFIRE (~1-2 j, ~40-80k tokens)
- Générer automatiquement le tableau des ressources et emplois à partir des écritures de l'exercice.
- Calculer la variation du fonds de roulement et la cohérence avec le bilan.
- Critère de fin : le TAFIRE est calculé automatiquement et vérifiable par rapprochement.

### Lot S3 — ETATC, notes essentielles (~3-5 j, ~100-180k tokens)
- Produire les notes de base les plus utiles : immobilisations, stocks, créances, dettes, trésorerie, capitaux propres, engagements hors bilan.
- Rendre les notes alimentées automatiquement depuis la base, avec possibilité de paramétrage texte si nécessaire.
- Critère de fin : les notes principales sont disponibles et cohérentes avec les états de synthèse.

### Lot S4 — Assemblage du dossier (~1 j, ~30-50k tokens)
- Rassembler le dossier complet en une vue unique à l'écran et en export PDF unique.
- Ajouter sommaire, pagination, en-têtes et structure de lecture cohérente.
- Critère de fin : le dossier complet est téléchargeable en un clic et consultable sans rupture.

**Total S0-S4 : ~8-12 j — ~260-460k tokens**

---

## 5. Programme Comptable complémentaire

### Lot F1 — Clôture d'exercice automatique (~2-3 j, ~60-100k tokens)
1. Audit de l'existant (ExerciceComptable, ComptabiliteHelper).
2. Workflow : contrôles (balance équilibrée) → calcul du résultat → écritures de détermination (classe 12) → report à nouveau (classe 11) → clôture 6/7 → bilan d'ouverture.
3. UI : bouton "Clôturer l'exercice", récapitulatif, exercice clôturé en lecture seule.
4. Tests + tsc.

### Lot F2 — Flux de trésorerie + SIG + KPIs (~2-3 j, ~60-100k tokens)
- Tableau des flux (méthode indirecte), SIG (marge, VA, EBE, résultat…), dashboard financier (trésorerie, recouvrement, résultat), exports PDF/Excel.

### Lot F3 — Connexions modules + TVA (~3-4 j, ~80-120k tokens)
- Stocks → comptes 6/7 (sorties, corrections, rebuts, transferts).
- Marchés → engagements.
- Stages → facturation (si confirmé).
- TVA : taux, calcul, déclaration (si confirmé).

**Total F1-F3 : ~7-10 j — ~200-320k tokens**

---

## 6. Programme RH — Paie, HAO & pointages (Togo)

### Cadrage produit validé (02/08/2026)

- **Pays : Togo** — charges sociales togolaises.
- **HAO = Heures Hors Activité Ordinaire** : régime de rémunération des heures complémentaires des enseignants, au-delà du service ordinaire (quota annuel d'activité ordinaire par statut). Les heures dans le quota ne sont pas payées ; les heures HAO au-delà sont rémunérées au taux horaire du statut.
- **HAO = concept RH ET comptable** : les HAO sont des **charges de personnel** — chaque mois, les heures constatées génèrent automatiquement les **écritures comptables** (constatation de la charge → dette envers l'enseignant si paiement différé → lettrage au paiement), comme les paiements étudiants alimentent déjà la compta.
- **Source des heures : les pointages** (heures d'arrivée / de départ du module pointage) — pas de saisie manuelle.
- **Heures pointées brutes : aucune déduction** (pas de retrait de pause). Toute présence pointée compte (seuil minimal paramétrable, défaut : 0).
- **Règle prévu vs pointé, paramétrable** : le calcul compare l'**emploi du temps** (heures prévues) aux **pointages** (heures réelles). Si le prof était prévu 2 h et a pointé 3 h, le mode de prise en compte est choisi par paramétrage (ex. retenir le réel / le prévu / plafonner au prévu / tolérance).
- **Tout est paramétrable depuis l'application** : taux horaires, quotas, charges sociales, règles de calcul (prévu vs pointé, seuil, arrondi). Aucun taux ni règle en dur dans le code.

### Lots

### Lot R1 — Référentiel RH paramétrable (~1-2 j, ~40-70k tokens)
- Statuts enseignants (vacataire, permanent, assistant…), **quota annuel d'activité ordinaire** par statut (ex. 150 h), **taux horaire HAO** par statut.
- Charges sociales paramétrables : **CNSS** (part salariale ~4 % / patronale ~14 % — taux à confirmer, évoluent chaque année), **IR salarié**, autres prélèvements éventuels.
- Règles de calcul paramétrables : déduction de pause, seuil minimal d'une présence, arrondi.
- Écran de paramétrage centralisé (même pattern que le plan comptable).

### Lot R2 — Extraction des heures depuis les pointages (~2-3 j, ~60-100k tokens)
- Agrégation des pointages (arrivée/départ) de l'enseignant sur la période de paie → **heures effectives** selon les règles paramétrables (pause, seuil, arrondi).
- Contrôles de cohérence : pointage incomplet (arrivée sans départ), heure inversée, chevauchements.
- Détail consultable : jour par jour, corrigeable si anomalie (avec trace).

### Lot R3 — Calcul automatique des salaires prestataires (~2-3 j, ~60-100k tokens)
- Volume mensuel = heures HAO (au-delà du quota) → **bulletin prestataire automatique** (volume × taux horaire).
- **Écriture comptable automatique** à la génération du bulletin (réutiliser l'existant paie/prestations) :
  - constatation de la charge (comptes 64/65) le mois des heures prestées,
  - dette envers l'enseignant si paiement différé (compte 42/47),
  - lettrage automatique au paiement.
- Distinction nette : heures dans l'activité ordinaire (non payées) vs heures HAO (payées).
- Critère de fin : bulletin + écritures (constatation, dette, lettrage) générés sans saisie manuelle, contrôlables.

### Lot R4 — Suivi HAO annuel (~1-2 j, ~40-80k tokens)
- Compteur de consommation du quota par enseignant (heures effectuées vs quota annuel).
- Alerte de dépassement (notification + liste), tableau de bord masse salariale HAO par statut/filière.

### Lot R5 — Complétude paie Togo (~2-3 j, ~60-100k tokens)
- Intégration des charges au bulletin : CNSS salariale/patronale, IR salarié, congés payés, déductions (prêts, HS, avances).
- Édition du bulletin de paie conforme (format paramétrable).
- Rapprochement : total bulletin ↔ écriture comptable ↔ pointages.

**Total R1-R5 : ~8-13 j — ~260-450k tokens**

---

## 7. Programme E-Learning — Arborescence académique (A PLANIFIER)

### Contexte (état des lieux vérifié)

- Module déjà riche : cours en ligne (vidéos/PDF), modules, quiz + réponses, devoirs + soumissions, progression apprenant, certificats, supports + commentaires, chat/salons temps réel (socket + SSE), notifications.
- **Gap structurel identifié** : `CoursEnLigne.coursId` est un lien **texte libre** (STRING, sans FK vers le Cours pédagogique) → **aucun rattachement à la hiérarchie** Année → Parcours → Filière → Niveau. Toutes les pages du module sont des listes plates.

### Cadrage

- Arborescence identique au Lot 7 : **Année → Parcours → Filière → Niveau → (Classe) → Cours en ligne**, avec compteurs.
- S'applique **à tout** : catalogue des cours, devoirs, quiz, supports, certificats, progression — plus aucune liste plate.
- **Exécution en PARALLELE** des programmes Compta (S0-F3) et RH (R1-R5) confiés à l'IA externe — zones disjointes : le e-learning ne touche qu'à `modules/elearning` + frontend elearning (+ rattachement au modèle Cours si besoin).

### Lots

### Lot EL1 — Rattachement hiérarchique (~2-3 j, ~60-100k tokens)
- Relier `CoursEnLigne` au Cours pédagogique (FK réelle ou résolution du chemin académique existant : classe → niveau → filière → parcours → année).
- Migration des données existantes (coursId texte → lien structuré), garde-fous pour les cours sans rattachement.
- Critère de fin : chaque cours en ligne remonte à son chemin académique complet.

### Lot EL2 — Catalogue arborescent (~2-3 j, ~60-100k tokens)
- Page de gestion e-learning en **arbre** (Année → Parcours → Filière → Niveau → Cours) avec filtres combinés et compteurs (même pattern que la page "Dossiers").

### Lot EL3 — Arborescence par entité (~3-4 j, ~80-130k tokens)
- Devoirs, quiz, supports, certificats, progression : mêmes arbres + navigation cohérente.
- Critère de fin : navigation complète sans liste plate dans le module.

**Total EL1-EL3 : ~7-10 j — ~200-330k tokens**

---

## 8. Lot optionnel — Sécurité des fichiers (~1-2 j)

- Purge des fichiers orphelins (`public/inscription/dossiers/` jamais validés).
- Vérification d'intégrité fichier ↔ base de données.
- Procédure de sauvegarde du dossier `public/` (stockage local).

---

## 9. Séquencement global

```
[LIVRE] Lots 0-5
        |
        v
[EN COURS] Lot 6 (IA externe)  -->  revue + commit à la livraison
        |
        v
┌──────────────────────────────────────────────────────┐
│  PARALLELE (zones disjointes)                         │
│                                                      │
│  IA EXTERNE 2 :  S0-S4 -> F1-F3 -> R1-R5             │
│  (compta SYSCOHADA + RH/HAO)                         │
│                                                      │
│  EQUIPE INTERNE : EL1 -> EL2 -> EL3 (e-learning)     │
│  puis Lot 7 (arborescence généralisée)               │
└──────────────────────────────────────────────────────┘
```

Règles d'exécution :
- **Séquentiel strict** dans chaque programme ; salves parallèles uniquement sur zones disjointes.
- **Parallélisme IA externe / équipe interne** : l'IA externe 2 pilote la **compta (comptabilite, achats, marche, stock, immobilisation + écritures auto)** et le **RH (rh, pointage, paie)** ; l'équipe interne travaille **exclusivement sur e-learning + arborescence**. Aucun fichier commun : `git status` + revue des fichiers modifiés avant chaque lancement (les deux IA externes — Lot 6 et Compta/RH — et l'équipe interne ne doivent JAMAIS travailler sur le même dossier).
- **Mode économe** : 1 agent à la fois, lectures ciblées, validation entre chaque lot.
- **Non-collision** avec les IA externes : vérification `git status` avant chaque lancement.
- **Commit par lot** + revue (tsc, conventions) avant clôture.

---

## 10. Budget estimatif global (tokens de traitement)

| Programme | Tokens (est.) |
|---|---|
| Pédagogique (Lots 0-5 + 6 + 7) | ~650-850k (déjà consommé : ~550-700k) |
| ERP SYSCOHADA (S0-S4) | ~260-460k |
| Compta complémentaire (F1-F3) | ~200-320k |
| RH (R1-R5) | ~260-450k |
| E-Learning (EL1-EL3) | ~200-330k |
| Sécurité fichiers | ~30-60k |
| **Total restant** | **~950-1630k** |

---

## 11. Décisions en attente

1. Référentiel : SYSCOHADA **révisé 2017** ? (à confirmer)
2. Le plan comptable de l'app est-il un plan OHADA conforme ? (vérification rapide)
3. Dossier PDF complet (60+ pages) téléchargeable + consultation à l'écran ? (recommandé : oui)
4. TVA : applicable au contexte ? (sinon F3.4 retiré)
5. Stages : génèrent-ils des facturations ?
6. Multi-exercices ouverts simultanément : autorisé ou un seul actif ?
7. **Charges sociales Togo** : taux exacts CNSS (salariale/patronale), IR salarié, autres prélèvements — à fournir ou à laisser paramétrables en production (recommandé : paramétrables, les taux évoluent).
8. **Règle de pause** : les heures pointées (arrivée → départ) sont-elles brutes, ou déduire une pause (durée ?) ?
9. **Seuil minimal** : à partir de combien de minutes une présence compte-t-elle comme heure prestée ?
10. **Majoration HAO** : heures au-delà du quota : toutes au même taux, ou taux majoré au-delà d'un plafond ?
11. **HAO comptable** : constatation de la charge le mois des heures prestées (même si paiement différé) + lettrage au paiement — confirmé ? Provision mensuelle des HAO non encore payées ?
12. **E-Learning** : un cours en ligne peut-il être **partagé entre plusieurs filières/niveaux** (cours transverse) ou est-il rattaché à une seule classe ?

---

## 12. Rappels utiles (acquis vérifiés)

- Stockage des fichiers d'inscription : OUI, `public/dossiers/{annee}/{parcours}/{classe}/{niveau}/{matricule}/` + copie GED + références en base.
- Le champ texte `Seance.salle` est la source effective actuelle (FK `salleDeClasseId` orpheline) — harmonisation à prévoir (chantier doublons).
- Les notes sont rattachées au Cours ("Cours = UE") ; l'ECUE est décoratif — choix documenté.
- Les tests Jest : 20/34 suites vertes ; 14 suites en échec restantes (hors périmètre, à traiter en lot qualité).
- Module RH existant : employés, contrats, catégories/grilles salariales, paie + écritures auto, prestations enseignants, HS, prêts, congés/soldes, pointage, planning — le Programme RH complète l'existant (calcul auto depuis pointages, HAO, charges Togo).
- E-Learning : `CoursEnLigne.coursId` est un lien texte libre sans FK vers le Cours — le rattachement hiérarchique (EL1) est le prérequis de l'arborescence.
