# Module Reporting — Design

> Date : 22/06/2026
> Statut : Approuvé

## 1. Architecture

**Approche Data Warehouse** : Tables de reporting dédiées (`rpt_*`) synchronisées périodiquement depuis les modules source. Pas de requêtes directes sur les tables métier.

## 2. Rapports par profil

| Profil | Rapports disponibles |
|--------|---------------------|
| **Apprenant** | Cursus, notes par semestre/matière, présences, paiements, documents |
| **Enseignant** | Cours donnés, présences relevées, notes saisies, cahiers de texte |
| **Institution** | Effectifs, inscriptions, taux réussite, notes moyennes, finances globales, RH, stocks, achats |
| **Ressources Humaines** | Effectifs employés, formations, paie, prestations, évaluations |
| **Comptabilité/Caissier** | Recettes, dépenses, budget vs réel, factures, quitus |
| **Achats** | Demandes en cours, validations, commandes, réceptions |

## 3. Tables (préfixe `rpt_`)

### Académique
- `rpt_effectifs` — classeId, periode, nbInscrits, nbActifs, nbHommes, nbFemmes
- `rpt_inscriptions` — sessionId, date, nbInscrits, montantTotal, statut
- `rpt_notes_moyennes` — classeId, matiereId, periode, moyenneClasse, min, max, nbEtudiants
- `rpt_presences` — coursId, seanceId, date, nbPresent, nbAbsent, taux
- `rpt_reussite` — classeId, semestre, annee, nbAdmis, nbEchoues, tauxReussite
- `rpt_documents_academiques` — typeDocument, periode, nbDemandes, nbDelivres

### Financier
- `rpt_paiements` — date, modePaiement (especes/enligne/mobilemoney), montantTotal, nbTransactions
- `rpt_budget_vs_reel` — departementId, periode, budgetPrevu, budgetReel, ecart
- `rpt_factures` — mois, nbFactures, montantTotal, statut

### RH
- `rpt_effectifs_rh` — departementId, date, nbEmployes, nbActifs, masseSalariale
- `rpt_paie` — periode, nbBulletins, totalGains, totalRetenues, netTotal
- `rpt_formations_rh` — formationId, nbParticipants, coutTotal, duree totale
- `rpt_evaluations` — periode, nbEvaluations, noteMoyenneGlobale

### Achats/Stock/Immobilisations
- `rpt_achats` — categorieId, periode, nbDemandes, nbCommandes, montantTotal
- `rpt_stocks` — articleId, stockActuel, stockAlerte, valeurStock
- `rpt_immobilisations` — categorieId, nbActifs, valeurAcquisition, amortissementTotal, valeurNet

## 4. Sync

```
core/scripts/sync-reporting.ts
```

Script exécutable via `npm run db:sync-reporting` qui :
1. Vide les tables `rpt_*`
2. Re-calcule toutes les stats depuis les modules source
3. Insère les données agrégées

## 5. Backend

```
modules/reporting/
├── ReportingRoutes.ts
├── controllers/
│   ├── RapportEffectifsController
│   ├── RapportNotesController
│   ├── RapportPaiementsController
│   ├── RapportBudgetController
│   ├── RapportRHController
│   ├── RapportAchatsController
│   └── RapportConsolideController
└── routers/
```

Ajout dans `src/routes.ts` : `.use('/reporting', ReportingRoutes)`

## 6. Frontend

```
features/modules/reporting/
├── reporting.module.ts
├── reporting-routing.module.ts
├── pages/
│   ├── dashboard-global-page          → Vue institution
│   ├── rapport-effectifs-page
│   ├── rapport-notes-page
│   ├── rapport-paiements-page
│   ├── rapport-budget-page
│   ├── rapport-rh-page
│   ├── rapport-stocks-page
│   ├── rapport-immobilisations-page
│   └── rapport-achats-page
├── components/
│   ├── stat-card
│   ├── graphique-ligne
│   ├── graphique-barre
│   └── export-pdf-button
```
