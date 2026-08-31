# AUDIT COMPLET PRÉ-PRODUCTION — EasyEcole

> **Application** : gestion scolaire (étudiants, enseignants, administration, comptabilité, secrétariat, direction)
> **Cible** : fonctionnement 24h/24 & 7j/7, plusieurs utilisateurs simultanés
> **Portée** : architecture, performance, sécurité, fiabilité, allègement, tests, CI/CD
> **Date** : 29/08/2026
> **Méthode** : audit statique + exécution d'outils de vérification ; **aucune modification effectuée au cours de l'audit**.

---

## 1. RÉSUMÉ EXÉCUTIF

**Décision pré-production : NO-GO immédiat.** L'application **fonctionne** mais elle n'est pas prête pour une production **24h/24 multi-utilisateurs** dans son état actuel. Plusieurs problèmes **CRITIQUES** (données, sécurité, performance) doivent être corrigés.

Les 3 constats majeurs :
1. **`sync({ alter: true })` actif par défaut en production** → risque de perte/altération de données au redémarrage.
2. **9 failles de sécurité RBAC/autorisation** dont certaines **critiques** (accès aux permissions de comptes, module comptabilité ouvert, upload GED de 3 Go, téléchargement public de bordereaux).
3. **N+1 / requêtes quadratiques massifs** sur les fonctionnalités les plus sollicitées (génération de bulletins, délibérations, états financiers) + **fuites mémoire côté Frontend** (323 composants sans libération de subscriptions).

**Points forts à préserver** : transactions bien menées sur les flux financiers critiques, cache Redis (récemment activé) fail-safe, rate-limiting global + helmet, requêtes SQL paramétrées, 25 modules frontend lazy-loaded, pool MySQL configuré.

---

## 2. PROBLÈMES CRITIQUES (C1)

### Sécurité
| # | Fichier | Problème | Risque |
|---|---------|----------|--------|
| S1 | `PermissionRouter.ts:11,12` | Routes permissions protégées par `[Authenticate]` uniquement | Tout utilisateur (apprenant, parent) peut **modifier/copier les permissions de n'importe quel compte** → élévation de privilèges |
| S2 | Module comptabilité (`CompteRouter`, `CompteBancaireRouter`, `ReleveBancaireRouter`, `RapprochementRouter`, `ExerciceComptableRouter`) | Aucun contrôle de rôle → tout authentifié accède/édite les comptes, RIB, rapprochements | Fuite/altération de données financières |
| S3 | `CheckPermission.ts:18-21` | **Fail-open** : permission inconnue = route autorisée | Une typo/seed incomplet déverrouille la route |
| S4 | `AuthConfidentiality.ts:8,14` | Fail-open si pas de `documentId`/document introuvable | Accès par défaut à des documents confidentiels |
| S5 | `DocumentGedRouter.ts:38` | Upload GED limité à **3 Go** | DoS trivial (disque/bande passante) par un utilisateur authentifié |

### Stabilité / données
| # | Fichier | Problème | Risque |
|---|---------|----------|--------|
| D1 | `DatabaseConnection.ts:225-248` | `sync({ alter: true })` **par défaut en prod** (+ FK checks off) | Perte de colonnes/données, verrouillage des tables au boot, indisponibilité |
| D2 | `PaiementInscriptionController.ts:112-132` | Paiement + écriture comptable + lettrage **hors transaction** | **Déséquilibre comptable silencieux** si une étape échoue |
| D3 | `ComptabiliteHelper.ts:58,105` | Numérotation des écritures via `count()` (race condition) | Doublons de numéros d'écritures comptables |
| D4 | `.env` + logs | 1227 `console.*` (dont body financiers dans `FinanceRouter.ts`) | Volumex + **fuite de données sensibles dans les logs** |

### Performance
| # | Fichier | Problème | Impact |
|---|---------|----------|--------|
| P1 | `GenerationBulletinService.ts:109-167` | N+1/quadratique : ~27 000 requêtes par génération de bulletins (classe 100/30UE/3MCC) | Génération en minutes, lock pool |
| P2 | `MoteurCalculService.ts:150-161,40-75` | N+1 délibérations massives (2 000+ requêtes) | Dégradation forte |
| P3 | `EtatsFinanciersController` + `ComptabiliteHelper.ts:87-142` | `findAll` charge toutes les écritures en RAM + **6 copies** du même calcul | Mo chargés en RAM, duplication |

---

## 3. PROBLÈMES DE SÉCURITÉ (complément ÉLEVÉ → MOYEN)

**ÉLEVÉ**
- `RhEmployeController.ts:27,38` : mass-assignment (`create(req.body)`/`update(req.body)`) sans whitelist.
- `BordereauController.ts:430-471` : téléchargement **public** de bordereaux par id séquentiel → exposition données perso/financières (IDOR).
- `UtilisateurController.ts:29,317` : listage des utilisateurs (PII) ouvert au-delà d'APPRENANT.
- `gen-tokens-temp.ts:18` / `seed-comptes-par-role.ts:17` : logs TOKEN + mot de passe par défaut en dur → à retirer de la prod.
- Fuite d'erreurs DB brutes au client : `RhEmployeController`, `PermissionController`, `DocumentGedController:1082`, `CartesController:47`, `VerificationController:57`.

**MOYEN**
- `AuthRouter.ts:246` : révocation JWT à la déconnexion à vérifier (`tokenVersion`).
- Salt rounds bcrypt incohérents (12 vs 10).
- OTP en mémoire (perte au redémarrage/multi-instance).
- Validation des entrées quasi absente (montants, emails, matricules).
- Upload : `fileFilter` ne teste que le MIME déclaré (spoofable), pas les magic bytes.
- `app.ts:81` CSP `style-src 'unsafe-inline'` (assumé Angular) ; Swagger UI exposé publiquement.
- Erreurs silencieuses : `ParentController.ts:128,168`, `seed-ged-full-demo.ts:117` (`catch {}` vides).

---

## 4. PROBLÈMES DE PERFORMANCE (Backend + DB)

**ÉLEVÉ**
- `RappelSalleCron.ts:24` : cron **toutes les minutes** sans garde anti-chevauchement + N+1 notifications.
- `SseController.ts:20` / `SseService` : aucun limite de clients SSE (fuite de descripteurs réseau).
- `DocumentPDFGenerator.ts` + `ArchiveGedService.ts` : streams non fermés + `readFileSync` de gros fichiers en RAM (346 Mo de vidéos elarning).
- `chatSocket.ts:98-105` : broadcast global `io.emit('presence')` + état online non nettoyé.
- `DeliberationController.ts:195,228,420` : `findAll` sans limit sur bulletins/résultats.

**MOYEN**
- Pool `acquire:30000` amplifié par les N+1.
- Index à vérifier (`compte_ecritures` sur `compteDebitId`/`compteCreditId`, filtres fréquents).
- `RappelEcheanceCron.ts:25` : pas de lock.

---

## 5. PROBLÈMES BACKEND / ARCHITECTURE

- **ÉLEVÉ** : contrôleurs trop volumineux (`ExcelController.ts` 1441 l, `DataResolverService.ts` 1190 l, `DocumentGedController.ts` 958 l, `EtatsFinanciersController.ts` 818 l).
- **MOYEN** : logique métier dans un routeur (`FinanceRouter.ts:318` — saisie financière inline).
- **FAIBLE** : fichiers morts/scripts destructeurs dans le repo (`seed-ged-demo`, `*-temp`, `clean-etudiants`, `reset-database`, `gen-tokens-temp`).
- **MOYEN** : duplication du calcul de solde comptable (6 copies).

---

## 6. PROBLÈMES FRONTEND (Angular 12)

**CRITIQUE**
- **Subscriptions non libérées** : 323/338 composants `.subscribe()` sans `ngOnDestroy`, **0 `takeUntil`**. Croissance mémoire lente mais continue (24h/24).
- Socket singleton mal géré (`socket.service.ts`) : plusieurs composants appellent `disconnect()` → coupures croisées / reconnect storms.
- `this.ngOnInit()` rappelé par `liste-effectifs-page.component.ts:313` (ré-charge 4 référentiels à chaque refresh).

**ÉLEVÉ**
- Référentiels (classe/niveau/parcours/annee) rechargés à chaque page (98 appels `getAll()`), sans cache/shareReplay.
- Aucun `OnPush` (0/398), **388 méthodes/getters dans les templates** ré-exécutés à chaque cycle.
- `*ngFor` sans `trackBy` (270 fichiers), **0 `debounceTime`** sur les recherches.
- Bundle initial lourd : Videogular + Chart.js + Quill chargés globalement pour tous les rôles.
- **CSS global 3,25 Mo** (safelist Tailwind trop large), fonts dupliquées (Google Fonts + fichiers locaux 2,73 Mo), images lourdes/orphelines (LOGIN.png 2,2 Mo, Gemini 780 Ko non référencées).

**MOYEN**
- Listes importantes sans virtualisation CDK / pagination (arbre `treeNodes`, immobilisations, notes).

---

## 7. PROBLÈMES BASE DE DONNÉES

- **CRITIQUE** : `sync({alter:true})` par défaut en prod (voir D1).
- **ÉLEVÉ** : chargement en RAM de toutes les écritures comptables pour calcul de solde → utiliser `SUM()` SQL.
- **MOYEN** : index manquants à valider (`compte_ecritures.compteDebitId`, `compteCreditId`, filtres séances/échéances/bulletins/listes_notes).
- **FAIBLE** : collation `utf8mb3` ; `DB_LOGGING` non défini (bon : SQL off en prod).
- **Attention** : purge SQL d'orphelins à chaque boot (`DatabaseConnection.ts:88-107`) — à vérifier sur grosse base.

---

## 8. PROBLÈMES DOCKER / DOKPLOY

- **MOYEN** : `morgan("dev")` en prod → logs non rotationnés (croissance disque 24h/24).
- **MOYEN** : vidéos elarning stockées dans `public/` servies par express.static (non-Docker volume) — 346 Mo commitables, persistance à vérifier.
- **FAIBLE** : pas de `restart` explicite discuté, mais `restart: unless-stopped` présent dans le compose. Healthchecks backend/db présents (bon).

---

## 9. CODE INUTILE / SUPPRESSIBLE (sans casser le comportement)
- Scripts dev one-off dans `src/core/scripts/` : `seed-ged-demo.ts`, `seed-ged-full-demo.ts`, `*-temp.ts` (diag-*, apply-migration-temp, gen-tokens-temp, user-model-temp, test-e2e-inscription-temp), `clean-etudiants.ts`, `reset-database.ts`, `endpoint-audit*.ts` (écrit en chemin absolu Windows).
- Assets frontend non référencés : `Gemini_Generated_*.png`, anciens `LOGIN.png`/`LOGINFACE.png`.

---

## 10. REQUÊTES SQL À OPTIMISER
1. Calcul de solde comptable : remplacer `findAll` par `aggregate`/`fn` `SUM(CASE...)`.
2. Génération bulletins : précharger `ListeNoteEvaluation`/`NoteEvaluation` du semestre (2-3 requêtes) au lieu de 27 000.
3. Délibérations : précharger règles/cursus par `Op.in`.
4. `findAll` sans limit sur délibérations/bulletins → ajouter pagination/limite.
5. Vérifier les index ci-dessus (§7).

---

## 11. APIS À OPTIMISER / SÉCURISER
- Pest supplémentaire `PermissionRouter`, `Compte*Router`, `UtilisateurRouter` (gardes).
- Téléchargement bordereaux → auth + contrôler l'appartenance.
- Upload GED → limiter taille + magic bytes.
- Référentiels → cache côté frontend (shareReplay) pour réduire le trafic.

---

## 12. RISQUES LIÉS À L'UTILISATION 24/7
| Risque | Cause |
|--------|-------|
| Fuite mémoire | Subscriptions frontend non libérées + socket singleton |
| Fuite de descripteurs | Streams PDF non fermés, clients SSE non limités |
| Croissance mémoire/CPU | `findAll` en RAM, getters de templates, cron sans lock |
| Croissance disque | Logs non rotationnés, tables non archivées, fichiers temp |
| Saturation connexions pool | N+1 bulletins/délibérations |

---

## 13. PLAN DE CORRECTION PRIORISÉ

### Phase C1 — CRITIQUE (à corriger avant production)
1. Désactiver `sync({alter:true})` en prod (migrations).
2. Durcir les gardes RBAC : `PermissionRouter`, module comptabilité, `checkPermission` deny-by-default, `AuthConfidentiality`.
3. Rendre `PaiementInscriptionController` **transactionnel**.
4. Réduire l'upload GED (3 Go → max ~50 Mo) + magic bytes.
5. Sécuriser le téléchargement des bordereaux (auth + propriété).

### Phase C2 — ÉLEVÉ
6. Protect uploads contrôlés (MIME réel) + taille vidéo.
7. Whitelist `RhEmployeController` (anti mass-assignment).
8. Restreindre `UtilisateurController` (listage PII) → AuthAdmin.
9. Retirer scripts morts/secrets/logs en dur.
10. Ne plus renvoyer d'erreurs DB brutes au client (passer par ErrorHandler).
11. Trojané / Add anti-chevauchement cron minuterie (RappelSalle).
12. Limiter clients SSE + fermer les streams PDF proprement.
13. Activer le cache frontend des référentiels + `takeUntil`/`first()` sur les subscriptions critiques + corriger `this.ngOnInit()`.
14. Ajouter débounceTime + trackBy + OnPush sur les composants lourds eventuels.

*(Les vagues suivantes MOYEN/FAIBLE seront priorisées après C1/C2.)*

---

## 14. CHECKLIST GO / NO-GO PRODUCTION

### Sécurité
- [ ] Authentification sécurisée (hash bcrypt 12 uniforme, révocation JWT)
- [ ] Autorisations Backend (RBAC durci, deny-by-default) — **⛔ en échec**
- [ ] Upload sécurisé (taille + MIME réel) — **⛔ en échec**
- [ ] IDOR/BOLA — **⛔ bordereaux publics**
- [ ] Rate limiting — ✅ présent
- [ ] Secrets protégés — ⚠️ (retirer logs/scripts en dur)
- [ ] XSS — ⚠️ (CSP unsafe-inline, vérif innerHTML)

### Performance
- [ ] Pas de memory leak — **⛔ frontend 323 subscriptions**
- [ ] Pas de N+1 queries — **⛔ bulletins/délibérations**
- [ ] Pagination — ⚠️ partiel
- [ ] Index DB — ⚠️ à valider
- [ ] Cache pertinent — ✅ Redis activé
- [ ] Lazy loading — ✅ 25 modules

### Fiabilité
- [ ] Gestion des erreurs — ⚠️ (erreurs silencieuses)
- [ ] Transactions — **⛔ paiement non transactionnel**
- [ ] Healthcheck — ✅ (dans compose + pipeline)
- [ ] Restart automatique — ✅ (unless-stopped)
- [ ] Backup testé — ⚠️ (voir §23 d'origine)

### Production
- [ ] NODE_ENV=production — **⛔ .env en development**
- [ ] sync DB désactivé en prod — **⛔**
- [ ] HTTPS — ⚠️ à confirmer
- [ ] Monitoring — ⚠️

---

## 15. CONCLUSION

**Décision : NO-GO** tant que les problèmes CRITIQUES (C1) ne sont pas corrigés. Les corrections C1 puis C2 sont lancées juste après ce rapport. Chaque groupe de corrections sera suivi de vérification (`tsc --noEmit` + suite de tests) pour ne rien casser. La cible finale est : **NO-GO → GO conditionnel** une fois C1/C2 traités et la checklist re-vérifiée (volet tests + CI/CD détaillés dans le rapport des tests).
