# Stratégie de Tests Unitaires — EasyEcole

---

## Objectif

Créer une suite de tests unitaires automatisés pour l'ensemble des **15 modules backend** d'EasyEcole, permettant de valider le comportement de chaque contrôleur et de détecter les régressions lors des modifications.

---

## Stack technique

| Outil | Version | Rôle |
|-------|---------|------|
| **Jest** | 29.x | Framework de test |
| **ts-jest** | 29.x | Transpile TypeScript pour Jest |
| **Supertest** | 6.x | Test des routes HTTP (intégration) |
| **@types/jest** | 29.x | Typages TypeScript |

---

## Structure des tests

```
easy-ecole-backend/
├── jest.config.ts                    # Configuration Jest
├── tsconfig.test.json                # Typescript config pour les tests
├── src/
│   └── __tests__/
│       ├── helpers/
│       │   ├── express-mocks.ts      # Mocks pour req/res Express
│       │   └── model-mocks.ts        # Helpers pour mocker Sequelize
│       └── modules/
│           ├── auth/
│           │   ├── AuthController.test.ts
│           │   ├── ApprenantController.test.ts
│           │   └── EnseignantController.test.ts
│           ├── stock/
│           │   ├── ArticleController.test.ts
│           │   ├── FournisseurController.test.ts
│           │   ├── CategorieArticleController.test.ts
│           │   └── BonCommandeController.test.ts
│           ├── inscription/
│           │   ├── CoursController.test.ts
│           │   ├── ClasseController.test.ts
│           │   ├── SessionController.test.ts
│           │   ├── PresenceController.test.ts
│           │   ├── PaiementInscriptionController.test.ts
│           │   └── ...
│           ├── achats/
│           ├── bulletins/
│           ├── communication/
│           ├── comptabilite/
│           ├── elearning/
│           ├── ged/
│           ├── immobilisation/
│           ├── orientation/
│           ├── reporting/
│           ├── rh/
│           ├── scolarite/
│           └── stage/
```

---

## Stratégie de mock

Les contrôleurs sont des **classes statiques** dont les méthodes prennent `(req: Request, res: Response)`. Ils appellent directement les **modèles Sequelize**.

### Principe

On mocke **uniquement les appels Sequelize** via `jest.mock()`, pas la base de données réelle :

```ts
// Exemple de mock pour Article
jest.mock('../../models/Article', () => ({
  Article: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  }
}))
```

### Helper Express

```ts
// express-mocks.ts
export function mockRequest(data?: Partial<Request>): Request {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    ...data,
  } as Request
}

export function mockResponse(): Response {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.sendStatus = jest.fn().mockReturnValue(res)
  return res
}
```

---

## Convention d'écriture des tests

### Nommage

- Fichier : `NomDuController.test.ts`
- Describe : `describe('NomDuController.nomMethode', () => { ... })`
- Tests : `it('retourne 200 si ...', ...)`, `it('retourne 404 si introuvable', ...)`

### Structure d'un test CRUD typique

```ts
describe('ArticleController.getAll', () => {
  it('retourne 200 avec la liste des articles', async () => {
    const req = mockRequest()
    const res = mockResponse()
    ;(Article.findAll as jest.Mock).mockResolvedValue([fakeArticle])

    await ArticleController.getAll(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith([fakeArticle])
  })

  it('retourne 500 si erreur base de données', async () => {
    const req = mockRequest()
    const res = mockResponse()
    ;(Article.findAll as jest.Mock).mockRejectedValue(new Error('DB error'))

    await ArticleController.getAll(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
```

### Cas à couvrir par contrôleur

| Méthode | Cas OK | Cas erreur |
|---------|--------|------------|
| `getAll` | 200 + liste | 500 (DB error) |
| `get` | 200 + item | 404 (not found), 500 |
| `create` | 200 + item créé | 403 (rôle non autorisé), 400 (duplicate), 500 |
| `update` | 200 + item mis à jour | 403, 404, 400 (duplicate), 500 |
| `delete` | 200 + confirmation | 403, 404, 500 |

---

## Modules et priorité

| Ordre | Module | Nb contrôleurs estimé | Tests à écrire |
|-------|--------|----------------------|----------------|
| 1 | **Auth** | 4 (Auth, Apprenant, Enseignant, Utilisateur) | login, register, reset password, email confirm, CRUD |
| 2 | **Stock** | 5 (Article, Fournisseur, Categorie, BonCommande, LigneBonCommande, Mouvement) | CRUD complet |
| 3 | **Inscription** | ~15 (Cours, Classe, Session, Présence, Paiement, Note, Dossier, etc.) | CRUD + règles métier |
| 4 | **Achats** | ~8 (Demande, Commande, Facture, Budget, Réception, etc.) | CRUD + workflow validation |
| 5 | **Bulletins** | 4 (Bulletin, Délibération, Jury, Echelle) | CRUD + calculs |
| 6 | **Communication** | 3 (Communication, Actualité, Suggestion) | CRUD |
| 7 | **Comptabilité** | 3 (Ecriture, Journal, Compte) | CRUD + écritures |
| 8 | **Stage** | 8 (Offre, Demande, Convention, Rapport, etc.) | CRUD |
| 9 | **Scolarité** | 3 (Réclamation, Document, Livre) | CRUD |
| 10 | **Elearning** | ? | CRUD |
| 11 | **GED** | 2 (Document, Session) | CRUD |
| 12 | **Immobilisation** | 5 (Site, Immobilisation, Maintenance, etc.) | CRUD |
| 13 | **Orientation** | ? | CRUD |
| 14 | **RH** | ? | CRUD |
| 15 | **Reporting** | ? | CRUD |

---

## Exécution

```bash
# Lancer tous les tests
npm test

# Lancer les tests d'un module spécifique
npx jest src/__tests__/modules/auth/

# Lancer un fichier spécifique
npx jest src/__tests__/modules/auth/AuthController.test.ts

# Mode watch (développement)
npx jest --watch

# Avec couverture
npx jest --coverage
```

---

## Phases de réalisation

| Phase | Contenu | Statut |
|-------|---------|--------|
| 0 | Documentation + commit initial | ✅ À faire |
| 1 | Setup Jest + ts-jest + helpers | ⏳ En attente |
| 2 | Tests module Auth | ⏳ |
| 3 | Tests module Stock | ⏳ |
| 4 | Tests module Inscription | ⏳ |
| 5 | Tests module Achats | ⏳ |
| 6 | Tests module Bulletins | ⏳ |
| 7 | Tests module Communication | ⏳ |
| 8 | Tests modules restants | ⏳ |
