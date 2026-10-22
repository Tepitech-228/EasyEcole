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
- `10-comite-correction.js` — Comité : correction sur pièce fautive, reprise, unanimité

## Scripts complémentaires (hors phases)

| Script | Rôle |
|---|---|
| `../replay-inscription-maki-toto.cjs` | Rejeu A → Z du workflow d'inscription en API (compte → demande → parcours → pièces → pré-inscription → bordereau → Cabinet → ESA → comité → validation finale + matricule). Usage : `node scripts/replay-inscription-maki-toto.cjs --reset` |
| `../cypress-tokens.cjs` | Génère les jetons du spec Cypress (`easy-ecole-web/cypress.env.json`). Usage : `node scripts/cypress-tokens.cjs` |

> ⚠️ **Ordre d'exécution** : `cleanE2EData()` (dans `helpers/seeds.js`) supprime **toutes** les
> lignes des tables `ins_*` au démarrage du harnais. Le rejeu complet doit donc être lancé
> **après** `npm run test:e2e`, et ses artefacts sont purgés par le harnais suivant.

## Règles métier du workflow d'inscription (vérifiées par la phase 10 et le rejeu)

- La **pré-inscription** doit être `valide` avant la saisie ESA
  (`POST /inscription/pre-inscriptions/:demandeId/soumettre` puis
  `PUT /inscription/pre-inscriptions/:demandeId/valider`).
  Elle n'est auto-validée par la Finance que sur le **premier** bordereau d'un étudiant
  **sans dossier étudiant** (`estPremierBordereau = !dossierExistant`, `FinanceRouter.ts` l. 558).
- La validation finale du comité exige `aut_apprenants.periode` ∈ {`matin`, `soir`, `en_ligne`}.
- Le parcours doit être choisi avec `choixFinal = true`.
- Contrat multi-sites : `etablissementId` dans le JWT **et** affectation
  `aut_utilisateur_etablissements`, sinon `403 « Aucun site actif sélectionné »`.

## Convention de logging

Chaque script utilise `[OK]` / `[FAIL]` + assertions explicites.

## Base de données

Utilise la base `easyecole` configurée dans `.env`. Les scripts sont idempotents : ils nettoient les données de test avant de créer les nouvelles.
