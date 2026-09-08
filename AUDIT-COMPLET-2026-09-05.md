# 🔍 RAPPORT D'AUDIT COMPLET — EASYECOLE

> **Date** : 05/09/2026
> **Périmètre** : backend (1 117 fichiers TS / 114 353 lignes), frontend (1 031 fichiers TS / 61 180 lignes), 295 tables MySQL, Docker/CI, sécurité
> **Mode** : audit en lecture seule — aucun fichier ni aucune donnée modifiée

---

## 1. Résumé exécutif

| Critère | Évaluation |
|---|---|
| **Qualité générale du code** | 🟠 Moyenne — socle cohérent (transactions bien gérées, requêtes paramétrées, conteneurisation propre), mais **accumulation de problèmes de montée en charge** |
| **Risque production immédiat** | 🔴 **ÉLEVÉ** — 8 problèmes critiques bloquants |
| **Préparation pour 10 000 utilisateurs** | 🔴 **INSATISFAISANTE** — saturations prévisibles (pool 20 conn., polling 60 s/utilisateur, N+1 comptables, pas de workers, pas de backup) |
| **Sécurité** | 🔴 **ÉLEVÉ** — LFI, IDOR, uploads non validés, JWT placeholder, OTP en clair |
| **Observabilité** | 🟠 Pauvre — `console.*`, pas de métriques, pas de slow-query, pas de request-id |

**Points sains vérifiés** : transactions commit/rollback `await`ées (35 sites), tous les `.then()` couplés à `.catch()`, uploads multer en `diskStorage` (pas en RAM), FK toutes indexées, requêtes Sequelize paramétrées (pas de concaténation SQL), static express restreint aux médias.

---

## 2. Architecture actuelle (réelle)

```text
Angular 17 (lazy loading partiel)
   → services data (app/data/modules)
   → Interceptors (auth, progress) + Guards
   → API Express /api/v1 (routes.ts → Scolarite/Inscription/Auth/...Router)
   → Controllers → Services métier → Sequelize ORM → MySQL (port 3307)
   └── Redis (cache optionnel, moyen down → DB directe)
   └── Socket.io (chat, notifications)
   └── Stockage fichiers local (public/, storage/) — GED, PV, cartes, PDF
   └── OCR (OcrService) + Puppeteer (PDF) + ffmpeg → SANS queue (synchrones dans le HTTP)
   └── Docker Compose : nginx + backend(1 process) + redis + mysql + frontend
```

**Points notables** : 295 tables (60,99 MB), 23 modules backend, 10 pôles fonctionnels, RBAC par `aut_user_permissions` (matérialisé) + `RolePermission`.

---

## 3. Problèmes CRITIQUES 🔴

| ID | Fichier | Problème | Impact | 10k users | Correction | Priorité |
|---|---|---|---|---|---|---|
| **AUDIT-D01** | `seed-comptes-par-role.ts:334` | `INSERT ... ON DUPLICATE KEY UPDATE` à **chaque boot** sur `aut_user_permissions` **sans index UNIQUE** → no-op → **+2 400 lignes/boot**. **Base réelle : 312 893 lignes** (6 utilisateurs × 33 930 lignes) | Table la plus grosse de la base (14,5 MB data + 14 MB index) | +2,7 M lignes/boot → 500 M+/an ; chaque `CheckPermission` scannera des dizaines de milliers de lignes | `UNIQUE(utilisateurId, permissionId)` + purge + s'appuyer sur `RolePermission` | **P0** |
| **AUDIT-D02** | `RecuCaisse.ts:38`, `DemandeDocument.ts:117`, `TypeOperationBordereau.ts:23`, `BourseConfiguration.ts:35` | `unique:true` restés dans 4 modèles → `sync({alter:true})` rejoue l'UNIQUE à chaque boot → **59 à 63 index dupliqués** par table (plafond MySQL 64 atteint) | `scol_recus_caisse` : 0 ligne mais 0,98 MB d'index ; chaque INSERT paie des dizaines d'index | Boot peut échouer définitivement ; écritures scolaires 3-5× plus chères | Retirer `unique:true` + `DROP INDEX _2.._63` + garder `uq_...` nominatifs | **P0** |
| **AUDIT-S01** | `DeliberationController.ts:400` | **LFI / Path Traversal** : `path.join(process.cwd(),'uploads','pv', req.params.filename)` sans normalisation, route sous `[Authenticate]` seul | Lecture arbitraire de fichiers serveur (dont `.env`) | Exposition totale des secrets | `path.basename` + `path.resolve` + check dossier + rôle | **P0** |
| **AUDIT-S02** | `DemandeDocumentController.ts:337` + Router:50 | **BOLA** : `batchStatut` (PUT `/batch/statut`) **sans middleware de rôle ni permission** | Tout compte authentifié (y compris apprenant) force `validee/delivree` d'une demande → **fraude aux documents** | Fraude massive sur les certificats | `CheckPermission` + scoping par rôle | **P0** |
| **AUDIT-S03** | `DossierEtudiantController.ts:474` | **IDOR** : `GET /dossiers/:id/complet` sans contrôle de propriété | Tout compte authentifié lit un dossier étudiant complet (identité, parents, échéances, bordereaux) | Fuite RGPD massive | Scoping `utilisateurId` pour APPRENANT | **P0** |
| **AUDIT-C01** | `docker-compose.yml` | **Aucune sauvegarde MySQL automatisée** (pas de conteneur cron backup, `backups/` = dumps manuels) | Perte totale des données (dossiers, bordereaux, comptabilité) | Catastrophique | Conteneur `mysqldump --single-transaction` + rétention + **test de restore** | **P0** |
| **AUDIT-C02** | `DatabaseConnection.ts:185-202` + `.env` | `DB_SYNC_ON_BOOT=true` → **`sequelize.sync({alter:true})` à chaque boot en prod** + `FOREIGN_KEY_CHECKS=0` | ALTER destructifs / verrous DDL à chaque déploiement | Downtime répété, schéma volatile, perte potentielle de données | Migrations versionnées (`migrations/` non branchées) + `DB_SYNC_ON_BOOT=false` | **P0** |
| **AUDIT-C03** | `DatabaseConnection.ts:102-123` | Purge des "orphelins" (`DELETE...NOT IN`) à **chaque boot**, activée par défaut | Locks + scans coûteux au démarrage | Boot pouvant bloquer des heures | `DISABLE_BOOT_ORPHAN_PURGE=true` en prod + cleanup planifié | **P0** |

---

## 4. Problèmes MAJEURS 🟠

| ID | Fichier | Problème | Impact / 10k | Correction |
|---|---|---|---|---|
| **AUDIT-B01** | `EtatsFinanciersController.ts:38,312,489` | **N+1 bilan comptable** : boucle comptes × `getSoldeCompteAtDate()` (2 req/compte) | Écran bilan > 10 s | `SUM GROUP BY` période en 1 passe |
| **AUDIT-B03/04** | `DashboardController.ts:88,522` | `findAll` **sans filtre ni agrégation** sur Demandes, Paiements, Échéances, Bordereaux (agrégés en JS) | Millions de lignes en RAM à chaque ouverture | `count()` + `GROUP BY` SQL + fenêtre annuelle |
| **AUDIT-B02** | `RappelEcheanceCron.ts:40-92` | Cron **sans LIMIT** (toute la table impayée) + 1 notification/insert/SSE séquentielle | Table entière en RAM, notifications en rafale | Batching 500/iter + notifications parallèles bornées |
| **AUDIT-B08** | `ReferenceService.ts:18-24` | Génération de référence **non atomique** (`findOrCreate`→`increment`→`reload`) → **doublons de références** en concurrence (preuve : doublons constatés au dashboard) | Références dupliquées = rapprochements faux | `INSERT...ON DUPLICATE KEY...RETURNING` en 1 requête |
| **AUDIT-B09** | `BulletinController.ts:39-92` | Transaction **ouverte sur toute la génération** de bulletins (boucles semestres × rangs 1 par 1) | Verrous longs, pool épuisé en campagne | Génération hors tx puis tx courte pour les rangs |
| **AUDIT-B11** | `OcrService.ts:34`, `DocumentGedController.ts:216,371,672` | `fs.readFileSync` charge **le PDF complet en RAM** dans le handler HTTP | Pics mémoire par upload | Streaming + limites + nettoyage temp |
| **AUDIT-B12** | `PdfGeneratorService.ts:21,30`, `GenerateurCarteService.ts:102` | **`puppeteer.launch()` par génération** (~300 MB Chromium) + `networkidle0` | Épuisement mémoire lors des campagnes (bulletins, cartes) | **Pool de browsers + file d'attente** |
| **AUDIT-B16** | `ExcelController.ts:456-761` | Import Excel **N+1 dans le handler HTTP** (3-6 req/ligne + `Op.like`) | Coach de cohortes → timeouts, pool épuisé | **Queue de job** + `bulkCreate` + index |
| **AUDIT-F01** | `base-layout.component.ts:76` | `setInterval(refreshStatutPaiement, 60000)` **dans le layout racine, jamais stoppé** | **1 req/min/utilisateur** = ~600 000 req/min à 10k | Push socket/SSE, ou timer lié à OnDestroy + pages concernées |
| **AUDIT-F05** | global `src/app` | **~1 202 `.subscribe(` vs 25 `takeUntil/untilDestroyed`** → fuites mémoire + doubles chargements réseau | RAM DOM + cumul de requêtes sur chaque navigation | `takeUntilDestroyed` / `\| async` + OnPush |
| **AUDIT-F14** | 404 composants | **0 `ChangeDetectionStrategy.OnPush`** | Tout l'arbre rescanne à chaque événement | OnPush + async pipe sur les composants de données |
| **AUDIT-F19** | `apprenant.service.ts:24`, `enseignant.service.ts:16` | `getAll()` **sans pagination** (listes 10k+) | Tableaux entiers en mémoire + réseau | Pagination serveur obligatoire |
| **AUDIT-F23/24** | `app-routing.module.ts` | Dashboard **non lazy** (bundle initial, budget 4/6 MB) + `canLoad: [AuthGuard]` **commenté** | Démarrage lent ; chunks téléchargés par non-autorisés | Lazy load dashboard + activation canLoad |
| **AUDIT-F16** | `base-component-class.ts:8-9` | `new JwtTokenService()` manuel + `static utilisateur` global mutable partagé | Écrans incohérents, aucune réactivité | Injection singleton + BehaviorSubject |
| **AUDIT-D03** | `CheckPermission.ts` | **4 requêtes séquentielles par requête protégée** (dont scan ~34 k lignes) | Saturation du pool | Index composite + 1 requête `RolePermission` + cache |
| **AUDIT-D04** | `MenuRoutes.ts:165` | Menu = `findAll` de **~34 000 permissions** incluse par utilisateur | 340 M lignes lues à 10k ouvertures de menu | Cache menu par rôle (RolePermission : 266 lignes) |
| **AUDIT-D05/C19** | `DatabaseConnection.ts` | **Pool `max:20`, acquire 20 s, SANS queueLimit** | Goulot dès ~150 req/s ; files illimitées + 500 | `max:50-100` via env + `connectionTimeout` + queueLimit |
| **AUDIT-D06** | `DataResolverService.ts:234` | **N+1 relevés** : `getEnseignantNom` par note (~1 000 req/relevé) | Génération de PV/relevés effondrée | `WHERE id IN (...)` + cache Map |
| **AUDIT-D07** | boot DB | `sync({alter:true})` sur **295 tables** au boot (cf C02) | Boots longs, DDL à chaque déploy | Migrations versionnées |
| **AUDIT-S05** | `app.ts:117` | `/media/scolarite/documents` **servi SANS authentification**, noms prévisibles | Attestations/certificats (données perso) lisibles par énumération | Auth + UUID + serveur via contrôleur |
| **AUDIT-S06** | `AuthRouter.ts:39,161` | Upload profil **sans fileFilter ni limits** (extension conservée, servi statiquement) | Upload `.html`/`.svg` → **XSS même-origine** ; DoS disque | Magic bytes + whitelist + montée `nosniff` |
| **AUDIT-S07** | `DocumentGedController.ts:199,356` | `folderId` injecté dans `path.resolve(UPLOAD_DIR, folderId, ficname)` | Écriture PDF hors `public/ged` (path traversal écriture) | Valider/sanitize `folderId` |
| **AUDIT-S08/09** | `.env:14,26,29,32` | `JWT_SECRET` placeholder « change_me », compte **MySQL `root`**, `DB_SYNC_ON_BOOT=true` | Forge de jetons, base entière si compromission API | Secrets forts + rotation + compte dédié |
| **AUDIT-S10** | `AuthController.ts:62` | **OTP loggé en clair** (track dev conservé) | Exfiltration des logs = 2FA neutralisée | Journaliser hash/statut, jamais l'OTP |
| **AUDIT-C04** | `docker-compose.yml` | **Aucune limite CPU/RAM** sur les services | Fuite mémoire → OOM host (puppeteer/ffmpeg) | `mem_limit` db 1G / backend 1-2G / redis-nginx 256M |
| **AUDIT-C05** | `.env` | MySQL en `root` avec le même mdp que `MYSQL_ROOT_PASSWORD` | Compromission API = base entière | Compte applicatif à privilèges limités |
| **AUDIT-C06** | `Dockerfile` + entrypoint | **Un seul process Node** pour API + Puppeteer + ffmpeg | Event loop bloquée pendant générations | Queue BullMQ + scaling horizontal |
| **AUDIT-C07/16** | `Logger.ts`, `routes.ts` | Logs `console.*` bruts, **aucune métrique**, pas de slow-query | Incident = aveugle | pino/winston JSON + request-id + prom-client + Grafana |
| **AUDIT-C09** | `ci-cd.yml:97` | `npm test -- --passWithNoTests` → **CI verte sans aucun test** | Régressions silencieuses | Retirer `--passWithNoTests`, seuil de coverage |
| **AUDIT-C14** | `nginx.conf` | **Pas de TLS** (80 seul), pas de HTTP/2, `client_max_body_size 250m` global | HTTPS hors contrôle, uploads non chiffrés | Let's Encrypt + brotli + limites par endpoint |

---

## 5. Problèmes MODÉRÉS 🟡 (sélection)

| ID | Fichier | Problème |
|---|---|---|
| B06 | ~28 controllers | `findAll` admin sans pagination (RH, achats, stock, permissions) |
| B07 | `DataResolverService.ts:89,211` | `Promise.all` N+1 par cursus + `Etablissement.findOne` répété **14×** dans le fichier |
| B13 | `CacheMiddleware.ts:26,38` | `redis.set/delByPattern` fire-and-forget sans catch → rejets non gérés si Redis tombe |
| B15 | `EcheanceController.ts:216` | Échéancier inséré **1 par 1 sans transaction** |
| B17 | `app.ts:34-39` | `uncaughtException` loggé mais process non terminé → état corrompu ; **FIX : exit(1) + redémarrage** |
| B20 / S22 | `app.ts:127` | Swagger exposé si `NODE_ENV !== 'production'` (défaut dev) |
| D08 | 942 colonnes DATETIME / collation `utf8mb3` / montants en **FLOAT** / VARCHAR(255) généralisé | Arrondis monétaires + RAM index +15-20 % |
| D09 | `scol_demandes_document.statut`, `scol_journal_caisse.createdAt`, `aut_user_permissions.estActif` | Index manquants sur les futures tables chaudes |
| D10 | `docgen_templates.contenu` LONGTEXT (15,53 MB / 78 lignes) | Gabarits binaires relus intégralement |
| D11 | `ged_folders` | **3 174 dossiers pour 6 documents** — arborescences générées en masse pour chaque étudiant × année |
| F02 | `sse.service.ts:39` | Fallback `interval(30000)` + `catchError(() => [])` → polling aveugle permanent |
| F08 | `discussions-page.component.ts` | 21 `.subscribe` sans nettoyage + double chargement (ngOnInit + ngAfterViewInit) |
| F15 | services inscription | `shareReplay(1)` + `invalidate()` **jamais appelée** → données périmées + variantes non cachées |
| F18 | `dashboard-page.component.ts` | 4 chargements `ngOnInit` via HttpClient direct |
| S12 | `Authenticate.ts:26`, `app.ts:108` | **JWT en query string** (whitelist GED/bordereaux/PV) + morgan `combined` → tokens loggués |
| S13/14 | `AuthRouter.ts:93`, `AuthController.ts:53` | `register` public sans rate-limit + 404 « non trouvé » → énumération de comptes |
| S17 | `DeliberationRouter.ts:10` | Lectures délibérations (résultats, dettes) sous `[Authenticate]` seul → apprenant lit toutes les classes |
| S21 | sanitize-html + otp-page + template-edit | Sanitizer regex faible + `bypassSecurityTrustHtml` → XSS (fix : DOMPurify + CSP) |
| C08 | `ci-cd.yml:166` | Images construites en CI **rejetées** (pas de registry) → image déployée ≠ testée ; pas de Trivy |
| C15 | `app.ts:99` | Rate-limit 2000 req/15 min/IP global → **toute une école derrière une IP NAT bloquée** |
| C18 | volumes `uploads`/`storage` | Non sauvegardés (docs légaux : dossiers, cartes, GED) |

---

## 6. Code mort / requêtes mortes

| Type | Élément | Raison |
|---|---|---|
| Backend | `CalculRattrapageService.ts`, `CalculCompensationService.ts` | **Zéro import** dans tout le codebase — la logique « calcul rattrapage/compensation » est **inopérante en production** (fonctionnalité prévue mais non branchée) |
| Backend | `PdfGeneratorService.googleFontsUrl` | Dead config |
| Frontend | 17 services non importés (vérifiés) : `AchatsService`, `AcquisitionService`, `AdministrationService`, `QuitusService`, `TuteurService`, `ConventionStageService`, `NoteStageService`, `RhLigneBulletinService`, etc. | Occurrence = déclaration seule |
| Frontend | `sse.service` fallback + socket | Double source sans bascule claire |
| Frontend | 2 pages `roles-page` (administration + parametres) | Duplication divergente |

---

## 7. Fichiers les plus problématiques (top 10)

| # | Fichier | Problèmes |
|---|---|---|
| 1 | `ExcelController.ts` | Import N+1/LIKE dans le HTTP, pas de nettoyage temp |
| 2 | `DashboardController.ts` | 4 `findAll` massifs non filtrés |
| 3 | `DataResolverService.ts` | N+1 + Etablissement requêté 14× |
| 4 | `EtatsFinanciersController.ts` | N+1 bilan |
| 5 | `PdfGeneratorService.ts` | Chromium par requête |
| 6 | `BulletinController.ts` | Transactions longues + boucles rangs |
| 7 | `DocumentGedController.ts` / `OcrService.ts` | Fichiers lus en RAM, path traversal |
| 8 | `base-layout.component.ts` | Polling 60 s racine permanent |
| 9 | `discussions-page.component.ts` | 21 subs + double chargement |
| 10 | `apprenant.service.ts` / `enseignant.service.ts` | getAll() sans pagination |

---

## 8. Test de résistance théorique (10 000 utilisateurs)

| Scénario | Premier goulot | Second | Troisième |
|---|---|---|---|
| 1 000 actifs | `aut_user_permissions` (scan 34 k lignes par CheckPermission) | Pool MySQL max 20 | Menu (34 k lignes/utilisateur) |
| 500 consultent dossiers | Chargement de toutes les demandes (pas de pagination) | N+1 docgen | Polling paiement × 60 s |
| 200 uploads docs | `readFileSync` PDF en RAM | Pas de queue OCR (traitements HTTP bloquants) | Puppeteer 300 MB/requête |
| 100 opérations financières | Écrans comptables N+1 (SUM par compte) | Écritures FLOAT (arrondis) | Transactions bulletins longues |
| Contenu partagé | Menu ré-généré par utilisateur (aucun cache par rôle) | Permissions re-scannées | Redis non branché sur ces chemins |

**Conclusion nette** : à ~500 utilisateurs simultanés, les symptômes apparaissent (timeouts, pool épuisé, lenteur menu/dashboard) ; à 2 000, indisponibilité prévisible ; à 10 000, effondrement sauf traitements en priorité P0/P1.

---

## 9. Architecture cible (justifiée, progressive)

```text
Angular (OnPush, async pipe, canLoad, pagination serveur)
   ↓
nginx (TLS, brotli, rate-limit par utilisateur)
   ↓
API Express (single process × N via PM2/scale)
   ↓
Redis (cache permissions/menu références + queue BullMQ)
   ↓
MySQL (pool 50-100, migrations versionnées)
   ↓
Queue OCR/PDF/excel → Workers (puppeteer pool, streaming)
   ↓
Stockage objet (MinIO/S3) + backup automatisé
```

Chaque ajout est justifié par un finding : Redis par D01/D03/D04 (permissions/menu), BullMQ par B11/B12/B16 (OCR/PDF/excel), stockage objet par C18 (volumes non sauvegardés).

---

## 10. PLAN DE CORRECTION (Roadmap)

### PHASE 0 — URGENT (sécurité + données)
- S01 LFI, S02 batchStatut, S03/S04 IDOR, S05 exposition statique, S06 upload XSS, S07 path traversal GED, S08/S09 secrets (JWT, root, sync boot), C01 backup + test restore

### PHASE 1 — STABILITÉ
- D01 index UNIQUE + purge, D02 index dupliqués, C02/C03 migrations + disable sync/purge, D07, B08 références atomiques, B17 exit(1), C07 logs structurés

### PHASE 2 — PERFORMANCE
- D03/D04 CheckPermission/Menu par RBAC + cache, D05 pool, B01/B03/04 agrégations SQL, D06 N+1 docgen, B09 transactions bulletins, F05/F14 subscriptions + OnPush, F01 polling, F19 pagination

### PHASE 3 — SCALABILITÉ
- B11/B12/B16 workers OCR/PDF/Excel (BullMQ), C06 scaling multi-process, C04 limites mémoire, C08 CI

---

## Annexe — Suivi des en-têtes d'audit

| Domaine       | État | Risque |
| ------------- | ---- | ------ |
| Frontend      | 🟠 | ÉLEVÉ (subscriptions, polling, pagination) |
| Backend       | 🟠 | ÉLEVÉ (N+1, crons, event loop) |
| MySQL         | 🔴 | CRITIQUE (permissions dupliquées, index x63, sync au boot) |
| API           | 🟠 | ÉLEVÉ (N+1, pas de pagination, token en query string) |
| Upload        | 🟡 | MOYEN→ÉLEVÉ (XSS upload profil, path traversal GED) |
| OCR           | 🟠 | ÉLEVÉ (lecture RAM, pas de queue) |
| Sécurité      | 🔴 | CRITIQUE (LFI, IDOR, BOLA, secrets placeholder) |
| Docker        | 🟠 | ÉLEVÉ (pas de backup, pas de limites, single process) |
| Scalabilité   | 🔴 | INSUFFISANTE (goulots dès ~500 simultanés) |
| Observabilité | 🟠 | Pauvre (console.*, aucune métrique) |