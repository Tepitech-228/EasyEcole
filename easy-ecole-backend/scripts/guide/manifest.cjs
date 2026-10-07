/**
 * Manifest du guide automatisé EasyEcole.
 * route : chemin front (http://localhost:4200 + route)
 * compte : identifiant aut_utilisateurs utilisé pour la capture (null = public)
 * profil : libellé affiché dans le PDF
 */
const PAGES = [
  {
    route: '/auth/connexion', compte: null, profil: 'Public',
    titre: 'Connexion',
    description: "Porte d'entrée de l'application : l'utilisateur saisit son email (ou identifiant) et son mot de passe. En cas de compte à double facteur, un code OTP est demandé. Une session dure 10 heures.",
    workflow: ['Saisir email et mot de passe', 'Valider (OTP si activé)', 'Accès au tableau de bord du profil'],
  },
  {
    route: '/', compte: 'direction', profil: 'Direction (Institution)',
    titre: 'Tableau de bord direction',
    description: "Vue synthétique pour la direction : effectifs, inscriptions, paiements et taux de réussite. Les indicateurs sont calculés côté serveur (agrégats SQL).",
    workflow: ['Consulter les KPI', 'Filtrer par année / filière', 'Suivre les alertes'],
  },
  {
    route: '/inscription/choisir-session', compte: 'etudiant1', profil: 'Étudiant (Apprenant)',
    titre: 'Choisir une session d inscription',
    description: "L'étudiant choisit sa session d'inscription. Si une demande existe déjà pour la session, il est redirigé vers son wizard à l'étape réelle du dossier (reprise serveur).",
    workflow: ['Choisir la session', 'Créer ou reprendre la demande', 'Entrer dans le wizard'],
  },
  {
    route: '/inscription/demandes', compte: 'etudiant1', profil: 'Étudiant (Apprenant)',
    titre: 'Mes demandes d inscription',
    description: "Historique des demandes de l'étudiant avec leur avancement dans le pipeline : soumis, authentifié, saisie validée, transmis au comité, validé.",
    workflow: ['Voir ses demandes', 'Ouvrir une demande (reprise à la bonne étape)', 'Suivre le statut pipeline'],
  },
  {
    route: '/inscription/validation-bordereaux', compte: 'tepitechcorp', profil: 'Cabinet comptable',
    titre: 'Validation des bordereaux (cabinet)',
    description: "Le cabinet authentifie les bordereaux déposés par les étudiants : contrôle du PDF, saisie de la référence bancaire, du numéro et de la date de paiement. Un bordereau authentifié part en attente de saisie ESA-Compta.",
    workflow: ['Voir le bordereau (PDF)', 'Valider avec références bancaires', 'Ou rejeter avec motif'],
  },
  {
    route: '/inscription/finance/bordereaux', compte: 'kakashitogo', profil: 'ESA Compta',
    titre: 'Bordereaux à imputer (ESA Compta)',
    description: "Saisie comptable des bordereaux authentifés : type d'opération, montant constaté, imputation automatique (FIFO) sur les échéances de l'étudiant.",
    workflow: ['Ouvrir un bordereau validé', 'Saisir le montant et imputer', 'Transmettre au comité'],
  },
  {
    route: '/inscription/finance/situation-financiere', compte: 'kakashitogo', profil: 'ESA Compta',
    titre: 'Situation financière',
    description: "Situation financière par étudiant : total à payer, total payé, reste à payer, échéances soldées ou en retard.",
    workflow: ['Rechercher un étudiant', 'Consulter le solde', 'Voir les échéances'],
  },
  {
    route: '/pointage', compte: 'surveillant1', profil: 'Surveillant',
    titre: 'Terminal de pointage',
    description: "Pointage des arrivées et départs par QR code (caméra, zoom, lampe) ou saisie manuelle du matricule. Le scan affiche photo, identité et situation financière avant de pointer.",
    workflow: ['Scanner le QR ou saisir le matricule', 'Vérifier identité et statut (vert/rouge)', 'Pointer arrivée / départ'],
  },
  {
    route: '/pointage/historique', compte: 'surveillant1', profil: 'Surveillant',
    titre: 'Historique des pointages',
    description: "Historique filtrable des pointages : personne, rôle, date, arrivée, départ, durée calculée et statut (complet / en cours).",
    workflow: ['Filtrer par personne, rôle ou date', 'Consulter les durées', 'Repérer les départs manquants'],
  },
  {
    route: '/pointage/shifts', compte: 'tepitechbuild', profil: 'Administrateur',
    titre: 'Gestion des shifts',
    description: "Définition des plages horaires de travail : nom, heures de début et fin, jours actifs. Les shifts servent de référence aux horaires attendus.",
    workflow: ['Créer un shift', 'Activer / désactiver', 'Modifier ou supprimer'],
  },
  {
    route: '/pointage/planning', compte: 'direction', profil: 'Direction (Institution)',
    titre: 'Planning hebdomadaire',
    description: "Vue hebdomadaire des planifications du personnel (données RH) : employé, matricule, poste, tâche et horaires par jour.",
    workflow: ['Consulter la semaine', 'Voir le détail par employé', 'Actualiser'],
  },
  {
    route: '/pointage/rapports', compte: 'direction', profil: 'Direction (Institution)',
    titre: 'Rapports de pointage',
    description: "Statistiques calculées sur les pointages réels : synthèse de la période et détail par personne (présences, heures, départs manquants), avec filtre de dates.",
    workflow: ['Choisir la période', 'Lire la synthèse', 'Analyser le détail par personne'],
  },
  {
    route: '/scolarite/demandes-documents', compte: 'secretaire1', profil: 'Secrétaire',
    titre: 'Demandes de documents',
    description: "Suivi des demandes de documents des étudiants : pièces déposées, bordereau, validation par le comité puis génération par le secrétariat.",
    workflow: ['Voir les demandes', 'Contrôler les pièces', 'Transmettre / générer'],
  },
  {
    route: '/scolarite/secretariat/demandes', compte: 'secretaire1', profil: 'Secrétaire',
    titre: 'Guichet secrétariat',
    description: "File des demandes à traiter par le secrétariat : encaissements, génération des documents validés par le comité, clôtures de caisse.",
    workflow: ['Traiter la file', 'Générer les documents validés', 'Encaisser / clôturer'],
  },
  {
    route: '/cours/notes', compte: 'prof-maths', profil: 'Enseignant',
    titre: 'Saisie des notes',
    description: "Saisie des notes par l'enseignant pour ses classes et matières : contrôles, devoirs, examens. Les moyennes alimentent bulletins et délibérations.",
    workflow: ['Choisir classe et matière', 'Saisir les notes', 'Publier / transmettre'],
  },
];

PAGES.push(
  {
    route: '/inscription/demandes/406', compte: 'etudiant-demo', profil: 'Étudiant (Apprenant)',
    titre: 'Wizard inscription (reprise de dossier)',
    description: "Ouverture d'une demande existante : le wizard se positionne sur l'étape réelle du dossier (ici suivi après transmission au comité) au lieu de repartir de zéro, même après rechargement.",
    workflow: ['Ouvrir sa demande', 'Reprendre à la bonne étape', 'Suivre le statut pipeline'],
  },
  {
    route: '/inscription/reinscription/wizard', compte: 'jean-marc.kouassi', profil: 'Étudiant (Apprenant)',
    titre: 'Wizard de réinscription',
    description: "Réinscription annuelle en 5 étapes : situation, documents, bordereau, récapitulatif, suivi. L'étape et la saisie sont conservées en cas de rechargement (règle LMD : le solde affiché n'est pas bloquant).",
    workflow: ['Vérifier sa situation', 'Déposer les 6 pièces', 'Téléverser le bordereau', 'Confirmer et suivre'],
  },
  {
    route: '/inscription/rattrapage/mes-demandes', compte: 'etudiant-demo', profil: 'Étudiant (Apprenant)',
    titre: 'Demandes de rattrapage',
    description: "L'étudiant choisit une session de rattrapage (ou demande sans session via ses UE non validées), dépose les 3 pièces obligatoires puis le bordereau après validation du comité.",
    workflow: ['Choisir la session', 'Déposer les pièces', 'Payer après validation'],
  },
  {
    route: '/inscription/rattrapage/sessions', compte: 'direction', profil: 'Direction (Institution)',
    titre: 'Sessions de rattrapage',
    description: "Le secrétariat général crée les sessions de rattrapage (date, matières) et y affecte les correcteurs, notifiés par mail et dans l'application.",
    workflow: ['Créer une session', 'Affecter les correcteurs', 'Publier'],
  },
  {
    route: '/inscription/rattrapage/comite', compte: 'histoiregede', profil: 'Comité d orientation',
    titre: 'Comité rattrapage (validation)',
    description: "Chaque membre du comité examine la demande, vote et signe électroniquement. L'unanimité déclenche la suite (paiement puis programmation).",
    workflow: ['Examiner le dossier', 'Voter et signer', 'Décision collégiale'],
  },
  {
    route: '/bulletins', compte: 'direction', profil: 'Direction (Institution)',
    titre: 'Bulletins',
    description: "Bulletins générés depuis les notes saisies : moyennes par matière, crédits, mentions. Base des délibérations et relevés.",
    workflow: ['Choisir année / classe', 'Générer les bulletins', 'Consulter / imprimer'],
  },
  {
    route: '/bulletins/moyennes', compte: 'direction', profil: 'Direction (Institution)',
    titre: 'Moyennes',
    description: "Calcul et consultation des moyennes par étudiant, matière et classe, avec règles de compensation et crédits.",
    workflow: ['Calculer les moyennes', 'Vérifier par classe', 'Transmettre en délibération'],
  },
  {
    route: '/cours/emplois-du-temps', compte: 'prof-maths', profil: 'Enseignant',
    titre: 'Emploi du temps',
    description: "Emplois du temps créés par le secrétariat général : cours, enseignants, salles et horaires par classe, filière et parcours.",
    workflow: ['Consulter son planning', 'Voir salles et horaires', 'Suivre les modifications'],
  },
  {
    route: '/cours/enseignants', compte: 'direction', profil: 'Direction (Institution)',
    titre: 'Gestion des enseignants (profs)',
    description: "Référentiel des enseignants : profils, spécialités, affectations aux cours et badge QR pour le pointage.",
    workflow: ['Créer / modifier un enseignant', 'Affecter aux cours', 'Générer le badge QR'],
  },
  {
    route: '/inscription/sessions', compte: 'direction', profil: 'Direction (Institution)',
    titre: 'Sessions d inscription',
    description: "Sessions d'inscription par année académique et niveau : périodes d'ouverture, documents requis et frais associés.",
    workflow: ['Créer une session', 'Fixer les pièces et frais', 'Ouvrir / clôturer'],
  },
  {
    route: '/inscription/parcours', compte: 'direction', profil: 'Direction (Institution)',
    titre: 'Parcours, UE et ECUE',
    description: "Catalogue des formations : parcours, unités d'enseignement (UE) et éléments constitutifs (ECUE) avec crédits, volumes horaires et prérequis.",
    workflow: ['Créer le parcours', 'Ajouter UE et ECUE', 'Définir crédits et prérequis'],
  },
  {
    route: '/administration/utilisateurs', compte: 'tepitechbuild', profil: 'Administrateur',
    titre: 'Comptes utilisateurs',
    description: "Gestion des comptes : création, rôles, activation / blocage, réinitialisation. Chaque compte porte un rôle qui détermine ses menus et actions.",
    workflow: ['Créer un compte', 'Attribuer le rôle', 'Activer / bloquer'],
  },
  {
    route: '/administration/roles', compte: 'tepitechbuild', profil: 'Administrateur',
    titre: 'Rôles et permissions',
    description: "Matrice des habilitations : chaque rôle coche ses menus et actions (lire, créer, valider...). Le backend applique ces droits sur chaque route.",
    workflow: ['Choisir un rôle', 'Cocher menus et actions', 'Appliquer (effet immédiat)'],
  },
);

module.exports = { PAGES };
