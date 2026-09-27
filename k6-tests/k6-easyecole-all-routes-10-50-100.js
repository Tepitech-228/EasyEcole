// ============================================================================
// K6 Load Test - EasyEcole Backend
// Objectif : tester la résilience et la capacité sous 10 → 50 → 100 VUs
// Méthode : requêtes GET sans authentification (401 attendu sur les routes protégées)
// ============================================================================

import { check, sleep, group } from 'k6';
import http from 'k6/http';

const BASE = 'http://[::1]:3000/api/v1';

// ---------------------------------------------------------------------------
// Configuration des paliers de charge
// 1 minute à 10 VUs, 2 minutes à 50 VUs, 2 minutes à 100 VUs, puis descente
// ---------------------------------------------------------------------------
export let options = {
    stages: [
        { duration: '1m', target: 10 },
        { duration: '2m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '1m', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<800', 'p(99)<1500'],
        http_req_failed: ['rate<0.05'], // tolérance 5% (401 attendus sans token)
        checks: ['rate>0.95'],
    },
};

// ============================================================================
// Fonction utilitaire : effectuer un GET et vérifier les assertions de base
// ============================================================================
function makeChecks(tagName) {
    const checks = {};
    const prefix = '[' + tagName + '] ';
    checks[prefix + 'Status 200 ou 401 (pas 500)'] = function(r) { return r.status === 200 || r.status === 401; };
    checks[prefix + 'Pas de 500'] = function(r) { return r.status !== 500; };
    checks[prefix + 'Duree < 800ms'] = function(r) { return r.timings.duration < 800; };
    return checks;
}

function testGet(path, tagName) {
    const url = BASE + path;
    const res = http.get(url, { tags: { name: tagName } });
    check(res, makeChecks(tagName));
    return res;
}

// ============================================================================
// Fonction utilitaire : effectuer un GET avec tag et check plus détaillé
// ============================================================================
function testGetDetailed(path, tagName) {
    const url = BASE + path;
    const res = http.get(url, { tags: { name: tagName } });
    check(res, makeChecks(tagName));
    return res;
}

// ============================================================================
// FONCTION PRINCIPALE - Itération par palier de charge
// ============================================================================
export default function () {

    // -----------------------------------------------------------------------
    // GROUP 1 : Core / Health Check
    // Routes accessibles sans authentification
    // -----------------------------------------------------------------------
    group('Core', function () {
        // Route principale (Hello world)
        testGetDetailed('/', 'core_root');

        // Health check - endpoint critique pour CI/CD et Docker
        testGetDetailed('/health', 'core_health');
    });

    sleep(0.5);

    // -----------------------------------------------------------------------
    // GROUP 2 : AUTH - Authentification et gestion des utilisateurs
    // Préfixe : /api/v1/auth
    // Sous-modules : AuthRouter, UtilisateurRouter, ApprenantRouter,
    //                InstitutionRouter, RoleRouter, PermissionRouter,
    //                EnseignantRouter, PersonnelAdministratifRouter,
    //                CaissierBanqueRouter, ComiteOrientationRouter
    // -----------------------------------------------------------------------
    group('Auth', function () {
        // === Utilisateurs ===
        // GET /api/v1/auth/utilisateurs - Liste tous les utilisateurs
        testGetDetailed('/auth/utilisateurs', 'auth_utilisateurs');
        // GET /api/v1/auth/utilisateurs/moi - Utilisateur courant (JWT)
        testGetDetailed('/auth/utilisateurs/moi', 'auth_utilisateurs_moi');
        // GET /api/v1/auth/utilisateurs/statistics/count - Compteur utilisateurs
        testGetDetailed('/auth/utilisateurs/statistics/count', 'auth_utilisateurs_count');
        // GET /api/v1/auth/apprenants - Liste des apprenants
        testGetDetailed('/auth/apprenants', 'auth_apprenants');
        // GET /api/v1/auth/institutions - Liste des institutions
        testGetDetailed('/auth/institutions', 'auth_institutions');
        // GET /api/v1/auth/enseignants - Liste des enseignants
        testGetDetailed('/auth/enseignants', 'auth_enseignants');
        // GET /api/v1/auth/personnelAdministratif - Personnel administratif
        testGetDetailed('/auth/personnelAdministratif', 'auth_personnel_admin');
        // GET /api/v1/auth/roles - Liste des rôles
        testGetDetailed('/auth/roles', 'auth_roles');
        // GET /api/v1/auth/permissions - Liste des permissions
        testGetDetailed('/auth/permissions', 'auth_permissions');
        // GET /api/v1/auth/caissiersBanque - Caissiers banques
        testGetDetailed('/auth/caissiersBanque', 'auth_caissiers');
        // GET /api/v1/auth/comite-orientation - Comité d'orientation
        testGetDetailed('/auth/comite-orientation', 'auth_comite_orientation');
    });

    sleep(0.5);

    // -----------------------------------------------------------------------
    // GROUP 3 : INSCRIPTION - Gestion scolaire et administrative
    // Préfixe : /api/v1/inscription
    // Modules : Sessions, Cours, Classes, Parcours, Matieres, NiveauxEtude,
    //           ParcoursChoisis, DemandesInscription, AnneesAcademiques,
    //           CursusApprenant, SallesDeClasse, Creneaux, Presences,
    //           Pre-inscriptions, Bordereaux, Finance, Notes, Bulletins,
    //           Echeances, Documents, Paiement, Hierarchy, Excel, OCR,
    //           PublicationsNotes, Absences, Equivalences, Dispenses,
    //           Rattrapages, Reinscription, CahiersDeTexte, Pointages,
    //           Dossiers, Seances, Ressources, FichiersRessource
    // -----------------------------------------------------------------------
    group('Inscription', function () {
        // === Dashboard & Référentiels ===
        // GET /api/v1/inscription/dashboard - Tableau de bord inscription
        testGetDetailed('/inscription/dashboard', 'insc_dashboard');
        // GET /api/v1/inscription/sessions - Sessions académiques
        testGetDetailed('/inscription/sessions', 'insc_sessions');
        // GET /api/v1/inscription/cours - Cours
        testGetDetailed('/inscription/cours', 'insc_cours');
        // GET /api/v1/inscription/classes - Classes
        testGetDetailed('/inscription/classes', 'insc_classes');
        // GET /api/v1/inscription/parcours - Parcours
        testGetDetailed('/inscription/parcours', 'insc_parcours');
        // GET /api/v1/inscription/matieres - Matières
        testGetDetailed('/inscription/matieres', 'insc_matieres');
        // GET /api/v1/inscription/niveauxEtude - Niveaux d'étude
        testGetDetailed('/inscription/niveauxEtude', 'insc_niveaux_etude');
        // GET /api/v1/inscription/parcoursChoisis - Parcours choisis
        testGetDetailed('/inscription/parcoursChoisis', 'insc_parcours_choisis');
        // GET /api/v1/inscription/demandesInscription - Demandes d'inscription
        testGetDetailed('/inscription/demandesInscription', 'insc_demandes_inscription');
        // GET /api/v1/inscription/anneesAcademiques - Années académiques
        testGetDetailed('/inscription/anneesAcademiques', 'insc_annees_academiques');

        // === Suivi & Cursus ===
        // GET /api/v1/inscription/cursusApprenant - Cursus de l'apprenant
        testGetDetailed('/inscription/cursusApprenant', 'insc_cursus_apprenant');
        // GET /api/v1/inscription/sallesDeClasse - Salles de classe
        testGetDetailed('/inscription/sallesDeClasse', 'insc_salles_classe');
        // GET /api/v1/inscription/creneaux - Créneaux
        testGetDetailed('/inscription/creneaux', 'insc_creneaux');
        // GET /api/v1/inscription/hierarchy - Hiérarchie pédagogique
        testGetDetailed('/inscription/hierarchy', 'insc_hierarchy');

        // === Présences & Absences ===
        // GET /api/v1/inscription/listesPresences - Listes de présence
        testGetDetailed('/inscription/listesPresences', 'insc_listes_presences');
        // GET /api/v1/inscription/presences - Présences
        testGetDetailed('/inscription/presences', 'insc_presences');
        // GET /api/v1/inscription/notesEvaluation - Notes d'évaluation
        testGetDetailed('/inscription/notesEvaluation', 'insc_notes_evaluation');

        // === Documents & Dossiers ===
        // GET /api/v1/inscription/pre-inscriptions - Pré-inscriptions
        testGetDetailed('/inscription/pre-inscriptions', 'insc_pre_inscriptions');
        // GET /api/v1/inscription/bordereaux - Bordereaux
        testGetDetailed('/inscription/bordereaux', 'insc_bordereaux');
        // GET /api/v1/inscription/documents - Documents de dossier
        testGetDetailed('/inscription/documents', 'insc_documents');
        // GET /api/v1/inscription/dossiers - Dossiers étudiants
        testGetDetailed('/inscription/dossiers', 'insc_dossiers');

        // === Notes & Évaluations ===
        // GET /api/v1/inscription/typesNoteEvaluation - Types de notes
        testGetDetailed('/inscription/typesNoteEvaluation', 'insc_types_note_eval');
        // GET /api/v1/inscription/listesNoteEvaluation - Listes de notes
        testGetDetailed('/inscription/listesNoteEvaluation', 'insc_listes_note_eval');
        // GET /api/v1/inscription/echelles-notes - Échelles de notes
        testGetDetailed('/inscription/echelles-notes', 'insc_echelles_notes');
        // GET /api/v1/inscription/jury-membres - Membres du jury
        testGetDetailed('/inscription/jury-membres', 'insc_jury_membres');

        // === Sessions & Examens ===
        // GET /api/v1/inscription/semestres-academiques - Semestres
        testGetDetailed('/inscription/semestres-academiques', 'insc_semestres');
        // GET /api/v1/inscription/sessions-examens - Sessions d'examen
        testGetDetailed('/inscription/sessions-examens', 'insc_sessions_examens');
        // GET /api/v1/inscription/echeances - Échéances
        testGetDetailed('/inscription/echeances', 'insc_echeances');

        // === Finance & Frais ===
        // GET /api/v1/inscription/finance - Finance
        testGetDetailed('/inscription/finance', 'insc_finance');
        // GET /api/v1/inscription/excel - Export Excel
        testGetDetailed('/inscription/excel', 'insc_excel');
        // GET /api/v1/inscription/fraisScolarite - Frais de scolarité
        testGetDetailed('/inscription/fraisScolarite', 'insc_frais_scolarite');
        // GET /api/v1/inscription/paiement - Paiement
        testGetDetailed('/inscription/paiement', 'insc_paiement');

        // === Public & Divers ===
        // GET /api/v1/inscription/ocr - OCR
        testGetDetailed('/inscription/ocr', 'insc_ocr');
        // GET /api/v1/inscription/publications-notes - Publications de notes
        testGetDetailed('/inscription/publications-notes', 'insc_publications_notes');
        // GET /api/v1/inscription/absences - Absences
        testGetDetailed('/inscription/absences', 'insc_absences');
        // GET /api/v1/inscription/equivalences - Équivalences
        testGetDetailed('/inscription/equivalences', 'insc_equivalences');
        // GET /api/v1/inscription/dispenses - Dispenses
        testGetDetailed('/inscription/dispenses', 'insc_dispenses');
        // GET /api/v1/inscription/rattrapages - Rattrapages
        testGetDetailed('/inscription/rattrapages', 'insc_rattrapages');
        // GET /api/v1/inscription/reinscription - Réinscriptions
        testGetDetailed('/inscription/reinscription', 'insc_reinscription');

        // === Bulletins (intégrés dans inscription) ===
        // GET /api/v1/inscription/notesEvaluation - Notes (déjà ci-dessus)
        // GET /api/v1/inscription/echeances - Déjà ci-dessus

        // === Cahier de texte ===
        // GET /api/v1/inscription/cahiersDeTexte - Cahiers de texte
        testGetDetailed('/inscription/cahiersDeTexte', 'insc_cahiers_de_texte');
        // GET /api/v1/inscription/pointages - Pointages
        testGetDetailed('/inscription/pointages', 'insc_pointages');
    });

    sleep(0.5);

    // -----------------------------------------------------------------------
    // GROUP 4 : GED - Gestion Électronique des Documents
    // Préfixe : /api/v1/ged
    // Modules : Documents, Folders, Sessions, Admin, Processus, Storage,
    //           FoldersAuto, Courrier, Dashboard, Notifications, Tags,
    //           AcademicTree
    // -----------------------------------------------------------------------
    group('GED', function () {
        // GET /api/v1/ged/documents - Documents GED
        testGetDetailed('/ged/documents', 'ged_documents');
        // GET /api/v1/ged/folders - Dossiers GED
        testGetDetailed('/ged/folders', 'ged_folders');
        // GET /api/v1/ged/sessions - Sessions GED
        testGetDetailed('/ged/sessions', 'ged_sessions');
        // GET /api/v1/ged/admin - Administration GED
        testGetDetailed('/ged/admin', 'ged_admin');
        // GET /api/v1/ged/dashboard - Tableau de bord GED
        testGetDetailed('/ged/dashboard', 'ged_dashboard');
        // GET /api/v1/ged/notifications - Notifications GED
        testGetDetailed('/ged/notifications', 'ged_notifications');
        // GET /api/v1/ged/tags - Tags GED
        testGetDetailed('/ged/tags', 'ged_tags');
        // GET /api/v1/ged/academic-tree - Arbre académique
        testGetDetailed('/ged/academic-tree', 'ged_academic_tree');
        // GET /api/v1/ged/courrier - Courrier GED
        testGetDetailed('/ged/courrier', 'ged_courrier');
        // GET /api/v1/ged/folders-auto - Dossiers automatiques
        testGetDetailed('/ged/folders-auto', 'ged_folders_auto');
        // GET /api/v1/ged/processus - Processus GED
        testGetDetailed('/ged/processus', 'ged_processus');
        // GET /api/v1/ged/storage - Configuration de stockage
        testGetDetailed('/ged/storage', 'ged_storage');
    });

    sleep(0.5);

    // -----------------------------------------------------------------------
    // GROUP 5 : ACHATS - Gestion des achats
    // Préfixe : /api/v1/achats
    // Modules : Demandes, Validations, Validateurs, Commandes, Réceptions,
    //           Factures, Budgets, Engagements, Fournisseurs, Catégories
    // -----------------------------------------------------------------------
    group('Achats', function () {
        // GET /api/v1/achats/demandes - Demandes d'achat
        testGetDetailed('/achats/demandes', 'achats_demandes');
        // GET /api/v1/achats/validations - Validations
        testGetDetailed('/achats/validations', 'achats_validations');
        // GET /api/v1/achats/validateurs - Validateurs
        testGetDetailed('/achats/validateurs', 'achats_validateurs');
        // GET /api/v1/achats/commandes - Commandes
        testGetDetailed('/achats/commandes', 'achats_commandes');
        // GET /api/v1/achats/receptions - Réceptions
        testGetDetailed('/achats/receptions', 'achats_receptions');
        // GET /api/v1/achats/factures - Factures
        testGetDetailed('/achats/factures', 'achats_factures');
        // GET /api/v1/achats/budgets - Budgets
        testGetDetailed('/achats/budgets', 'achats_budgets');
        // GET /api/v1/achats/engagements - Engagements
        testGetDetailed('/achats/engagements', 'achats_engagements');
        // GET /api/v1/achats/fournisseurs - Fournisseurs
        testGetDetailed('/achats/fournisseurs', 'achats_fournisseurs');
        // GET /api/v1/achats/categories - Catégories d'achat
        testGetDetailed('/achats/categories', 'achats_categories');
    });

    sleep(0.5);

    // -----------------------------------------------------------------------
    // GROUP 6 : REPORTING - Tableaux de bord et rapports
    // Préfixe : /api/v1/reporting
    // Modules : Effectifs, Notes, Paiements, Budget, RH, Achats, Consolide
    // -----------------------------------------------------------------------
    group('Reporting', function () {
        // GET /api/v1/reporting/effectifs - Effectifs
        testGetDetailed('/reporting/effectifs', 'reporting_effectifs');
        // GET /api/v1/reporting/notes - Notes
        testGetDetailed('/reporting/notes', 'reporting_notes');
        // GET /api/v1/reporting/paiements - Paiements
        testGetDetailed('/reporting/paiements', 'reporting_paiements');
        // GET /api/v1/reporting/budget - Budget
        testGetDetailed('/reporting/budget', 'reporting_budget');
        // GET /api/v1/reporting/rh - RH Reporting
        testGetDetailed('/reporting/rh', 'reporting_rh');
        // GET /api/v1/reporting/achats - Achats Reporting
        testGetDetailed('/reporting/achats', 'reporting_achats');
        // GET /api/v1/reporting/consolide - Consolidated
        testGetDetailed('/reporting/consolide', 'reporting_consolide');
    });

    sleep(0.5);

    // -----------------------------------------------------------------------
    // GROUP 7 : SCOLARITE - Gestion de la scolarité
    // Préfixe : /api/v1/scolarite
    // Modules : DemandesDocument, TypesDocument, Secretariat, Reclamations,
    //           Registres, Calendrier, Discipline, Conseils, Livres,
    //           DecisionPassage, DemandeReorientation, Sanctions, Diplomes,
    //           DemandesVAE, AutoSanctions
    // -----------------------------------------------------------------------
    group('Scolarite', function () {
        // GET /api/v1/scolarite/demandesDocument - Demandes de documents
        testGetDetailed('/scolarite/demandesDocument', 'scolaire_demandes_doc');
        // GET /api/v1/scolarite/typesDocument - Types de documents
        testGetDetailed('/scolarite/typesDocument', 'scolaire_types_doc');
        // GET /api/v1/scolarite/secretariat - Secrétariat
        testGetDetailed('/scolarite/secretariat', 'scolaire_secretariat');
        // GET /api/v1/scolarite/reclamations - Réclamations
        testGetDetailed('/scolarite/reclamations', 'scolaire_reclamations');
        // GET /api/v1/scolarite/registres - Registres académiques
        testGetDetailed('/scolarite/registres', 'scolaire_registres');
        // GET /api/v1/scolarite/calendrier - Calendrier
        testGetDetailed('/scolarite/calendrier', 'scolaire_calendrier');
        // GET /api/v1/scolarite/discipline - Discipline
        testGetDetailed('/scolarite/discipline', 'scolaire_discipline');
        // GET /api/v1/scolarite/conseils - Conseils de classe
        testGetDetailed('/scolarite/conseils', 'scolaire_conseils');
        // GET /api/v1/scolarite/livres - Livres
        testGetDetailed('/scolarite/livres', 'scolaire_livres');
        // GET /api/v1/scolarite/decisionPassage - Décisions de passage
        testGetDetailed('/scolarite/decisionPassage', 'scolaire_decision_passage');
        // GET /api/v1/scolarite/demandeReorientation - Demandes de réorientation
        testGetDetailed('/scolarite/demandeReorientation', 'scolaire_demande_reorientation');
        // GET /api/v1/scolarite/sanctions - Sanctions académiques
        testGetDetailed('/scolarite/sanctions', 'scolaire_sanctions');
        // GET /api/v1/scolarite/diplomes - Diplômes
        testGetDetailed('/scolarite/diplomes', 'scolaire_diplomes');
        // GET /api/v1/scolarite/demandeVAE - Demandes VAE
        testGetDetailed('/scolarite/demandeVAE', 'scolaire_demande_vae');
        // GET /api/v1/scolarite/autoSanctions - Auto-sanctions
        testGetDetailed('/scolarite/autoSanctions', 'scolaire_auto_sanctions');
    });

    sleep(0.5);

    // -----------------------------------------------------------------------
    // GROUP 8 : QUALITE - Gestion de la qualité
    // Préfixe : /api/v1/qualite
    // Modules : NonConformites, ActionsCorrectives, Audits, AuditsPistes,
    //           RevuesDirection, DecisionsRevue, EnquetesSatisfaction,
    //           ReponsesSatisfaction
    // -----------------------------------------------------------------------
    group('Qualite', function () {
        // GET /api/v1/qualite/non-conformites - Non-conformités
        testGetDetailed('/qualite/non-conformites', 'qualite_non_conformites');
        // GET /api/v1/qualite/actions-correctives - Actions correctives
        testGetDetailed('/qualite/actions-correctives', 'qualite_actions_correctives');
        // GET /api/v1/qualite/audits - Audits qualité
        testGetDetailed('/qualite/audits', 'qualite_audits');
        // GET /api/v1/qualite/audits-pistes - Pistes d'audit
        testGetDetailed('/qualite/audits-pistes', 'qualite_audits_pistes');
        // GET /api/v1/qualite/revues-direction - Revues de direction
        testGetDetailed('/qualite/revues-direction', 'qualite_revues_direction');
        // GET /api/v1/qualite/decisions-revue - Décisions de revue
        testGetDetailed('/qualite/decisions-revue', 'qualite_decisions_revue');
        // GET /api/v1/qualite/enquetes-satisfaction - Enquêtes satisfaction
        testGetDetailed('/qualite/enquetes-satisfaction', 'qualite_enquetes_satisfaction');
        // GET /api/v1/qualite/reponses-satisfaction - Réponses satisfaction
        testGetDetailed('/qualite/reponses-satisfaction', 'qualite_reponses_satisfaction');
    });

    sleep(0.5);

    // -----------------------------------------------------------------------
    // GROUP 9 : BOURSE - Bourses et aides financières
    // Préfixe : /api/v1/bourses
    // Modules : BourseConfiguration, BourseCampagne, BourseAttribution
    // -----------------------------------------------------------------------
    group('Bourse', function () {
        // GET /api/v1/bourses/bourse-configuration - Configuration des bourses
        testGetDetailed('/bourses/bourse-configuration', 'bourse_config');
        // GET /api/v1/bourses/bourse-campagne - Campagnes de bourses
        testGetDetailed('/bourses/bourse-campagne', 'bourse_campagne');
        // GET /api/v1/bourses/bourse-attribution - Attributions de bourses
        testGetDetailed('/bourses/bourse-attribution', 'bourse_attribution');
    });

    sleep(0.5);

    // -----------------------------------------------------------------------
    // GROUP 10 : STAGE - Gestion des stages
    // Préfixe : /api/v1/stages
    // Modules : Tuteurs, RapportsStages, OffresStages, NotesStages,
    //           Entreprises, DemandesStages, ConventionsStages, AttestationsStages
    // -----------------------------------------------------------------------
    group('Stage', function () {
        // GET /api/v1/stages/tuteurs - Tuteurs de stage
        testGetDetailed('/stages/tuteurs', 'stage_tuteurs');
        // GET /api/v1/stages/rapports-stage - Rapports de stage
        testGetDetailed('/stages/rapports-stage', 'stage_rapports');
        // GET /api/v1/stages/offres-stage - Offres de stage
        testGetDetailed('/stages/offres-stage', 'stage_offres');
        // GET /api/v1/stages/notes-stage - Notes de stage
        testGetDetailed('/stages/notes-stage', 'stage_notes');
        // GET /api/v1/stages/entreprises - Entreprises
        testGetDetailed('/stages/entreprises', 'stage_entreprises');
        // GET /api/v1/stages/demandes-stage - Demandes de stage
        testGetDetailed('/stages/demandes-stage', 'stage_demandes');
        // GET /api/v1/stages/conventions-stage - Conventions de stage
        testGetDetailed('/stages/conventions-stage', 'stage_conventions');
        // GET /api/v1/stages/attestations-stage - Attestations de stage
        testGetDetailed('/stages/attestations-stage', 'stage_attestations');
    });

    sleep(0.5);

    // -----------------------------------------------------------------------
    // GROUP 11 : STOCK - Gestion du stock
    // Préfixe : /api/v1/stocks
    // Modules : Articles, Fournisseurs, Besoins, BonCommande, LigneBonCommande,
    //           InventaireStock, LigneInventaireStock, MouvementStock,
    //           Rebut, CorrectionStock, TransfertStock, StockReporting,
    //           DemandePrix, CategorieArticle, LigneInventaire, BonCommande
    // -----------------------------------------------------------------------
    group('Stock', function () {
        // GET /api/v1/stocks/article - Articles
        testGetDetailed('/stocks/article', 'stock_article');
        // GET /api/v1/stocks/fournisseurs - Fournisseurs
        testGetDetailed('/stocks/fournisseurs', 'stock_fournisseurs');
        // GET /api/v1/stocks/besoins - Besoins
        testGetDetailed('/stocks/besoins', 'stock_besoins');
        // GET /api/v1/stocks/bon-commande - Bon de commande
        testGetDetailed('/stocks/bon-commande', 'stock_bon_commande');
        // GET /api/v1/stocks/inventaire-stock - Inventaire
        testGetDetailed('/stocks/inventaire-stock', 'stock_inventaire');
        // GET /api/v1/stocks/mouvement-stock - Mouvements de stock
        testGetDetailed('/stocks/mouvement-stock', 'stock_mouvement');
        // GET /api/v1/stocks/rebut - Rebus
        testGetDetailed('/stocks/rebut', 'stock_rebut');
        // GET /api/v1/stocks/correction-stock - Corrections
        testGetDetailed('/stocks/correction-stock', 'stock_correction');
        // GET /api/v1/stocks/transfert-stock - Transferts
        testGetDetailed('/stocks/transfert-stock', 'stock_transfert');
        // GET /api/v1/stocks/stock-reporting - Reporting stock
        testGetDetailed('/stocks/stock-reporting', 'stock_reporting');
        // GET /api/v1/stocks/demande-prix - Demandes de prix
        testGetDetailed('/stocks/demande-prix', 'stock_demande_prix');
        // GET /api/v1/stocks/categorie-article - Catégories d'articles
        testGetDetailed('/stocks/categorie-article', 'stock_categories');
    });

    sleep(0.5);

    // -----------------------------------------------------------------------
    // GROUP 12 : IMMOBILISATION - Gestion des immobilisations
    // Préfixe : /api/v1/immobilisations
    // Modules : Immobilisation, Inventaire, Acquisition, Affectation,
    //           Amortissement, Assurance, Batiment, CategorieImmobilisation,
    //           Cession, Departement, Localisation, Maintenance,
    //           MaintenanceProgrammee, Reporting, SortieProvisoire, Site,
    //           LigneInventaire
    // -----------------------------------------------------------------------
    group('Immobilisation', function () {
        // GET /api/v1/immobilisations/immobilisation - Immobilisations
        testGetDetailed('/immobilisations/immobilisation', 'immobilisation_liste');
        // GET /api/v1/immobilisations/inventaire - Inventaire immobilisations
        testGetDetailed('/immobilisations/inventaire', 'immobilisation_inventaire');
        // GET /api/v1/immobilisations/acquisition - Acquisitions
        testGetDetailed('/immobilisations/acquisition', 'immobilisation_acquisition');
        // GET /api/v1/immobilisations/affectation - Affectations
        testGetDetailed('/immobilisations/affectation', 'immobilisation_affectation');
        // GET /api/v1/immobilisations/amortissement - Amortissements
        testGetDetailed('/immobilisations/amortissement', 'immobilisation_amortissement');
        // GET /api/v1/immobilisations/assurance - Assurances
        testGetDetailed('/immobilisations/assurance', 'immobilisation_assurance');
        // GET /api/v1/immobilisations/batiment - Bâtiments
        testGetDetailed('/immobilisations/batiment', 'immobilisation_batiment');
        // GET /api/v1/immobilisations/cession - Cessions
        testGetDetailed('/immobilisations/cession', 'immobilisation_cession');
        // GET /api/v1/immobilisations/departement - Départements
        testGetDetailed('/immobilisations/departement', 'immobilisation_departement');
        // GET /api/v1/immobilisations/localisation - Localisations
        testGetDetailed('/immobilisations/localisation', 'immobilisation_localisation');
        // GET /api/v1/immobilisations/maintenance - Maintenances
        testGetDetailed('/immobilisations/maintenance', 'immobilisation_maintenance');
        // GET /api/v1/immobilisations/maintenance-programmee - Maintenances programmées
        testGetDetailed('/immobilisations/maintenance-programmee', 'immobilisation_maintenance_prog');
        // GET /api/v1/immobilisations/reporting - Reporting immobilisations
        testGetDetailed('/immobilisations/reporting', 'immobilisation_reporting');
        // GET /api/v1/immobilisations/site - Sites
        testGetDetailed('/immobilisations/site', 'immobilisation_site');
    });

    sleep(0.5);

    // -----------------------------------------------------------------------
    // GROUP 13 : ELEARNING - Formation en ligne
    // Préfixe : /api/v1/elearning
    // Modules : CoursEnLigne, Module, Devoir, Quiz, Arborescence,
    //           Certificat, Chat, Notification, Progression, ProgressionApprenant,
    //           Support, SSE (events)
    // -----------------------------------------------------------------------
    group('Elearning', function () {
        // GET /api/v1/elearning/cours-en-ligne - Cours en ligne
        testGetDetailed('/elearning/cours-en-ligne', 'elearning_cours');
        // GET /api/v1/elearning/module - Modules
        testGetDetailed('/elearning/module', 'elearning_module');
        // GET /api/v1/elearning/devoir - Devoirs
        testGetDetailed('/elearning/devoir', 'elearning_devoir');
        // GET /api/v1/elearning/quiz - Quiz
        testGetDetailed('/elearning/quiz', 'elearning_quiz');
        // GET /api/v1/elearning/arborescence - Arborescence pédagogique
        testGetDetailed('/elearning/arborescence', 'elearning_arborescence');
        // GET /api/v1/elearning/certificat - Certificats
        testGetDetailed('/elearning/certificat', 'elearning_certificat');
        // GET /api/v1/elearning/chat - Chat
        testGetDetailed('/elearning/chat', 'elearning_chat');
        // GET /api/v1/elearning/notification - Notifications
        testGetDetailed('/elearning/notification', 'elearning_notification');
        // GET /api/v1/elearning/progression - Progression
        testGetDetailed('/elearning/progression', 'elearning_progression');
        // GET /api/v1/elearning/support - Support cours
        testGetDetailed('/elearning/support', 'elearning_support');
        // GET /api/v1/elearning/ (SSE - Server-Sent Events)
        testGetDetailed('/elearning/', 'elearning_sse');
    });

    sleep(0.5);

    // -----------------------------------------------------------------------
    // GROUP 14 : RH - Ressources Humaines
    // Préfixe : /api/v1/rh
    // Modules : Employe, Poste, Departement, Contrat, Evaluation, FicheEvaluation,
    //           BulletinPaie, Candidature, CategorieProfessionnelle, CritereEvaluation,
    //           Conge, Formation, GrilleSalariale, HeureSupplementaire,
    //           IndemnitePrestataire, LigneBulletin, OffreEmploi, ParticipationFormation,
    //           PeriodePaie, PlanningPersonnel, Prestataire, PrestationEnseignant,
    //           Pret, RemboursementPret, Reporting, RubriquePaie, TypeContrat
    // -----------------------------------------------------------------------
    group('RH', function () {
        // GET /api/v1/rh/employe - Employés
        testGetDetailed('/rh/employe', 'rh_employe');
        // GET /api/v1/rh/poste - Postes
        testGetDetailed('/rh/poste', 'rh_poste');
        // GET /api/v1/rh/departement - Départements RH
        testGetDetailed('/rh/departement', 'rh_departement');
        // GET /api/v1/rh/contrat - Contrats
        testGetDetailed('/rh/contrat', 'rh_contrat');
        // GET /api/v1/rh/evaluation - Évaluations RH
        testGetDetailed('/rh/evaluation', 'rh_evaluation');
        // GET /api/v1/rh/fiche-evaluation - Fiches d'évaluation
        testGetDetailed('/rh/fiche-evaluation', 'rh_fiche_evaluation');
        // GET /api/v1/rh/bulletin-paie - Bulletins de paie
        testGetDetailed('/rh/bulletin-paie', 'rh_bulletin_paie');
        // GET /api/v1/rh/candidature - Candidatures
        testGetDetailed('/rh/candidature', 'rh_candidature');
        // GET /api/v1/rh/conge - Congés
        testGetDetailed('/rh/conge', 'rh_conge');
        // GET /api/v1/rh/formation - Formations
        testGetDetailed('/rh/formation', 'rh_formation');
        // GET /api/v1/rh/offre-emploi - Offres d'emploi
        testGetDetailed('/rh/offre-emploi', 'rh_offre_emploi');
        // GET /api/v1/rh/planning-personnel - Planning du personnel
        testGetDetailed('/rh/planning-personnel', 'rh_planning_personnel');
        // GET /api/v1/rh/prestataire - Prestataires RH
        testGetDetailed('/rh/prestataire', 'rh_prestataire');
        // GET /api/v1/rh/pret - Prêts RH
        testGetDetailed('/rh/pret', 'rh_pret');
        // GET /api/v1/rh/reporting - Reporting RH
        testGetDetailed('/rh/reporting', 'rh_reporting');
        // GET /api/v1/rh/type-contrat - Types de contrat
        testGetDetailed('/rh/type-contrat', 'rh_type_contrat');
    });

    sleep(0.5);

    // -----------------------------------------------------------------------
    // GROUP 15 : COMMUNICATION - Communication interne
    // Préfixe : /api/v1/communication
    // Modules : Actualite, Communication, Suggestion
    // -----------------------------------------------------------------------
    group('Communication', function () {
        // GET /api/v1/communication/actualite - Actualités
        testGetDetailed('/communication/actualite', 'comm_actualite');
        // GET /api/v1/communication/communication - Communications
        testGetDetailed('/communication/communication', 'comm_communication');
        // GET /api/v1/communication/suggestion - Suggestions
        testGetDetailed('/communication/suggestion', 'comm_suggestion');
    });

    sleep(0.5);

    // -----------------------------------------------------------------------
    // GROUP 16 : MARCHE - Marchés publics
    // Préfixe : /api/v1/marche
    // Modules : AppelOffre, AvenantMarche, ContratMarche, ManifestationInteret,
    //           PlanificationMarche
    // -----------------------------------------------------------------------
    group('Marche', function () {
        // GET /api/v1/marche/appel-offre - Appels d'offres
        testGetDetailed('/marche/appel-offre', 'marche_appel_offre');
        // GET /api/v1/marche/avenant - Avenants
        testGetDetailed('/marche/avenant', 'marche_avenant');
        // GET /api/v1/marche/contrat - Contrats de marché
        testGetDetailed('/marche/contrat', 'marche_contrat');
        // GET /api/v1/marche/manifestation-interet - Manifestations d'intérêt
        testGetDetailed('/marche/manifestation-interet', 'marche_manifestation_interet');
        // GET /api/v1/marche/planification - Planification des marchés
        testGetDetailed('/marche/planification', 'marche_planification');
    });

    sleep(0.5);

    // -----------------------------------------------------------------------
    // GROUP 17 : PARENT - Espace parent
    // Préfixe : /api/v1/parent
    // -----------------------------------------------------------------------
    group('Parent', function () {
        // GET /api/v1/parent/ - Espace parent (accueil/enfant)
        testGetDetailed('/parent/', 'parent_accueil');
    });

    sleep(0.5);

    // -----------------------------------------------------------------------
    // GROUP 18 : ETABLISSEMENT - Gestion des établissements
    // Préfixe : /api/v1/etablissements
    // -----------------------------------------------------------------------
    group('Etablissement', function () {
        // GET /api/v1/etablissements/ - Établissements
        testGetDetailed('/etablissements/', 'etablissement_liste');
    });

    sleep(0.5);

    // -----------------------------------------------------------------------
    // GROUP 19 : DOCGEN - Génération de documents
    // Préfixe : /api/v1/docgen
    // Modules : Document, Template, Type, Signing, Workflow, Cachet,
    //           StudentDocument, Verification
    // -----------------------------------------------------------------------
    group('DocGen', function () {
        // GET /api/v1/docgen/document - Documents
        testGetDetailed('/docgen/document', 'docgen_document');
        // GET /api/v1/docgen/template - Templates
        testGetDetailed('/docgen/template', 'docgen_template');
        // GET /api/v1/docgen/type - Types de documents
        testGetDetailed('/docgen/type', 'docgen_type');
        // GET /api/v1/docgen/signing - Signature
        testGetDetailed('/docgen/signing', 'docgen_signing');
        // GET /api/v1/docgen/workflow - Workflows
        testGetDetailed('/docgen/workflow', 'docgen_workflow');
        // GET /api/v1/docgen/cachet - Cachets
        testGetDetailed('/docgen/cachet', 'docgen_cachet');
        // GET /api/v1/docgen/student/document - Documents étudiants
        testGetDetailed('/docgen/student/document', 'docgen_student_document');
        // GET /api/v1/docgen/student/documents - Documents de l'étudiant
        testGetDetailed('/docgen/student/documents', 'docgen_student_documents');
        // GET /api/v1/docgen/signing/pending/enseignant - Documents en attente enseignant
        testGetDetailed('/docgen/signing/pending/enseignant', 'docgen_signing_pending_enseignant');
        // GET /api/v1/docgen/signing/pending/direction - Documents en attente direction
        testGetDetailed('/docgen/signing/pending/direction', 'docgen_signing_pending_direction');
        // GET /api/v1/docgen/verification/document/:matricule/:reference - Vérification document
        testGetDetailed('/verification/document/TEST/REF001', 'docgen_verification');
    });

    sleep(0.5);

    // -----------------------------------------------------------------------
    // GROUP 20 : ORIENTATION - Orientation scolaire
    // Préfixe : /api/v1/orientation
    // Modules : Categorie, DeboucheParcours, DemandeOrientation, MatierePrerequis,
    //           NiveauEtude, PanierParcoursChoisi, ParcoursChoisi, PrerequisParcours,
    //           PrerequisParcoursChoisi, ReponseOrientation
    // -----------------------------------------------------------------------
    group('Orientation', function () {
        // GET /api/v1/orientation/categorie - Catégories d'orientation
        testGetDetailed('/orientation/categorie', 'orientation_categorie');
        // GET /api/v1/orientation/debouche-parcours - Débouchés des parcours
        testGetDetailed('/orientation/debouche-parcours', 'orientation_debouche');
        // GET /api/v1/orientation/demande-orientation - Demandes d'orientation
        testGetDetailed('/orientation/demande-orientation', 'orientation_demande');
        // GET /api/v1/orientation/matiere-prerequis - Matières prérequis
        testGetDetailed('/orientation/matiere-prerequis', 'orientation_matiere_prerequis');
        // GET /api/v1/orientation/niveau-etude - Niveaux d'étude
        testGetDetailed('/orientation/niveau-etude', 'orientation_niveau_etude');
        // GET /api/v1/orientation/parcours-choisi - Parcours choisis
        testGetDetailed('/orientation/parcours-choisi', 'orientation_parcours_choisi');
        // GET /api/v1/orientation/prerequis-parcours - Prérequis des parcours
        testGetDetailed('/orientation/prerequis-parcours', 'orientation_prerequis_parcours');
        // GET /api/v1/orientation/reponse-orientation - Réponses d'orientation
        testGetDetailed('/orientation/reponse-orientation', 'orientation_reponse');
    });

    sleep(0.5);

    // -----------------------------------------------------------------------
    // GROUP 21 : MENU & SURVEILLANCE & EVENTS
    // Préfixes : /api/v1/menu, /api/v1/surveillance, /api/v1/events
    // -----------------------------------------------------------------------
    group('Menu Surveillance Events', function () {
        // GET /api/v1/menu/ - Menu principal
        testGetDetailed('/menu/', 'menu_principal');
        // GET /api/v1/surveillance/ - Surveillance
        testGetDetailed('/surveillance/', 'surveillance_liste');
        // GET /api/v1/events/ - Events (SSE)
        testGetDetailed('/events/', 'events_sse');
    });

    sleep(0.5);

    // -----------------------------------------------------------------------
    // GROUP 22 : BULLETINS - Bulletins de notes
    // Préfixe : /api/v1/bulletins (monté dans inscription)
    // Modules : Bulletin, Deliberation, EchelleNote, JuryMembre, Passation,
    //           SuiviUe, AuditNote
    // -----------------------------------------------------------------------
    group('Bulletins', function () {
        // GET /api/v1/inscription/bulletins - Bulletins (via InscriptionRoutes)
        testGetDetailed('/inscription/bulletins', 'bulletin_liste');
        // GET /api/v1/inscription/bulletins/moyennes - Moyennes
        testGetDetailed('/inscription/bulletins/moyennes', 'bulletin_moyennes');
        // GET /api/v1/inscription/deliberations - Délibérations
        testGetDetailed('/inscription/deliberations', 'bulletin_deliberations');
        // GET /api/v1/inscription/echelle-notes - Échelles de notes
        testGetDetailed('/inscription/echelle-notes', 'bulletin_echelles');
        // GET /api/v1/inscription/jury-membres - Membres du jury
        testGetDetailed('/inscription/jury-membres', 'bulletin_jury');
        // GET /api/v1/inscription/passations - Passations
        testGetDetailed('/inscription/passations', 'bulletin_passations');
        // GET /api/v1/inscription/suivi-ue - Suivi UE
        testGetDetailed('/inscription/suivi-ue', 'bulletin_suivi_ue');
        // GET /api/v1/inscription/audit-notes - Audit des notes
        testGetDetailed('/inscription/audit-notes', 'bulletin_audit_notes');
    });

    sleep(0.5);

    // -----------------------------------------------------------------------
    // GROUP 23 : COMPTABILITE - Comptabilité
    // Préfixe : /api/v1/comptabilite
    // Modules : ExerciceComptable, EtatsFinanciers, EcritureComptable, Compte,
    //           CompteBancaire, ReleveBancaire, ReductionFrais, Rapprochement,
    //           PenaliteRetard, ParametreFrais, LigneFraisEtudiant,
    //           JournalComptable, FraisParcours
    // -----------------------------------------------------------------------
    group('Comptabilite', function () {
        // GET /api/v1/comptabilite/exercice-comptable - Exercices comptables
        testGetDetailed('/comptabilite/exercice-comptable', 'compta_exercice');
        // GET /api/v1/comptabilite/bilan - Bilan
        testGetDetailed('/comptabilite/bilan', 'compta_bilan');
        // GET /api/v1/comptabilite/compte-resultat - Compte de résultat
        testGetDetailed('/comptabilite/compte-resultat', 'compta_compte_resultat');
        // GET /api/v1/comptabilite/compte - Comptes
        testGetDetailed('/comptabilite/compte', 'compta_compte');
        // GET /api/v1/comptabilite/compte-bancaire - Comptes bancaires
        testGetDetailed('/comptabilite/compte-bancaire', 'compta_compte_bancaire');
        // GET /api/v1/comptabilite/releve-bancaire - Relevés bancaires
        testGetDetailed('/comptabilite/releve-bancaire', 'compta_releve');
        // GET /api/v1/comptabilite/journal-comptable - Journal comptable
        testGetDetailed('/comptabilite/journal-comptable', 'compta_journal');
        // GET /api/v1/comptabilite/frais-parcours - Frais de parcours
        testGetDetailed('/comptabilite/frais-parcours', 'compta_frais_parcours');
        // GET /api/v1/comptabilite/reductions-frais - Réductions de frais
        testGetDetailed('/comptabilite/reductions-frais', 'compta_reductions');
        // GET /api/v1/comptabilite/rapprochement - Rapprochements
        testGetDetailed('/comptabilite/rapprochement', 'compta_rapprochement');
        // GET /api/v1/comptabilite/penalite-retard - Pénalités de retard
        testGetDetailed('/comptabilite/penalite-retard', 'compta_penalite_retard');
        // GET /api/v1/comptabilite/ligne-frais-etudiant - Ligne de frais étudiant
        testGetDetailed('/comptabilite/ligne-frais-etudiant', 'compta_ligne_frais');
        // GET /api/v1/comptabilite/parametre-frais - Paramètres de frais
        testGetDetailed('/comptabilite/parametre-frais', 'compta_parametre_frais');
        // GET /api/v1/comptabilite/ecriture-comptable - Écritures comptables
        testGetDetailed('/comptabilite/ecriture-comptable', 'compta_ecriture');
        // GET /api/v1/comptabilite/etats-financiers - États financiers
        testGetDetailed('/comptabilite/etats-financiers', 'compta_etats_financiers');
    });

    sleep(0.5);

    // -----------------------------------------------------------------------
    // FIN DU TEST
    // Tous les modules ont été testés dans leurs groupes respectifs
    // Total : plus de 120 endpoints GET représentatifs couverts
    // -----------------------------------------------------------------------
}
