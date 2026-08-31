# Fiche de Spécification — Tests d'Intégration « Anti-Requêtes Silencieuses »

> **Statut** : à implémenter par l'équipe Qualité
> **Version** : 1.0 (29/08/2026)
> **Outil** : Jest + supertest sur `app.ts` exporté (déjà exportable, ErrorHandler monté)
> **Cible** : ~1532 endpoints API sur 264 contrôleurs

---

## 1. Objectif

Garantir que **chaque endpoint API teste non seulement que la requête « réussit »,
mais aussi qu'elle « répond » toujours**, et qu'aucune requête ne meurt en silence
(promesse avalée, rejet non consommé, timeout sans réponse, `catch {}` muet).

> **Définition « requête silencieuse »** : une requête qui ne produit **aucune réponse**
> HTTP claire (pas de status explicite) ou dont l'échec est avalé sans être signalé,
> laissant croire à tort que tout va bien.

---

## 2. Les 3 protections obligatoires (dans la suite de test)

### P1 — Échec sur `unhandledRejection` / erreur non consommée

Chaque suite de test doit enregistrer un hook global qui fait **échouer** les tests
si une promesse rejetée n'est pas consommée.

```ts
// jest.setup.ts (extension)
process.on('unhandledRejection', (reason) => {
  throw new Error(`[REQUETE-SILENCIEUSE] Promesse rejetée non consommée : ${reason}`)
})
process.on('unhandledException', (err) => {
  throw err
})
```

> Une promesse rejetée `async` non retournée ou non capturée provoquera un
> **échec visible**, pas un silence.

### P2 — Toute requête DOIT répondre sous un délai max

Chaque appel supertest se termine par une assertion d'**existence de réponse**
(implicite via `expect(res.status)`), et une requête qui reste pendue est un échec.

```ts
import request from 'supertest'
import app from '../../../app'   // app.ts déjà exportable

// contrainte de délai globale (timeout de test)
jest.setTimeout(10000)

// Chaque test de route DOIT se terminer par une assertion de statut
// (jamais un simple "expect(request).resolves" sans vérifier la réponse).
```

**Règle** : aucun test ne doit se contenter de « lancer » la requête sans vérifier
que **une** réponse (même 4xx/5xx explicite) a été renvoyée dans le délai.

### P3 — Tester systématiquement le CAS D'ÉCHEC, pas que le cas nominal

Un endpoint testé uniquement sur son succès est un candidat naturel aux erreurs silencieuses.

Pour chaque méthode (GET / POST / PUT / DELETE / PATCH), tester a minima :
| Cas | Attendu |
|-----|---------|
| Accès refusé (rôle insuffisant / pas de token) | 401 ou 403 explicite |
| Ressource / route introuvable | 404 explicite |
| Payload invalide (validation) | 400 explicite |
| Erreur interne (le cas échéant) | 500 explicite |

> ⚠️ **Tout statut autre que `2xx` issu d'un plantage silencieux doit être détecté.**
> Si le code renvoie `200` par défaut sur une erreur avalée, le test d'erreur le révélera.

---

## 3. Gabarit minimal d'un test d'intégration par module

```ts
// src/__tests__/integration/<module>.<controller>.test.ts
import request from 'supertest'
import app from '../../../app'

describe('<Module> - <Controller> (intégration API)', () => {
  // P1 : nettoyage / seed minimal pour la base de test si nécessaire

  describe('GET <route>/', () => {
    it('répond 200 et liste (nominal)', async () => {
      const res = await request(app).get('/api/v1/...').set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)
    })
    it('répond 401 sans token (échec)', async () => {
      const res = await request(app).get('/api/v1/...')
      expect(res.status).toBe(401)
    })
  })
  // ... même logique pour POST / PUT / DELETE
})
```

> **Seuil de temps** : chaque test hérite du timeout global (P2). Une route qui
> dépasse sans répondre = échec automatique.

---

## 4. Critère de validation d'un module « couvert »

Un module est **couvert** quand, pour **chaque contrôleur** (registre de couverture),
les endpoints sont testés en **nominal + cas d'échec**, et que la suite est **verte**.

> Mise à jour du **registre global** (`docs/REGISTRE-COUVERTURE-TESTS.md`) :
> incrémenter le nombre d'endpoints couverts à mesure.

---

## 5. Rappel — infrastructure existante (réutilisable)

- `src/app.ts` : **déjà exportable** (permet les tests d'intégration sans CLI server).
- `src/core/middlewares/ErrorHandler.ts` : déjà monté, normalise 400/401/500.
- `jest.config.ts` : preset ts-jest, `roots: src`, `testMatch: **/__tests__/**/*.test.ts`.
- `jest.setup.ts` : charge `.env` (à compléter avec P1).

**Ne pas** :
- désactiver un test en échec sans justification (registre) ;
- tester uniquement les 2xx ;
- faire tourner l'intégration contre la base de production (toujours une DB de test).
