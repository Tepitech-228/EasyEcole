# Plan de vérification et complément contrat backend

## Contexte
Le contrat fourni liste 5 solutions avec leurs fonctionnalités. Le backend existe déjà avec des modules couvrant une grande partie du périmètre. Ce plan identifie les écarts et propose les implémentations restantes.

## État actuel vérifié

### ✅ EASYECOLE (presque complet)
- Sécurité/administration ✓
- Inscriptions ✓ (`inscription`)
- Années académiques, classes, salles, cours ✓
- Affectation enseignants-cours ✓ (`CoursRouter.assignerCours`)
- Paiements frais scolarité ✓ (`PaiementInscriptionRouter`, `EcheanceRouter`, `FraisParcoursRouter`)
- Dossiers administratifs ✓ (`DossierEtudiantRouter`, `DemandeDocumentRouter`)
- Ressources pédagogiques ✓ (`RessourceRouter`, `LivreRouter`)
- Présences ✓ (`PresenceRouter`, `PresenceCoursParticipantRouter`, `AbsenceRouter`)
- Évaluations/notes ✓ (`NoteEvaluationRouter`, `ListeNoteEvaluationRouter`)
- Bulletins ✓ (`BulletinRouter`)
- Stages ✓ (`stage`)
- Entreprises/tuteurs ✓ (`EntrepriseRouter`, `TuteurRouter`)
- Stocks ✓ (`stock`)
- Patrimoine ✓ (`immobilisation`)
- Maintenance ✓ (`MaintenanceRouter`, `MaintenanceProgrammeeRouter`)
- Reportings ✓ (`reporting`)

### ⚠️ Point requires clarification
- **Gestion des établissements**: `etablissement` existe seulement comme champ string sur `CursusApprenant`. Aucun module/modèle dédié `Etablissement`.

---

### ✅ IMMOBILISATION (quasi-complet)
- Types d'immobilisations ✓ (`CategorieImmobilisation`)
- Acquisitions ✓ (`Acquisition`)
- Affectations/mise en service ✓ (`Affectation`)
- Assurances ✓ (`Assurance`)
- Amortissement ✓ (`Amortissement`)
- Sorties provisoires/retours ✓ (`SortieProvisoire`)
- Cessions ✓ (`Cession`)
- Inventaire fin d'exercice ✓ (`Inventaire`, `LigneInventaire`)
- Écritures comptables auto ✓ (`EcritureImmobilisationService`)
- Reportings ✓ (`ReportingRouter`)

### ❌ Manquant
- **Mises au rebut**: absent du module `immobilisation` (seul `stock` a un `Rebut`).

---

### ✅ RESSOURCES HUMAINES ET PAIE (complet)
- Grille salariale/catégories ✓ (`RhGrilleSalarialeRouter`, `RhCategorieProfessionnelleRouter`)
- Primes/retenues ✓ (`RhRubriquePaieRouter`)
- Personnalisation bulletin ✓ (`RhLigneBulletinController`)
- Heures supplémentaires ✓ (`RhHeureSupplementaireRouter`)
- Avances/prêts ✓ (`RhPretRouter`, `RhRemboursementPretRouter`)
- Simulation remboursements ✓ (`RhPretController.simuler`)
- Indemnités prestataires ✓ (`RhPrestationEnseignantRouter`)
- Calcul paie ✓ (`RhPeriodePaieController.genererBulletins`)
- Reportings ✓ (`RhReportingRouter`)

---

### ❌ MARCHE / ACHATS (incomplet)
Le module `achats` couvre budget/demande/commande/réception/facture/engagement/fournisseur/catégorie/validation.

### ❌ Manquant par rapport au contrat
- **Délai de planification**
- **Saisie des plannings** (marchés)
- **Appels à manifestation d'intérêt (AMI)**
- **Appels d'offres (AO)**
- **Gestion des contrats/avenants** (spécifique aux marchés)

---

### ✅ STOCKS (quasi-complet)
- Fournisseurs ✓
- Besoins ✓
- Produits/types ✓
- Entrées/sorties ✓ (`MouvementStock`)
- Demandes de prix ✓
- Stock d'alerte ✓ (dans `StockReportingController`)
- Correction/annulation ✓
- Rebuts ✓
- Inventaire ✓
- Reportings ✓

### ❌ Manquant
- **Transferts entre stocks** (aucun modèle/router `TransfertStock`)
- **Gestion de cycle de vie** stock (non clair si présent)

---

## Plan d'action proposé

### Phase 1 — Clarification
1. **Confirmer l'équivalence MARCHE = ACHATS** ou demander si un module dédié `marche` est attendu séparément.
2. **Confirmer le périmètre "mises au rebut" immobilisation** : feature distincte ou couverte par Cession ?

### Phase 2 — Compléments backend
Avec la réponse à la phase 1 :

**A. Etablissements**
- Créer `modules/etablissement/` : modèle `Etablissement`, CRUD, router, seed.
- Remplacer le champ string `etablissement` sur `CursusApprenant` par une FK optionnelle vers `Etablissement`.

**B. Mises au rebut immobilisation**
- Ajouter modèle `RebutImmobilisation` dans `modules/immobilisation/models/`.
- Ajouter controller + router.
- Lier à `Immobilisation` + générer écriture comptable.

**C. Compléments Marchés/Achats**
Si MARCHE = ACHATS :
- Ajouter modèles : `PlanificationMarche`, `AppelOffre` (ou `AO`), `ManifestationInteret` (ou `AMI`), `ContratMarche`, `AvenantMarche`.
- Ajouter controllers + routers respectifs.
- Ajouter reportings associés.

**D. Transferts entre stocks**
- Ajouter modèle `TransfertStock` + `LigneTransfertStock`.
- Controller + router pour CRUD + exécution transfert.
- Mise à jour `MouvementStock` automatique lors de l'exécution.

**E. Cycle de vie stock** (selon confirmation métier)
- Si basé sur dates péremption/statut : ajouter champs `datePeremption`, `statutCycle` sur `Article` + endpoints de suivi.

### Phase 3 — Finalisation
1. Mettre à jour `TODO.md` avec les tâches détaillées.
2. Mettre à jour `PROJECT_RAPPORT.md` une fois implémenté.
3. Vérifier la compilation (`tsc --noEmit`) et les tests.

## Question de cadrage
**MARCHE** dans le contrat désigne-t-il exactement le module existant `achats`, ou faut-il créer un module `marche` séparé avec AMI/AO/Contrats/Avenants/Planning ?

*Recommandation* : créer un module `marche` séparé de `achats`, car les fonctionnalités contractuelles (AMI, AO, contrats/avenants, planning) ne sont pas présentes dans `achats` et relèvent d'un processus métier distinct (passation des marchés publics vs exécution Budgétaire/commandes).
