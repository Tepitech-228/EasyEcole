# Recette E2E — Année universitaire avec 10 étudiants

## But

Simuler une année universitaire avec dix comptes de test et des workflows métier exercés par API. Les parcours, classes et UE utilisées pour les notes sont sélectionnés dans le référentiel de la base E2E; aucun ID académique n'est codé en dur. Neuf dossiers aboutissent à une inscription, le dixième vérifie les refus d'un dossier incomplet et d'un rejet motivé par le comité.

## Garde-fous de lancement

- Base de données clonée et jetable, nommée explicitement `easyecole_e2e` ou `easyecole_e2e_*`.
- Backend démarré sur cette base; les tests décrits ici sont des tests API E2E, pas encore des tests navigateur Cypress.
- Arrêt immédiat si la base n'a pas le préfixe E2E, si l'API n'est pas saine, ou si les données réelles nécessaires sont insuffisantes.
- Dix apprenants créés pour le run, identifiants `e2e-<runId>-std-01` à `e2e-<runId>-std-10`; aucun ID de parcours, UE ou classe codé en dur.
- Sélectionner un parcours actif ayant une classe et des UE réelles dans les deux semestres. Conserver ses IDs et libellés dans le rapport. Ne pas modifier ces données de référence.
- Utiliser les membres de comité et les références réellement seedés; il faut au moins trois membres. Le frais global `frais_rattrapage`, les types d'évaluation et les documents gratuits doivent être configurés.
- Les changements métier (demandes, décisions, paiements, notes, bulletins, documents) passent par API sous les rôles concernés. Le SQL de test est limité à lire les références/résultats et à créer les comptes de fixture.
- Le nettoyage actuel vide les tables métier listées par `cleanE2EData`; il n'est pas ciblé par `runId`. C'est tolérable uniquement dans une base jetable dédiée et restaurable.
- Chaque assertion fonctionnelle doit échouer sur une réponse d'accès refusé, une page vide, un ID absent ou un statut inattendu.

## Données de référence requises

Avant le run, résoudre dynamiquement et consigner :

1. Un administrateur et une année académique libre pour le run; l'année N est créée par API et l'année N+1 est générée au workflow de réinscription.
2. Une classe rattachée à ce parcours.
3. Au moins une UE/cours de semestre 1 et une de semestre 2, avec leurs coefficients/crédits et enseignants affectables.
4. Un administrateur, trois membres du comité ou plus, un rôle cabinet comptable, un rôle ESA-compta, un rôle institution, un compte secrétariat et un enseignant créable par API.
5. Les types de notes, documents obligatoires et permissions activées dans cette base.

Si une relation n'est pas présente (par exemple la classe n'appartient pas au parcours), le test s'arrête avec `PREREQUIS MANQUANT`; il ne choisit pas arbitrairement le premier ID.

## Simulation par phases

| Phase | Parcours simulé | État et assertions |
|---|---|---|
| 0 — Précontrôle | Vérifier nom de DB, connexion DB, health API, rôles et références. | Automatisé. Le runner refuse toute base hors `easyecole_e2e*` et vérifie l'API avant nettoyage. |
| 1 — Année/session | Choisir parcours/classe/UE réels S1/S2; créer une année N libre et la session avec frais/pièce obligatoire par API. | Automatisé. Les références et la pièce sont relues; les semestres déjà clôturés ne sont pas réutilisés. |
| 2 — Première inscription | Dix demandes et choix de parcours. Le compte 10 soumet sans pièce puis avec pièce. Audit, ESA et comité exécutent les transitions via API. | Automatisé. Neuf pipelines finissent `valide`; le dixième finit `rejete` avec motif; aucun cursus pour le rejeté. |
| 3 — UE et enseignant | Vérifier les UE existantes; créer un profil enseignant par API et l'affecter aux UE réelles. Tester aussi la création d'une UE E2E puis sa suppression. | Affectation enseignant automatisée; création/suppression d'une UE dédiée non automatisée. Les UE réelles existantes ne sont jamais modifiées/supprimées. |
| 4 — Présence QR | Lire le QR produit par l'inscription, pointer l'étudiant à une séance, tester QR modifié, étudiant sans inscription et double scan. | Non automatisé. Chaque résultat doit être vérifié par la route de scan et la liste de présence de la séance. |
| 5 — Notes S1/S2 | Créer MCC/listes pour les UE réelles et saisir par le profil enseignant via API. | Automatisé. Cinq étudiants ont 8/20 sur une UE S1, les autres notes sont 14/20; -1 et 21 sont refusées. Les seuils 9,99/10/10,01 restent à ajouter. |
| 6 — Bulletin initial | Générer, publier et relire les bulletins S1/S2 avant rattrapage. | Automatisé par API. Les lignes des UE sont conservées comme baseline; la comparaison documente le cas sans rattrapage. |
| 7 — Rattrapage | Ouvrir session, déposer trois pièces par étudiant, recueillir l'unanimité, déposer bordereau, confirmer paiement et affecter enseignant. | Automatisé pour cinq demandes; arrêt explicite si frais `frais_rattrapage` non configurés. Le rejet d'une demande rattrapage reste à ajouter. |
| 8 — Notes et bulletin après rattrapage | L'enseignant désigné saisit 15/20; régénérer S1/S2; republier et relire les relevés. | Automatisé par API. Vérifier que l'UE rattrapée passe de 8 à 15, que crédits validés progressent et que les autres UE/S2 restent inchangées. |
| 9 — Réinscription N+1 | Clôturer N, créer année/session N+1, planifier, soumettre les six pièces, traiter paiements et unanimité du comité. | Automatisé pour les neuf inscrits; une planification en double doit être refusée; le compte rejeté n'est pas éligible. |
| 10 — Demandes de documents | Chaque inscrit demande un document gratuit; l'établissement traite et délivre le PDF. | Automatisé. Un apprenant ne peut pas traiter sa propre demande; PDF et disponibilité étudiant vérifiés via API. |
| 11 — Permissions | Attribuer une permission à un rôle, tester une route autorisée, retirer la permission et retester. | Non automatisé dans cette simulation annuelle; ne pas le compter `PASS`. |
| 12 — Décision annuelle | Calculer les statuts finaux des UE et la décision annuelle après les deux semestres et les rattrapages. | Non automatisé. Ajouter seuils frontière, crédits, dettes et décision du jury avant de déclarer une année totalement validée. |
| 13 — Nettoyage/rapport | Nettoyer les données métier sur base jetable et conserver le résumé du run. | Nettoyage actuel global sur la base E2E, pas `runId`-scopé; aucune purge de production. Rapport actuel console uniquement. |

## Résultat attendu pour les dix comptes

Le jeu de notes et de décisions automatisé couvre :

- neuf apprenants inscrits et réinscrits par les workflows API;
- cinq apprenants avec une UE S1 à 8/20 avant rattrapage, puis à 15/20 après;
- quatre apprenants avec 14/20 sur les UE évaluées;
- un dixième dossier incomplet refusé, corrigé, puis rejeté par le comité avec motif;
- aucun cursus, vote, paiement, note ou bulletin créé par insertion SQL de test.

Les rôles sont attribués par scénario, pas en contournant l'autorisation avec un compte administrateur lorsque l'objet du test est le droit d'accès.

## Critères de réussite

- Toutes les phases annoncées comme automatisées sont exécutées et leurs assertions métier passent.
- Le rapport nomme le parcours, la classe et les UE réelles sélectionnées; il confirme neuf cursus finaux et un dossier rejeté, pas simplement dix utilisateurs créés.
- Les bulletins avant/après rattrapage sont comparés et les statuts/calculs par UE sont vérifiés. Les seuils frontière restent un critère d'acceptation en attente d'automatisation.
- Les scénarios négatifs contrôlent qu'aucune donnée partielle non désirée n'a été créée.
- Tout scénario non exécuté est noté `NON EXÉCUTÉ` ou `PREREQUIS MANQUANT`, jamais `PASS`.

## État de la suite actuelle

Les phases 1 à 8 du runner [`scripts/e2e/run-e2e.js`](../easy-ecole-backend/scripts/e2e/run-e2e.js) utilisent les parcours/classes/UE de la base et font passer les principales transitions métier par API. Le SQL restant crée les comptes de fixture, lit les références ou vérifie les résultats. Le runner refuse toute base dont le nom ne commence pas par `easyecole_e2e`, vérifie DB/API avant nettoyage, et ne doit pas être lancé sur `easyecole` partagé.

Couverture non incluse : scan de QR, attribution/retrait de permissions, création d'une nouvelle UE, rejet spécifique d'une demande de rattrapage, seuils 9,99/10/10,01 et décision annuelle/jury. La syntaxe des scripts a été vérifiée; le scénario complet n'a pas été exécuté car l'environnement courant utilise `DB_NAME=easyecole` et l'API E2E n'était pas disponible. Le build CLI backend/frontend n'a pas fourni de résultat exploitable dans ce terminal; les diagnostics des fichiers modifiés sont propres.
