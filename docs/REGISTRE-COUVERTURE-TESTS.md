# Registre de Couverture de Tests — EasyEcole

> **Statut** : en cours
> **Version** : 1.1 (29/08/2026)
> **Nature** : outil de suivi de la couverture de tests (modules + endpoints API)
> **Périmètre** : backend Express (tests unitaires + intégration API prévus)
>
> **Documents associés** :
> - Fiche tests d'intégration : `FICHE-TESTS-ANTI-REQUETES-SILENCIEUSES.md`
> - Fiche cache Redis : `FICHE-IMPLEMENTATION-CACHE-REDIS.md`

---

## 1. Synthèse (état mesuré)

| Métrique | Valeur |
|----------|--------|
| Modules backend | **22** |
| Contrôleurs backend | **264** |
| Fichiers Router | **255** |
| Endpoints HTTP (approx.) | **~1532** |
| Modules avec ≥ 1 test | **6 / 22** |
| Modules sans test | **16 / 22** |
| Tests unitaires existants | 40 suites / 527 tests |
| Tests en échec | **88** (17 suites) |
| Couverture réelle | Partielle et non représentative |

> ⚠️ **Périmètre réel à couvrir** : ~1532 endpoints répartis sur 264 contrôleurs.
> Le niveau actuel ne teste qu'une fraction des modules, et les tests existants sont en échec.

---

## 2. Registre par module (source de vérité du suivi)

> **Colonnes** : « Contrôleurs » (nb de *Controller.ts), « Endpoints » (nb approx. de routes HTTP),
> « Tests » (nb de fichiers *.test.ts présents), « Statut » = état de couverture souhaité.

### 🟢 Modules partiellement couverts (à compléter)

| Module | Contrôleurs | Endpoints | Tests | Statut |
|--------|------------:|----------:|------:|--------|
| inscription | 63 | 422 | 26 | 🔴 tests en échec, à compléter |
| stock | 14 | 81 | 6 | 🟠 à compléter |
| auth | 10 | 72 | 2 | 🟠 à compléter (sécurité) |
| docgen | 8 | 31 | 3 | 🟠 à compléter |
| comptabilite | 14 | 66 | 1 | 🟠 à compléter (financier) |

### 🔴 Modules sans AUCUN test (priorité)

| Module | Contrôleurs | Endpoints | Tests | Priorité |
|--------|------------:|----------:|------:|----------|
| rh | 29 | 161 | 0 | 🔴 Haute (volume + métier RH) |
| scolarite | 18 | 120 | 0 | 🔴 Haute |
| immobilisation | 18 | 102 | 0 | 🔴 Haute (volume) |
| ged | 15 | 88 | 0 | 🔴 Moyenne |
| orientation | 11 | 68 | 0 | 🟠 Moyenne |
| comptabilite (compléter) | — | — | — | 🟠 Financier |
| elearning | 12 | 57 | 0 | 🟠 Moyenne |
| bulletins | 7 | 47 | 0 | 🟠 Moyenne (financier/académique) |
| achats | 9 | 45 | 0 | 🟠 Moyenne |
| qualite | 8 | 44 | 0 | 🟠 Moyenne |
| stage | 8 | 42 | 0 | 🟠 Moyenne |
| marche | 5 | 30 | 0 | 🟡 Basse |
| communication | 3 | 19 | 0 | 🟡 Basse |
| bourse | 3 | 15 | 0 | 🟡 Basse |
| reporting | 7 | 17 | 0 | 🟡 Basse |
| etablissement | 1 | 5 | 0 | 🟡 Basse |
| parent | 1 | 0 | 0 | 🟡 Basse |
| menu | 0 | 0 | 0 | — (pas de contrôleur) |

---

## 3. Méthode de travail (par vagues)

Ordre de priorité recommandé (risque métier × volume) :

1. **Vague 0 — Fiabiliser l'existant**
   - Mettre les **88 tests en échec** au vert (arbitrage : test obsolète vs régression).
   - Activer les **157 tests frontend** (Karma) dans la pipeline.
   - Mettre en place la **protection anti-requêtes silencieuses** (`unhandledRejection` → échec).

2. **Vague 1 — Flux critiques**
   - Comptabilité (compléter), bulletins, bourse.

3. **Vague 2 — Volumes métiers**
   - RH (29 ctrl), immobilisation (18), scolarité (18).

4. **Vague 3 — Modules fonctionnels**
   - GED, elearning, achats, stage, orientation, qualite, reporting, communication, marche, etablissement, parent.

---

## 4. Règle d'or de couverture (endpoints)

Pour chaque contrôleur, un test d'intégration doit couvrir **au minimum** :
- Le **contrat nominal** (CRUD : liste / détail / création / mise à jour / suppression).
- **2 à 3 cas d'erreur** par méthode (accès refusé, introuvable, payload invalide).

> 📊 **Jalon de progression** : suivre le **nombre d'endpoints couverts** sur ~1532.
> Un module est « couvert » quand tous ses contrôleurs sont testés (nominal + erreur).

---

## 5. Vigilance : requêtes qui meurent en silence

Un **middleware global d'erreur** (`ErrorHandler`) est déjà présent et monté dans `app.ts`.
Il ne peut **pas** détecter à lui seul :
- les promesses **non retournées** d'un handler `async` (rejet ignoré → réponse jamais envoyée) ;
- les `catch {}` muets qui avalent l'erreur ;
- les timeouts de requête long sans réponse.

**Protections à intégrer dans la suite de test (obligatoire) :**
1. Hook global qui **fait échouer** le test à la moindre `unhandledRejection` / erreur non consommée.
2. Délai de timeout (supertest) : toute requête **doit répondre** — une requête pendue = test en échec.
3. Tester **systématiquement le cas d'échec** de chaque endpoint, pas seulement le cas nominal.

---

## 6. Critère de « prêt à déployer »

La pipeline **(structure déjà en place)** doit exiger **tous Verts** avant le job `deploy` :
- `backend-validate` : typecheck + tests Jest **verts** (bloquants).
- `frontend-validate` : typecheck + **tests Karma** + build **verts**.
- `docker-build` : images construites.

Aucun `continue-on-error`/`allow failure` sur ces jobs.

---

## 7. Volet cache (production) — décisions IT

Contexte : objectif de ne pas surcharger la base MySQL en prod. Audit du 29/08 :
la couche cache est **conçue mais inactive** (init jamais appelé, middleware non monté,
aucun service Redis en prod). Détails : `FICHE-IMPLEMENTATION-CACHE-REDIS.md`.

| Décision | Choix |
|----------|-------|
| D1 Architecture | **Redis seul** (pas de cache mémoire généralisé) |
| D2 Activation | Fail-safe au boot (Redis indisponible → fallback base, app OK) |
| D3 Prod | Service `redis:7` ajouté au docker-compose, `REDIS_URL` effectif, désactivable |
| D4 Cibles | Référentiels + dashboards (TTL 30–300 s), jamais flux financiers en TTL long |
| D5 Cohérence | Invalidation systématique sur écriture (POST/PUT/DELETE) |

État d'avancement du chantier global (29/08) :
- ✅ Registre de couverture (ce document)
- ✅ Fiche tests anti-requêtes silencieuses
- ✅ Bilan des 88 échecs (tests obsolètes → mise à jour, pas de timeout)
- ✅ Fiche d'implémentation cache Redis (décisions IT)
- 🔄 En attente d'implémentation : vague C1 (tests) + K1-K3 (cache), par l'équipe Qualité / Backend
