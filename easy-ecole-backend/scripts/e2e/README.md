# E2E Tests — EasyEcole

Scénarios de bout en bout simulant une année scolaire complète.

## Exécution

```bash
# Via npm (ajoute `test:e2e` dans package.json)
npm run test:e2e

# Ou directement avec Node
node scripts/e2e/run-e2e.js
```

## Structure

- `run-e2e.js` — Orchestrateur principal, exécute les phases séquentiellement
- `helpers/api.js` — Client HTTP + génération JWT
- `helpers/seeds.js` — Utilitaires de création de données de test
- `01-annee-scolaire.js` — Création année, sessions, classes, ECUE, échelle
- `02-inscription-10.js` — Inscription de 10 étudiants (pipeline complet)
- `03-saisie-notes-releves.js` — Saisie notes + génération relevés (5 échecs)
- `04-rattrapage-5.js` — Demandes rattrapage + workflow comité
- `05-notes-rattrapage.js` — Saisie notes rattrapage par les profs
- `06-bulletins-apres.js` — Régénération bulletins, vérification moyenne >=10
- `07-reinscription-10.js` — Réinscription N → N+1 (clôture + 6 pièces)
- `08-documents.js` — Demandes de documents + traitement secrétariat + PDF

## Convention de logging

Chaque script utilise `[OK]` / `[FAIL]` + assertions explicites.

## Base de données

Utilise la base `easyecole` configurée dans `.env`. Les scripts sont idempotents : ils nettoient les données de test avant de créer les nouvelles.
