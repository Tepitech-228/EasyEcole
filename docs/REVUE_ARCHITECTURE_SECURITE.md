# Revue Architecture et Securite - EasyEcole

## Avis General

Le projet EasyEcole repose sur une architecture globalement saine : un backend Node.js/TypeScript separe du frontend Angular, avec un decoupage backend par modules metier. Cette approche est adaptee au contexte du projet, car le perimetre couvre plusieurs domaines sensibles : inscription, orientation, notes, bulletins, paiements, QR codes, scolarite, comptabilite, RH, achats, reporting et e-learning.

Le choix d'un monolithe modulaire est pertinent pour cette phase du projet. Il permet de garder une architecture comprehensible, de mutualiser l'authentification, les permissions, les modeles et les regles metier, tout en evitant la complexite prematuree d'une architecture microservices.

Cependant, la securite actuelle correspond davantage a un niveau developpement/recette qu'a un niveau production. Plusieurs mecanismes existent deja, mais certains verrous sont trop permissifs ou incomplets.

## Points Positifs

- Separation claire entre `easy-ecole-backend` et `easy-ecole-web`.
- Backend organise par modules metier : `auth`, `inscription`, `orientation`, `bulletins`, `scolarite`, `comptabilite`, `rh`, `achats`, `reporting`, `elearning`.
- Utilisation de `helmet` pour les en-tetes de securite HTTP.
- Utilisation de `express-rate-limit` pour limiter les requetes.
- Authentification par JWT deja en place.
- Mots de passe hashes avec `bcrypt`.
- Presence de middlewares d'authentification et de roles.
- Systeme de permissions deja amorce avec permissions utilisateurs et permissions par role.
- Utilisation frequente de `paranoid: true` dans les modeles Sequelize, ce qui permet une suppression logique.
- Les domaines sensibles du metier sont bien representes : notes, paiements, documents, QR codes, RH, comptabilite.

## Risques Critiques Identifies

### 1. Secret JWT trop faible

Fichier concerne : `easy-ecole-backend/src/core/config/jwt.ts`

Le code utilise une valeur par defaut :

```ts
export const JWT_SECRET = process.env.JWT_SECRET || 'secret'
```

C'est dangereux en production. Si la variable d'environnement n'est pas definie, tous les tokens sont signes avec une cle connue.

Recommandation : rendre `JWT_SECRET` obligatoire au demarrage de l'application et refuser de lancer le serveur si la variable est absente.

### 2. Tokens JWT sans expiration pour la connexion

Fichier concerne : `easy-ecole-backend/src/modules/auth/controllers/AuthController.ts`

Le token de login est genere sans `expiresIn`. Un token vole pourrait donc rester valide indefiniment.

Recommandation : ajouter une expiration courte, par exemple `15m`, `1h` ou `2h`, puis prevoir un mecanisme de refresh token si necessaire.

### 3. Gestion des permissions insuffisamment protegee

Fichier concerne : `easy-ecole-backend/src/modules/auth/routers/PermissionRouter.ts`

Les routes de permissions sont protegees seulement par `Authenticate`. Un utilisateur connecte peut donc potentiellement acceder a des operations sensibles comme :

- consulter les permissions d'un utilisateur ;
- modifier les permissions d'un utilisateur ;
- copier les permissions d'un utilisateur vers un autre.

Recommandation : proteger ces routes avec un role fort (`ADMIN` ou `INSTITUTION`) et une permission explicite de type `action.administration.permissions.gerer`.

### 4. Middleware de permission en fail-open

Fichier concerne : `easy-ecole-backend/src/core/middlewares/CheckPermission.ts`

Actuellement, si une permission n'existe pas en base, le middleware laisse passer la requete avec `next()`.

C'est un comportement risque : une permission mal seedee ou une faute dans une cle de permission peut ouvrir un endpoint sensible.

Recommandation : adopter une logique fail-closed. Si la permission n'existe pas, retourner `403` ou `500` selon le cas.

### 5. CORS trop permissif

Fichier concerne : `easy-ecole-backend/src/app.ts`

La configuration actuelle accepte `*` si `CORS_ORIGIN` n'est pas defini.

Recommandation : en production, autoriser uniquement les domaines frontend officiels. Exemple :

```txt
CORS_ORIGIN=https://app.easyecole.example
```

Le meme durcissement doit etre applique a Socket.io.

### 6. Swagger expose publiquement

Fichier concerne : `easy-ecole-backend/src/app.ts`

La documentation API est exposee via `/api-docs`. C'est pratique en developpement, mais sensible en production.

Recommandation : desactiver Swagger en production ou le proteger avec authentification forte.

### 7. Uploads stockes dans `public`

Fichiers concernes :

- `easy-ecole-backend/src/modules/auth/routers/AuthRouter.ts`
- `easy-ecole-backend/src/modules/auth/routers/ApprenantRouter.ts`
- `easy-ecole-backend/src/modules/orientation/routers/ParcoursRouter.ts`

Plusieurs fichiers uploades sont stockes directement dans `public`. Cela expose potentiellement des documents ou fichiers sensibles.

Recommandations :

- stocker les fichiers sensibles hors du dossier public ;
- servir les fichiers via une route controlee par authentification ;
- verifier le type MIME reel ;
- limiter la taille des fichiers ;
- renommer les fichiers ;
- refuser les extensions executables ;
- scanner les fichiers si possible ;
- journaliser les consultations de documents sensibles.

### 8. Token stocke dans localStorage

Fichier concerne : `easy-ecole-web/src/app/core/services/local-storage.service.ts`

Le token JWT est stocke dans `localStorage`. C'est simple, mais vulnerable en cas de XSS.

Recommandation production : utiliser de preference un cookie `HttpOnly`, `Secure`, `SameSite=Strict` ou `Lax`, avec protection CSRF adaptee si l'API utilise les cookies.

### 9. Risque XSS avec HTML riche

Exemple concerne : `easy-ecole-web/src/app/features/modules/cours/pages/details-cahier-de-texte-page/details-cahier-de-texte-page.component.ts`

Le frontend utilise `bypassSecurityTrustHtml` pour afficher du contenu riche. Cela peut etre acceptable uniquement si le contenu est strictement nettoye cote backend.

Recommandation : sanitiser le HTML avant sauvegarde et/ou avant affichage, avec une bibliotheque robuste comme DOMPurify cote frontend ou une solution equivalente cote backend.

### 10. API de production forcee en HTTP

Fichier concerne : `easy-ecole-web/src/environments/environment.prod.ts`

La configuration production construit l'URL API en `http://hostname:3000`.

Recommandation : utiliser HTTPS en production et externaliser l'URL API via configuration d'environnement ou fichier de configuration deploye.

## Priorites de Correction

### Priorite 1 - Avant toute mise en production

- Rendre `JWT_SECRET` obligatoire.
- Ajouter une expiration aux JWT de connexion.
- Fermer CORS a des domaines explicites.
- Proteger ou desactiver `/api-docs`.
- Corriger `CheckPermission` pour bloquer si une permission est inconnue.
- Proteger les routes `/auth/permissions` avec un role et une permission forte.
- Remplacer les URLs API `http://` par `https://` en production.

### Priorite 2 - Protection des donnees sensibles

- Sortir les uploads sensibles du dossier `public`.
- Ajouter validation MIME, taille maximale et filtrage des extensions.
- Servir les documents via routes authentifiees.
- Ajouter un journal d'audit sur les operations sensibles.
- Verrouiller les endpoints qui ne sont proteges que par `Authenticate` mais manipulent des donnees critiques.

### Priorite 3 - Durcissement applicatif

- Mettre en place une politique de mots de passe.
- Ajouter une protection contre brute force sur `/auth/login` et reset password.
- Eviter les messages differents entre utilisateur inexistant et mauvais mot de passe.
- Ajouter MFA pour les roles sensibles : admin, institution, comptabilite, RH, scolarite.
- Ajouter une strategie de refresh token et revocation de session.
- Sanitiser tout contenu HTML riche avant affichage.

## Audit Log Recommande

Les actions suivantes devraient etre journalisees :

- connexion et echecs de connexion ;
- changement de mot de passe ;
- modification des permissions ;
- creation, modification et suppression d'utilisateur ;
- saisie, modification, validation et publication de notes ;
- generation et publication de bulletins ;
- validation de paiements et quitus ;
- upload, consultation et validation de documents ;
- generation et verification de QR codes ;
- operations comptables ;
- operations RH sensibles ;
- suppressions logiques et restaurations.

Chaque entree d'audit devrait contenir :

- identifiant utilisateur ;
- role ;
- action ;
- module ;
- ressource cible ;
- ancienne valeur si pertinent ;
- nouvelle valeur si pertinent ;
- adresse IP ;
- user-agent ;
- date et heure.

## Conclusion

EasyEcole a une bonne base architecturale. Le decoupage par modules est coherent avec le domaine metier, et le choix d'un monolithe modulaire est pertinent pour ce niveau de projet.

Le point faible principal n'est pas l'organisation du code, mais le niveau de durcissement securite. Avant une mise en production, il faut traiter en priorite l'authentification JWT, les permissions, CORS, Swagger, les uploads publics, l'audit trail et la configuration HTTPS.

Verdict : architecture saine, mais securite a renforcer avant exploitation reelle.
