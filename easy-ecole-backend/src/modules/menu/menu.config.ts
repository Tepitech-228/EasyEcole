import { RolesUtilisateur } from "../../core/enums/RolesUtilisateur";

export interface MenuItemConfig {
    label: string;
    route: string;
    icon: string;
    permissionKey?: string;
    allowedRoles?: RolesUtilisateur[];
}

export interface MenuGroupConfig {
    label: string;
    icon?: string;
    items: MenuItemConfig[];
    permissionKey?: string;
    allowedRoles?: RolesUtilisateur[];
}

export interface MenuPoleConfig {
    label: string;
    icon: string;
    groups: MenuGroupConfig[];
    allowedRoles?: RolesUtilisateur[];
}

export const MENU_CONFIG: MenuPoleConfig[] = [
    {
        label: 'Pedagogique',
        icon: 'school',
        allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN],
        groups: [
            {
                label: 'Admission & Inscription',
                items: [
                    { label: 'Sessions', route: '/inscription/sessions', icon: 'cycle', permissionKey: 'menu.inscription.sessions', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Parcours', route: '/inscription/parcours', icon: 'school', permissionKey: 'menu.inscription.parcours', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Frais par parcours', route: '/inscription/frais-parcours', icon: 'payments', permissionKey: 'menu.inscription.frais-parcours', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Demandes', route: '/inscription/demandes', icon: 'receipt_long', permissionKey: 'menu.inscription.demandes', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Mon cursus', route: '/inscription/cursus', icon: 'event_list', permissionKey: 'menu.inscription.cursus', allowedRoles: [RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Mon dossier', route: '/inscription/mon-dossier', icon: 'folder', permissionKey: 'menu.inscription.mon-dossier', allowedRoles: [RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Dossiers etudiants', route: '/inscription/dossiers', icon: 'folder_special', permissionKey: 'menu.inscription.dossiers-etudiants', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Demandes orientation', route: '/orientation/demandes', icon: 'receipt_long', permissionKey: 'menu.orientation.demandes', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Parcours orientation', route: '/orientation/parcours', icon: 'route', permissionKey: 'menu.orientation.parcours', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Preinscriptions', route: '/inscription/comite-orientation', icon: 'how_to_reg', permissionKey: 'menu.comite-orientation.preinscriptions', allowedRoles: [RolesUtilisateur.COMITE_ORIENTATION, RolesUtilisateur.ADMIN] },
                    { label: 'Mes bordereaux', route: '/inscription/bordereaux', icon: 'receipt_long', permissionKey: 'menu.finances.bordereaux', allowedRoles: [RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Valid. bordereaux', route: '/inscription/validation-bordereaux', icon: 'task_alt', permissionKey: 'menu.finances.validation-bordereaux', allowedRoles: [RolesUtilisateur.CABINET_COMPTABLE, RolesUtilisateur.ADMIN] },
                ]
            },
            {
                label: 'Formation',
                items: [
                    { label: 'Enseignants', route: '/cours/enseignants', icon: 'cycle', permissionKey: 'menu.cours.enseignants', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Cours', route: '/cours/cours', icon: 'book', permissionKey: 'menu.cours.liste' },
                    { label: 'Presences', route: '/cours/presences', icon: 'checklist', permissionKey: 'menu.cours.presences', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Mes presences', route: '/cours/mes-presences', icon: 'fact_check', permissionKey: 'menu.cours.mes-presences', allowedRoles: [RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Cahiers de texte', route: '/cours/cahiers-de-texte', icon: 'note_stack', permissionKey: 'menu.cours.cahiers-de-texte' },
                    { label: 'Emplois du temps', route: '/cours/emplois-du-temps', icon: 'event_note', permissionKey: 'menu.cours.emplois-du-temps' },
                    { label: 'Notes', route: '/cours/notes', icon: 'lab_profile', permissionKey: 'menu.cours.notes' },
                    { label: 'Mes cours', route: '/elearning', icon: 'school', permissionKey: 'menu.elearning.mes-cours' },
                    { label: 'Quiz', route: '/elearning/quiz', icon: 'quiz', permissionKey: 'menu.elearning.quiz' },
                    { label: 'Progression', route: '/elearning/progression', icon: 'trending_up', permissionKey: 'menu.elearning.progression', allowedRoles: [RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Certificats', route: '/elearning/certificats', icon: 'verified', permissionKey: 'menu.elearning.certificats', allowedRoles: [RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Devoirs', route: '/elearning/devoirs', icon: 'assignment', permissionKey: 'menu.elearning.devoirs' },
                    { label: 'Gestion elearning', route: '/elearning/admin/gestion', icon: 'manage_search', permissionKey: 'menu.elearning.gestion', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Demandes docs', route: '/scolarite/demandes-documents', icon: 'description', permissionKey: 'menu.scolarite.demandes-docs', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Traiter demandes', route: '/scolarite/traiter-demandes', icon: 'fact_check', permissionKey: 'menu.scolarite.traiter-demandes', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Registres', route: '/scolarite/registres', icon: 'menu_book', permissionKey: 'menu.scolarite.registres', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Calendrier', route: '/scolarite/calendrier', icon: 'calendar_month', permissionKey: 'menu.scolarite.calendrier', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Bibliotheque', route: '/scolarite/bibliotheque', icon: 'library_books', permissionKey: 'menu.scolarite.bibliotheque', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Gestion bibliotheque', route: '/scolarite/gestion-bibliotheque', icon: 'manage_search', permissionKey: 'menu.scolarite.bibliotheque.gestion', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                ]
            },
            {
                label: 'Evaluation & Suivi',
                items: [
                    { label: 'Bulletins', route: '/bulletins', icon: 'badge', permissionKey: 'menu.evaluations.bulletins', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Deliberations', route: '/bulletins/deliberations', icon: 'how_to_vote', permissionKey: 'menu.evaluations.deliberations', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'UEs', route: '/bulletins/ues', icon: 'account_tree', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'MCC', route: '/bulletins/mcc', icon: 'table_chart', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Sessions examens', route: '/bulletins/sessions', icon: 'event', permissionKey: 'menu.evaluations.sessions', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.ADMIN] },
                    { label: 'Rattrapages', route: '/bulletins/rattrapages', icon: 'autorenew', permissionKey: 'menu.evaluations.rattrapages', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.ADMIN] },
                    { label: 'Absences', route: '/bulletins/absences', icon: 'block', permissionKey: 'menu.evaluations.absences', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.ADMIN] },
                    { label: 'Echelles', route: '/bulletins/echelles', icon: 'straighten', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Jury', route: '/bulletins/jury', icon: 'groups', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Equivalences', route: '/bulletins/equivalences', icon: 'swap_horiz', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.ADMIN] },
                    { label: 'Dispenses', route: '/bulletins/dispenses', icon: 'file_copy', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.ADMIN] },
                    { label: 'Audit notes', route: '/bulletins/audit-notes', icon: 'history', permissionKey: 'menu.evaluations.audit', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Moyennes', route: '/bulletins/moyennes', icon: 'calculate', permissionKey: 'menu.evaluations.moyennes', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.ADMIN] },
                    { label: 'Mon releve', route: '/bulletins/mon-releve', icon: 'receipt_long', permissionKey: 'menu.evaluations.mon-releve', allowedRoles: [RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Reclamations', route: '/scolarite/mes-reclamations', icon: 'feedback', permissionKey: 'menu.scolarite.reclamations', allowedRoles: [RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Traiter reclam.', route: '/scolarite/traiter-reclamations', icon: 'gavel', permissionKey: 'menu.scolarite.traiter-reclamations', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Discipline', route: '/scolarite/discipline', icon: 'block', permissionKey: 'menu.scolarite.discipline', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Conseils classe', route: '/scolarite/conseils', icon: 'groups', permissionKey: 'menu.scolarite.conseils', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.ADMIN] },
                ]
            },
            {
                label: 'Vie Etudiante',
                items: [
                    { label: 'Annonces', route: '/communication/annonces', icon: 'campaign', permissionKey: 'menu.communication.annonces' },
                    { label: 'Vie estudiantine', route: '/communication', icon: 'diversity_3', permissionKey: 'menu.communication.vie-estudiantine' },
                    { label: 'Suggestions', route: '/communication/suggestions', icon: 'lightbulb', permissionKey: 'menu.communication.suggestions', allowedRoles: [RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                ]
            },
            {
                label: 'Insertion Professionnelle',
                items: [
                    { label: 'Offres stage', route: '/stages/offres', icon: 'work', permissionKey: 'menu.stages.offres', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Demandes stage', route: '/stages/demandes', icon: 'receipt_long', permissionKey: 'menu.stages.demandes-stage', allowedRoles: [RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Entreprises', route: '/stages/entreprises', icon: 'business', permissionKey: 'menu.stages.entreprises', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                ]
            },
        ]
    },
    {
        label: 'Financier',
        icon: 'paid',
        allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.APPRENANT, RolesUtilisateur.CAISSIER_BANQUE, RolesUtilisateur.CABINET_COMPTABLE, RolesUtilisateur.ADMIN, RolesUtilisateur.RESSOURCES_HUMAINES, RolesUtilisateur.ENSEIGNANT],
        groups: [
            {
                label: 'Finance',
                items: [
                    { label: 'Paiements', route: '/inscription/paiements', icon: 'paid', permissionKey: 'menu.finances.paiements', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.APPRENANT, RolesUtilisateur.CAISSIER_BANQUE, RolesUtilisateur.ADMIN] },
                    { label: 'Comptabilite', route: '/comptabilite/dashboard', icon: 'account_balance', permissionKey: 'menu.finances.comptabilite', allowedRoles: [RolesUtilisateur.CABINET_COMPTABLE, RolesUtilisateur.ADMIN] },
                ]
            },
            {
                label: 'Achats',
                allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN],
                items: [
                    { label: 'Demandes achat', route: '/achats/demandes', icon: 'receipt_long', permissionKey: 'menu.achats.demandes' },
                    { label: 'Commandes', route: '/achats/commandes', icon: 'shopping_cart', permissionKey: 'menu.achats.commandes' },
                    { label: 'Factures', route: '/achats/factures', icon: 'receipt', permissionKey: 'menu.achats.factures' },
                    { label: 'Fournisseurs', route: '/achats/fournisseurs', icon: 'local_shipping', permissionKey: 'menu.achats.fournisseurs' },
                    { label: 'Budgets', route: '/achats/budgets', icon: 'account_balance', permissionKey: 'menu.achats.budgets' },
                ]
            },
            {
                label: 'Stocks',
                allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN, RolesUtilisateur.CAISSIER_BANQUE],
                items: [
                    { label: 'Articles', route: '/stocks/articles', icon: 'inventory_2', permissionKey: 'menu.stocks.articles' },
                    { label: 'Mouvements', route: '/stocks/mouvements', icon: 'swap_horiz', permissionKey: 'menu.stocks.mouvements' },
                    { label: 'Fournisseurs', route: '/stocks/fournisseurs', icon: 'local_shipping', permissionKey: 'menu.stocks.fournisseurs-stock', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                ]
            },
            {
                label: 'Immobilisations',
                allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN, RolesUtilisateur.ENSEIGNANT],
                items: [
                    { label: 'Immobilisations', route: '/immobilisations', icon: 'business', permissionKey: 'menu.immobilisations.liste' },
                    { label: 'Sites', route: '/immobilisations/sites', icon: 'location_on', permissionKey: 'menu.immobilisations.sites', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Categories', route: '/immobilisations/categories', icon: 'category', permissionKey: 'menu.immobilisations.categories', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Maintenance', route: '/immobilisations/maintenances', icon: 'build', permissionKey: 'menu.immobilisations.maintenance', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                ]
            },
        ]
    },
    {
        label: 'Ressources Humaines',
        icon: 'badge',
        allowedRoles: [RolesUtilisateur.RESSOURCES_HUMAINES, RolesUtilisateur.ADMIN, RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT],
        groups: [
            {
                label: 'RH',
                allowedRoles: [RolesUtilisateur.RESSOURCES_HUMAINES, RolesUtilisateur.ADMIN],
                items: [
                    { label: 'Employes', route: '/rh/employes', icon: 'badge', permissionKey: 'menu.rh.employes' },
                    { label: "Offres d'emploi", route: '/rh/offres-emploi', icon: 'work', permissionKey: 'menu.rh.offres-emploi' },
                    { label: 'Candidatures', route: '/rh/candidatures', icon: 'receipt_long', permissionKey: 'menu.rh.candidatures' },
                    { label: 'Paie', route: '/rh/paie', icon: 'paid', permissionKey: 'menu.rh.paie' },
                    { label: 'Prestations', route: '/rh/prestations', icon: 'cycle', permissionKey: 'menu.rh.prestations' },
                    { label: 'Contrats', route: '/rh/contrats-enseignant', icon: 'file_copy', allowedRoles: [RolesUtilisateur.RESSOURCES_HUMAINES, RolesUtilisateur.ADMIN] },
                    { label: 'Planning personnel', route: '/rh/planning-personnel', icon: 'calendar_view_week', allowedRoles: [RolesUtilisateur.RESSOURCES_HUMAINES, RolesUtilisateur.ADMIN, RolesUtilisateur.INSTITUTION] },
                ]
            },
            {
                label: 'Pointage',
                allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.ADMIN],
                items: [
                    { label: 'Terminal', route: '/pointage', icon: 'touch_app', permissionKey: 'menu.pointage.terminal' },
                    { label: 'Historique', route: '/pointage/historique', icon: 'history', permissionKey: 'menu.pointage.historique' },
                    { label: 'Shifts', route: '/pointage/shifts', icon: 'schedule', permissionKey: 'menu.pointage.shifts' },
                    { label: 'Absences', route: '/pointage/absences', icon: 'block', permissionKey: 'menu.pointage.absences' },
                    { label: 'Planning', route: '/pointage/planning', icon: 'calendar_view_week', permissionKey: 'menu.pointage.planning' },
                    { label: 'Rapports', route: '/pointage/rapports', icon: 'assessment', permissionKey: 'menu.pointage.rapports' },
                ]
            },
        ]
    },
    {
        label: 'Communication & Collaboration',
        icon: 'campaign',
        allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN],
        groups: [
            {
                label: 'Communication',
                items: [
                    { label: 'Messagerie', route: '/communication/messagerie', icon: 'mail', permissionKey: 'menu.communication.messagerie' },
                    { label: 'Discussions', route: '/communication/discussions', icon: 'forum', permissionKey: 'menu.communication.discussions' },
                ]
            },
            {
                label: 'Reporting',
                allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN],
                items: [
                    { label: 'Dashboard', route: '/reporting', icon: 'dashboard-outline', permissionKey: 'menu.reporting.dashboard' },
                    { label: 'Effectifs', route: '/reporting/effectifs', icon: 'people', permissionKey: 'menu.reporting.effectifs' },
                    { label: 'Notes', route: '/reporting/notes', icon: 'lab_profile', permissionKey: 'menu.reporting.notes' },
                    { label: 'Paiements', route: '/reporting/paiements', icon: 'paid', permissionKey: 'menu.reporting.paiements' },
                    { label: 'RH', route: '/reporting/rh', icon: 'badge', permissionKey: 'menu.reporting.rh' },
                ]
            },
        ]
    },
    {
        label: 'Archivages Numeriques',
        icon: 'folder_open',
        allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN],
        groups: [
            {
                label: 'Documents',
                items: [
                    { label: 'Catalogue', route: '/ged/catalog', icon: 'inventory_2' },
                    { label: 'Dossiers', route: '/ged/folders', icon: 'folder' },
                ]
            },
            {
                label: 'Traitement',
                items: [
                    { label: 'Televerser', route: '/ged/upload', icon: 'upload_file' },
                    { label: 'Saisie', route: '/ged/saisie', icon: 'edit_note' },
                ]
            },
            {
                label: 'Organisation',
                items: [
                    { label: 'Nomenclature', route: '/ged/nomenclature', icon: 'rule' },
                    { label: 'Sessions', route: '/ged/sessions', icon: 'assignment', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                ]
            },
        ]
    },
    {
        label: 'Administration & Systeme',
        icon: 'manage_accounts',
        groups: [
            {
                label: 'Administration',
                allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN],
                items: [
                    { label: 'Utilisateurs', route: '/administration/utilisateurs', icon: 'people', permissionKey: 'menu.administration.utilisateurs', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Roles', route: '/parametres/roles', icon: 'manage_accounts', permissionKey: 'menu.administration.roles', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Permissions', route: '/parametres/permissions', icon: 'security', permissionKey: 'menu.administration.permissions', allowedRoles: [RolesUtilisateur.ADMIN] },
                    { label: 'QR Codes', route: '/administration/qr-codes', icon: 'qr_code', permissionKey: 'menu.administration.qr-codes', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Cartes', route: '/administration/cartes', icon: 'credit_card', permissionKey: 'menu.administration.cartes', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Journal audit', route: '/administration/audit-logs', icon: 'fact_check', permissionKey: 'menu.administration.journal-audit', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Configuration', route: '/administration/configuration', icon: 'tune', permissionKey: 'menu.administration.configuration', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                ]
            },
            {
                label: 'Parametres',
                items: [
                    { label: 'Mon profil', route: '/parametres/profil', icon: 'badge', permissionKey: 'menu.parametres.mon-profil' },
                    { label: 'Mon compte', route: '/parametres/compte', icon: 'account_circle', permissionKey: 'menu.parametres.mon-compte' },
                    { label: 'Ecole', route: '/parametres/ecole', icon: 'school', permissionKey: 'menu.parametres.configuration.ecole', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Annee scol.', route: '/parametres/annees-scolaires', icon: 'calendar_today', permissionKey: 'menu.parametres.configuration.annees-scolaires', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Frais', route: '/parametres/frais', icon: 'payments', permissionKey: 'menu.parametres.configuration.frais', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Notifications', route: '/parametres/notifications', icon: 'notifications', permissionKey: 'menu.parametres.configuration.notifications', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Systeme', route: '/parametres/systeme', icon: 'settings', permissionKey: 'menu.parametres.configuration.systeme', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Sauvegardes', route: '/parametres/sauvegardes', icon: 'backup', permissionKey: 'menu.parametres.configuration.sauvegardes', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                ]
            },
        ]
    },
];
