# Plan d'intégration Comptabilité — Paiements d'Inscription

## État actuel

- `PaiementInscriptionController` crée déjà une écriture comptable (Debit 512 / Credit 702)
- `BordereauController.validerBordereau()` crée aussi une écriture (Debit 512 / Credit 701 ou 702)
- Les écritures sont marquées `validee: false` (validation manuelle requise)
- `moduleSource: 'inscription'` + `referenceModuleId` permettent la traçabilité

---

## 1. Plan comptable — Comptes à utiliser

| Compte | Libellé | Type |
|--------|---------|------|
| **411** | Créances élèves/étudiants | Actif (Classe 4) |
| **512** | Banque | Actif (Classe 5) |
| **521** | Caisse | Actif (Classe 5) |
| **702100** | Frais d'inscription | Produit (Classe 7) |
| **702200** | Frais de scolarité | Produit (Classe 7) |
| **702300** | Frais de dossier | Produit (Classe 7) |
| **4191** | Avances reçues sur inscriptions | Passif (Classe 4) |
| **441** | État — TVA collectée | Passif (Classe 4) |

---

## 2. Flux comptables par scénario

### 2.1 Paiement direct d'inscription (PaiementInscription)
```
Journal: VEN (Ventes)
Débit:  512 (Banque) ou 521 (Caisse)
Crédit: 702100 (Frais d'inscription)
Module:  inscription, referenceModuleId: paiementId
```

### 2.2 Validation de bordereau
```
Journal: VEN (Ventes)
Débit:  512 (Banque)
Crédit: 702100 (Frais d'inscription) si type=inscription
        702200 (Frais de scolarité)  si type=scolarite
Module:  inscription, referenceModuleId: bordereauId
```

### 2.3 Acompte / Dépot (paiement partiel avant inscription)
```
Journal: CAI (Caisse) ou BQ (Banque)
Débit:  512 (Banque) ou 521 (Caisse)
Crédit: 4191 (Avances reçues sur inscriptions)
Module:  inscription, referenceModuleId: paiementId

→ Au moment de l'inscription finale, extourne :
Journal: OD (Opérations Diverses)
Débit:  4191 (Avances reçues)
Crédit: 702100 (Frais d'inscription)
```

### 2.4 Créance (inscription sans paiement immédiat)
```
Journal: OD (Opérations Diverses)
Débit:  411 (Créances élèves)
Crédit: 702100 (Frais d'inscription)
Module:  inscription, referenceModuleId: dossierId
```

### 2.5 Paiement de créance
```
Journal: VEN (Ventes)
Débit:  512 (Banque) ou 521 (Caisse)
Crédit: 411 (Créances élèves)
Module:  inscription, referenceModuleId: paiementId
```

### 2.6 Paiement échéance de scolarité
```
Journal: VEN (Ventes)
Débit:  512 (Banque) ou 521 (Caisse)
Crédit: 702200 (Frais de scolarité)
Module:  inscription, referenceModuleId: echeanceId
```

### 2.7 Pénalité de retard
```
Journal: VEN (Ventes)
Débit:  512 (Banque) ou 521 (Caisse)
Crédit: 702400 (Frais de documents / pénalités)
Module:  inscription, referenceModuleId: penaliteId
```

### 2.8 Réduction / Bourse
```
Journal: OD (Opérations Diverses)
Débit:  702100 (Frais d'inscription) — réduction du produit
Crédit: 4191 (Avances reçues) — si remboursable
         ou extinction directe de la créance (411)
Module:  inscription, referenceModuleId: reductionId
```

---

## 3. Modifications à apporter

### 3.1 Backend — Controllers

#### PaiementInscriptionController
- Différencier le type de paiement (inscription / scolarité / acompte)
- Choisir le journal (VEN, BQ, CAI) selon le mode de paiement
- Choisir le compte créditeur selon le type
- Gérer le cas acompte vs paiement final

#### BordereauController.validerBordereau()
- Déjà bien implémenté
- Ajouter option pour mode de paiement (espece/virement/chèque)
- Utiliser compte 521 (Caisse) si paiement en espèces

#### Nouveau: EcheanceController.payer()
- Créer écriture comptable au moment du paiement d'une échéance
- Journal: VEN
- Débit: 512/521, Crédit: 702200

#### Nouveau: PenaliteController.appliquer()
- Créer écriture au moment de l'application d'une pénalité
- Journal: VEN
- Débit: 512/521, Crédit: 702400

### 3.2 Backend — Helper ComptabiliteHelper

✅ Déjà existant et bien conçu — `creerEcritureComptable()` et `creerEcritureAutomatique()`

### 3.3 Frontend — ComptabiliteService

Ajouter ces méthodes :
```typescript
getEcrituresByModule(moduleSource: string, referenceId: string)
  → GET /comptabilite/ecritures?moduleSource=inscription&referenceModuleId=X

getEcrituresInscription(dossierId: string)
  → GET /comptabilite/ecritures/par-dossier/{dossierId}
```

### 3.4 Frontend — Nouvelles pages

1. **Suivi comptable des inscriptions** (`/comptabilite/suivi-inscriptions`)
   - Tableau : Dossier étudiant → Total dû → Total payé → Solde → Échéances
   - Filtres : Parcours, Session, Statut paiement
   - Lien vers les écritures comptables associées

2. **Rapprochement bancaire** (`/comptabilite/rapprochement`)
   - Liste des paiements reçus vs relevé bancaire
   - Statut : À rapprocher / Rapproché / Écart

---

## 4. Logique d'échéancier automatique

### 4.1 Génération des échéances
```
Inscription → FraisInscription (montant total)
  → Echeancier:
      - 1 échéance inscription (paiement immédiat)
      - 10 échéances scolarité (mensualités Oct-Juillet)
      - Montant échéance = FraisScolarite / 10
```

### 4.2 Comptabilisation au fil de l'eau
```
Mois 1 (Octobre) : Student paie échéance #1
  → Debit 512, Credit 702200 (Revenu comptabilisé immédiatement)

Mois 2 (Novembre) : Student paie échéance #2
  → Debit 512, Credit 702200
```

### 4.3 Vue Trésorerie vs Comptabilité d'engagement
- **Trésorerie** : Revenu comptabilisé quand l'argent est reçu (approche actuelle)
- **Engagement** : Revenu comptabilisé au début de l'année, avec créance (411) pour le solde impayé → à implémenter comme option

---

## 5. Rapports comptables à créer

| Rapport | Description | Données sources |
|---------|-------------|-----------------|
| État des encaissements | Total reçu par type (inscription/scolarité) | PaiementInscription + Bordereau |
| Restes à recouvrer | Créances impayées par étudiant | Echeance (statut=impaye) |
| Journal des ventes | Toutes les écritures VEN liées inscription | EcritureComptable (journal=VEN) |
| Situation trésorerie | Solde banque + caisse période | EcritureComptable (compte 512+521) |
| Produits constatés | Revenus inscriptions par exercice | EcritureComptable (compte 702*) |

---

## 6. Priorités d'implémentation

1. **Immédiat** — Ajouter mode de paiement (espèce/virement) dans le flux existant
2. **Court terme** — Gérer les acomptes/dépôts avec compte 4191
3. **Moyen terme** — Lier le paiement des échéances aux écritures comptables
4. **Moyen terme** — Créer la page "Suivi comptable inscriptions"
5. **Long terme** — Implémenter la comptabilité d'engagement avec compte 411

---

## 7. Schéma relationnel (nouveautés)

```
ins_paiements_inscription ──────┐
                                  ├──> cpt_ecritures_comptables
ins_bordereaux ──────────────────┘      (moduleSource='inscription')
                                        (referenceModuleId = paiementId | bordereauId)
ins_echeances ────> cpt_ecritures_comptables (quand payée)

cpt_lignes_frais_etudiant ──> cpt_ecritures_comptables (engagement)
  │
  └──> ins_dossier_etudiant
  └──> cpt_frais_parcours (définition du tarif)
```

---

## 8. Extensions futures

- **Remboursement** : Si un étudiant se désiste, créer une écriture d'extourne
  ```
  Journal: OD
  Débit:  702100
  Crédit: 512 (remboursement) ou 4191 (si à rembourser plus tard)
  ```
- **TVA** : Si l'école est assujettie, ajouter compte 441 (TVA collectée) dans les écritures
- **Multi-devises** : Gérer les paiements en devises avec compte d'écart de conversion
