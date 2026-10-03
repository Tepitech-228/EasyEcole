# Audit global EasyEcole — 3 octobre 2026

## Synthèse

L'audit initial et son extension ont identifié des défauts de contrôle d'accès et d'intégrité des notes, des erreurs backend exposées, des requêtes frontend pouvant présenter un échec comme une absence de données, un handle de timer qui empêchait Jest de quitter, ainsi que des lacunes de tests. Les défauts de sécurité et de fiabilité vérifiés pendant ce travail ont été corrigés et retestés. Les 16 modules précédemment sans test ont maintenant chacun une suite ciblée, mais la couverture de tous leurs endpoints et contrôleurs reste à compléter.

**Conclusion : pas de validation de mise en production.** Les temps de réponse actuels ne sont pas connus; le build frontend dépasse toujours ses budgets, et les nouvelles suites couvrent des contrôleurs/services choisis plutôt que chaque route.

## Périmètre et méthode

- Branche présente au début de l'audit : `V4-2`.
- Arbre de travail déjà modifié : de nombreux fichiers backend/frontend et migrations étaient modifiés ou non suivis. Les résultats reflètent donc l'arbre courant, pas uniquement un commit propre.
- Analyse statique du backend, des routeurs API, des middlewares d'erreur, des scripts et de la documentation de performance disponible.
- Exécution de la suite Jest backend, du contrôle TypeScript backend et du build de production Angular.
- Vérification de la disponibilité locale des services sur les ports 3000, 4200 et 3307, et de l'outil k6.
- Revue de sécurité dédiée, en lecture seule.

Le dépôt contient 261 fichiers `*Router.ts` sous les modules backend. Au début de l'audit, 47 fichiers de test backend étaient recensés; la suite finale comprend 67 suites Jest (65 passées, 2 ignorées). Un comptage initial des tests Angular trouvait 149 fichiers `*.spec.ts`. Un comptage regex des appels `router.get/post/put/patch/delete` trouve 239 déclarations directes dans 35 fichiers, mais ne couvre pas nécessairement les routes construites autrement; ce n'est donc pas un décompte exhaustif des endpoints.

## Constats

### 1. Sécurité et protection au niveau des champs

| ID | Gravité | Localisation | Constat vérifié | État |
|---|---|---|---|
| SEC-01 | ÉLEVÉ | [`DossierInscriptionController.ts`](../easy-ecole-backend/src/modules/inscription/controllers/DossierInscriptionController.ts#L98-L121), [`DossierInscriptionRouter.ts`](../easy-ecole-backend/src/modules/inscription/routers/DossierInscriptionRouter.ts#L120) | Un compte authentifié non apprenant pouvait remplacer des pièces de demande d'inscription; le contrôle de propriété était conditionnel au rôle apprenant. | Corrigé : route limitée aux apprenants avant Multer; contrôle de propriété systématique dans le contrôleur. Trois tests couvrent rôles refusés, propriétaire refusé/autorisé. |
| SEC-02 | MOYENNE — recette à faire | [`GenerationBulletinService.ts`](../easy-ecole-backend/src/modules/bulletins/services/GenerationBulletinService.ts), [`RattrapageWorkflowController.ts`](../easy-ecole-backend/src/modules/inscription/controllers/RattrapageWorkflowController.ts) | Une note de rattrapage au statut `saisie` ne doit pas influer sur le bulletin. | La route de validation par l'enseignant auteur est ajoutée; elle confirme la note et recalcule le bulletin existant en brouillon. Tests ciblés passés. Il faut encore tester le cycle en base de recette; le bulletin recalculé doit être republié avant consultation par l'étudiant. |
| SEC-03 | À INVESTIGUER | [`RoleController.ts`](../easy-ecole-backend/src/modules/auth/controllers/RoleController.ts#L36-L58), [`RhEmployeController.ts`](../easy-ecole-backend/src/modules/rh/controllers/RhEmployeController.ts#L5-L10) | Les surfaces examinées montrent des whitelists de champs côté serveur sur les rôles et employés; ce contrôle n'a pas été vérifié exhaustivement sur l'ensemble des contrôleurs. Des tests couvrent maintenant la création et la mise à jour RH sans champs privilégiés ajoutés par le client. | Ne pas considérer les champs masqués dans Angular comme protégés. Poursuivre l'inventaire d'exposition en lecture, mass assignment, données financières/PII, DTOs et droits de champs par rôle. |
| SEC-04 | MOYENNE — résiduel | [`token-interceptor.service.ts`](../easy-ecole-web/src/app/core/interceptors/token-interceptor.service.ts#L18), [`local-storage.service.ts`](../easy-ecole-web/src/app/core/services/local-storage.service.ts#L22) | Le JWT est stocké en `localStorage`; un XSS exécuté dans l'origine peut le lire. Aucun flux de renouvellement de token n'a été observé pendant la revue. | Pas de migration automatique vers cookie HttpOnly : cela change le modèle d'authentification et nécessite une conception/validation CSRF. Réduire la surface XSS et décider explicitement du modèle de session. |

**SQL :** aucun cas d'injection SQL n'a été démontré dans la revue focalisée et les requêtes observées utilisent principalement Sequelize. Il ne s'agit pas d'une preuve d'absence sur les centaines de contrôleurs; les appels `sequelize.query`/SQL brut et interpolations doivent rester dans la revue de code.

**Abus de requêtes :** Express applique une limite générale de 10 000 requêtes par fenêtre de 15 minutes et des limites de corps JSON de 10 MB; k6 et les services étant indisponibles, ces contrôles n'ont pas été validés sous charge. L'upload de pièces permet jusqu'à 50 fichiers de 20 MB chacun, plafond théorique élevé qui mérite une limite agrégée alignée sur les usages métier.

### 2. Tests et gestion des erreurs

| Vérification | Résultat | Détail |
|---|---|---|
| Jest backend complet | PASSÉ | 65 suites passées, 2 ignorées; 666 tests réussis et 14 ignorés. `--detectOpenHandles` ne signale plus de handle après correction du timer OTP. |
| Notes de rattrapage — tests ciblés | PASSÉ | 2 suites, 12 tests passés pour la validation par l'enseignant et le recalcul du bulletin. Ce résultat ciblé ne remplace pas une recette intégrée. |
| Suites backend auparavant en échec | CORRIGÉES | Les tests mockent maintenant les modèles qui déclenchaient Sequelize `Model.init` au chargement; les deux suites passent. |
| Échecs d'API backend | PARTIEL | Une recherche statique trouve 848 réponses HTTP 500 candidates qui incluent un champ `error`, dans 182 fichiers contrôleurs. Ce sont des candidates à vérifier (la recherche regex ne prouve pas à elle seule une fuite exploitable). Les réponses de `RhEmployeController` modifiées ne renvoient plus l'erreur brute; le reste doit être traité progressivement pour préserver les erreurs de validation métier. |
| TypeScript backend | PASSÉ | `ignoreDeprecations` a été ramené à `"5.0"`; `npm run types` passe. |
| Tests des modules précédemment sans couverture | AMÉLIORÉ, NON EXHAUSTIF | 17 nouveaux fichiers de tests ciblés touchent 16 modules. Ils couvrent quelques contrôleurs/services avec des modèles mockés; ils ne constituent pas une couverture complète de chaque route et de chaque cas. |
| Tests unitaires Angular | NON EXÉCUTÉS | Le nouveau test de régression de l'erreur de chargement du pointage est compilé via `tsconfig.spec`; Karma n'a pas été lancé car aucun navigateur Chrome/Edge/Chromium n'est disponible. |

### 3. Recette des opérations métier et observation runtime complémentaire

Les principales briques fonctionnelles sont présentes dans le code : sessions, parcours/classes et UE/cours, inscriptions, listes et publication de notes, génération/publication de bulletins, workflow de rattrapage et consultation de bulletins. Leur présence et les tests unitaires ciblés ne prouvent pas que le parcours complet fonctionne avec la base et les données de l'environnement déployé. Aucune recette intégrée couvrant la création des référentiels jusqu'au relevé final n'a été exécutée.

Un journal runtime partagé le 3 octobre 2026 apporte des éléments supplémentaires par rapport au contrôle initial de disponibilité :

- `GET /api/v1/inscription/dossiers/arbre` répond `200` et `GET /api/v1/elearning/notifications` répond `304` dans l'extrait.
- Le chargement d'un dossier complet échoue dans `DossierEtudiantController.getDossierComplet` sur MySQL `ER_BAD_FIELD_ERROR` : Sequelize sélectionne `dossiersDemande.correctionDemandee`, absente de la table mappée par le modèle (`ins_dossiers_demandes`) dans la base utilisée par ce runtime. Le code et l'image Docker embarquent désormais le runner et la migration idempotente 027. La migration n'a pas été exécutée sur la base runtime; l'incident reste à confirmer comme résolu après déploiement contrôlé.
- La requête SQL journalisée sélectionnait aussi les colonnes `utilisateur.motDePasse` et `utilisateur.tokenVersion` via une association. Le chargement de dossier limite maintenant explicitement les attributs utilisateur; tests runtime et vérification de la sérialisation restent à faire.

Cette observation concerne l'environnement et le moment du journal fourni; elle ne contredit pas le contrôle antérieur où aucun listener local n'était disponible.

### 3.1 Migrations : contenu attendu et limites de l'outillage

- Le runner n'exécute que les fichiers `*.sql`. La migration 015 de peuplement des filières est actuellement nommée [`015_seed_filieres_inscription.sql.ISOLER`](../migrations/015_seed_filieres_inscription.sql.ISOLER) et n'est donc pas exécutée. Son contenu remplace des filières non référencées par des demandes et réinitialise l'auto-incrément : elle ne doit pas être renommée/exécutée telle quelle sur une base existante sans validation métier et sauvegarde.
- Le générateur, le pré-audit et le runner local pointaient par défaut vers `easy-ecole-backend/migrations`, alors que le dossier canonique inclus dans Docker est le `migrations/` à la racine du dépôt. Le marqueur vide du dossier backend et les sorties 002–004 du générateur n'étaient donc pas alignés avec les migrations embarquées. Les trois scripts ciblent maintenant le dossier racine en développement et `/app/migrations` dans l'image, avec `MIGRATIONS_DIR` comme surcharge explicite.
- Avant correction, le générateur pouvait écraser une migration portant le même nom; il génère maintenant de nouveaux numéros après la dernière migration, évite de recréer un contenu identique et n'écrase aucun fichier existant. Les nouveaux fichiers produits restent à examiner/versionner explicitement avant déploiement.
- La source des index uniques déclarait `ins_parcours.titre` unique, alors que le modèle d'inscription et la migration 015 isolée prévoient la même filière sur plusieurs grades. Cette contrainte pouvait échouer sur les données multigrades. La définition a été retirée et la migration 029 retire de façon ciblée les index uniques simples sur `titre`, sans toucher aux index composites ni aux données.
- Les migrations SQL existantes sont majoritairement conditionnelles/idempotentes : une sortie `SELECT 1` peut signifier « déjà présent », mais aussi « table parente absente ». Le runner enregistre malgré cela le fichier comme appliqué. Le pré-audit vérifie quelques prérequis statiques, mais ne prouve pas toutes les postconditions de toutes les migrations; un statut vert ne remplace donc pas l'inspection des migrations en attente.
- Les contrôles de `db:migrate:check` décrivaient à tort les tables RBAC comme prérequis d'un fichier généré `002_reference_data_autorisations.sql`; ils sont maintenant décrits comme prérequis du seed runtime `ensureReferenceData()`.

### 4. Build et taille frontend

Le build de production Angular **réussit**, mais émet toujours deux avertissements de budget :

- taille initiale rapportée : **4,52 MB**, soit environ **535 KB au-dessus** du budget de 4 MB;
- styles de `dashboard-page.component.scss` : **20,81 KB**, soit **5,81 KB au-dessus** du budget de 15 KB.

Ces tailles sont celles affichées par Angular lors du dernier build achevé; elles ne constituent pas une mesure du temps de téléchargement réel sur un réseau donné. L'arborescence de routage contient 29 déclarations lazy-load, mais le lazy loading n'est pas une autorisation serveur. Le chunk lazy maximal rapporté est de 1 004 KB. Un comptage statique a trouvé 2 occurrences `OnPush`, aucune occurrence `trackBy` dans les templates et 55 fichiers utilisant `debounceTime` : optimisations de rendu et de recherche à étendre après profilage.

### 5. APIs et temps de réponse

Au moment du contrôle initial, les ports locaux 3000, 4200 et 3307 n'étaient pas en écoute et `k6` n'était pas installé. Des journaux runtime partagés ultérieurement montrent quelques réponses réelles (deux exemples 200/304 et un échec SQL décrits plus haut), mais ils ne constituent ni un test systématique des API, ni une recette intégrée, ni une mesure de latence/charge. Aucun p95/p99 courant n'est donc disponible.

Le dépôt contient un benchmark historique [`RAPPORT_PERFORMANCE_V4.md`](performance/RAPPORT_PERFORMANCE_V4.md), daté du 23 septembre 2026 et exécuté sur la branche `V4`, pas sur l'état courant `V4-2` :

| Charge historique | Débit rapporté | p95 rapporté | Erreurs 5xx rapportées |
|---|---:|---:|---:|
| 10 utilisateurs virtuels, 30 s | 16,46 req/s | 2 052,6 ms | 0 % |
| 50 utilisateurs virtuels, 30 s | 17,66 req/s | 11 261,8 ms | 0 % |

Le rapport historique note un débit presque stagnant entre 10 et 50 utilisateurs avec une forte hausse de latence. Ces mesures sont indicatives uniquement et doivent être reproduites sur un environnement représentatif de la branche courante avant toute décision de capacité.

## Résultats des vérifications exécutées

| Commande/contrôle | Résultat |
|---|---|
| Backend `npm test -- --runInBand --silent --detectOpenHandles` | 666 réussis, 14 ignorés; 65 suites passées et 2 ignorées; plus de handle ouvert détecté. |
| Backend `npm run types` | Réussi après correction de `ignoreDeprecations`. |
| Frontend `npx tsc --noEmit -p tsconfig.spec.json` | Réussi pour les fichiers de test Angular. |
| Frontend `npm run build` | Réussi après la correction d'affichage; budget initial/style toujours dépassé. |
| Requêtes silencieuses — contrôles vérifiés | Le timer OTP a été rendu non bloquant (`unref`); l'erreur de chargement du pointage affiche maintenant un état d'erreur et une action Réessayer au lieu de présenter une liste vide; le `catch {}` autour de la lecture du type d'évaluation est remplacé par une réponse explicite 500 et la date est validée. Les specs concernés compilent. |
| Réponses JSON contenant `error` | Recherche statique : 848 réponses HTTP 500 candidates dans 182 fichiers contrôleurs; résultats à qualifier (la regex n'est pas une validation manuelle). Les réponses de `RhEmployeController` sont neutralisées et couvertes par tests. |
| Disponibilité runtime | Aucun listener détecté sur 3000, 4200 ou 3307. |
| Journaux runtime partagés après ce contrôle | Quelques endpoints ont répondu; le chargement du dossier complet a rencontré un champ de schéma manquant (`correctionDemandee`). Voir « Recette des opérations métier et observation runtime complémentaire ». |
| k6 | Indisponible dans l'environnement. |
| Image et orchestration Docker | `docker compose config --quiet` passe avec des variables de test. Le contexte backend utilise la racine du dépôt afin d'embarquer les migrations; Compose sépare les réseaux d'entrée et de données, attend les services sains, borne les logs/PID et transmet explicitement le compte DB applicatif. La construction d'image n'a pas pu être validée : le moteur Docker Desktop n'est pas démarré/disponible dans cet environnement. |
| Outil de génération/pré-audit/exécution des migrations | Générateur, vérificateur et runner ciblent désormais le même dossier racine en local et `/app/migrations` dans Docker. Le générateur ne réécrit plus les migrations existantes; le pré-audit ne fait plus référence à une migration générée absente. Validation SQL sur une vraie base non exécutée. |
| Migration 029 — index filières multigrades | Définition applicative corrigée et migration ajoutée pour retirer les contraintes uniques sur le seul titre. SQL non exécuté sur une base; vérifier en recette que les index voulus sont supprimés avant toute nouvelle migration de données filières. |

## Plan d'action recommandé

1. **P0 — Aligner le schéma runtime** : appliquer de manière contrôlée la migration 027, sans activer globalement toutes les migrations au démarrage; vérifier ensuite `getDossierComplet` sur la base cible.
2. **P0 — Recetter la chaîne de notes de rattrapage** : vérifier la transition de saisie à validation par l'enseignant auteur, le recalcul en brouillon, puis la republication du bulletin et la consultation du relevé.
3. **P0 — Effectuer une recette métier bout en bout** : référentiels (années, sessions, parcours/classes, UE/cours), inscription, saisie/publication des notes normales, génération/publication du bulletin, rattrapage, recalcul et consultation du relevé.
4. **P0 — Vérifier en runtime la whitelist des données utilisateur** dans le chargement de dossier; mot de passe et `tokenVersion` sont maintenant exclus explicitement des attributs récupérés.
5. **P1 — Étendre la protection des champs** : inventorier les champs sensibles renvoyés/modifiables par rôle, éliminer le mass-assignment non protégé et ajouter des tests vérifiant les whitelists/DTOs.
6. **P1 — Compléter réellement les 16 modules** : étendre les suites ciblées aux contrôleurs et routes restants avec succès, accès refusé, entrées invalides, ressource absente et panne contrôlée par méthode.
7. **P1 — Qualifier les réponses d'erreur brutes** : préserver les messages métier, renvoyer des erreurs techniques neutres et journaliser côté serveur.
8. **P1 — Refaire les mesures API et charge** sur une recette isolée, avec p50/p95/p99, débit, erreurs et mémoire; aucune mesure de la version courante n'a été réalisée.
9. **P1 — Réduire le poids initial Angular** et le style du dashboard; profiler avant d'étendre OnPush, trackBy, debounce et pagination/virtualisation.
10. **P2 — Décider des limites d'upload et du modèle de session** (taille agrégée, renouvellement/révocation de token, cookie HttpOnly ou mitigation XSS) selon les besoins métier et les protections CSRF.
11. **P2 — Exécuter les tests Angular** dans un runner avec navigateur et produire un smoke test horodaté pour chaque route réelle.

## Limites

- Les tests ne couvrent pas toutes les fonctions ni toutes les combinaisons de rôles/données; la présence d'un test ne garantit pas la couverture de tous les chemins.
- Les journaux fournis ne couvrent que quelques requêtes. La recette E2E navigateur et les essais de charge restent à faire dans un environnement de recette avec les services disponibles; k6 était absent au moment de l'audit.
- Le rapport de performance V4 est ancien par rapport à la branche actuelle.
- L'arbre de travail était déjà sale; les éventuels constats liés aux modifications locales doivent être confirmés sur un commit identifié et reproductible.
