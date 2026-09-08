# CONCEPTION — Wizard de Réinscription + Pipeline + Badge Comité

**Type :** Document de conception (aucun code produit dans ce document)
**Périmètre :** Frontend Angular (`easy-ecole-web`) + Backend Express/Sequelize (`easy-ecole-backend`)
**Statut :** Proposition à valider avant implémentation
**Date :** 01/09/2026
**Référence :** Complète le dispositif existant de réinscription planifiée

---

## 1. Contexte et objectif

Aujourd'hui :
- Le flux de **1ère inscription** passe par un wizard (`/inscription/demandes/:id` avec sections) puis par le **pipeline** Cabinet → ESA Compta → Comité, avec création d'un **bordereau de paiement**.
- La **réinscription** actuelle utilise un flux allégé (`planifier-reinscription-page`) qui **ne crée PAS de bordereau de paiement** et **ne passe PAS par le pipeline** Cabinet → ESA Compta → Comité. Il se limite à poser `statutReinscription = en_attente` sur un nouveau `CursusApprenant`.

**Objectif de ce chantier :** construire un **wizard de réinscription distinct** du wizard de 1ère inscription, qui reprend le circuit complet de validation :

```
Étudiant (wizard réinscription) → dépôt documents + bordereau de paiement
  → Cabinet Comptable (authentification du bordereau)
  → ESA Compta (recouvrement / saisie comptable)
  → Comité d'orientation (validation finale)
```

Avec, au niveau du comité, un **badge visuel** distinguant **1ère inscription** de **réinscription** pour guider la vérification.

---

## 2. Public cible et éligibilité

| Critère | Règle |
|---------|-------|
| Rôle requis | `APPRENANT` (authentifié) |
| Précondition | Avoir déjà un `DossierEtudiant` actif (être déjà inscrit) |
| Accès au wizard | Depuis le menu « Ma réinscription » et/ou bouton sur le dashboard apprenant |
| Dette | **Affichée mais non bloquante** (règle LMD) — le solde n'est exigé qu'à la validation du diplôme |

L'entrée du wizard de réinscription est **distincte** de celle du wizard de 1ère inscription :
- 1ère inscription → `/inscription/demandes` (choix session → wizard)
- Réinscription → `/inscription/reinscription/wizard` (nouveau)

---

## 3. Wizard de réinscription — parcours de l'étudiant

Le wizard est **multi-étapes**, distinct du wizard de 1ère inscription (pas de ressaisie des infos perso, pas de choix de parcours depuis zéro — on réutilise le cursus existant).

```
┌─────────────┐   ┌──────────────┐   ┌──────────────┐   ┌────────────────┐   ┌───────────┐
│ ÉTAPE 1     │ → │ ÉTAPE 2      │ → │ ÉTAPE 3      │ → │ ÉTAPE 4        │ → │ ÉTAPE 5   │
│ MA          │   │ Documents    │   │ Bordereau de │   │ Récapitulatif  │   │ Suivi     │
│ RÉINSCRIPT. │   │ à fournir    │   │ paiement     │   │ & confirmation │   │ du dossier│
└─────────────┘   └──────────────┘   └──────────────┘   └────────────────┘   └───────────┘
```

### Étape 1 — « Ma réinscription » (point d'entrée)
- Affichage récapitulatif (lecture seule) du cursus actuel :
  - Matricule
  - Parcours / filière / niveau / classe actuels
  - Année académique en cours
- CTA **« Faire ma réinscription »** qui déclenche le passage à l'étape 2.
- Vérification d'éligibilité automatique (déjà inscrit, session de réinscription ouverte).

### Étape 2 — Documents requis
L'étudiant doit téléverser **6 pièces obligatoires** (workflow réinscription) :

| # | Document | Obligatoire | Type attendu |
|---|----------|:-----------:|--------------|
| 1 | Demande adressée au **DG** (Directeur Général) | ✅ | PDF/image |
| 2 | Copie simple de l'**autorisation provisoire d'inscription** | ✅ | PDF/image |
| 3 | Copie des **relevés de notes** obtenus | ✅ | PDF/image |
| 4 | Copie de la **carte d'identité nationale** | ✅ | PDF/image |
| 5 | **Quitus définitif** et les **bordereaux de l'année écoulée** | ✅ | PDF/image |
| 6 | **Bordereau d'inscription de la nouvelle année** | ✅ | PDF/image |

> Tous ces documents sont stockés via le mécanisme GED existant (`DossierStorageService`) et rattachés à la demande de réinscription, pour être consultés par le comité.

### Étape 3 — Bordereau de paiement
- L'étudiant **téléverse le bordereau de paiement** de la réinscription (preuve de versement des frais de réinscription).
- Le bordereau est créé avec le **type d'opération `REINSCRIPTION`** (déjà présent dans `ins_types_operations_bordereau`).

### Étape 4 — Récapitulatif & confirmation
- Résumé : cursus réutilisé, documents déposés (noms de fichiers), bordereau.
- Confirmation de soumission → le dossier part dans le pipeline.

### Étape 5 — Suivi du dossier
- Timeline visuelle des statuts pipeline (soumis → authentifié → transmis_comite → valide / correction / rejet).
- Boutons selon état (relance, correction de documents).

---

## 4. Pipeline de validation (Cabinet → ESA Compta → Comité)

Le dossier de réinscription suit le **même pipeline** que la 1ère inscription, en réutilisant `statutPipeline` de `DemandeInscription` :

```
soumis ──► authentifie ──► transmis_comite ──► valide
                       │                  ├──► correction_demandee
                       │                  └──► rejete
                       └──► (rejet cabinet)
```

| Étape | Acteur | Action |
|-------|--------|--------|
| 1 | **Étudiant** | Soumet le wizard (documents + bordereau) → `soumis` |
| 2 | **Cabinet comptable** | Authentifie le bordereau, valide la conformité → `authentifie` |
| 3 | **ESA Compta** | Recouvrement : saisie comptable, imputation FIFO, écriture auto → `transmis_comite` |
| 4 | **Comité d'orientation** | Examine le dossier (documents + finances), décide → `valide` / `correction_demandee` / `rejete` |
| 5 | **Système** | Si `valide` : finalisation (mise à jour du cursus de réinscription, `statutReinscription = confirme`, notification email) |

### Règles spécifiques réinscription (vs 1ère inscription)
- **Pas de création d'un second `DossierEtudiant`** — on réutilise celui existant ; on incrémente simplement `nombreInscriptions`.
- **Pas de ressaisie des infos perso** — le parcours/niveau/classe sont repris du cursus actuel (ajustement possible du niveau/classe cibles).
- **Validation comité → mise à jour du `CursusApprenant`** en réinscription (`statutReinscription = 'confirme'`) plutôt que création d'un nouveau dossier de 1ère inscription.

---

## 5. Badge « 1ère inscription / Réinscription » au comité

### Objectif
Permettre au **comité d'orientation** de savoir immédiatement **quoi vérifier** : le circuit de vérification n'est pas le même selon qu'il s'agit d'un nouvel étudiant ou d'un étudiant qui se réinscrit (pour une réinscription, on vérifie notamment le quitus, les bordereaux de l'année écoulée, la demande au DG).

### Logique de détermination
Le statut est déterminé **côté backend** et renvoyé dans la réponse du `ComiteValidationController` (détail + liste), via le champ `DossierEtudiant.nombreInscriptions` :

| `nombreInscriptions` | Type de dossier | Badge affiché |
|:--------------------:|-----------------|---------------|
| `0` ou `1` | **1ère inscription** | 🟢 « 1ère inscription » |
| `> 1` | **Réinscription** | 🔵 « Réinscription » |

> Règle : au moment de la soumission d'une réinscription, on **pré-incrémente** ou on déduit le type depuis le contexte du flux. Le plus sûr est de stocker un marqueur explicite (`typeDemande = 'inscription' | 'reinscription'`) sur la `DemandeInscription`, en plus du `nombreInscriptions`, pour éviter toute ambiguïté.

### Représentation (backend)
Le `ComiteValidationController` renvoie un champ supplémentaire pour chaque dossier :
```jsonc
{
  "id": 42,
  "typeDemande": "reinscription",   // 'inscription' | 'reinscription'
  "estReinscription": true,          // raccourci booléen pour le badge
  "nombreInscriptions": 2,
  // ... autres champs existants
}
```

### Affichage (frontend `comite-validation-page`)
- **Dans la liste des dossiers** : une pastille/badge coloré à côté du nom.
- **Dans le détail du dossier** : un bandeau indiquant le type ET les **points de contrôle spécifiques** attendus (pour une réinscription : quitus, bordereaux année écoulée, demande DG, autorisation provisoire ; pour une 1ère inscription : pièces classiques du nouvel étudiant).

```
[🔵 RÉINSCRIPTION]  Dossier n°42 — Mathématiques L1 → L2
    Points de contrôle : quitus, bordereaux année écoulée, demande DG,
                         autorisation provisoire, relevés de notes, CNI
```

---

## 6. Impact sur les entités de données

### A. `DemandeInscription` (ou nouvelle table dédiée réinscription)
- Ajout d'un champ `typeDemande : 'inscription' | 'reinscription'` (permettra au comité de filtrer/afficher le badge sans calcul).
- Réutilisation des champs pipeline existants (`statutPipeline`, `motifPipeline`).

### B. Documents
- Réutiliser la table des dossiers/documents (`DossierDemande`) avec un **libellé de document** correspondant aux 6 pièces.
- Possibilité de créer un **type de dossier documentaire dédié « réinscription »** listant les 6 documents requis (en s'inspirant du mécanisme `documentsRequis` existant du rattrapage).

### C. `CursusApprenant`
- Réutiliser `statutReinscription` / `dateReinscription` pour la traçabilité de la planification (comme aujourd'hui).

---

## 7. Écrans et navigation

### 7.1 Entrée de menu
| Champ | Valeur |
|-------|--------|
| `label` | « Ma réinscription » |
| `route` | `/inscription/reinscription/wizard` |
| `allowedRoles` | `[APPRENANT]` |
| Accès dashboard | Bouton « Planifier / faire ma réinscription » quand éligible |

### 7.2 Régression — ne pas casser
- Le flux de **1ère inscription** existant ne doit pas être modifié (zones disjointes).
- Le `planifier-reinscription-page` actuel peut être **remplacé** par le nouveau wizard (ou conservé comme étape de suivi).

---

## 8. Décisions à trancher avant de coder

1. **Support de données** : réutiliser `DemandeInscription` avec `typeDemande`, ou créer un flux/tables dédiés à la réinscription ? (Recommandé : réutiliser `DemandeInscription` + champs, pour réutiliser tout le pipeline comité sans duplication.)
2. **Incrément de `nombreInscriptions`** : au moment de la soumission du wizard, ou à la validation du comité ? (Recommandé : à la validation comité, pour ne pas fausser le badge tant que le dossier n'est pas définitif.)
3. **Pointage du badge** : faut-il aussi un filtre « Afficher uniquement les réinscriptions » dans la liste du comité ? (Recommandé : oui, en plus du badge.)
4. **Level cible** : lors de la réinscription, l'étudiant choisit-il son niveau/classe cibles (planification) ou est-ce imposé par la décision de passage ? (À arbitrer avec le métier — cf. CONCEPTION-PLANIFICATION-REINSCRIPTION §6.)
5. **Rattrapage** : un étudiant en situation de rattrapage peut-il se réinscrire ? (Réutiliser la logique `DecisionPassage`.)

---

## 9. Plan d'implémentation (lots)

> Exécution séquentielle, 1 lot à la fois, validation entre chaque lot. Zones disjointes du flux de 1ère inscription (non-régression garantie).

### Lot RE-1 — Backend : type de demande & éligibilité réinscription (1-2 j)
- Ajouter `typeDemande` sur `DemandeInscription` + migration idempotente.
- Enrichir `getEligibilite` de `ReinscriptionController` pour renvoyer aussi les `documentsRequis` et la session de réinscription ouverte.
- **Critère** : l'étudiant éligible reçoit la liste des 6 documents + la session cible.

### Lot RE-2 — Backend : soumission du dossier de réinscription (2-3 j)
- Nouvel endpoint `POST /inscription/reinscription/soumettre` :
  - crée/réutilise la `DemandeInscription` (typeDemande = 'reinscription', statutPipeline = 'soumis'),
  - persist les 6 documents (GED + références),
  - crée le bordereau (type `REINSCRIPTION`),
  - ne crée pas de nouveau `DossierEtudiant` (réutilise l'existant).
- Réutilise le pipeline existant (Cabinet → ESA → Comité) sans modification du circuit.
- **Critère** : un dossier de réinscription apparaît dans la file d'attente Cabinet/ESA/Comité avec les bons documents.

### Lot RE-3 — Backend : badge comité (1 j)
- Dans `ComiteValidationController` (liste + détail) : renvoyer `typeDemande`, `estReinscription`, `nombreInscriptions`.
- (Optionnel) filtre `?type=reinscription`.
- **Critère** : l'API expose le type de dossier pour le badge.

### Lot RE-4 — Frontend : wizard de réinscription (2-3 j)
- Nouvelle page `/inscription/reinscription/wizard` (5 étapes).
- Étape 1 « Ma réinscription » avec CTA.
- Étape 2 : upload des 6 documents requis avec libellés explicites.
- Étape 3 : upload du bordereau de paiement.
- Étape 4 : récapitulatif.
- Étape 5 : suivi du pipeline (timeline).
- Service `reinscription-wizard.service.ts` (build sur `ReinscriptionService`).
- **Critère** : parcours complet utilisable par l'étudiant.

### Lot RE-5 — Frontend : badge au comité (0.5-1 j)
- Dans `comite-validation-page` + `comite-details-page` : badge coloré « 1ère inscription » / « Réinscription ».
- Bandeau des points de contrôle spécifiques selon le type.
- (Optionnel) filtre dans la liste.
- **Critère** : le comité distingue visuellement le type et sait quoi vérifier.

### Lot RE-6 — Recette & validation (1 j)
- Parcours E2E : étudiant (réinscription) → Cabinet → ESA → Comité.
- Vérif badge, documents, écarts notes, quitus, double-clic.
- Non-régression 1ère inscription.
- Commit + push + redéploiement.

**Total estimé : ~7-11 jours**

---

## 10. Matrice de traçabilité → Diagrammes de cas d'utilisation

| Cas d'utilisation existant | Impact du chantier |
|----------------------------|--------------------|
| UC11 — Planifier réinscription | ⚠️ Évolue : devient le wizard complet (documents + bordereau + pipeline) |
| UC12 — Confirmer planification | ⚠️ Évolue : la validation se fait désormais via le comité (non plus seulement admin) |
| UC09 — Valider dossier au comité | ✳️ Évolue : ajout du badge 1ère/réinscription + points de contrôle |
| UC07/UC08 — Authentifier/Saisir bordereau | ➕ Les bordereaux `REINSCRIPTION` passent aussi par ce circuit |

> ⚠️ Le fichier `docs/DIAGRAMMES-CAS-UTILISATION.md` devra être mis à jour après validation de cette conception (UC11/UC12/UC09).
