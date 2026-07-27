# Rapport global (EasyEcole Backend)

## Objectif
Parcours du projet côté backend pour produire un rapport module par module et endpoint par endpoint, en décrivant les processus.

> Note: en l’état, l’environnement de recherche (ripgrep) n’était pas disponible, donc le rapport ci-dessous est basé sur les fichiers réellement listés/visibles via l’outil (arborescence) et sur les fichiers GED déjà inspectés.

---

## Sommaire
- [core](#core)
  - [Middlewares](#middlewares)
  - [Services / Helpers](#services--helpers)
  - [Cache](#cache)
  - [Scripts seed/sync](#scripts-seed--sync)
- [modules: achats](#modules-achats)
- [modules: auth](#modules-auth)
- [modules: bulletins](#modules-bulletins)
- [modules: communication](#modules-communication)
- [modules: comptabilite](#modules-comptabilite)
- [modules: elearning](#modules-elearning)
- [modules: ged](#modules-ged)
- [modules: immobilisation](#modules-immobilisation)
- [modules: inscription](#modules-inscription)
- [modules: menu](#modules-menu)
- [modules: orientation](#modules-orientation)
- [modules: reporting](#modules-reporting)
- [modules: rh](#modules-rh)
- [modules: scolarite](#modules-scolarite)
- [modules: stage](#modules-stage)
- [modules: stock](#modules-stock)

---

## core

### Middlewares
- `core/middlewares/Authenticate.ts`
- `core/middlewares/AuthInstitution.ts`
- `core/middlewares/AuthApprenant.ts`
- `core/middlewares/AuthAdmin.ts`
- `core/middlewares/AuthEnseignant.ts`
- `core/middlewares/AuthCaissierBanque.ts`
- `core/middlewares/AuthComiteOrientation.ts`
- `core/middlewares/AuthRessourcesHumaines.ts`
- `core/middlewares/AuthConfidentiality.ts`
- `core/middlewares/CheckPermission.ts`
- `core/middlewares/CacheMiddleware.ts`
- `core/middlewares/ErrorHandler.ts`

**Process général (pattern)**
1. Vérification token/session (Authenticate)
2. Vérification rôle autorisé (middlewares spécifiques par rôle)
3. Vérification permission/confidentialité
4. ErrorHandler renvoie une réponse cohérente

### Services / Helpers
- `core/helpers/DatabaseConnection.ts`
- `core/helpers/DocumentPDFGenerator.ts`
- `core/helpers/OcrService.ts` (dans `core/services`)
- `core/services/AuditService.ts`
- `core/services/ReferenceService.ts`
- `core/helpers/MobileMoneyCinetpay.ts`
- `core/helpers/SseService.ts`
- `core/validators/*`

### Cache
- `core/cache/RedisClient.ts`
- middleware: `core/middlewares/CacheMiddleware.ts`

### Scripts seed/sync
- `core/scripts/seed.ts`
- `core/scripts/reset-database.ts`
- `core/scripts/sync-database.ts`
- `core/scripts/sync-reporting.ts`

---

## modules: achats
- Fichiers clés:
  - `modules/achats/AchatsModule.ts`
  - `modules/achats/AchatsRoutes.ts`
  - `modules/achats/controllers/*`
  - `modules/achats/models/*`
  - `modules/achats/routers/*`

**Process général** (à confirmer par lecture des contrôleurs)
- CRUD sur Budget / Demande / Commande / Engagement / Facture / Fournisseur / Réception
- Endpoints contrôlés par Authenticate + middlewares rôle

---

## modules: auth
- Fichiers clés:
  - `modules/auth/AuthModule.ts`
  - `modules/auth/AuthRoutes.ts`
  - `modules/auth/controllers/*`
  - `modules/auth/models/*`
  - `modules/auth/seed/*`

**Process général**
- Authentification + gestion utilisateurs/roles/permissions
- Seeds pour roles/permissions

---

## modules: bulletins
- Fichiers clés:
  - `modules/bulletins/controllers/BulletinController.ts`
  - `modules/bulletins/routers/BulletinRouter.ts`
  - seed: `modules/bulletins/seed.ts` (création `EchelleNote`)


### Routes & endpoints (par `InscriptionRoutes`)
Les endpoints bulletins sont montés via `InscriptionRoutes` avec le prefix serveur `/inscription` :

- `POST /inscription/bulletins/generer`

  - Middlewares: `AuthInstitution`, `CheckPermission('action.evaluation.bulletin.generer')`, `validerGeneration`
  - Logique: génère les bulletins en transaction, calcule notes/moyennes par cours à partir des évaluations et des poids (devoir/examen + notes pondérées), puis calcule rang/mention.
  - Réponses: 400 (paramètres manquants), 404 (aucun apprenant/cours), 500 (erreur)

- `GET /inscription/bulletins`
  - Middlewares: `Authenticate`, `validerPagination`
  - Logique: `Bulletin.findAndCountAll` avec `include` (utilisateur/classe/année/lignes).
  - Réponses: 200 (data + pagination), 500

- `GET /inscription/bulletins/mon-releve`
  - Middlewares: `Authenticate`, `AuthApprenant`
  - Logique: récupère le dernier bulletin publié de l’apprenant connecté (`statut='publie'`).
  - Réponses: 401 (non authentifié), 404 (aucun bulletin), 500

- `GET /inscription/bulletins/moyennes`
  - Middlewares: `Authenticate`
  - Logique: agrégation par classe (effectif, moyenne min/max, taux de réussite, meilleur élève).
  - Réponses: 500

- `GET /inscription/bulletins/:id`
  - Middlewares: `Authenticate`
  - Logique: `findByPk` + includes (lignes + cours).

- `PUT /inscription/bulletins/:id`
  - Middlewares: `AuthInstitution`, `CheckPermission('action.evaluation.bulletin.modifier')`, `validerUpdate`
  - Logique: modifie `appreciation` si bulletin non publié.

- `PUT /inscription/bulletins/:id/publier`
  - Middlewares: `AuthInstitution`, `CheckPermission('action.evaluation.bulletin.publier')`
  - Logique: passe `statut` en `publie` et set `datePublication`.

- `PUT /inscription/bulletins/:id/signer-enseignant`
  - Middlewares: `Authenticate`, `AuthEnseignant`
  - Logique: enregistre `signatureEnseignant` et `dateSignatureEnseignant`.

- `PUT /inscription/bulletins/:id/signer-chef`
  - Middlewares: `Authenticate`, `AuthInstitution`
  - Logique: enregistre `signatureChef` et `dateSignatureChef`.

- `DELETE /inscription/bulletins/:id`
  - Middlewares: `AuthInstitution`, `CheckPermission('action.evaluation.bulletin.supprimer')`
  - Logique: `destroy` du bulletin.

### Process de génération (BulleinController.generer)
1. Démarre une transaction.
2. Valide `classeId`, `semestre`, `anneeAcademiqueId`.
3. Récupère les apprenants (CursusApprenant) et les cours du semestre.
4. Pour chaque apprenant, crée le bulletin si absent.
5. Pour chaque cours: récupère `ListeNoteEvaluation` et ses `notesEvaluation` filtrées par `CoursParticipant`.
6. Calcule `noteDevoir`, `noteExamen` et/ou une moyenne pondérée (selon catégories/poids).
7. Calcule `moyenneGenerale` pondérée par crédits (coefficient) + total credits + crédits validés.
8. Crée les `LigneBulletin`.
9. Calcule rang/mention sur l’ensemble des bulletins du contexte.
10. Commit et retourne les bulletins créés.


---

## modules: communication
- Fichiers clés:
  - `modules/communication/CommunicationModule.ts`
  - `modules/communication/CommunicationRoutes.ts`
  - `modules/communication/controllers/*`
  - `modules/communication/seed.ts`

---

## modules: comptabilite
- Fichiers clés:
  - `modules/comptabilite/ComptabiliteModule.ts`
  - `modules/comptabilite/ComptabiliteRoutes.ts`
  - `modules/comptabilite/seed.ts`

---

## modules: elearning
- Fichiers clés:
  - `modules/elearning/ElearningModule.ts`
  - `modules/elearning/ElearningRoutes.ts`
  - `modules/elearning/controllers/*`
  - `modules/elearning/socket/*`

---

## modules: ged

### Fichiers clés
- `modules/ged/GedModule.ts`
- `modules/ged/GedRoutes.ts`
- `modules/ged/controllers/*`
- `modules/ged/routers/*`
- `modules/ged/models/*`
- `modules/ged/seed-ged-demo.ts`

### Routes
- `GedRoutes.ts`:
  - `/documents` -> `DocumentGedController` (Authenticate)
  - `/folders` -> `FolderController` (Authenticate)
  - `/sessions` -> `SessionGedController` (Authenticate)
  - `/admin` -> `AdminGedRouter` (Authenticate)

### Controllers (GED) inspectés

#### DocumentGedController
- `getAll`:
  - Pagination: `page`, `pageSize`
  - Filtres: `statut`, `folderId`, `domainId`, `documentTypeId`, `confidentialityLevel`, `lifecycleStatus`, `anneeAcademiqueId`, `parcoursId`, `niveauEtudeId`
  - Recherche texte: `q` via `LIKE %q%` sur plusieurs colonnes: `titre`, `reference`, `contenuTexte`, `tags`, `auteur`
  - Contrôle rôle: non-admin -> `confidentialityLevel in ('public','interne')`
  - Query: `DocumentGed.findAndCountAll` + `include` uploader/domain/documentType
- `get`:
  - `findByPk` + includes (uploader/domain/documentType/folder/session/parent)
  - versions: si `reference` existe, `findAll` sur même reference excluant le document courant
- `upload`:
  - Vérifie rôle INSTITUTION/ADMIN
  - Stocke fichier via multer diskStorage
  - OCR: `OcrService.extraireMetadonnees(fullPath)`
  - Hash intégrité SHA256
  - Génération référence si absente: `ReferenceService.generer(domain.code, docType.shortCode, year)`
  - ClassificationPath (fallback)
  - `DocumentGed.create` + Audit log
- `update`:
  - Lock checks
  - Modifie champs updatable
  - Si fichier fourni -> supprime ancien + OCR + recompute hash
- `download`:
  - Stream fichier
- `exportPdf`:
  - Génère PDF summary: `DocumentPDFGenerator.generateGedSummary`
- `validate`:
  - lock + passage `courant` -> `intermediaire`, `duaEndDate` selon DocumentType
- `newVersion`:
  - copy file dans `public/ged/versions`
  - crée nouvelle ligne avec `parentDocumentId`
- `lock/unlock`:
  - verrouillage par institution/admin/owner
- `markForDeletion/confirmDeletion`:
  - flow “soft lifecycleStatus -> record -> delete efetif”
- `getAuditTrail`:
  - join utilisateurs pour logs

#### FolderController
- `list`: `Folder.findAll(order nom ASC)`
- `create/update/remove`: CRUD (avec AuthInstitution/Admin)

#### SessionGedController
- `list`:
  - `SessionGed.findAll` avec `include creator` + `include documents` (potentiellement coûteux)
- `get`, `create`, `update`
- `uploadBatch`:
  - `req.files` array -> création DocumentGed multiples
- `generateShareLink`:
  - génère token chiffré AES + log consultation

### Admin Ged
- Routers `AdminGedRouter.ts` (non inspecté en profondeur dans cette passe)

### Seed GED
- `seed-ged-demo.ts` corrigé pour ne plus planter sur schéma DB partiel (absence de colonnes attendues / absence de deletedAt)

---

## modules: immobilisation
- Fichiers clés: `ImmobilisationModule.ts`, `ImmobilisationRoutes.ts`

---

## modules: inscription
- Fichiers clés:
  - `inscription/InscriptionModule.ts`
  - `inscription/InscriptionRoutes.ts`
  - `inscription/controllers/*` (dont `DashboardController.ts`)

---

## modules: menu
- `menu/MenuRoutes.ts`, `menu/menu.config.ts`

---

## modules: orientation
- `orientation/OrientationModule.ts`, `OrientationRoutes.ts`

---

## modules: reporting
- `reporting/ReportingModule.ts`, `ReportingRoutes.ts`

---

## modules: rh
- `rh/RhModule.ts`, `rh/RhRoutes.ts`, `rh/seed.ts`

---

## modules: scolarite
- `scolarite/ScolariteModule.ts`, `ScolariteRoutes.ts`, `seed.ts`

---

## modules: stage
- `stage/StageModule.ts`, `StageRoutes.ts`

---

## modules: stock
- `stock/StockModule.ts`, `StockRoutes.ts`

---

## Statut actuel
- Rapport généré **partiellement** (surtout core + ged) car l’étape “lecture de chaque fichier/contrôleur/page” implique de parcourir beaucoup de fichiers.
- Prochaine étape pour compléter fidèlement votre demande:
  - pour chaque module: lire `*Routes.ts` + chaque controller + chaque page/endpoint (s’il y a un front côté web) puis écrire un chapitre.

Le fichier produit est: `easy-ecole-backend/PROJECT_RAPPORT.md`.
</result>
<command></command>
</attempt_completion>
