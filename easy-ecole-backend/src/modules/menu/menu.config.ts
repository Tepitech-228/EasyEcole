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
        allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN, RolesUtilisateur.COMITE_ORIENTATION],
        groups: [
            {
                label: 'Admission & Inscription',
                icon: 'assignment',
                items: [
                    { label: 'Sessions', route: '/inscription/sessions', icon: 'cycle', permissionKey: 'menu.inscription.sessions', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Parcours', route: '/inscription/parcours', icon: 'school', permissionKey: 'menu.inscription.parcours', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Salles de classe', route: '/inscription/salles-de-classe', icon: 'meeting_room', permissionKey: 'menu.inscription.salles', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN, RolesUtilisateur.ENSEIGNANT] },
                    { label: 'Frais par parcours', route: '/inscription/frais-parcours', icon: 'payments', permissionKey: 'menu.inscription.frais-parcours', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Demandes', route: '/inscription/demandes', icon: 'receipt_long', permissionKey: 'menu.inscription.demandes', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Effectifs inscrits', route: '/inscription/effectifs', icon: 'group', permissionKey: 'menu.inscription.effectifs', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                     { label: 'Demandes orientation', route: '/orientation/demandes', icon: 'receipt_long', permissionKey: 'menu.orientation.demandes', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Parcours orientation', route: '/orientation/parcours', icon: 'route', permissionKey: 'menu.orientation.parcours', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Preinscriptions', route: '/inscription/comite-orientation', icon: 'how_to_reg', permissionKey: 'menu.comite-orientation.preinscriptions', allowedRoles: [RolesUtilisateur.COMITE_ORIENTATION, RolesUtilisateur.ADMIN] },
                    { label: 'Mes bordereaux', route: '/inscription/bordereaux', icon: 'receipt_long', permissionKey: 'menu.finances.bordereaux', allowedRoles: [RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Mon dossier', route: '/inscription/mon-dossier', icon: 'folder_special', permissionKey: 'menu.inscription.mon-dossier', allowedRoles: [RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Désignation directeur mémoire', route: '/inscription/designation-memoire', icon: 'menu_book', permissionKey: 'menu.inscription.designation-memoire', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                ]
            },
            {
                label: 'Gestion Bourse',
                icon: 'school',
                items: [
                    { label: 'Configurations', route: '/bourses/configurations', icon: 'school', permissionKey: 'menu.bourses.configurations', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN, RolesUtilisateur.COMITE_ORIENTATION] },
                    { label: 'Attributions', route: '/bourses/attributions', icon: 'assignment_ind', permissionKey: 'menu.bourses.attributions', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN, RolesUtilisateur.COMITE_ORIENTATION] },
                    { label: 'Campagne de bourses', route: '/bourses/campagne', icon: 'campaign', permissionKey: 'menu.bourses.campagne', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN, RolesUtilisateur.COMITE_ORIENTATION] },
                ]
            },
            {
                label: 'Traitement de données',
                icon: 'folder_special',
                items: [
                    { label: 'Dossiers etudiants', route: '/inscription/dossiers', icon: 'folder_special', permissionKey: 'menu.inscription.dossiers-etudiants', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Cartes étudiantes', route: '/inscription/cartes', icon: 'credit_card', permissionKey: 'menu.inscription.cartes', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Arborescence dossiers', route: '/inscription/hierarchy-dossiers', icon: 'account_tree', permissionKey: 'menu.inscription.hierarchy', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Registres', route: '/scolarite/registres', icon: 'menu_book', permissionKey: 'menu.scolarite.registres', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Equivalences', route: '/bulletins/equivalences', icon: 'swap_horiz', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.ADMIN] },
                    { label: 'Dispenses', route: '/bulletins/dispenses', icon: 'file_copy', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.ADMIN] },
                    { label: 'Reorientation', route: '/scolarite/reorientation', icon: 'swap_horiz', permissionKey: 'menu.scolarite.reorientation', allowedRoles: [RolesUtilisateur.APPRENANT, RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Reclamations', route: '/scolarite/mes-reclamations', icon: 'feedback', permissionKey: 'menu.scolarite.reclamations', allowedRoles: [RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Traiter reclam.', route: '/scolarite/traiter-reclamations', icon: 'gavel', permissionKey: 'menu.scolarite.traiter-reclamations', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                ]
            },
            {
                label: 'Planning',
                icon: 'calendar_view_week',
                items: [
                    { label: 'Emplois du temps', route: '/cours/emplois-du-temps', icon: 'event_note', permissionKey: 'menu.cours.emplois-du-temps', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Calendrier', route: '/scolarite/calendrier', icon: 'calendar_month', permissionKey: 'menu.scolarite.calendrier', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Sessions examens', route: '/bulletins/sessions', icon: 'event', permissionKey: 'menu.evaluations.sessions', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.ADMIN] },
                    { label: 'Rattrapages', route: '/bulletins/rattrapages', icon: 'autorenew', permissionKey: 'menu.evaluations.rattrapages', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.ADMIN] },
                    { label: 'Mes rattrapages', route: '/bulletins/rattrapages/mes-demandes', icon: 'autorenew', permissionKey: 'menu.evaluations.rattrapages', allowedRoles: [RolesUtilisateur.APPRENANT] },
                    { label: 'Decisions passage', route: '/scolarite/decisions-passage', icon: 'how_to_vote', permissionKey: 'menu.scolarite.decisions-passage', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                ]
            },
            {
                label: 'Formation',
                icon: 'book',
                items: [
                    // ── Cours & Enseignants ──
                    { label: 'Enseignants', route: '/cours/enseignants', icon: 'cycle', permissionKey: 'menu.cours.enseignants', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: "Unités d'enseignements", route: '/cours/cours', icon: 'book', permissionKey: 'menu.cours.liste', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Cahiers de texte', route: '/cours/cahiers-de-texte', icon: 'note_stack', permissionKey: 'menu.cours.cahiers-de-texte', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },

                    // ── Présences & Notes ──
                    { label: 'Presences', route: '/cours/presences', icon: 'checklist', permissionKey: 'menu.cours.presences', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Notes', route: '/cours/notes', icon: 'lab_profile', permissionKey: 'menu.cours.notes', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },

                    // ── Scolarité ──
                    { label: 'Bibliotheque', route: '/scolarite/bibliotheque', icon: 'library_books', permissionKey: 'menu.scolarite.bibliotheque', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Gestion bibliotheque', route: '/scolarite/gestion-bibliotheque', icon: 'manage_search', permissionKey: 'menu.scolarite.bibliotheque.gestion', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                ]
            },
            {
                label: 'Evaluation & Suivi',
                icon: 'assessment',
                items: [
                    // ── Notes & Bulletins ──
                    { label: 'Bulletins', route: '/bulletins', icon: 'badge', permissionKey: 'menu.evaluations.bulletins', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Moyennes', route: '/bulletins/moyennes', icon: 'calculate', permissionKey: 'menu.evaluations.moyennes', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.ADMIN] },
                    { label: 'Audit notes', route: '/bulletins/audit-notes', icon: 'history', permissionKey: 'menu.evaluations.audit', allowedRoles: [RolesUtilisateur.ADMIN] },
                    { label: 'Paramètres notation', route: '/bulletins/parametres-notation', icon: 'table_chart', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },

                    // ── Examens & Jurys ──
                    { label: 'Délibérations & Jury', route: '/bulletins/deliberations-jury', icon: 'how_to_vote', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },

                    // ── Suivi individuel ──
                    { label: 'Absences', route: '/bulletins/absences', icon: 'block', permissionKey: 'menu.evaluations.absences', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.ADMIN] },
                    { label: 'Sanctions & Discipline', route: '/scolarite/sanctions-discipline', icon: 'gavel', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Conseils classe', route: '/scolarite/conseils', icon: 'groups', permissionKey: 'menu.scolarite.conseils', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.ADMIN] },
                ]
            },
            {
                label: 'Vie Etudiante',
                icon: 'diversity_3',
                items: [
                    { label: 'Annonces', route: '/communication/annonces', icon: 'campaign', permissionKey: 'menu.communication.annonces', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Vie estudiantine', route: '/communication', icon: 'diversity_3', permissionKey: 'menu.communication.vie-estudiantine', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Suggestions', route: '/communication/suggestions', icon: 'lightbulb', permissionKey: 'menu.communication.suggestions', allowedRoles: [RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                ]
            },
            {
                label: 'Insertion Professionnelle',
                icon: 'work',
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
        allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.APPRENANT, RolesUtilisateur.CAISSIER_BANQUE, RolesUtilisateur.CABINET_COMPTABLE, RolesUtilisateur.ADMIN, RolesUtilisateur.RESSOURCES_HUMAINES, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.ESA_COMPTA],
        groups: [
            {
                label: 'Finance',
                icon: 'account_balance',
                items: [
                    { label: 'Paiements', route: '/inscription/paiements', icon: 'paid', permissionKey: 'menu.finances.paiements', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.APPRENANT, RolesUtilisateur.CAISSIER_BANQUE, RolesUtilisateur.CABINET_COMPTABLE, RolesUtilisateur.ADMIN] },
                    { label: 'Echeances', route: '/inscription/echeances', icon: 'event', permissionKey: 'menu.finances.echeances', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.APPRENANT, RolesUtilisateur.CABINET_COMPTABLE, RolesUtilisateur.ADMIN] },
                    { label: 'Valid. bordereaux', route: '/inscription/validation-bordereaux', icon: 'task_alt', permissionKey: 'menu.finances.validation-bordereaux', allowedRoles: [RolesUtilisateur.CABINET_COMPTABLE, RolesUtilisateur.ADMIN] },
                    { label: 'Validation comité', route: '/inscription/comite-validation', icon: 'how_to_reg', permissionKey: 'menu.finances.comite-validation', allowedRoles: [RolesUtilisateur.COMITE_ORIENTATION, RolesUtilisateur.ADMIN] },
                    { label: 'Bordereaux a traiter', route: '/inscription/finance/bordereaux', icon: 'receipt_long', permissionKey: 'menu.finances.bordereaux-a-traiter', allowedRoles: [RolesUtilisateur.ESA_COMPTA, RolesUtilisateur.ADMIN] },
                    { label: 'Types de bordereau', route: '/inscription/finance/types-bordereaux', icon: 'category', permissionKey: 'menu.finances.types-bordereaux', allowedRoles: [RolesUtilisateur.ESA_COMPTA, RolesUtilisateur.ADMIN] },
                    { label: 'Comptabilite', route: '/comptabilite/dashboard', icon: 'account_balance', permissionKey: 'menu.finances.comptabilite', allowedRoles: [RolesUtilisateur.CABINET_COMPTABLE, RolesUtilisateur.ADMIN] },
                ]
            },
            {
                label: 'Marches',
                icon: 'gavel',
                allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN],
                items: [
                    { label: 'Planifications', route: '/marche/planifications', icon: 'event', permissionKey: 'menu.marche.planifications' },
                    { label: 'AMI', route: '/marche/ami', icon: 'handshake', permissionKey: 'menu.marche.ami' },
                    { label: "Appels d'offres", route: '/marche/ao', icon: 'request_quote', permissionKey: 'menu.marche.ao' },
                    { label: 'Contrats', route: '/marche/contrats', icon: 'description', permissionKey: 'menu.marche.contrats' },
                    { label: 'Avenants', route: '/marche/avenants', icon: 'edit_note', permissionKey: 'menu.marche.avenants' },
                ]
            },
            {
                label: 'Banque',
                icon: 'account_balance',
                allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN, RolesUtilisateur.CAISSIER_BANQUE, RolesUtilisateur.CABINET_COMPTABLE],
                items: [
                    { label: 'Comptes bancaires', route: '/comptabilite/comptes-bancaires', icon: 'account_balance', permissionKey: 'menu.finances.comptes-bancaires' },
                    { label: 'Relevés bancaires', route: '/comptabilite/releves-bancaires', icon: 'receipt_long', permissionKey: 'menu.finances.releves-bancaires' },
                    { label: 'Rapprochement', route: '/comptabilite/rapprochement', icon: 'fact_check', permissionKey: 'menu.finances.rapprochement' },
                ]
            },
            {
                label: 'Achats',
                icon: 'shopping_cart',
                allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN],
                items: [
                    { label: 'Demandes achat', route: '/achats/demandes', icon: 'receipt_long', permissionKey: 'menu.achats.demandes' },
                    { label: 'Validations', route: '/achats/validations', icon: 'task_alt', permissionKey: 'menu.achats.validations' },
                    { label: 'Commandes', route: '/achats/commandes', icon: 'shopping_cart', permissionKey: 'menu.achats.commandes' },
                    { label: 'Receptions', route: '/achats/receptions', icon: 'inventory_2', permissionKey: 'menu.achats.receptions' },
                    { label: 'Factures', route: '/achats/factures', icon: 'receipt', permissionKey: 'menu.achats.factures' },
                    { label: 'Fournisseurs', route: '/achats/fournisseurs', icon: 'local_shipping', permissionKey: 'menu.achats.fournisseurs' },
                    { label: 'Budgets', route: '/achats/budgets', icon: 'account_balance', permissionKey: 'menu.achats.budgets' },
                ]
            },
            {
                label: 'Stocks',
                icon: 'inventory_2',
                allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN, RolesUtilisateur.CAISSIER_BANQUE],
                items: [
                    { label: 'Articles', route: '/stocks/articles', icon: 'inventory_2', permissionKey: 'menu.stocks.articles' },
                    { label: 'Catégories', route: '/stocks/categories', icon: 'category', permissionKey: 'menu.stocks.categories', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Mouvements', route: '/stocks/mouvements', icon: 'swap_horiz', permissionKey: 'menu.stocks.mouvements' },
                    { label: 'Besoins', route: '/stocks/besoins', icon: 'assignment', permissionKey: 'menu.stocks.besoins' },
                    { label: 'Demandes de prix', route: '/stocks/demandes-prix', icon: 'request_quote', permissionKey: 'menu.stocks.demandes-prix' },
                    { label: 'Transferts', route: '/stocks/transferts', icon: 'repeat', permissionKey: 'menu.stocks.transferts', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Corrections', route: '/stocks/corrections-stock', icon: 'edit_note', permissionKey: 'menu.stocks.corrections', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Rebuts', route: '/stocks/rebuts', icon: 'delete', permissionKey: 'menu.stocks.rebuts', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Inventaires', route: '/stocks/inventaires', icon: 'fact_check', permissionKey: 'menu.stocks.inventaires', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Fournisseurs', route: '/stocks/fournisseurs', icon: 'local_shipping', permissionKey: 'menu.stocks.fournisseurs-stock', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Reportings', route: '/stocks/reportings', icon: 'assessment', permissionKey: 'menu.stocks.reportings', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Cycle de vie', route: '/stocks/cycle-vie', icon: 'cycle', permissionKey: 'menu.stocks.cycle-vie', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                ]
            },
            {
                label: 'Immobilisations',
                icon: 'business',
                allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN, RolesUtilisateur.ENSEIGNANT],
                items: [
                    { label: 'Immobilisations', route: '/immobilisations', icon: 'business', permissionKey: 'menu.immobilisations.liste' },
                    { label: 'Sites', route: '/immobilisations/sites', icon: 'location_on', permissionKey: 'menu.immobilisations.sites', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Categories', route: '/immobilisations/categories', icon: 'category', permissionKey: 'menu.immobilisations.categories', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Affectations', route: '/immobilisations/affectations', icon: 'assignment_ind', permissionKey: 'menu.immobilisations.affectations', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Assurances', route: '/immobilisations/assurances', icon: 'verified', permissionKey: 'menu.immobilisations.assurances', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Sorties provisoires', route: '/immobilisations/sorties-provisoires', icon: 'logout', permissionKey: 'menu.immobilisations.sorties-provisoires', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Cessions', route: '/immobilisations/cessions', icon: 'sell', permissionKey: 'menu.immobilisations.cessions', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Rebuts', route: '/immobilisations/rebuts', icon: 'delete_forever', permissionKey: 'menu.immobilisations.rebuts', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Maintenance', route: '/immobilisations/maintenances', icon: 'build', permissionKey: 'menu.immobilisations.maintenance', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Inventaires', route: '/immobilisations/inventaires', icon: 'fact_check', permissionKey: 'menu.immobilisations.inventaires', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Reportings', route: '/immobilisations/reportings', icon: 'assessment', permissionKey: 'menu.immobilisations.reportings', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
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
                icon: 'badge',
                allowedRoles: [RolesUtilisateur.RESSOURCES_HUMAINES, RolesUtilisateur.ADMIN],
                items: [
                    { label: 'Employes', route: '/rh/employes', icon: 'badge', permissionKey: 'menu.rh.employes' },
                    { label: "Offres d'emploi", route: '/rh/offres-emploi', icon: 'work', permissionKey: 'menu.rh.offres-emploi' },
                    { label: 'Candidatures', route: '/rh/candidatures', icon: 'receipt_long', permissionKey: 'menu.rh.candidatures' },
                    { label: 'Catégories professionnelles', route: '/rh/categories-professionnelles', icon: 'category', permissionKey: 'menu.rh.categories-professionnelles', allowedRoles: [RolesUtilisateur.RESSOURCES_HUMAINES, RolesUtilisateur.ADMIN] },
                    { label: 'Grilles salariales', route: '/rh/grilles-salariales', icon: 'table_chart', permissionKey: 'menu.rh.grilles-salariales', allowedRoles: [RolesUtilisateur.RESSOURCES_HUMAINES, RolesUtilisateur.ADMIN] },
                    { label: 'Paramètres paie', route: '/rh/parametres-paie', icon: 'settings', allowedRoles: [RolesUtilisateur.RESSOURCES_HUMAINES, RolesUtilisateur.ADMIN] },
                    { label: 'Paie', route: '/rh/paie', icon: 'paid', permissionKey: 'menu.rh.paie' },
                    { label: 'Heures supplémentaires', route: '/rh/heures-supplementaires', icon: 'schedule', permissionKey: 'menu.rh.heures-supplementaires', allowedRoles: [RolesUtilisateur.RESSOURCES_HUMAINES, RolesUtilisateur.ADMIN] },
                    { label: 'Prêts / Avances', route: '/rh/prets', icon: 'account_balance', permissionKey: 'menu.rh.prets', allowedRoles: [RolesUtilisateur.RESSOURCES_HUMAINES, RolesUtilisateur.ADMIN] },
                    { label: 'Prestataires', route: '/rh/prestataires', icon: 'badge', permissionKey: 'menu.rh.prestataires', allowedRoles: [RolesUtilisateur.RESSOURCES_HUMAINES, RolesUtilisateur.ADMIN] },
                    { label: 'Indemnités prestataires', route: '/rh/indemnites-prestataires', icon: 'payments', permissionKey: 'menu.rh.indemnites-prestataires', allowedRoles: [RolesUtilisateur.RESSOURCES_HUMAINES, RolesUtilisateur.ADMIN] },
                    { label: 'Prestations', route: '/rh/prestations', icon: 'cycle', permissionKey: 'menu.rh.prestations' },
                    { label: 'Contrats', route: '/rh/contrats-enseignant', icon: 'file_copy', allowedRoles: [RolesUtilisateur.RESSOURCES_HUMAINES, RolesUtilisateur.ADMIN] },
                    { label: 'Formations', route: '/rh/formations', icon: 'school', permissionKey: 'menu.rh.formations' },
                    { label: 'Évaluations', route: '/rh/evaluations', icon: 'assessment', permissionKey: 'menu.rh.evaluations' },
                    { label: 'Planning personnel', route: '/rh/planning-personnel', icon: 'calendar_view_week', allowedRoles: [RolesUtilisateur.RESSOURCES_HUMAINES, RolesUtilisateur.ADMIN, RolesUtilisateur.INSTITUTION] },
                    { label: 'Reportings RH', route: '/rh/reportings', icon: 'assessment', permissionKey: 'menu.rh.reportings', allowedRoles: [RolesUtilisateur.RESSOURCES_HUMAINES, RolesUtilisateur.ADMIN] },
                ]
            },
            {
                label: 'Congés',
                icon: 'event',
                allowedRoles: [RolesUtilisateur.RESSOURCES_HUMAINES, RolesUtilisateur.ADMIN, RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT],
                items: [
                    { label: 'Demandes de congé', route: '/rh/demandes-conge', icon: 'receipt_long', permissionKey: 'menu.rh.demandes-conge' },
                    { label: 'Soldes de congé', route: '/rh/soldes-conge', icon: 'event_note', permissionKey: 'menu.rh.soldes-conge' },
                ]
            },
            {
                label: 'Pointage',
                icon: 'touch_app',
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
        allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN, RolesUtilisateur.COMITE_ORIENTATION, RolesUtilisateur.CABINET_COMPTABLE, RolesUtilisateur.CAISSIER_BANQUE, RolesUtilisateur.RESSOURCES_HUMAINES],
        groups: [
            {
                label: 'Communication',
                icon: 'forum',
                items: [
                    { label: 'Discussions', route: '/communication/discussions', icon: 'forum', permissionKey: 'menu.communication.discussions', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                ]
            },
            {
                label: 'Reporting',
                icon: 'assessment',
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
                icon: 'inventory_2',
                items: [
                    { label: 'Catalogue', route: '/ged/catalog', icon: 'inventory_2' },
                    { label: 'Recherche avancee', route: '/ged/search', icon: 'search' },
                    { label: 'Dossiers', route: '/ged/folders', icon: 'folder' },
                ]
            },
            {
                label: 'Traitement',
                icon: 'upload_file',
                items: [
                    { label: 'Televerser', route: '/ged/upload', icon: 'upload_file' },

                ]
            },
            {
                label: 'Organisation',
                icon: 'rule',
                items: [
                    { label: 'Conservation', route: '/ged/conservation', icon: 'event' },
                    { label: 'Bordereaux', route: '/ged/disposal', icon: 'delete_sweep', allowedRoles: [RolesUtilisateur.ADMIN] },
                ]
            },
        ]
    },
    {
        label: 'E-Learning',
        icon: 'school',
        allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN],
        groups: [
            {
                label: 'Formation',
                icon: 'school',
                items: [
                    { label: 'Mes cours', route: '/elearning/dashboard', icon: 'school', permissionKey: 'menu.elearning.mes-cours', allowedRoles: [RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Cours vidéos', route: '/elearning/videos', icon: 'play_circle', permissionKey: 'menu.elearning.videos', allowedRoles: [RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Cours PDF', route: '/elearning/pdfs', icon: 'picture_as_pdf', permissionKey: 'menu.elearning.pdfs', allowedRoles: [RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Quiz', route: '/elearning/quiz', icon: 'quiz', permissionKey: 'menu.elearning.quiz', allowedRoles: [RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Progression', route: '/elearning/progression', icon: 'trending_up', permissionKey: 'menu.elearning.progression', allowedRoles: [RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Certificats', route: '/elearning/certificats', icon: 'verified', permissionKey: 'menu.elearning.certificats', allowedRoles: [RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Devoirs', route: '/elearning/devoirs', icon: 'assignment', permissionKey: 'menu.elearning.devoirs', allowedRoles: [RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Catalogue e-learning', route: '/elearning/catalogue', icon: 'account_tree', permissionKey: 'menu.elearning.catalogue', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN, RolesUtilisateur.ENSEIGNANT] },
                ]
            },
            {
                label: 'Administration',
                icon: 'manage_search',
                allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN],
                items: [
                    { label: 'Gestion e-learning', route: '/elearning/admin/gestion', icon: 'manage_search', permissionKey: 'menu.elearning.gestion' },
                ]
            },
        ]
    },
    {
        label: 'Espace Parents',
        icon: 'favorite',
        allowedRoles: [RolesUtilisateur.PARENT],
        groups: [
            {
                label: 'Suivi',
                icon: 'visibility',
                items: [
                    { label: 'Tableau de bord', route: '/parent', icon: 'dashboard', permissionKey: 'menu.parent.dashboard' },
                    { label: 'Notes', route: '/parent/notes', icon: 'lab_profile', permissionKey: 'menu.parent.notes' },
                    { label: 'Absences', route: '/parent/absences', icon: 'block', permissionKey: 'menu.parent.absences' },
                ]
            },
            {
                label: 'Informations',
                icon: 'info',
                items: [
                    { label: 'Emploi du temps', route: '/parent/emploi-du-temps', icon: 'event_note', permissionKey: 'menu.parent.edt' },
                    { label: 'Paiements', route: '/parent/paiements', icon: 'paid', permissionKey: 'menu.parent.paiements' },
                    { label: 'Documents', route: '/parent/documents', icon: 'description', permissionKey: 'menu.parent.documents' },
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
                icon: 'security',
                allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN],
                items: [
                    { label: 'Utilisateurs', route: '/administration/utilisateurs', icon: 'people', permissionKey: 'menu.administration.utilisateurs', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Roles', route: '/parametres/roles', icon: 'manage_accounts', permissionKey: 'menu.administration.roles', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Permissions', route: '/parametres/permissions', icon: 'security', permissionKey: 'menu.administration.permissions', allowedRoles: [RolesUtilisateur.ADMIN] },
                    { label: 'QR Codes', route: '/administration/qr-codes', icon: 'qr_code', permissionKey: 'menu.administration.qr-codes', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Journal audit', route: '/administration/audit-logs', icon: 'fact_check', permissionKey: 'menu.administration.journal-audit', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Configuration', route: '/administration/configuration', icon: 'tune', permissionKey: 'menu.administration.configuration', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                ]
            },
            {
                label: 'Parametres',
                icon: 'settings',
                items: [
                    { label: 'Mon profil', route: '/parametres/profil', icon: 'badge', permissionKey: 'menu.parametres.mon-profil', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN, RolesUtilisateur.COMITE_ORIENTATION, RolesUtilisateur.CABINET_COMPTABLE, RolesUtilisateur.CAISSIER_BANQUE, RolesUtilisateur.RESSOURCES_HUMAINES, RolesUtilisateur.PARENT] },
                    { label: 'Mon compte', route: '/parametres/compte', icon: 'account_circle', permissionKey: 'menu.parametres.mon-compte', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN, RolesUtilisateur.COMITE_ORIENTATION, RolesUtilisateur.CABINET_COMPTABLE, RolesUtilisateur.CAISSIER_BANQUE, RolesUtilisateur.RESSOURCES_HUMAINES, RolesUtilisateur.PARENT] },
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
    {
        label: 'Gestion documentaire',
        icon: 'description',
        allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN, RolesUtilisateur.ENSEIGNANT],
        groups: [
            {
                label: 'Configuration',
                icon: 'settings',
                items: [
                    { label: 'Types de documents', route: '/docgen/types', icon: 'category', permissionKey: 'menu.docgen.types', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Modeles', route: '/docgen/templates', icon: 'file_copy', permissionKey: 'menu.docgen.templates', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Cachet electronique', route: '/docgen/cachet', icon: 'verified', permissionKey: 'menu.docgen.cachet', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Workflows', route: '/docgen/workflows', icon: 'account_tree', permissionKey: 'menu.docgen.workflows', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                ]
            },
            {
                label: 'Documents',
                icon: 'description',
                items: [
                    { label: 'Tous les documents', route: '/docgen/documents', icon: 'description', permissionKey: 'menu.docgen.documents', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.ADMIN] },
                    { label: 'Générer', route: '/docgen/generer', icon: 'add_circle', permissionKey: 'menu.docgen.generer', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Diplomes', route: '/scolarite/diplomes', icon: 'workspace_premium', permissionKey: 'menu.scolarite.diplomes', allowedRoles: [RolesUtilisateur.APPRENANT, RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                ]
            },
            {
                label: 'Demandes',
                icon: 'receipt_long',
                items: [
                    { label: 'Demandes docs', route: '/scolarite/demandes-documents', icon: 'description', permissionKey: 'menu.scolarite.demandes-docs', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.APPRENANT, RolesUtilisateur.ADMIN] },
                    { label: 'Traiter demandes', route: '/scolarite/traiter-demandes', icon: 'fact_check', permissionKey: 'menu.scolarite.traiter-demandes', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Demandes VAE', route: '/scolarite/demandes-vae', icon: 'verified', permissionKey: 'menu.scolarite.demandes-vae', allowedRoles: [RolesUtilisateur.APPRENANT, RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                ]
            },
            {
                label: 'Signatures',
                icon: 'how_to_vote',
                items: [
                    { label: 'Signatures', route: '/docgen/signatures', icon: 'how_to_vote', permissionKey: 'menu.docgen.signatures', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Signature direction', route: '/docgen/signatures/direction', icon: 'how_to_reg', permissionKey: 'menu.docgen.signatures-direction', allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                ]
            },
        ]
    },
    {
        label: 'Secretariat',
        icon: 'admin_panel_settings',
        allowedRoles: [RolesUtilisateur.SECRETAIRE, RolesUtilisateur.PERSONNEL_ADMINISTRATIF, RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN],
        groups: [
            {
                label: 'General',
                icon: 'dashboard',
                items: [
                    { label: 'Tableau de bord', route: '/scolarite/secretariat/dashboard', icon: 'dashboard', permissionKey: 'menu.secretariat.dashboard', allowedRoles: [RolesUtilisateur.SECRETAIRE, RolesUtilisateur.PERSONNEL_ADMINISTRATIF, RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Caisse', route: '/scolarite/secretariat/caisse', icon: 'payments', permissionKey: 'menu.secretariat.caisse', allowedRoles: [RolesUtilisateur.SECRETAIRE, RolesUtilisateur.PERSONNEL_ADMINISTRATIF, RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Cloture caisse', route: '/scolarite/secretariat/cloture-caisse', icon: 'lock', permissionKey: 'menu.secretariat.cloture', allowedRoles: [RolesUtilisateur.SECRETAIRE, RolesUtilisateur.PERSONNEL_ADMINISTRATIF, RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                ]
            },
            {
                label: 'Documents',
                icon: 'description',
                items: [
                    { label: 'Demandes', route: '/scolarite/secretariat/demandes', icon: 'receipt_long', permissionKey: 'menu.secretariat.demandes', allowedRoles: [RolesUtilisateur.SECRETAIRE, RolesUtilisateur.PERSONNEL_ADMINISTRATIF, RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                    { label: 'Types de documents', route: '/scolarite/secretariat/types-documents', icon: 'category', permissionKey: 'menu.secretariat.types-documents', allowedRoles: [RolesUtilisateur.SECRETAIRE, RolesUtilisateur.PERSONNEL_ADMINISTRATIF, RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                ]
            },
            {
                label: 'Rapports',
                icon: 'assessment',
                items: [
                    { label: 'Journal caisse', route: '/scolarite/secretariat/journal-caisse', icon: 'book', permissionKey: 'menu.secretariat.journal', allowedRoles: [RolesUtilisateur.SECRETAIRE, RolesUtilisateur.PERSONNEL_ADMINISTRATIF, RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] },
                ]
            },
        ]
    },
    {
        label: 'Qualite',
        icon: 'verified',
        allowedRoles: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN],
        groups: [
            {
                label: 'Gestion Qualité',
                icon: 'verified',
                items: [
                    { label: 'Non-conformités', route: '/qualite/non-conformites', icon: 'error_outline', permissionKey: 'menu.qualite.non-conformites' },
                    { label: 'Audits', route: '/qualite/audits', icon: 'fact_check', permissionKey: 'menu.qualite.audits' },
                    { label: 'Revues direction', route: '/qualite/revues-direction', icon: 'assignment', permissionKey: 'menu.qualite.revues-direction' },
                    { label: 'Enquêtes satisfaction', route: '/qualite/enquetes-satisfaction', icon: 'poll', permissionKey: 'menu.qualite.enquetes' },
                ]
            },
        ]
    },
];
