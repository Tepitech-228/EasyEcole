# Suivi qualité par module — ESA Ecole

**Date :** 03/10/2026 · **Périmètre :** `easy-ecole-backend/src` · **Version analysée :** branche `V4-2`
**Nature des constats :** analyse statique du code source (aucun de ces points n'a été validé en exécution, sauf mention contraire).

---

## 1. Synthèse

Le projet est **fonctionnellement riche mais techniquement fragile**. Il expose 1 609 routes réparties sur 24 modules, pour 137 668 lignes de TypeScript. L'API répond, la recette E2E passe, mais la codebase accumule quatre dettes structurelles qui will become bloquantes à la première évolution majeure.

| Indicateur | Mesure | Lecture |
|---|---|---|
| Fichiers TS | 1 146 | — |
| Lignes de code | 137 668 | — |
| Routes | 1 609 | surface d'attaque très large |
| Modules | 24 | — |
| **Réponses 403 sans message** | **275** | 47 % des 403 |
| **Fuite d'erreur brute en 5xx** | **861** | **critique** |
| Utilisations de `any` | 3 682 | 1 toutes les 37 lignes |
| Fichiers de tests | **1** | couverture inexistante |
| Fichiers de validation | **2** | 1 600 routes, 2 validateurs |
| Documentation Swagger | 0 annotation | API non documentée |

**Le bon news** : le module `core/` est propre sur le dossier 403 (0 sans message). Le problème est isolé et donc corrigeable.

**Le mauvais news** : la fuite d'erreurs en 5xx (861 occurrences) est le risque de sécurité numéro un. correcting the 403 without touching it would be treating the symptom.

---

## 2. Le dossier « 403 sans message »

### 2.1 Ce qui a été fait

Les 13 middlewares d'authentification de `core/` ont été message. **9** d'entre eux ont été modifiés dans cette session :

`AuthAdmin`, `AuthApprenant`, `AuthCabinetComptable`, `AuthCaissierBanque`, `AuthComiteOrientation`, `AuthEnseignant`, `AuthEsacompta`, `AuthInstitution`, `AuthRessourcesHumaines`

Les 4 autres possédaient déjà un message : `AuthSecretariat`, `AuthConfidentiality`, `TenantScope`, `InscriptionComplete`, plus `CheckPermission` (2 occurrences).

**Résultat : `core/` = 0 occurrence sans message.**

### 2.2 Ce qui reste — 275 occurrences, toutes dans les contrôleurs

Toutes prennent la forme exacte suivante, répétée à l'identique :

```typescript
return res.status(403).json({ success: false })
```

Aucune exception. C'est un copier-coller, pas une décision d设计.

### 2.3 Répartition par module

| Module | 403 avec message | 403 **sans** message | Part vide |
|---|---|---|---|
| inscription | 132 | **136** | 51 % |
| orientation | 3 | **42** | 93 % |
| stock | 16 | **24** | 60 % |
| immobilisation | 38 | **19** | 33 % |
| auth | 4 | **17** | 81 % |
| communication | 1 | **12** | 92 % |
| scolarite | 12 | **12** | 50 % |
| stage | 18 | 8 | 31 % |
| elearning | 15 | 3 | 17 % |
| bulletins | 4 | 2 | 33 % |
| rh, ged, comptabilite, achats, marche, qualite, docgen, bourse, reporting, parent, etablissement, menu, surveillance | 121 | 0 | 0 % |

### 2.4 Fichiers les plus touchés

| Fichier | Occurrences |
|---|---|
| `inscription/controllers/CoursController.ts` | 9 |
| `inscription/controllers/DemandeInscriptionController.ts` | 6 |
| `inscription/controllers/CursusApprenantController.ts` | 5 |
| `inscription/controllers/PaiementInscriptionController.ts` | 5 |
| `inscription/controllers/PresenceController.ts` | 5 |
| `orientation/controllers/PanierParcoursChoisiController.ts` | 5 |
| `orientation/controllers/ReponseOrientationController.ts` | 5 |
| `scolarite/controllers/DemandeDocumentController.ts` | 5 |
| `auth/controllers/CaissierBanqueController.ts` | 4 |
| `auth/controllers/InstitutionController.ts` | 4 |
| `communication/controllers/ActualiteController.ts` | 4 |
| `communication/controllers/CommunicationController.ts` | 4 |
| `communication/controllers/SuggestionController.ts` | 4 |

### 2.5 Pourquoi c'est un problème réel

Le pattern le plus fréquent est un contrôle de rôle en fin de chaîne `if/else` :

```typescript
if (role === RolesUtilisateur.ADMIN) {
  // ... requête avec filtre tenant
} else {
  return res.status(403).json({ success: false })   // ← aucune raison donnée
}
```

Conséquences :

1. **L'utilisateur ne sait pas quoi faire.** « Accès refusé » sans motif est un dead end. Il ne peut pas distinguer « vous n'avez pas le rôle » de « cette ressource appartient à un autre établissement ».
2. **Le support est aveugle.** Un ticket « ça marche pas » ne peut pas être qualifié.
3. **L'audit de sécurité est impossible.** On ne sait pas *quelle* règle a bloqué.
4. **Incohérence frontend.** Le client Angular ne peut pas afficher de message contextualisé sur 47 % des refus.

### 2.6 Plan d'action proposé

**Lot 1 — outillage (à faire en premier, sinon le reste est voué à régresser)**

Ajouter une règle ESLint `no-restricted-syntax` interdisant `status(403).json({ success: false })` sans `message`. Sans cela, on va corriger 275 sites et le premier nouveau contrôleur réintroduira le problème.

**Lot 2 — correction par vague, du plus rentable au moins rentable**

| Vague | Périmètre | Occurrences | Pourquoi dans cet ordre |
|---|---|---|---|
| A | `core/` | 0 | déjà fait |
| B | Top 10 fichiers | ~50 |gain immédiat, faible risque |
| C | `inscription` (reste) | ~86 | module le plus exposé (506 routes) |
| D | `orientation` + `stock` + `auth` | ~83 | 3 modules, motifs identiques |
| E | reste | ~56 | finition |

**Lot 3 — correction de fond**

Extraire les 275 contrôles vers des helpers typés, par exemple :

```typescript
// core/helpers/http.ts
export const refuse = (res: Response, motif: RefusMotif, detail?: string) =>
  res.status(403).json({
    success: false,
    code: motif,
    message: MESSAGES_REFUS[motif],
    ...(detail ? { detail } : {})
  })
```

avec un enum fermé (`ROLE_INSUFFISANT`, `RESSOURCE_AUTRE_TENANT`, `INSCRIPTION_INCOMPLETE`, `SENSIBLE_CONFIDENTIEL`, …). On obtient un message, **un code stable pour le frontend**, et une liste exhaustique des motifs de refus — ce qui devient un vrai document de sécurité.

> **Note d'estimation :** le lot B+C+D représente ~220 occurrences. À raison d'un traitement paroccurrence avec relecture métier du motif, il s'agit d'un travail de fond, pas d'un sed. Chaque message doit refléter la règle réellement appliquée.

---

## 3. Fuite d'erreurs en 5xx — risque critique

**861 réponses d'erreur renvoient l'objet `error` brut au client.**

```typescript
return res.status(500).json({ success: false, error })   // ← à ne plus faire
```

Dans tout le code, `error.message` n'apparaît que **2 fois**.

### Pourquoi c'est le point le plus grave du dossier

Un objet `Error` sérialisé en JSON expose selon le contexte :

- la **requête SQL** et les noms de tables/colonnes ;
- les **chemins du système de fichiers** (`/app/...`) ;
- la **stack d'exécution** et les noms de fonctions internes ;
- les noms des **modèles Sequelize** et des associations.

Un attaquant n'a plus besoin d'injection SQL pour cartographier le schéma : l'API le livre. C'est une accélération considerable de la reconnaissance.

Aucun des 5 logs conteneur analysés durant la campagne de tests n'a détecté ces fuites, car le corpus E2E ne provoked pas de 500 sur les modules concernés.

### Plan d'action

1. Helper unique `core/helpers/http.ts` : `serverError(res, error)` qui journalise la stack **côté serveur** et ne renvoie qu'un `message` générique + un `correlationId`.
2. Erreur de validation métier (400/422) : message autorisé, mais **jamais** l'objet `error`.
3. Idem pour les 404 et 403 : pas d'objet brut.
4. Règle ESLint interdisant `json({ ... error })`.

---

## 4. Validation des entrées — angle mort majeur

**2 fichiers de validation pour 1 609 routes.** La quasi-totalité des contrôles est presumably manuelle, dans les contrôleurs, sous forme de `if (!req.body.x) ...`.

Conséquence directe, visible dans l'audit : **200 réponses 422** sur la passe B. Ce ne sont pas des protections qui fonctionnent, ce sont des **rejets tardifs et non homogènes** — chaque contrôleur invente sa propre règle, donc les messagesvaries d'un module à l'autre et le frontend ne peut pas les exploiter.

Recommandation : introduire une couche de validation déclarative centralisée, et normaliser le format d'erreur :

```json
{
  "success": false,
  "code": "VALIDATION_FAILED",
  "message": "Données invalides",
  "errors": [{ "field": "email", "rule": "format", "message": "Format d'e-mail invalide" }]
}
```

---

## 5. Typage — 3 682 `any`

Répartition notable : `inscription` 1 204, `ged` 330, `auth` 166, `immobilisation` 184.

Le pattern dominant dans les contrôleurs est `(req as any).utilisateurId`, `(req as any).utilisateurRole`. C'est la conséquence directe du fait que le payload JWT n'est pas déclaré sur `Request`.

**Correction à fort levier, en une seule fois :**

```typescript
// src/types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      utilisateurId?: number
      utilisateurRole?: string
      etablissementId?: number
      tokenVersion?: number
    }
  }
}
```

Puis remplacer `(req as any).utilisateurX` par `req.utilisateurX`. Gain : suppression de ~1 500 `any` et activation de la vérification de types sur le payload d'authentification.

---

## 6. Tests — le point le plus critique en termes de risque projet

**1 seul fichier de test** pour 1 609 routes et 137 668 lignes.

C'est la vraie fragilité. L'équipe ne peut pas refactorer sans casser sans le savoir. Cela explique aussi pourquoi les 23 erreurs 500 n'ont été découvertes que par un balayage manuel de 774 requêtes.

État des lieux réel :
- la recette E2E (8 phases) est verte et c'est un acquis ;
- elle couvre un parcours métier nominal, pas les cas d'erreur ;
- **835 routes d'écriture (POST/PUT/DELETE/PATCH) ne sont jamais exercées**.

Recommandation de séquencement : plutôt que viser une couverture large, couvrir en priorité **les controllers qui portent le plus de 403** (voir §2.3), parce que ce sont eux qui concentrent la logique de sécurité.

---

## 7. Documentation API — absente

**0 annotation `@swagger`** dans le code. Le point d'entrée Swagger est monté mais vide.

Pour 1 609 routes, l'absence de contrat écrit est un facteur de dérive : les DTO TypeScript côté front et les schémas de validation côté back ne peuvent pas être rapprochés manuellement.

Recommandation : documenter en priorité les 24 modules, pas les 1 609 routes. Un module = un lot. Démarrage suggéré : `auth`, `inscription` (blocs parity/notes/absences), `bulletins`.

---

## 8. Fiches par module

### Tier 1 — criticité immédiate

**`core`** — 174 fichiers, 26 760 lignes
- ✅ Propre sur le 403 (0 sans message)
- ✅ Point de passage unique pour l'authentification → bon emplacement pour centraliser les helpers de réponse
- 🔴 2 fuites 5xx seulement, mais **929 `any`** →Ratuit d'abord le pivot `Request`
- 🔴 Reçoit les middlewares mais pas de couche d'erreur globale identifiée → à créer (`app.ts`)
- 🔴 Absence d'hélioscopeur de logs / tracing sur les 5xx

**`inscription`** — 231 fichiers, 43 106 lignes, 506 routes
- 🔴 136 403 sans message (51 %) — le pire module
- 🔴 69 fuites 5xx
- 🔴 1 204 `any` (33 % du total du projet)
- 🟠 Module cœur de métier, mais mixture de 70 contrôleurs sans séparation claire par domaine
- 🟢 Modèle le plus documenté du projet (associations explicites dans `_associations.ts`)

**`rh`** — 91 fichiers, 6 843 lignes, 154 routes
- ✅ 0 403 sans message
- 🟠 **104 fuites 5xx pour 6 843 lignes** → le ratio le plus défavorable du projet (1 fuite / 66 lignes contre 1/160 pour `inscription`). Traitement prioritaire en termes de risque par ligne écrite.
- 🟠 1 seul 403 sur 154 routes → suspicion de **contrôle d'accès insuffisant** (routes simplement ouvertes). À vérifier avant de considérer ce point comme un acquis.

**`immobilisation`** — 58 fichiers, 3 482 lignes, 102 routes
- 🔴 102 fuites 5xx (ratio 1/34 lignes, le pire absolu)
- 🟠 19 403 sans message
- 🟠 184 `any` pour un module de gestion simple → sur-modélisation probable

### Tier 2 — dette àContaining

**`orientation`** — 36 fichiers, 66 routes
- 🔴 42 403 sans message sur 3 routes porteuses de message (93 % vides) → le standard n'existe pas
- 🟠 45 fuites 5xx

**`stock`** — 44 fichiers, 76 routes — 24 403 vides, 80 fuites 5xx
**`ged`** — 59 fichiers, 8 139 lignes — 0 403 vide ✅ mais **330 `any`** et 75 fuites 5xx
**`auth`** — 46 fichiers, 77 routes — 17 403 vides dans les contrôleurs (les middlewares sont propres) ; 166 `any`
**`scolarite`** — 64 fichiers, 123 routes — 12 403 vides, 63 fuites 5xx
**`comptabilite`** — 48 fichiers, 67 routes — 0 403 vide ✅ mais 54 fuites 5xx
**`achats`** — 38 fichiers, 48 routes — 0 403 vide ✅, 45 fuites 5xx
**`elearning`** — 44 fichiers, 56 routes — 3 403 vides ✅ (le meilleur taux), 31 fuites 5xx

### Tier 3 — à surveiller

**`stage`** (8 vides / 42 fuites) · **`docgen`** (0 vide ✅, 27 fuites, 117 `any`) · **`communication`** (12 vides sur 13 → 92 % vides, pire taux) · **`bourse`** (0 vide ✅, 15 fuites) · **`reporting`** (0 vide ✅, 10 fuites — mais **0 route 422 validée**, 17 modèles pour 23 routes : couches redondantes ?) · **`parent`** (0 vide ✅, 7 fuites) · **`bulletins`** (2 vides) · **`marche`** / **`qualite`** / **`etablissement`** (0 vide ✅, à surveiller)

**`menu`** et **`surveillance`** — quasi vides, sans anomalie.

---

## 9. Plan d'action priorisé

### Urgent — sécurité (à engager cette semaine)

| # | Action | Effort | Impact |
|---|---|---|---|
| 1 | Helper `serverError` + suppression des 861 fuites d'erreur brute | 2-3 j | critique |
| 2 | Règle ESLint interdisant `json({ ... error })` | 0,5 j | empêche la régression |
| 3 | Vérifier les 835 routes d'écriture jamais testées (au minimum un `OPTIONS`/dry-run sur les plus sensibles : `rh`, `immobilisation`, `comptabilite`) | 3-5 j | critique |

### Important — dette structurelle (semaine suivante)

| # | Action | Effort | Impact |
|---|---|---|---|
| 4 | Règle ESLint sur le 403 sans message | 0,5 j | precondition |
| 5 | Correction 403 vague B (top 10 fichiers, ~50 occ.) | 2 j | fort |
| 6 | Helper `refuse()` avec enum fermé + codes stables | 1 j | fort |
| 7 | Déclaration globale `Request` → suppression `any` | 2-3 j | fort |
| 8 | 403 vague C (`inscription`, ~86 occ.) | 3 j | fort |

### Important — prévention

| # | Action | Effort | Impact |
|---|---|---|---|
| 9 | Tests unitaires sur les 10 controllers les plus chargés en 403 | 5 j | élevé |
| 10 | Couche de validation centralisée + format d'erreur normalisé | 10 j | élevé |
| 11 | Documenter `auth` + `inscription` en Swagger | 5 j | moyen |

### À planifier

- 403 vagues D et E (~139 occurrences)
- Migration `any` complète (3 682 occurrences)
- Refonte de `reporting` (17 modèles / 23 routes)
- Documentation Swagger des 22 modules restants

---

## 10. Ce qui est déjà fait dans cette session

| Action | Statut |
|---|---|
| Recette E2E 8 phases verte, 2 exécutions consécutives | ✅ commit `9900278` |
| Correction 403 sur les 9 middlewares `core/` | ✅ source, compile (0 erreur tsc) |
| `HierarchyController` — colonnes `codeSemestre` / `titre` | ✅ compile |
| `PresenceEnseignantController` — `subQuery: false` (bug Sequelize v6) | ✅ compile |
| `Logger` — sérialisation lisible des erreurs | ✅ compile |
| Inventaire des 1 609 routes | ✅ |
| Passe A sécurité : 1 597/1 609 → 401, aucune fuite d'accès | ✅ |
| Passe B : 23 erreurs 500 diagnostiquées | ✅ |
| Validation runtime des 4 correctifs | ⚠️ **non fait** — nécessite un rebuild de l'image (voir §11) |

### 11. Réserve importante

Les correctifs source de cette session sont validés par **compilation** (`tsc --noEmit` : 0 erreur sur les 12 fichiers modifiés), **pas par exécution**. L'image Docker `easyecole-backend:latest` est **périmée par rapport à la source** — elle ne contient pas encore ces correctifs. Une recette de confirmation est nécessaire après rebuild avant de déclarer le lot 23 × 500 comme résolu.

---

*Document généré par analyse statique. Les métriques par module sont reproductibles via les scripts d'audit.*