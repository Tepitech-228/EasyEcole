# Conception — Workflow de planification de réinscription (passage en année supérieure)

**Type :** Document de conception (aucun code produit dans ce document)
**Périmètre :** Frontend Angular (`easy-ecole-web`) + Backend Express/Sequelize (`easy-ecole-backend`)
**Statut :** Proposition à valider avant implémentation
**Date :** 27 août 2026

---

## 1. Contexte et problème

Un étudiant **déjà inscrit** (ex. 1ère année Informatique) peut, en fin d'année, avoir été déclaré **admis** à passer en **2ème année**. Aujourd'hui, il ne dispose d'**aucun flux de réinscription allégé** :

- Le module `ReinscriptionController` ne fait que vérifier **l'absence de dette** (`peut-se-reinscrire`).
- Le module `RattrapageWorkflow` concerne les **rattrapages d'examens**, pas le passage en année supérieure.
- Le flux d'inscription standard force la **ressaisie des informations personnelles** et du **choix de parcours**, ce qui est redondant pour un étudiant déjà connu.

**Objectif :** créer une **nouvelle page + entrée de menu** proposant un **workflow de planification de réinscription** : l'étudiant déjà inscrit et admissible réutilise ses informations personnelles et son parcours déjà en base, et est « planifié » (affecté) à la session / année / niveau / classe suivants, sans ressaisie.

> Ce document décrit le **périmètre et le design**. La décision métier sur la signification exacte de « planifier » (voir §6) reste à trancher avant implémentation.

---

## 2. Positionnement dans l'existant

Le flux proposé s'inscrit **entre** deux mécanismes déjà présents :

```
[1. Décision de passage]  -->  [2. PLANIFICATION de réinscription (ce chantier)]  -->  [3. Inscription/réinscription effective]
        (existant)                                          (nouveau)                                      (existant)
```

| Mécanisme | Existant ? | Rôle |
|---|---|---|
| `DecisionPassage` (scolarite) | ✅ | Décide si l'étudiant est **admis / rattrapage / redoublement / exclusion** pour une année académique, rattaché à un `CursusApprenant`. C'est la **porte d'entrée pédagogique** du passage. |
| `CursusApprenant.statutReinscription` | ✅ (champs) | ENUM `en_attente / confirme / abandon / desactive` + `dateReinscription` + `emailReinscriptionEnvoyeLe`. Champs **déjà prévus mais jamais utilisés** par un flux. |
| `DossierEtudiant` | ✅ | Détient matricule, `nombreInscriptions`, mode de paiement → l'**historique étudiant** à conserver. |
| `ReinscriptionController.peutSeReinscrire` | ✅ | **Précondition** : pas de dette. |
| `CursusApprenantController` (CRUD) | ✅ | CRUD brut, réservé institution/admin (refuse `APPRENANT`). |

**Constats pour la conception :**
- Le modèle `CursusApprenant` est **le bon support** de la réinscription : il relie déjà `utilisateur → parcours, niveauEtude, classe, anneeAcademique, demandeInscription`.
- Les champs `statutReinscription`, `dateReinscription` existent mais sont **inutilisés** → ils doivent piloter le workflow de planification.
- La réutilisation des infos perso/parcours est naturelle : on part du `CursusApprenant` (et `DossierEtudiant`) existant plutôt que d'un nouveau `DemandeInscription` complet.

---

## 3. Règles métier proposées

Pour être admissible au flux de planification de réinscription, l'étudiant doit satisfaire **toutes** les conditions suivantes :

1. **Rôle** : `APPRENANT` (et authentifié).
2. **Dossier existant** : possède un `DossierEtudiant` actif (matricule connu).
3. **Cursus existant** : possède au moins un `CursusApprenant` (déjà inscrit une fois).
4. **Éligibilité pédagogique** : la dernière `DecisionPassage` le déclare **`admis`**.
5. **Solvabilité** : pas de dette (réutilisation logique de `peut-se-reinscrire`).
6. **Pas de planification dupliquée** : pas de réinscription déjà en `en_attente` / `confirme` pour la session cible.

**Si une condition manque**, la page affiche un état *inéligible* explicite (et pourquoi) au lieu de proposer le formulaire.

---

## 4. Nouvelles entités / champs

**Aucune nouvelle table n'est strictement requise** : le design s'appuie sur `CursusApprenant` (+ champs de réinscription) et `DecisionPassage`.

Pistes de précision à décider (optionnelles, à valider) :

- **Champ « session de réinscription » cible** : la `Session` d'inscription choisie pour la réinscription. À rattacher au `CursusApprenant` (ex. via `anneeAcademiqueId` / une nouvelle colonne `sessionReinscriptionId` si besoin de tracer la session exacte).
- **Traçabilité** : une table `PlanificationReinscription` légère (id, cursusApprenantId, sessionId, niveauEtudeId, classeId, statut, date, créé par) serait l'option la plus propre pour un **workflow avec statuts** solide. À trancher en §6.

> Principe : **préférer l'ajout de colonnes / d'une table légère à la création d'un double dossier**. On ne duplique PAS les infos perso ni le parcours.

---

## 5. UX — Nouvelle page et menu

### 5.1 Entrée de menu

Ajout dans la configuration de menu serveur `menu.config.ts` (pole **Pedagogique** → groupe **Admission & Inscription**, ou nouveau groupe **Réinscription**) :

| Champ | Valeur proposée |
|---|---|
| `label` | « Ma réinscription » |
| `route` | `/inscription/reinscription/planifier` |
| `icon` | `how_to_reg` (ou `autorenew`) |
| `permissionKey` | `menu.inscription.reinscription-planifier` |
| `allowedRoles` | `[APPRENANT, ADMIN]` |

Accessible aussi depuis le **dashboard apprenant** (bouton dédié, ex. « Planifier ma réinscription ») quand l'étudiant est éligible.

### 5.2 Parcours de la page « Planifier ma réinscription »

La page `/inscription/reinscription/planifier` (protégée par `ApprenantGuard`) présente un **workflow en étapes** :

1. **Vérification & résumé étudiant** (lecture seule)
   - Affiche les infos personnelles déjà connues (nom, prénoms, matricule) et le parcours / niveau / classe **actuels** — **non modifiables** (réutilisation).
   - Affiche le résultat d'éligibilité (décision de passage, solde de dette, session ouverte).
2. **Choix de la session de réinscription**
   - Liste des **sessions ouvertes** pour la réinscription (même principe que la page `choisir-session`).
3. **Planification / affectation**
   - Affecte le niveau / classe de la session suivante (pré-rempli à partir du parcours, ajustable).
   - Enregistre la « planification » : `statutReinscription = en_attente`, `dateReinscription = now`.
4. **Récapitulatif & confirmation**
   - Résumé de la planification, sans ressaisie des infos perso.
5. **Suivi**
   - Écran de suivi du statut (`en_attente → confirme`), bouton de relance / annulation selon statut.

**Rôles :**
- **APPRENANT** : lance et suit sa propre planification.
- **ADMIN / INSTITUTION** : confirme (`confirme`), marque `abandon` / `desactive`, voit toutes les planifications.
- **SECRETARIAT / SAISIE** : peut visualiser, à définir.

---

## 6. Points d'arbitrage à trancher avant de coder

1. **Sens précis de « planifier »** — trancher selon le métier :
   - (a) simple **demande en attente** de validation admin, ou
   - (b) **affectation immédiate** au niveau/classe de la session suivante (`CursusApprenant` mis à jour), ou
   - (c) les deux (planification → puis confirmation → puis activation).
2. **Table de traçabilité** : suffit-il des champs `CursusApprenant.statutReinscription / dateReinscription`, ou faut-il une table dédiée `PlanificationReinscription` (recommandé pour un workflow multi-statuts) ?
3. **Lien avec `DecisionPassage`** : faut-il imposer `admis` pour planifier, ou autoriser `rattrapage` sous conditions ?
4. **Lien avec la session** : la planification référence-t-elle une `Session` d'inscription spécifique, ou uniquement `anneeAcademique` + `niveauEtude` + `classe` ?
5. **Page(s) institution** : faut-il une page de validation admin des planifications (liste + confirmer/rejeter) en plus de la page apprenant ? (Le chantier actuel couvre la page **apprenant**.)
6. **Incrément de `DossierEtudiant.nombreInscriptions`** : doit-il être incrémenté à la planification ou à la confirmation ?

---

## 7. Périmètre d'implémentation (une fois validé)

### Backend (`easy-ecole-backend/src/modules/inscription`)
- **Routeur** : nouvelles routes sous `/inscription` (ex. `/reinscription-planification`) montées dans `InscriptionRoutes.ts`, avec `Authenticate` (+ vérification de rôle).
- **Contrôleur(s)** : éligibilité (embarque la logique `peut-se-reinscrire` + contrôle `DecisionPassage` + contrôle `CursusApprenant`), création/lecture/confirmation/annulation de la planification.
- **Modèle(s)** : réutiliser `CursusApprenant` ; optionnellement nouvelle table `PlanificationReinscription` (+ association `CursusApprenant.hasMany`).

### Frontend (`easy-ecole-web`)
- **Page** : `features/modules/inscription/pages/planifier-reinscription-page/` (composant + template + styles).
- **Route** : `/inscription/reinscription/planifier` dans `inscription-routing.module.ts`, protégée par `ApprenantGuard`, enregistrée dans `inscription.module.ts`.
- **Service** : service Angular d'appel aux nouveaux endpoints.
- **Menu** : entrée dans `menu.config.ts` (backend) + si applicable lien dans le dashboard apprenant.

### Points de vigilance récurrents (à garder en tête)
- **Monter les routeurs créés** : historique de 404 sur routeurs écrits mais non montés dans `*Routes.ts` — vérifier systématiquement le montage et faire un appel réel.
- **Non-régression** : ne pas casser le CRUD `CursusApprenant` existant ni `InscriptionComplete` (middleware).
- **Sécurité** : l'apprenant ne doit pouvoir agir que sur **sa propre** planification (scoper sur `utilisateurId`).

---

## 8. Lien avec le sujet de test non-régression

Le test de non-régression des routeurs d'inscription précédemment montés (finance, comite-validations, paiement, types-operations-bordereau, fraisScolarite, documents, rattrapage-workflow) est **volontairement laissé de côté** pour ce chantier (choix utilisateur). Il reste à faire plus tard, indépendamment.

---

## 9. Prochaines actions

1. **Arbitrer les 6 points du §6** avec le métier (décisions bloquantes pour le design final).
2. Rédiger une **fiche de tâches** (planificateur) découpant la fonctionnalité en étapes backend + frontend.
3. Implémenter puis **valider par appels réels** (y compris token apprenant).
