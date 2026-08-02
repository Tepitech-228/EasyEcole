import * as fs from 'fs';
import * as path from 'path';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType,
  UnderlineType, TableLayoutType, convertInchesToTwip, PageBreak
} from 'docx';

// ============================================================
// DATA — Plan de charge complet EasyEcole
// ============================================================

interface Task {
  id: string;
  description: string;
  team: 'Backend' | 'Frontend' | 'Backend + Frontend' | 'DevOps' | 'Qualité';
  priority: 'Haute' | 'Moyenne' | 'Basse';
  status: '☐ À faire' | '▣ En cours' | '☑ Fait' | '⏳ Planifié';
  estimate: string;
  module: string;
  phase: string;
  dependsOn: string[];
  notes: string;
}

const tasks: Task[] = [
  // ================================================================
  // MODULE COMPTABILITÉ — États financiers annuels
  // ================================================================
  {
    id: 'COMP-1.1', module: 'Comptabilité', phase: '1 — Fondation',
    description: 'Modèle ExerciceComptable (cpt_exercices) + exerciceId dans EcritureComptable',
    team: 'Backend', priority: 'Haute', status: '☑ Fait', estimate: '2h',
    dependsOn: [], notes: 'Fait par DB Schema + Helper'
  },
  {
    id: 'COMP-1.2', module: 'Comptabilité', phase: '1 — Fondation',
    description: 'Helper getExerciceEnCours() + résolution auto dans creerEcritureAutomatique/comptable',
    team: 'Backend', priority: 'Haute', status: '☑ Fait', estimate: '1h',
    dependsOn: ['COMP-1.1'], notes: 'Helper et seed mis à jour'
  },
  {
    id: 'COMP-1.3', module: 'Comptabilité', phase: '1 — Fondation',
    description: 'Controller CRUD ExerciceComptable (getAll, getEnCours, getById, create, update)',
    team: 'Backend', priority: 'Haute', status: '☑ Fait', estimate: '3h',
    dependsOn: ['COMP-1.1'], notes: '5 endpoints avec contrôles métier'
  },
  {
    id: 'COMP-1.4', module: 'Comptabilité', phase: '1 — Fondation',
    description: 'Router ExerciceComptable + intégration dans ComptabiliteRoutes',
    team: 'Backend', priority: 'Haute', status: '☑ Fait', estimate: '1h',
    dependsOn: ['COMP-1.3'], notes: 'Route /exercices avec Authenticate'
  },
  {
    id: 'COMP-1.5', module: 'Comptabilité', phase: '1 — Fondation',
    description: 'Seed de l\'exercice courant (année N) au démarrage',
    team: 'Backend', priority: 'Haute', status: '☑ Fait', estimate: '0.5h',
    dependsOn: ['COMP-1.1'], notes: 'seed.ts mis à jour'
  },
  {
    id: 'COMP-1.6', module: 'Comptabilité', phase: '1 — Fondation',
    description: 'Modèle TypeScript ExerciceComptable côté frontend',
    team: 'Frontend', priority: 'Haute', status: '☑ Fait', estimate: '0.5h',
    dependsOn: ['COMP-1.1'], notes: 'Interface dans Comptabilite.model.ts'
  },
  {
    id: 'COMP-1.7', module: 'Comptabilité', phase: '1 — Fondation',
    description: 'Service Angular : méthodes CRUD exercices + BehaviorSubject currentExercice$',
    team: 'Frontend', priority: 'Haute', status: '☑ Fait', estimate: '1h',
    dependsOn: ['COMP-1.6', 'COMP-1.3'], notes: 'Sélecteur global d\'exercice'
  },
  {
    id: 'COMP-1.8', module: 'Comptabilité', phase: '1 — Fondation',
    description: 'Page ExercicesPageComponent (tableau + CRUD modal)',
    team: 'Frontend', priority: 'Haute', status: '☑ Fait', estimate: '4h',
    dependsOn: ['COMP-1.7'], notes: 'Badges statut, spinner, formulaire'
  },
  {
    id: 'COMP-1.9', module: 'Comptabilité', phase: '1 — Fondation',
    description: 'Routing + Module declaration pour ExercicesPage',
    team: 'Frontend', priority: 'Haute', status: '☑ Fait', estimate: '0.5h',
    dependsOn: ['COMP-1.8'], notes: 'Route /exercices + navigation tabs'
  },
  {
    id: 'COMP-1.10', module: 'Comptabilité', phase: '1 — Fondation',
    description: 'Sélecteur d\'exercice global (dropdown) dans le Dashboard',
    team: 'Frontend', priority: 'Haute', status: '☑ Fait', estimate: '2h',
    dependsOn: ['COMP-1.7'], notes: 'Stocké dans le service (BehaviorSubject)'
  },
  {
    id: 'COMP-2.1', module: 'Comptabilité', phase: '2 — États financiers',
    description: 'Controller Bilan comptable (GET /etats-financiers/bilan)',
    team: 'Backend', priority: 'Haute', status: '☑ Fait', estimate: '4h',
    dependsOn: ['COMP-1.1', 'COMP-1.2'], notes: 'Actif vs Passif, équilibre, agrégation SQL'
  },
  {
    id: 'COMP-2.2', module: 'Comptabilité', phase: '2 — États financiers',
    description: 'Controller Compte de résultat (GET /etats-financiers/compte-resultat)',
    team: 'Backend', priority: 'Haute', status: '☑ Fait', estimate: '3h',
    dependsOn: ['COMP-1.1', 'COMP-1.2'], notes: 'Produits (classe 7) - Charges (classe 6) = Résultat'
  },
  {
    id: 'COMP-2.3', module: 'Comptabilité', phase: '2 — États financiers',
    description: 'Helper getSoldeCompteAtDate + getSoldeCompteSurPeriode',
    team: 'Backend', priority: 'Haute', status: '☑ Fait', estimate: '1h',
    dependsOn: [], notes: 'Fonctions de calcul de solde en partie double OHADA'
  },
  {
    id: 'COMP-2.4', module: 'Comptabilité', phase: '2 — États financiers',
    description: 'Export PDF Bilan (pdfkit)',
    team: 'Backend', priority: 'Moyenne', status: '☑ Fait', estimate: '3h',
    dependsOn: ['COMP-2.1'], notes: 'Tableau formaté avec totaux'
  },
  {
    id: 'COMP-2.5', module: 'Comptabilité', phase: '2 — États financiers',
    description: 'Export Excel Bilan (exceljs)',
    team: 'Backend', priority: 'Moyenne', status: '☑ Fait', estimate: '2h',
    dependsOn: ['COMP-2.1'], notes: '2 feuilles (Actif / Passif) + synthèse'
  },
  {
    id: 'COMP-2.6', module: 'Comptabilité', phase: '2 — États financiers',
    description: 'Export PDF/Excel Compte de résultat',
    team: 'Backend', priority: 'Moyenne', status: '☑ Fait', estimate: '2h',
    dependsOn: ['COMP-2.2'], notes: 'Produits / Charges / Résultat net'
  },
  {
    id: 'COMP-2.7', module: 'Comptabilité', phase: '2 — États financiers',
    description: 'Router EtatsFinanciers + intégration routes',
    team: 'Backend', priority: 'Haute', status: '☑ Fait', estimate: '1h',
    dependsOn: ['COMP-2.1', 'COMP-2.2'], notes: 'Route /etats-financiers avec Authenticate'
  },
  {
    id: 'COMP-2.8', module: 'Comptabilité', phase: '2 — États financiers',
    description: 'Service Angular : méthodes getBilan, getCompteResultat, exports',
    team: 'Frontend', priority: 'Haute', status: '☐ À faire', estimate: '1h',
    dependsOn: ['COMP-2.7'], notes: 'Appels HTTP + téléchargement Blob'
  },
  {
    id: 'COMP-2.9', module: 'Comptabilité', phase: '2 — États financiers',
    description: 'Page Bilan comptable (BilanPageComponent) — 2 tableaux Actif/Passif côte à côte',
    team: 'Frontend', priority: 'Haute', status: '☐ À faire', estimate: '5h',
    dependsOn: ['COMP-2.8'], notes: 'Sélecteur date, indicateur équilibre, exports'
  },
  {
    id: 'COMP-2.10', module: 'Comptabilité', phase: '2 — États financiers',
    description: 'Page Compte de résultat (CompteResultatPageComponent)',
    team: 'Frontend', priority: 'Haute', status: '☐ À faire', estimate: '4h',
    dependsOn: ['COMP-2.8'], notes: 'Période, Produits/Charges, Résultat net en couleur'
  },
  {
    id: 'COMP-2.11', module: 'Comptabilité', phase: '2 — États financiers',
    description: 'Routing Bilan + Compte résultat + navigation',
    team: 'Frontend', priority: 'Haute', status: '☐ À faire', estimate: '1h',
    dependsOn: ['COMP-2.9', 'COMP-2.10'], notes: 'Onglets Bilan | CRP | Exercices | Clôture'
  },
  {
    id: 'COMP-3.1', module: 'Comptabilité', phase: '3 — Clôture exercice',
    description: 'Seed comptes de clôture OHADA (88 Résultat, 89 Clôture) dans le plan comptable',
    team: 'Backend', priority: 'Moyenne', status: '☐ À faire', estimate: '0.5h',
    dependsOn: [], notes: 'Ajouter les comptes 88 et 89 dans seed.ts'
  },
  {
    id: 'COMP-3.2', module: 'Comptabilité', phase: '3 — Clôture exercice',
    description: 'Controller vérification pré-clôture (écritures validées, balance, lettrage)',
    team: 'Backend', priority: 'Moyenne', status: '☐ À faire', estimate: '2h',
    dependsOn: ['COMP-1.3'], notes: 'GET /exercices/:id/verification-cloture'
  },
  {
    id: 'COMP-3.3', module: 'Comptabilité', phase: '3 — Clôture exercice',
    description: 'Controller calcul du résultat + affectation (sliders %)',
    team: 'Backend', priority: 'Moyenne', status: '☐ À faire', estimate: '4h',
    dependsOn: ['COMP-3.2'], notes: 'POST /exercices/:id/calculer-resultat + affecter'
  },
  {
    id: 'COMP-3.4', module: 'Comptabilité', phase: '3 — Clôture exercice',
    description: 'Controller génération écritures de clôture (résultat → 12, affectation → 106)',
    team: 'Backend', priority: 'Moyenne', status: '☐ À faire', estimate: '4h',
    dependsOn: ['COMP-3.3'], notes: 'Journal OD, auto-validées'
  },
  {
    id: 'COMP-3.5', module: 'Comptabilité', phase: '3 — Clôture exercice',
    description: 'Controller bouclage exercice (clôture N, création N+1, écritures d\'ouverture)',
    team: 'Backend', priority: 'Moyenne', status: '☐ À faire', estimate: '4h',
    dependsOn: ['COMP-3.4'], notes: 'Transaction atomique, rollback si échec'
  },
  {
    id: 'COMP-3.6', module: 'Comptabilité', phase: '3 — Clôture exercice',
    description: 'Middleware CheckExerciceOuvert (bloque écritures si exercice clôturé)',
    team: 'Backend', priority: 'Moyenne', status: '☐ À faire', estimate: '1h',
    dependsOn: ['COMP-1.3'], notes: 'Protège les routes POST/PUT/DELETE'
  },
  {
    id: 'COMP-3.7', module: 'Comptabilité', phase: '3 — Clôture exercice',
    description: 'Router Clôture + intégration',
    team: 'Backend', priority: 'Moyenne', status: '☐ À faire', estimate: '0.5h',
    dependsOn: ['COMP-3.2', 'COMP-3.3', 'COMP-3.4', 'COMP-3.5'], notes: ''
  },
  {
    id: 'COMP-3.8', module: 'Comptabilité', phase: '3 — Clôture exercice',
    description: 'Service Angular : méthodes clôture (vérification, calcul, affectation, bouclage)',
    team: 'Frontend', priority: 'Moyenne', status: '☐ À faire', estimate: '1h',
    dependsOn: ['COMP-3.7'], notes: 'Appels aux endpoints de clôture'
  },
  {
    id: 'COMP-3.9', module: 'Comptabilité', phase: '3 — Clôture exercice',
    description: 'Page assistant de clôture (wizard 5 étapes)',
    team: 'Frontend', priority: 'Moyenne', status: '☐ À faire', estimate: '8h',
    dependsOn: ['COMP-3.8'], notes: 'Étapes: Vérif → Résultat → Affectation → Écritures → Bouclage'
  },
  {
    id: 'COMP-3.10', module: 'Comptabilité', phase: '3 — Clôture exercice',
    description: 'Routing + navigation clôture',
    team: 'Frontend', priority: 'Moyenne', status: '☐ À faire', estimate: '0.5h',
    dependsOn: ['COMP-3.9'], notes: 'Route /exercices/:id/cloture'
  },
  {
    id: 'COMP-4.1', module: 'Comptabilité', phase: '4 — Dashboard enrichi',
    description: 'Endpoint évolution du résultat sur 3 exercices',
    team: 'Backend', priority: 'Basse', status: '☐ À faire', estimate: '1h',
    dependsOn: ['COMP-1.3'], notes: 'GET /dashboard/evolution-resultat'
  },
  {
    id: 'COMP-4.2', module: 'Comptabilité', phase: '4 — Dashboard enrichi',
    description: 'Endpoint produits/charges mensuels (graphique barres)',
    team: 'Backend', priority: 'Basse', status: '☐ À faire', estimate: '2h',
    dependsOn: ['COMP-1.2'], notes: 'Grouper par mois'
  },
  {
    id: 'COMP-4.3', module: 'Comptabilité', phase: '4 — Dashboard enrichi',
    description: 'Endpoint alertes comptables (écritures non validées, non lettrées, etc.)',
    team: 'Backend', priority: 'Basse', status: '☐ À faire', estimate: '2h',
    dependsOn: ['COMP-1.3', 'COMP-1.2'], notes: 'Tableau de bord des anomalies'
  },
  {
    id: 'COMP-4.4', module: 'Comptabilité', phase: '4 — Dashboard enrichi',
    description: 'Router Dashboard comptable',
    team: 'Backend', priority: 'Basse', status: '☐ À faire', estimate: '0.5h',
    dependsOn: ['COMP-4.1', 'COMP-4.2', 'COMP-4.3'], notes: ''
  },
  {
    id: 'COMP-4.5', module: 'Comptabilité', phase: '4 — Dashboard enrichi',
    description: 'Service Angular : méthodes dashboard (évolution, mensuel, alertes)',
    team: 'Frontend', priority: 'Basse', status: '☐ À faire', estimate: '1h',
    dependsOn: ['COMP-4.4'], notes: ''
  },
  {
    id: 'COMP-4.6', module: 'Comptabilité', phase: '4 — Dashboard enrichi',
    description: 'Dashboard : carte KPI résultat exercice + graphique barres mensuel',
    team: 'Frontend', priority: 'Basse', status: '☐ À faire', estimate: '4h',
    dependsOn: ['COMP-4.5'], notes: 'Chart.js (ng2-charts déjà installé)'
  },
  {
    id: 'COMP-4.7', module: 'Comptabilité', phase: '4 — Dashboard enrichi',
    description: 'Dashboard : section alertes + évolution 3 ans',
    team: 'Frontend', priority: 'Basse', status: '☐ À faire', estimate: '3h',
    dependsOn: ['COMP-4.5'], notes: 'Graphique linéaire + cartes alertes'
  },

  // ================================================================
  // MODULE INSCRIPTION / PAIEMENTS — Automatisation comptable
  // ================================================================
  {
    id: 'INSC-1.1', module: 'Inscription & Paiements', phase: 'Automatisation compta',
    description: 'Génération auto écriture comptable lors d\'une inscription (Débit 411 / Crédit 702)',
    team: 'Backend', priority: 'Haute', status: '⏳ Planifié', estimate: '3h',
    dependsOn: ['COMP-1.2'], notes: 'Dans le helper creerEcritureAutomatique déjà prêt. À déclencher depuis InscriptionController'
  },
  {
    id: 'INSC-1.2', module: 'Inscription & Paiements', phase: 'Automatisation compta',
    description: 'Génération auto écriture lors d\'un paiement (Débit 512/521 / Crédit 411)',
    team: 'Backend', priority: 'Haute', status: '⏳ Planifié', estimate: '3h',
    dependsOn: ['COMP-1.2'], notes: 'Dans PaiementInscriptionController'
  },
  {
    id: 'INSC-1.3', module: 'Inscription & Paiements', phase: 'Automatisation compta',
    description: 'Lettrage automatique des créances (411) lors des paiements',
    team: 'Backend', priority: 'Moyenne', status: '⏳ Planifié', estimate: '2h',
    dependsOn: ['INSC-1.2'], notes: 'Rapprocher écriture créance + écriture encaissement'
  },
  {
    id: 'INSC-1.4', module: 'Inscription & Paiements', phase: 'Automatisation compta',
    description: 'Relances automatiques impayés (email + notification)',
    team: 'Backend + Frontend', priority: 'Moyenne', status: '⏳ Planifié', estimate: '4h',
    dependsOn: ['INSC-1.2'], notes: 'Cron job + template email + page suivi relances'
  },
  {
    id: 'INSC-1.5', module: 'Inscription & Paiements', phase: 'Automatisation compta',
    description: 'Dashboard suivi créances : reste à recouvrer par étudiant/promo',
    team: 'Frontend', priority: 'Moyenne', status: '⏳ Planifié', estimate: '3h',
    dependsOn: ['INSC-1.2'], notes: 'Tableau + graphiques'
  },

  // ================================================================
  // MODULE RH & PAIE
  // ================================================================
  {
    id: 'RH-1.1', module: 'RH & Paie', phase: 'Fondation',
    description: 'Audit du module RH existant : inventaire des modèles, contrôleurs, routes',
    team: 'Backend', priority: 'Haute', status: '⏳ Planifié', estimate: '2h',
    dependsOn: [], notes: 'Lister ce qui existe vs ce qui manque'
  },
  {
    id: 'RH-1.2', module: 'RH & Paie', phase: 'Fondation',
    description: 'Modèle contrat employé (type, date début/fin, poste, salaire de base)',
    team: 'Backend', priority: 'Haute', status: '⏳ Planifié', estimate: '2h',
    dependsOn: ['RH-1.1'], notes: ''
  },
  {
    id: 'RH-1.3', module: 'RH & Paie', phase: 'Fondation',
    description: 'Workflow congés (demande → validation supérieur → solde déduit)',
    team: 'Backend + Frontend', priority: 'Moyenne', status: '⏳ Planifié', estimate: '6h',
    dependsOn: ['RH-1.1'], notes: 'Nombre de jours selon statut, validation hiérarchique'
  },
  {
    id: 'RH-2.1', module: 'RH & Paie', phase: 'Paie',
    description: 'Modèle bulletin de paie + lignes de paie (primes, retenues, cotisations)',
    team: 'Backend', priority: 'Haute', status: '⏳ Planifié', estimate: '3h',
    dependsOn: ['RH-1.1'], notes: 'Structure: brut, cotisations, net imposable, net à payer'
  },
  {
    id: 'RH-2.2', module: 'RH & Paie', phase: 'Paie',
    description: 'Moteur de calcul de paie (salaire brut → cotisations CNPS → IRPP → net)',
    team: 'Backend', priority: 'Haute', status: '⏳ Planifié', estimate: '5h',
    dependsOn: ['RH-2.1'], notes: 'Barèmes CNPS (4.8% employé, 7.7% employeur) + IRPP progressif'
  },
  {
    id: 'RH-2.3', module: 'RH & Paie', phase: 'Paie',
    description: 'Génération automatique écriture comptable paie (Débit 641 / Crédit 421, 431, 447)',
    team: 'Backend', priority: 'Haute', status: '⏳ Planifié', estimate: '2h',
    dependsOn: ['RH-2.2', 'COMP-1.2'], notes: 'Via ComptabiliteHelper.creerEcritureAutomatique'
  },
  {
    id: 'RH-2.4', module: 'RH & Paie', phase: 'Paie',
    description: 'Génération bulletin de paie PDF (docx → pdf)',
    team: 'Backend', priority: 'Moyenne', status: '⏳ Planifié', estimate: '4h',
    dependsOn: ['RH-2.2'], notes: 'Template personnalisable'
  },
  {
    id: 'RH-2.5', module: 'RH & Paie', phase: 'Paie',
    description: 'Journal de paie (récapitulatif mensuel)',
    team: 'Backend + Frontend', priority: 'Moyenne', status: '⏳ Planifié', estimate: '3h',
    dependsOn: ['RH-2.2'], notes: 'Export Excel'
  },
  {
    id: 'RH-2.6', module: 'RH & Paie', phase: 'Paie',
    description: 'Page frontend : saisie variables paie + génération bulletins',
    team: 'Frontend', priority: 'Haute', status: '⏳ Planifié', estimate: '6h',
    dependsOn: ['RH-2.2'], notes: 'Formulaire primes/retenues, liste bulletins, téléchargement'
  },

  // ================================================================
  // MODULE GED — Archivage Documentaire
  // ================================================================
  {
    id: 'GED-1.1', module: 'GED & Archivage', phase: 'Fondation',
    description: 'Audit du module GED existant (modèles, services, seed)',
    team: 'Backend', priority: 'Haute', status: '⏳ Planifié', estimate: '2h',
    dependsOn: [], notes: 'Seed GED déjà existant (seed.ts, seed-ged-demo.ts)'
  },
  {
    id: 'GED-1.2', module: 'GED & Archivage', phase: 'Fondation',
    description: 'Automatisation archivage documents générés (bulletins, certificats, factures)',
    team: 'Backend', priority: 'Moyenne', status: '⏳ Planifié', estimate: '4h',
    dependsOn: ['GED-1.1'], notes: 'Déclencher archivage depuis RH, DocGen, Inscription'
  },
  {
    id: 'GED-1.3', module: 'GED & Archivage', phase: 'Fondation',
    description: 'Stratégie de sauvegarde des documents (sync S3/stockage local)',
    team: 'DevOps', priority: 'Moyenne', status: '⏳ Planifié', estimate: '3h',
    dependsOn: ['GED-1.1'], notes: 'Sauvegarde quotidienne + rétention'
  },
  {
    id: 'GED-1.4', module: 'GED & Archivage', phase: 'Fondation',
    description: 'Interface frontend : explorateur de documents GED (arborescence)',
    team: 'Frontend', priority: 'Moyenne', status: '⏳ Planifié', estimate: '5h',
    dependsOn: ['GED-1.1'], notes: 'Vue dossier/fichier, recherche, téléchargement'
  },
  {
    id: 'GED-1.5', module: 'GED & Archivage', phase: 'Fondation',
    description: 'Gestion des DUA (Durée d\'Utilité Administrative) + alerte échéance',
    team: 'Backend + Frontend', priority: 'Moyenne', status: '⏳ Planifié', estimate: '4h',
    dependsOn: ['GED-1.1'], notes: 'NotificationGedService.verifierDUA() déjà existant'
  },

  // ================================================================
  // MODULE IMMOBILISATIONS
  // ================================================================
  {
    id: 'IMMO-1.1', module: 'Immobilisations', phase: 'Comptabilisation',
    description: 'Génération auto écriture amortissement (Débit 681 / Crédit 28) chaque fin de mois',
    team: 'Backend', priority: 'Moyenne', status: '⏳ Planifié', estimate: '3h',
    dependsOn: ['COMP-1.2'], notes: 'Cron mensuel, calcul linéaire/dégressif'
  },
  {
    id: 'IMMO-1.2', module: 'Immobilisations', phase: 'Comptabilisation',
    description: 'Génération auto écriture acquisition immobilisation (Débit 2x / Crédit 512)',
    team: 'Backend', priority: 'Moyenne', status: '⏳ Planifié', estimate: '2h',
    dependsOn: ['COMP-1.2'], notes: 'À déclencher depuis le module immobilisation existant'
  },
  {
    id: 'IMMO-1.3', module: 'Immobilisations', phase: 'Comptabilisation',
    description: 'Page frontend : plan d\'amortissement + suivi valeurs nettes comptables',
    team: 'Frontend', priority: 'Basse', status: '⏳ Planifié', estimate: '4h',
    dependsOn: ['IMMO-1.1'], notes: ''
  },

  // ================================================================
  // MODULE ACHATS / STOCKS
  // ================================================================
  {
    id: 'STOCK-1.1', module: 'Achats & Stocks', phase: 'Comptabilisation',
    description: 'Génération auto écriture achat (Débit 601/301 / Crédit 401)',
    team: 'Backend', priority: 'Moyenne', status: '⏳ Planifié', estimate: '2h',
    dependsOn: ['COMP-1.2'], notes: 'Depuis le module Achats'
  },
  {
    id: 'STOCK-1.2', module: 'Achats & Stocks', phase: 'Comptabilisation',
    description: 'Génération auto écriture sortie de stock (Débit 6x / Crédit 301)',
    team: 'Backend', priority: 'Moyenne', status: '⏳ Planifié', estimate: '2h',
    dependsOn: ['COMP-1.2'], notes: ''
  },
  {
    id: 'STOCK-1.3', module: 'Achats & Stocks', phase: 'Comptabilisation',
    description: 'Inventaire tournant + écriture ajustement stock',
    team: 'Backend + Frontend', priority: 'Basse', status: '⏳ Planifié', estimate: '5h',
    dependsOn: ['STOCK-1.1'], notes: ''
  },

  // ================================================================
  // MODULE SCOLARITÉ — Pédagogie
  // ================================================================
  {
    id: 'SCO-1.1', module: 'Scolarité', phase: 'Pédagogie',
    description: 'Audit module scolarité : notes, délibérations, relevés',
    team: 'Backend + Frontend', priority: 'Haute', status: '⏳ Planifié', estimate: '3h',
    dependsOn: [], notes: 'PublicationNoteRouter, bulletins'
  },
  {
    id: 'SCO-1.2', module: 'Scolarité', phase: 'Pédagogie',
    description: 'Automatisation des relevés de notes PDF (template docgen)',
    team: 'Backend', priority: 'Moyenne', status: '⏳ Planifié', estimate: '4h',
    dependsOn: ['SCO-1.1'], notes: 'Utiliser le module docgen existant'
  },
  {
    id: 'SCO-1.3', module: 'Scolarité', phase: 'Pédagogie',
    description: 'Calcul automatique des crédits ECTS/session',
    team: 'Backend', priority: 'Haute', status: '⏳ Planifié', estimate: '4h',
    dependsOn: ['SCO-1.1'], notes: 'Validation UE → capitalisation crédits'
  },
  {
    id: 'SCO-1.4', module: 'Scolarité', phase: 'Pédagogie',
    description: 'Gestion des rattrapages et redoublements (conditions, session 2)',
    team: 'Backend + Frontend', priority: 'Haute', status: '⏳ Planifié', estimate: '5h',
    dependsOn: ['SCO-1.3'], notes: 'Moyenne < seuil → rattrapage ; validation partielle → redoublement'
  },
  {
    id: 'SCO-1.5', module: 'Scolarité', phase: 'Pédagogie',
    description: 'Workflow délibération (jury → PV → validation → archivage)',
    team: 'Backend + Frontend', priority: 'Moyenne', status: '⏳ Planifié', estimate: '6h',
    dependsOn: ['SCO-1.3'], notes: 'Signature électronique via module DocGen'
  },
  {
    id: 'SCO-1.6', module: 'Scolarité', phase: 'Pédagogie',
    description: 'Attestations de scolarité et diplômes (génération automatique)',
    team: 'Backend', priority: 'Moyenne', status: '⏳ Planifié', estimate: '3h',
    dependsOn: ['SCO-1.1'], notes: 'Via module docgen'
  },

  // ================================================================
  // MODULE ÉTABLISSEMENT — White Label / Personnalisation
  // ================================================================
  {
    id: 'ETAB-1.1', module: 'Établissement', phase: 'Configuration',
    description: 'Interface de configuration de l\'identité visuelle (logo, couleurs, en-têtes, signatures)',
    team: 'Frontend', priority: 'Haute', status: '⏳ Planifié', estimate: '4h',
    dependsOn: [], notes: 'Page admin avec upload logo, choix couleurs, textes personnalisés'
  },
  {
    id: 'ETAB-1.2', module: 'Établissement', phase: 'Configuration',
    description: 'API configuration établissement (GET/PUT /etablissements/:id/config)',
    team: 'Backend', priority: 'Haute', status: '⏳ Planifié', estimate: '2h',
    dependsOn: [], notes: 'Stockage des paramètres en JSON ou colonnes dédiées'
  },
  {
    id: 'ETAB-1.3', module: 'Établissement', phase: 'Configuration',
    description: 'Application des templates documents avec identité visuelle configurée',
    team: 'Backend', priority: 'Moyenne', status: '⏳ Planifié', estimate: '3h',
    dependsOn: ['ETAB-1.2'], notes: 'Dans le module DocGen, injecter logo + couleurs + en-têtes'
  },
  {
    id: 'ETAB-1.4', module: 'Établissement', phase: 'Configuration',
    description: 'Structure administrative configurable (départements, filières, cycles)',
    team: 'Backend + Frontend', priority: 'Moyenne', status: '⏳ Planifié', estimate: '4h',
    dependsOn: ['ETAB-1.2'], notes: 'CRUD hiérarchique sans modification du code source'
  },

  // ================================================================
  // MODULE GED — Workflows documentaires
  // ================================================================
  {
    id: 'DOC-1.1', module: 'DocGen', phase: 'Workflows',
    description: 'Workflow de validation des documents (brouillon → soumis → validé → signé → archivé)',
    team: 'Backend + Frontend', priority: 'Moyenne', status: '⏳ Planifié', estimate: '6h',
    dependsOn: [], notes: 'Module DocGenWorkflow déjà existant, à enrichir'
  },
  {
    id: 'DOC-1.2', module: 'DocGen', phase: 'Workflows',
    description: 'Signature électronique (cachet + signature manuscrite scannée)',
    team: 'Backend + Frontend', priority: 'Moyenne', status: '⏳ Planifié', estimate: '4h',
    dependsOn: ['DOC-1.1'], notes: 'SigningController et CachetController existants'
  },
  {
    id: 'DOC-1.3', module: 'DocGen', phase: 'Workflows',
    description: 'Génération en lot des documents (ex: tous les bulletins d\'une classe)',
    team: 'Backend + Frontend', priority: 'Basse', status: '⏳ Planifié', estimate: '4h',
    dependsOn: ['DOC-1.1'], notes: ''
  },

  // ================================================================
  // QUALITÉ — Tests
  // ================================================================
  {
    id: 'QA-1.1', module: 'Qualité', phase: 'Tests',
    description: 'Tests unitaires : helpers comptabilité (getSoldeCompteAtDate, getExerciceEnCours)',
    team: 'Qualité', priority: 'Haute', status: '⏳ Planifié', estimate: '3h',
    dependsOn: ['COMP-2.3'], notes: 'Jest'
  },
  {
    id: 'QA-1.2', module: 'Qualité', phase: 'Tests',
    description: 'Tests d\'intégration : endpoints Bilan + CRP',
    team: 'Qualité', priority: 'Haute', status: '⏳ Planifié', estimate: '4h',
    dependsOn: ['COMP-2.1', 'COMP-2.2'], notes: 'Supertest + Sequelize mock'
  },
  {
    id: 'QA-1.3', module: 'Qualité', phase: 'Tests',
    description: 'Tests du cycle de clôture d\'exercice (intégration)',
    team: 'Qualité', priority: 'Moyenne', status: '⏳ Planifié', estimate: '5h',
    dependsOn: ['COMP-3.5'], notes: 'Tester la transaction complète'
  },
  {
    id: 'QA-1.4', module: 'Qualité', phase: 'Tests',
    description: 'Tests unitaires : moteur de paie (calcul cotisations, IRPP, net)',
    team: 'Qualité', priority: 'Moyenne', status: '⏳ Planifié', estimate: '4h',
    dependsOn: ['RH-2.2'], notes: ''
  },

  // ================================================================
  // SÉCURITÉ
  // ================================================================
  {
    id: 'SEC-1.1', module: 'Sécurité', phase: 'Audit',
    description: 'Audit RBAC : vérifier que chaque endpoint a le bon niveau de permission',
    team: 'Qualité', priority: 'Haute', status: '⏳ Planifié', estimate: '4h',
    dependsOn: [], notes: 'Vérifier les rôles par module'
  },
  {
    id: 'SEC-1.2', module: 'Sécurité', phase: 'Audit',
    description: 'Audit XSS/CSRF + helmet + rate limiting',
    team: 'Qualité', priority: 'Haute', status: '⏳ Planifié', estimate: '2h',
    dependsOn: [], notes: 'helmet déjà configuré, rate limiting en place'
  },
  {
    id: 'SEC-1.3', module: 'Sécurité', phase: 'Audit',
    description: 'Mise en place d\'un audit log (traçabilité de chaque action sensible)',
    team: 'Backend', priority: 'Moyenne', status: '⏳ Planifié', estimate: '5h',
    dependsOn: [], notes: 'Table audit_logs + middleware de logging automatique'
  },
  {
    id: 'SEC-1.4', module: 'Sécurité', phase: 'Audit',
    description: 'Chiffrement des documents sensibles (diplômes, bulletins) au repos',
    team: 'DevOps', priority: 'Basse', status: '⏳ Planifié', estimate: '3h',
    dependsOn: ['GED-1.3'], notes: 'Chiffrement AES-256 côté stockage'
  },

  // ================================================================
  // INFRASTRUCTURE & DÉPLOIEMENT
  // ================================================================
  {
    id: 'OPS-1.1', module: 'Infrastructure', phase: 'Déploiement',
    description: 'Dockerisation du backend + frontend (Dockerfile + docker-compose)',
    team: 'DevOps', priority: 'Haute', status: '⏳ Planifié', estimate: '4h',
    dependsOn: [], notes: 'Node.js 18, MySQL 8, Nginx reverse proxy'
  },
  {
    id: 'OPS-1.2', module: 'Infrastructure', phase: 'Déploiement',
    description: 'CI/CD (GitHub Actions ou GitLab CI) : build → test → deploy',
    team: 'DevOps', priority: 'Haute', status: '⏳ Planifié', estimate: '4h',
    dependsOn: ['OPS-1.1'], notes: ''
  },
  {
    id: 'OPS-1.3', module: 'Infrastructure', phase: 'Déploiement',
    description: 'Sauvegarde automatisée BDD + fichiers (cron)',
    team: 'DevOps', priority: 'Moyenne', status: '⏳ Planifié', estimate: '2h',
    dependsOn: [], notes: 'mysqldump + rsync S3 (ou équivalent)'
  },
  {
    id: 'OPS-1.4', module: 'Infrastructure', phase: 'Déploiement',
    description: 'Monitoring (uptime, erreurs, performances)',
    team: 'DevOps', priority: 'Basse', status: '⏳ Planifié', estimate: '3h',
    dependsOn: ['OPS-1.1'], notes: 'Option Sentry + NewRelic ou open-source'
  },
  {
    id: 'OPS-1.5', module: 'Infrastructure', phase: 'Déploiement',
    description: 'Documentation déploiement + runbook',
    team: 'DevOps', priority: 'Moyenne', status: '⏳ Planifié', estimate: '3h',
    dependsOn: ['OPS-1.1', 'OPS-1.2'], notes: 'README déploiement, checklist'
  },
];

// ============================================================
// STYLES & HELPERS
// ============================================================

const COLORS = {
  primary: '1E3A5F',     // Bleu foncé
  secondary: '2E86AB',   // Bleu clair
  accent: '36C9C6',      // Turquoise
  success: '27AE60',     // Vert
  warning: 'F39C12',     // Orange
  danger: 'E74C3C',      // Rouge
  gray: '95A5A6',        // Gris
  lightBg: 'F8F9FA',     // Fond clair
  white: 'FFFFFF',
  dark: '2C3E50',
};

function statusColor(status: string): string {
  if (status.includes('Fait')) return COLORS.success;
  if (status.includes('Cours')) return COLORS.warning;
  if (status.includes('Planifié')) return COLORS.secondary;
  return COLORS.gray;
}

function priorityColor(priority: string): string {
  if (priority === 'Haute') return COLORS.danger;
  if (priority === 'Moyenne') return COLORS.warning;
  return COLORS.gray;
}

// ============================================================
// BUILD DOCUMENT
// ============================================================

async function main() {
  const children: any[] = [];

  // ---- PAGE DE GARDE ----
  children.push(
    new Paragraph({ spacing: { before: 4000 } }),
    new Paragraph({
      children: [
        new TextRun({ text: 'EASYEcole', size: 56, bold: true, color: COLORS.primary }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'ERP pour Établissement d\'Enseignement Supérieur', size: 28, color: COLORS.secondary }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'BLUEPRINT ARCHITECTURE & PLAN DE CHARGE', size: 36, bold: true, color: COLORS.primary }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Document de pilotage — Version 1.0', size: 24, color: COLORS.gray }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Généré le ' + new Date().toLocaleDateString('fr-FR'), size: 20, color: COLORS.gray }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Légende :  ☐ À faire  |  ▣ En cours  |  ☑ Fait  |  ⏳ Planifié',
          size: 20, color: COLORS.gray, italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
    }),
    new Paragraph({ children: [new TextRun({ text: '', size: 12 })] }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Totaux : ', bold: true, size: 22 }),
        new TextRun({
          text: `${tasks.filter(t => t.status.includes('Fait')).length} tâches terminées / ${tasks.filter(t => t.status.includes('Cours')).length} en cours / ${tasks.filter(t => t.status.includes('Planifié')).length} planifiées / ${tasks.filter(t => t.status.includes('À faire')).length} à faire`,
          size: 22, color: COLORS.primary,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
    }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ---- TABLE DES MATIÈRES ----
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'TABLE DES MATIÈRES', size: 32, bold: true, color: COLORS.primary })],
      spacing: { before: 400, after: 300 },
    }),
  );

  const modules = [...new Set(tasks.map(t => t.module))];
  for (const mod of modules) {
    const modTasks = tasks.filter(t => t.module === mod);
    const done = modTasks.filter(t => t.status.includes('Fait')).length;
    const total = modTasks.length;
    const phases = [...new Set(modTasks.map(t => t.phase))];
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${mod}  (${done}/${total})`, size: 22, bold: true, color: COLORS.dark }),
        ],
        spacing: { before: 120, after: 60 },
      }),
    );
    for (const phase of phases) {
      const phaseTasks = modTasks.filter(t => t.phase === phase);
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `     ${phase} : ${phaseTasks.length} tâches`, size: 20, color: COLORS.gray }),
          ],
          spacing: { before: 40, after: 40 },
        }),
      );
    }
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ---- RÉCAPITULATIF PAR STATUT ----
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'RÉCAPITULATIF GLOBAL', size: 32, bold: true, color: COLORS.primary })],
      spacing: { before: 200, after: 300 },
    }),
  );

  const statuses = ['☑ Fait', '▣ En cours', '⏳ Planifié', '☐ À faire'];
  const statusData = statuses.map(s => ({ status: s, count: tasks.filter(t => t.status === s).length }));
  const totalEstimate = tasks.reduce((acc, t) => {
    const match = t.estimate.match(/(\d+)/);
    return acc + (match ? parseInt(match[1]) : 0);
  }, 0);

  const summaryRows: any[] = [
    new TableRow({
      tableHeader: true,
      children: ['État', 'Nombre', '%', 'Estimation'].map(h =>
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: h, bold: true, size: 20, color: COLORS.white })],
            alignment: AlignmentType.CENTER,
          })],
          shading: { fill: COLORS.primary },
          width: { size: h === 'Estimation' ? 2000 : 1500, type: WidthType.DXA },
        })
      ),
    }),
  ];
  for (const sd of statusData) {
    summaryRows.push(new TableRow({
      children: [sd.status, `${sd.count}`, `${Math.round(sd.count / tasks.length * 100)}%`, ''].map((v, i) =>
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({
              text: v,
              size: 20,
              bold: i === 0,
              color: i === 0 ? statusColor(sd.status) : COLORS.dark,
            })],
            alignment: AlignmentType.CENTER,
          })],
          shading: { fill: COLORS.lightBg },
        })
      ),
    }));
  }
  summaryRows.push(new TableRow({
    children: ['TOTAL', `${tasks.length}`, '100%', `${totalEstimate}h`].map((v, i) =>
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: v, size: 20, bold: true, color: COLORS.primary })],
          alignment: AlignmentType.CENTER,
        })],
        shading: { fill: 'E8F0FE' },
      })
    ),
  }));

  children.push(
    new Table({
      rows: summaryRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
    }),
    new Paragraph({ spacing: { after: 400 } }),
  );

  // ---- RÉPARTITION PAR MODULE ----
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'RÉPARTITION PAR MODULE', size: 28, bold: true, color: COLORS.primary })],
      spacing: { before: 200, after: 200 },
    }),
  );

  for (const mod of modules) {
    const modTasks = tasks.filter(t => t.module === mod);
    const done = modTasks.filter(t => t.status.includes('Fait')).length;
    const modEstimate = modTasks.reduce((acc, t) => {
      const match = t.estimate.match(/(\d+)/);
      return acc + (match ? parseInt(match[1]) : 0);
    }, 0);

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${mod} `, bold: true, size: 22, color: COLORS.dark }),
          new TextRun({ text: `— ${done}/${modTasks.length} — ${modEstimate}h estimées`, size: 20, color: COLORS.gray }),
        ],
        spacing: { before: 80, after: 40 },
      }),
    );

    const phases = [...new Set(modTasks.map(t => t.phase))];
    for (const phase of phases) {
      const pTasks = modTasks.filter(t => t.phase === phase);
      const pDone = pTasks.filter(t => t.status.includes('Fait')).length;
      const barLen = Math.round(pDone / pTasks.length * 20);
      const bar = '█'.repeat(barLen) + '░'.repeat(20 - barLen);
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `   ${phase}  `, size: 18, color: COLORS.secondary }),
            new TextRun({ text: `${bar}`, size: 18, color: COLORS.success }),
            new TextRun({ text: `  ${pDone}/${pTasks.length}`, size: 18, color: COLORS.gray }),
          ],
          spacing: { before: 20, after: 20 },
        }),
      );
    }
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ---- DÉTAIL DES TÂCHES PAR MODULE ----
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'DÉTAIL DES TÂCHES PAR MODULE', size: 32, bold: true, color: COLORS.primary })],
      spacing: { before: 200, after: 300 },
    }),
  );

  for (const mod of modules) {
    const modTasks = tasks.filter(t => t.module === mod);
    const phases = [...new Set(modTasks.map(t => t.phase))];

    children.push(
      new Paragraph({
        children: [new TextRun({ text: mod, size: 28, bold: true, color: COLORS.primary })],
        spacing: { before: 300, after: 100 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.primary } },
      }),
    );

    for (const phase of phases) {
      const pTasks = modTasks.filter(t => t.phase === phase);

      children.push(
        new Paragraph({
          children: [new TextRun({ text: phase, size: 24, bold: true, color: COLORS.secondary })],
          spacing: { before: 200, after: 100 },
        }),
      );

      // En-têtes de tableau
      const headerRow = new TableRow({
        tableHeader: true,
        children: ['ID', 'Description', 'Équipe', 'Priorité', 'Statut', 'Est.', 'Dépend de'].map((h, i) => {
          const widths = [1000, 3800, 1400, 1000, 1100, 700, 1200];
          return new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: h, bold: true, size: 18, color: COLORS.white })],
              alignment: AlignmentType.CENTER,
            })],
            shading: { fill: h === 'Description' ? COLORS.secondary : COLORS.primary },
            width: { size: widths[i], type: WidthType.DXA },
          });
        }),
      });

      const dataRows = pTasks.map(t => {
        const widths = [1000, 3800, 1400, 1000, 1100, 700, 1200];
        return new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: t.id, size: 16, bold: true, color: COLORS.primary })],
              })],
              width: { size: widths[0], type: WidthType.DXA },
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: t.description, size: 16, color: COLORS.dark })],
              })],
              width: { size: widths[1], type: WidthType.DXA },
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: t.team, size: 16, color: COLORS.dark })],
                alignment: AlignmentType.CENTER,
              })],
              width: { size: widths[2], type: WidthType.DXA },
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({
                  text: t.priority,
                  size: 16,
                  bold: true,
                  color: priorityColor(t.priority),
                })],
                alignment: AlignmentType.CENTER,
              })],
              shading: { fill: t.priority === 'Haute' ? 'FDEDEC' : t.priority === 'Moyenne' ? 'FEF9E7' : 'F8F9FA' },
              width: { size: widths[3], type: WidthType.DXA },
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({
                  text: t.status,
                  size: 16,
                  bold: true,
                  color: statusColor(t.status),
                })],
                alignment: AlignmentType.CENTER,
              })],
              shading: { fill: t.status.includes('Fait') ? 'E8F8F0' : t.status.includes('Cours') ? 'FEF9E7' : 'F8F9FA' },
              width: { size: widths[4], type: WidthType.DXA },
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: t.estimate, size: 16, color: COLORS.dark })],
                alignment: AlignmentType.CENTER,
              })],
              width: { size: widths[5], type: WidthType.DXA },
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: t.dependsOn.length > 0 ? t.dependsOn.join(', ') : '—', size: 14, color: COLORS.gray })],
              })],
              width: { size: widths[6], type: WidthType.DXA },
            }),
          ],
        });
      });

      children.push(
        new Table({
          rows: [headerRow, ...dataRows],
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
        }),
        new Paragraph({ spacing: { after: 200 } }),
      );
    }

    // Notes du module
    const modNotes = modTasks.filter(t => t.notes).map(t => `• ${t.id} : ${t.notes}`);
    if (modNotes.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'Notes :', bold: true, size: 20, color: COLORS.secondary })],
          spacing: { before: 60, after: 40 },
        }),
        ...modNotes.map(n => new Paragraph({
          children: [new TextRun({ text: n, size: 18, color: COLORS.gray })],
          spacing: { before: 20, after: 20 },
          indent: { left: 400 },
        })),
      );
    }

    children.push(new Paragraph({ spacing: { after: 300 } }));
  }

  // ---- ANNEXE : DIAGRAMMES DE FLUX (description textuelle) ----
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      children: [new TextRun({ text: 'ANNEXE : WORKFLOWS CRITIQUES', size: 32, bold: true, color: COLORS.primary })],
      spacing: { before: 200, after: 300 },
    }),

    // Workflow cycle de validation des notes
    new Paragraph({
      children: [new TextRun({ text: 'A. Cycle de validation des notes', size: 26, bold: true, color: COLORS.secondary })],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: `1. Professeur saisit les notes (évaluation, examen) → Statut "Brouillon"
2. Professeur soumet les notes → Statut "Soumis"
3. Chef de département vérifie la cohérence (moyenne, distribution) → Statut "Vérifié" ou "Rejeté"
4. Secrétaire pédagogique importe en base → Statut "Validé"
5. Jury de délibération :
   a. Calcul des moyennes par UE (pondération EC)
   b. Validation des crédits ECTS
   c. Décision : passage / rattrapage / redoublement
6. Génération PV de délibération (DocGen) → Signature chef + secrétaire
7. Génération relevés de notes officiels → Archivage GED
8. Publication en ligne (espace étudiant)`,
        size: 18, color: COLORS.dark,
      })],
      spacing: { before: 40, after: 200 },
    }),

    // Workflow cycle de paie
    new Paragraph({
      children: [new TextRun({ text: 'B. Cycle complet de la paie', size: 26, bold: true, color: COLORS.secondary })],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: `Phase 1 — Saisie des variables (20-25 du mois) :
  1. RH saisit les variables : congés, absences, heures sup, primes exceptionnelles
  2. Import pointage (si système de pointage connecté)

Phase 2 — Calcul (26-27 du mois) :
  3. Moteur calcule pour chaque employé :
     a. Salaire brut = Salaire de base + Primes + HS - Absences
     b. Cotisations CNPS (4.8% employé, 7.7% employeur)
     c. IRPP (barème progressif)
     d. Autres retenues (avances, mutuelle)
     e. Net à payer = Brut - Cotisations salariales - IRPP - Retenues
  4. Génération écriture comptable (Débit 641 / Crédit 421, 431, 447)
  5. Édition des bulletins individuels PDF

Phase 3 — Paiement (28-fin du mois) :
  6. Virement bancaire / remise chèque
  7. Génération écriture comptable paiement (Débit 421 / Crédit 512)
  8. Archivage dans GED (bulletins, journal de paie)

Phase 4 — Déclarations (5-15 du mois suivant) :
  9. Déclaration CNPS
  10. Déclaration IRPP
  11. État du personnel (effectif, masse salariale)`,
        size: 18, color: COLORS.dark,
      })],
      spacing: { before: 40, after: 200 },
    }),

    // Flux d'intégration comptable automatisée
    new Paragraph({
      children: [new TextRun({ text: 'C. Intégration comptable automatisée', size: 26, bold: true, color: COLORS.secondary })],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: `Événement métier → Écriture comptable automatique :

Inscription étudiant :
  Débit  411 (Créances élèves)        Montant frais
    Crédit  702 (Prestations)          Montant frais

Paiement étudiant :
  Débit  512/521 (Banque/Caisse)      Montant payé
    Crédit  411 (Créances élèves)      Montant payé

Émission fiche de paie :
  Débit  641 (Rémunérations)          Salaire brut
    Crédit  421 (Personnel)            Net à payer
    Crédit  431 (CNPS)                 Cotisations
    Crédit  447 (IRPP)                 Impôt retenu

Achat fournitures :
  Débit  601/301 (Achats/Stocks)      Montant HT
    Crédit  401 (Fournisseurs)         Montant TTC

Amortissement mensuel :
  Débit  681 (Dotations amort.)        Montant
    Crédit  28 (Amortissements)         Montant

Clôture d'exercice :
  Soldes 6/7 → 12 (Résultat)
  12 → 106 (Report à nouveau)
  Ouverture N+1 : report soldes classes 1-5`,
        size: 18, color: COLORS.dark,
      })],
      spacing: { before: 40, after: 200 },
    }),
  );

  // ---- NOTE DE FIN ----
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      children: [new TextRun({ text: 'NOTE DE PILOTAGE', size: 32, bold: true, color: COLORS.primary })],
      spacing: { before: 200, after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: 'Ce blueprint est un document vivant. Chaque tâche cochée "☑ Fait" correspond à du travail livré et validé. Les tâches "⏳ Planifié" sont identifiées mais pas encore commencées. Les priorités évolueront selon les besoins métier et les retours utilisateurs.',
        size: 20, color: COLORS.dark,
      })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Prochaines étapes immédiates :', bold: true, size: 22, color: COLORS.secondary })],
      spacing: { before: 200, after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: `1. Terminer Phase 2 (frontend Bilan + CRP) ${tasks.filter(t => t.id.startsWith('COMP-2.8') || t.id.startsWith('COMP-2.9') || t.id.startsWith('COMP-2.10')).every(t => t.status.includes('Fait')) ? '☑' : '☐'}`,
        size: 20, color: COLORS.dark,
      })],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: `2. Démarrer automatisation écritures inscriptions/paiements (INSC-1.1 à INSC-1.3)`,
        size: 20, color: COLORS.dark,
      })],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: `3. Lancer l'audit RH (RH-1.1) pour planifier le module paie`,
        size: 20, color: COLORS.dark,
      })],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: `4. Mettre en place les tests QA-1.1 et QA-1.2 sur la comptabilité`,
        size: 20, color: COLORS.dark,
      })],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: `Estimation totale restante : ~${totalEstimate - tasks.filter(t => t.status.includes('Fait')).reduce((acc, t) => { const m = t.estimate.match(/(\d+)/); return acc + (m ? parseInt(m[1]) : 0); }, 0)}h`,
        size: 22, bold: true, color: COLORS.primary,
      })],
      spacing: { before: 300, after: 100 },
    }),
  );

  // ============================================================
  // GÉNÉRATION DU FICHIER
  // ============================================================
  const doc = new Document({
    title: 'EasyEcole - Blueprint Architecture & Plan de charge',
    description: 'Document de pilotage du projet EasyEcole ERP',
    creator: 'Équipe EasyEcole',
    sections: [{ children }],
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
          paragraph: { spacing: { after: 100 } },
        },
      },
    },
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.resolve(__dirname, '../blueprint-easyecole.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Document généré : ${outputPath}`);
  console.log(`📊 ${tasks.length} tâches réparties dans ${modules.length} modules`);
}

main().catch(console.error);
