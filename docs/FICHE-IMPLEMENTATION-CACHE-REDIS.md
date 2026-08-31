# Fiche d'Implémentation — Système de Cache (Redis)

> **Statut** : décisions IT validées — à implémenter par l'équipe Backend
> **Version** : 1.0 (29/08/2026)
> **Objectif** : ne pas surcharger la base MySQL en production (lectures fréquentes en cache)
> **Base existante** : `src/core/cache/RedisClient.ts` + `src/core/middlewares/CacheMiddleware.ts` (conçus, **non activés**)

---

## 1. Constat (audit du 29/08)

| Élément | État |
|---------|------|
| `RedisClient.ts` (singleton, fail-safe, logs throttlés) | ✅ Conçu |
| `CacheMiddleware.ts` (cache GET + invalidation sur écriture) | ✅ Conçu |
| `init()` du client appelé au boot | ❌ **Jamais appelé** → client non connecté |
| Middleware `cache()` monté sur des routes | ❌ **Aucune route** |
| Service Redis dans docker-compose prod | ❌ **Absent** |
| `REDIS_URL` configuré | ⚠️ Variable prévue, non effective |

**Conclusion** : le cache est **« prêt mais inactif »**. Il faut l'activer (K1→K3), sinon la base reste en première ligne en prod.

---

## 2. Décisions IT (validées)

### D1 — Architecture : Redis seul (pas de cache mémoire généralisé)
- Utiliser **Redis comme seule couche de cache partagée**.
- La Map mémoire de la GED (`cacheged.ts`) **reste un cas particulier local**, non généralisé (évite la double invalidation mémoire/Redis).
- **Justification** : simplicité, cohérence multi-instances (Dokploy peut scaler), invalidation centralisée.

### D2 — Activation fail-safe au boot (non bloquant)
- Appeler `RedisClient.getInstance().init()` **au démarrage** (`app.ts`, avant le montage des routes).
- Si Redis absent/joignable → `enabled=false`, **l'application fonctionne normalement** (fallback base).
- Aucun risque : le cache ne doit **jamais** être la source de vérité ni un point de défaillance.

### D3 — Redis actif en prod dès maintenant, mais désactivable
- Ajouter un **service Redis dédié** dans `docker-compose.yml` (prod) : `redis:7` + volume persistant + healthcheck.
- Le backend reçoit `REDIS_URL=redis://redis:6379`.
- L'absence de `REDIS_URL` (ex. env local) **désactive** le cache sans erreur → rétrocompatible.

### D4 — Cibles du cache : uniquement données peu volatiles et coûteuses
- **À cacher** : référentiels, dashboards, listes quasi-statiques (voir §4).
- **À ne PAS cacher en TTL long** : flux financiers sensibles, écritures, données strictement temps réel.
- TTL **courts** (30–300 s) selon volatilité.

### D5 — Cohérence lecture/écriture obligatoire
- Le middleware invalide déjà le cache par pattern sur POST/PUT/DELETE réussi.
- **Toute nouvelle écriture sur une donnée cachée DOIT invalider** la clé correspondante, sinon cache obsolète.

---

## 3. Ordre d'implémentation (petits lots à fort impact)

### Lot 1 — Activér la brique (bloquant)
- **K1** : service `redis:7` dans `docker-compose.yml` + `REDIS_URL` dans la config prod.
- **K2** : appeler `RedisClient.getInstance().init()` au boot dans `app.ts`.

### Lot 2 — Mettre le middleware en pratique sur un premier périmètre
- **K3a** : monter `cache(ttl)` sur les **5 contrôleurs Dashboard** (dashboards = coûteux, agrégents).
- **K3b** : monter sur les **référentiels inscription** (Classe, Niveau, Parcours, Cours, TypeNote, Matiere, Salle, TypeNote, Semestre, Session).

### Lot 3 — Généraliser (par vague)
- **K3c** : étendre aux référentiels des autres modules (RH, RH postes/catégories, scolarité, immobilisation catégories/sites, etc.), uniquement les listes stables.

### Lot 4 — Surveillance
- **K5** : s'assurer que les logs `[CACHE]` de `RedisClient.signaler()` remontent en prod (pas de cache qui échoue en silence).

---

## 4. Liste cible initiale des routes à mettre en cache

### A. Dashboard (agrégats coûteux — TTL 30–60 s)
| Contrôleur | Note |
|------------|------|
| `DashboardController` (inscription) | 12 méthodes agrégées — TTL court 30 s |
| `ComptabiliteDashboardController` | agrégats financiers — côté prudence, TTL 30 s, données non-mensuelles |
| `RhDashboardController` | TTL 60 s |
| `SecretariatDashboardController` | TTL 60 s |
| `DashboardGedController` | TTL 60 s |

> ⚠️ Les dashboards financiers doivent être **recachés après toute écriture** ; si l'invalidation est complexe, les laisser hors cache ou TTL très court.

### B. Référentiels inscription (donnée stable — TTL 300 s)
`Classe`, `NiveauEtude`, `Parcours`, `Cours`, `TypeNoteEvaluation`, `MatierePrerequis`, `SalleDeClasse`, `SemestreAcademique`, `Session`, `ParcoursChoisi`.

### C. Autres référentiels stables (à confirmer module par module)
Catégories/paramétrages RH, immobilisation (catégorie/site/département/localisation), stock (catégorie), achats (catégories), etc.

---

## 5. Critère de « non-régression »

- Le cache ne modifie **jamais** le comportement métier : 200/404/401/400 inchangés.
- Une panne Redis **ne doit pas** faire échouer une requête (fallback base silencieux + log).
- L'invalidation sur écriture est **testée** (une requête modifiée → le GET suivant renvoie la donnée fraîche).
