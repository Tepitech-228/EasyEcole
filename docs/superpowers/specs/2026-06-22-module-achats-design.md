# Module Achats — Design

> Date : 22/06/2026
> Statut : Approuvé

## 1. Rôle & Accès

- Tout le personnel peut soumettre une expression de besoin (tous les rôles connectés)
- Validation par des validateurs paramétrés
- Institution/DG accès complet

## 2. Tables (préfixe `ach_`)

### Demande & Validation
- `ach_categories` — id, nom, description
- `ach_demandes` — id, soumisParId (FK Utilisateur), description, statut (brouillon/soumise/validée/rejetée/commandée/reçue), dateSoumission, validateurChoisiId
- `ach_lignes_demande` — id, demandeId, designation, quantite, prixEstime, unite
- `ach_validateurs` — id, utilisateurId, niveau (1,2,...), montantMax, actif
- `ach_validations` — id, demandeId, validateurId, statut (approuvé/rejeté), commentaire, date

### Budget
- `ach_budgets` — id, departementId, periode (mois/année), montantAlloue, montantUtilise
- `ach_lignes_budget` — id, budgetId, categorieAchatId, montantAlloue, montantUtilise
- `ach_engagements` — id, budgetId, demandeId, montant, date, statut

### Commande & Réception
- `ach_fournisseurs` — id, nom, contact, email, telephone, adresse
- `ach_commandes` — id, demandeId, fournisseurId, dateCommande, statut (en_cours/livrée/annulée)
- `ach_lignes_commande` — id, commandeId, designation, quantite, prixUnitaire, total
- `ach_receptions` — id, commandeId, date, statut (partielle/totale), notes
- `ach_lignes_reception` — id, receptionId, ligneCommandeId, quantiteRecue

### Facturation
- `ach_factures_proforma` — id, commandeId, dateEmission, montantTotal, statut
- `ach_lignes_facture` — id, factureId, ligneCommandeId, designation, quantite, prixUnitaire, total

## 3. Workflow

```
1. Employé soumet demande + choisit validateur
2. Vérification budgétaire (suffisant ?)
3. Validation par validateur choisi
   → Si montant > seuil validateur → validation niveau supérieur
4. Engagement budgétaire
5. Bon de commande → fournisseur
6. [Optionnel] Facture pro forma émise
7. Réception
   ├── Si article stockable → mise à jour Stock (ins_stocks / ins_mouvements_stock)
   └── Si checkbox "immobilisation" → création dans module Immobilisation
```

## 4. Backend

```
modules/achats/
├── AchatsModule.ts          → préfixe ach_
├── AchatsRoutes.ts
├── models/*.ts              → Modèles Sequelize
├── controllers/
│   ├── DemandeController        → CRUD demandes
│   ├── ValidationController     → Validation workflow
│   ├── CommandeController       → CRUD commandes
│   ├── ReceptionController      → Réception + liens stock/immos
│   ├── FactureController        → Factures pro forma
│   ├── BudgetController         → Budget + engagements
│   └── FournisseurController    → CRUD fournisseurs
└── routers/
```

Ajout dans `src/routes.ts` : `.use('/achats', AchatsRoutes)`

## 5. Frontend

```
features/modules/achats/
├── achats.module.ts
├── achats-routing.module.ts
├── pages/
│   ├── liste-demandes-page
│   ├── nouvelle-demande-page
│   ├── details-demande-page
│   ├── validations-page
│   ├── liste-commandes-page
│   ├── commande-details-page
│   ├── receptions-page
│   ├── factures-page
│   ├── budgets-page
│   ├── fournisseurs-page
│   └── parametres-validateurs-page
```

## 6. Intégrations

- **Stock** : à la réception, si l'article est marqué "géré en stock", créer entrée dans `ins_mouvements_stock`
- **Immobilisations** : checkbox "actif immobilisé" sur la ligne de commande → création dans module immobilisation
