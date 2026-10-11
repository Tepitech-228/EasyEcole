# Travaux restants après l'audit EasyEcole

**Mis à jour le :** 4 octobre 2026 (première passe d'inventaire CRUD)

Ce document récapitule les principaux chantiers qui restent à mener après l'audit. Les constats et corrections détaillés sont consignés dans [AUDIT-GLOBAL-2026-10-03.md](./AUDIT-GLOBAL-2026-10-03.md).

## Priorités

### État des CRUD — première passe

- Le repérage statique a trouvé 261 fichiers de routes backend et 655 appels CRUD/requêtes dans 233 fichiers de pages frontend. Ces volumes décrivent le périmètre détecté par recherche, pas une validation fonctionnelle exhaustive.
- 44 routes mutatrices réparties dans 17 routeurs utilisent seulement `Authenticate`. Certaines peuvent être des actions destinées à tous les utilisateurs connectés; chacune doit être comparée à son besoin métier et à ses permissions avant modification.
- Une recherche a relevé 150 appels directs à `create(req.body)`, `update(req.body)` ou `bulkCreate(req.body)` dans 93 contrôleurs. Ils sont à vérifier individuellement : certains corps sont des DTO explicitement structurés, mais la recherche signale un vaste chantier de listes blanches et de validation métier.
- Le CRUD des sessions d'examen était incomplet : les écritures acceptaient des propriétés non prévues, la création du couple normale/rattrapage n'était pas atomique, le remplacement des correcteurs pouvait les effacer avant l'échec de la recréation, et l'interface masquait plusieurs erreurs. La mise à jour de correcteurs ne permettait pas d'enregistrer une liste vide.
- Les mutations des sessions d'examen utilisent maintenant les permissions institutionnelles existantes. Les entrées sont validées et limitées aux champs autorisés, les références de classe/année et de cours/enseignants sont vérifiées, les écritures groupées sont transactionnelles, et l'interface affiche les erreurs et permet de vider les correcteurs.
- Le CRUD des échelles de notes acceptait directement le corps HTTP (y compris des propriétés système) et ne validait pas l'intervalle côté serveur. Les écritures sont maintenant réservées à l'institution, limitées aux champs métier et contrôlées sur la plage 0–20 et l'ordre des bornes.
- La saisie en masse des notes utilisait `bulkCreate(updateOnDuplicate)` sans index unique composite visible; les erreurs du contrôle de semestre étaient ignorées et les erreurs d'audit masquées. La sauvegarde traite maintenant chaque participant dans une transaction avec validation des notes/participants, contrôle d'enseignant et d'appartenance au cours, vérification du verrou semestre et audit atomique. La migration d'un index unique composite reste à préparer après détection et résolution contrôlée des doublons historiques, afin de couvrir aussi les créations concurrentes.
- Cette première passe ne certifie pas les autres domaines CRUD. À poursuivre par blocs métier (référentiels académiques, inscription, notes/bulletins, finances, RH et documents) : permissions, validation des entrées, erreurs visibles, cohérence transactionnelle, confirmations de suppression et tests par scénario.

1. **P0 — Aligner le schéma runtime du dossier d'inscription**
   - Un journal runtime partagé le 3 octobre montre que `DossierEtudiantController.getDossierComplet` échoue avec MySQL `ER_BAD_FIELD_ERROR` : Sequelize sélectionne `dossiersDemande.correctionDemandee`, absente de la table mappée par le modèle `ins_dossiers_demandes` dans la base utilisée.
   - Un journal plus récent reproduit la même erreur depuis `ComiteValidationController.listerDossiers`. L'include utilisateur de cette liste a aussi été limité à une liste blanche excluant `motDePasse` et `tokenVersion`; l'application de la migration 027 reste nécessaire sur la base runtime.
   - Le runner et les migrations sont maintenant intégrés à l'image backend. La migration 027 est idempotente, mais n'a pas été exécutée sur la base runtime. L'appliquer de façon contrôlée puis tester la consultation et la correction de pièces. Ne pas activer toutes les migrations au démarrage sans avoir vérifié l'historique complet; `npm run db:migrate` lance l'ensemble des migrations en attente.

2. **P0 — Recetter la validation des notes de rattrapage**
   - L'enseignant auteur peut maintenant valider sa note; le recalcul rafraîchit le bulletin ciblé en brouillon.
   - Tester le flux réel puis republier le bulletin avant de vérifier le relevé visible par l'étudiant. L'API a des tests unitaires ciblés, mais pas encore de validation intégrée ni d'interface enseignant identifiée.

3. **P0 — Recetter les opérations métier de bout en bout**
   - Tester sur une base représentative la chaîne : création des sessions, parcours/classes et UE/cours; inscription; saisie puis publication des notes normales; génération et publication du bulletin; rattrapage, prise en compte des notes validées et consultation du relevé.
   - Les briques sont présentes, mais ce parcours complet n'a pas encore été démontré par une recette intégrée.

4. **P1 — Vérifier en runtime l'exclusion des champs secrets**
   - Le SQL observé sélectionnait `utilisateur.motDePasse` et `utilisateur.tokenVersion`. Les requêtes du chargement de dossier et de la liste du comité utilisent maintenant une whitelist d'attributs; vérifier la requête et la réponse sur l'environnement déployé.

5. **P1 — Valider le build Docker et l'orchestration**
   - Le Dockerfile backend utilise maintenant le contexte racine et copie les migrations/runner dans l'image. Compose applique des limites de processus et de logs, des healthchecks et des réseaux séparés pour l'entrée web et les données.
   - Exécuter `docker compose config`, construire les images et réaliser un smoke test en environnement de recette. Les services et la migration DB n'ont pas été démarrés/appliqués pendant ce travail.

6. **P1 — Examiner les migrations de données de référence**
   - La migration `015_seed_filieres_inscription.sql.ISOLER` est exclue du runner (`*.sql`) et contient des suppressions de parcours non reliés aux demandes ainsi qu'une réinitialisation d'auto-incrément. Ne pas la réactiver telle quelle; décider si les filières doivent être migrées et préparer une migration additive qui préserve l'existant.
   - Le générateur, le vérificateur et le runner local pointaient auparavant sur `easy-ecole-backend/migrations`, distinct du dossier racine embarqué dans Docker. Ils ciblent maintenant le même dossier. Vérifié en dev : le registre `schema_migrations` ne contient que les migrations racine 001–036 ; les sorties backend 001–004 n'ont jamais été appliquées et leur contenu est déjà couvert en production par les modules de démarrage (`ensureUniqueIndexes` / `ensurePerformanceIndexes` / `ensureReferenceData`, exécutés inconditionnellement au boot). Le dossier orphelin `easy-ecole-backend/migrations/` a donc été supprimé.
   - Le générateur a été sécurisé pour produire de nouveaux numéros et ne jamais écraser un fichier; générer puis relire les fichiers avant de les ajouter au dépôt.
   - Les pré-audits ne vérifient pas les postconditions de toutes les migrations conditionnelles; vérifier explicitement les tables/colonnes attendues par les migrations en attente.
   - La définition d'index unique `ins_parcours.titre` contredisait les filières multigrades. Elle est supprimée du code et la migration 029 retire les index uniques simples existants sans supprimer de données; l'exécuter uniquement après sauvegarde puis vérifier le résultat en recette.

7. **Compléter les tests des API**
   - Les 16 modules auparavant sans tests possèdent maintenant au moins une suite ciblée.
   - Étendre les tests à chaque contrôleur et route, avec les cas de succès, d'accès refusé, de données invalides, de ressource absente et d'erreur technique.
   - Les écritures du seed des rôles/permissions n'avalent plus leurs erreurs SQL; les liaisons manquantes pour un nouveau rôle produisent aussi une erreur explicite. Ce correctif local est couvert par un test, mais le seed reste journalisé puis toléré par l'initialisation DB; une stratégie fail-fast au démarrage reste à décider/tester.
   - Le rejet de la mise en file OCR retourne toujours une réponse 503 non sensible, mais sa cause est maintenant journalisée; les échecs de nettoyage des fichiers sont aussi journalisés, sauf fichier déjà absent. Le chemin est couvert par un test ciblé.
   - L'initialisation DB journalise maintenant l'objet erreur Sequelize complet du seed de comptes, au lieu du seul message générique « Validation error ». Le log transmis ne donne pas le champ invalide; le prochain démarrage permettra d'identifier précisément la validation qui échoue.

8. **Vérifier les réponses d'erreur serveur**
   - Examiner les 848 réponses HTTP 500 candidates repérées par recherche statique dans 182 fichiers.
   - Confirmer lesquelles exposent réellement des détails techniques; conserver les messages métier utiles et journaliser les détails techniques côté serveur.

9. **Auditer les champs et les permissions**
   - Vérifier pour chaque API les champs accessibles en lecture et en écriture selon le rôle.
   - Rechercher les risques de mass assignment et d'exposition de données sensibles; ajouter des tests de whitelist/DTO.

10. **Mesurer les performances et la tenue en charge**
   - Réaliser les mesures dans un environnement de recette représentatif de la version courante.
   - Relever les latences p50, p95 et p99, le débit, les erreurs et l'utilisation mémoire sous charge.
   - Les mesures historiques disponibles concernent une autre branche; aucune mesure actuelle n'a été réalisée pendant l'audit.
   - La page de situation financière ne reconstruit plus l'arbre récursif à chaque détection Angular; la recherche est temporisée et les requêtes précédentes sont annulées. Les filtres classe, période, recherche et le détail sont maintenant raccordés au bon cursus côté API. Ces corrections sont vérifiées au build et par des tests backend; le rendu authentifié en navigateur reste à valider.

11. **Traiter les budgets frontend et exécuter les tests navigateur**
   - Réduire le poids initial Angular (4,52 MB pour un budget de 4 MB) et le style du dashboard (20,81 KB pour un budget de 15 KB).
   - Exécuter les tests Angular dans un environnement équipé d'un navigateur.

12. **Décider des limites d'upload et du modèle de session**
   - Définir une limite agrégée d'upload adaptée aux besoins métier; la configuration examinée permet jusqu'à 50 fichiers de 20 MB chacun.
   - Décider du stockage, du renouvellement et de la révocation des tokens. Le JWT est actuellement stocké dans `localStorage`; toute migration vers des cookies HttpOnly doit intégrer une stratégie CSRF.

13. **Poursuivre la revue des requêtes SQL**
   - Aucune injection SQL n'a été démontrée dans les chemins examinés, mais la revue n'est pas exhaustive.
   - Continuer l'examen des requêtes SQL brutes, des interpolations et des entrées contrôlées par l'utilisateur.

## État général

L'audit ne valide pas à lui seul une mise en production : la couverture API reste partielle, les performances courantes ne sont pas mesurées, la migration corrective du schéma reste à appliquer sur la base cible et les workflows doivent être recettés en environnement représentatif. La création du compte DB `MYSQL_USER`/`MYSQL_PASSWORD` ne s'applique automatiquement que sur un volume MySQL neuf; sur un volume existant, vérifier/créer ce compte et accorder les droits avant le redéploiement.
