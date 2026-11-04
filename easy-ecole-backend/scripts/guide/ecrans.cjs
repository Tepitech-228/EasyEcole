/**
 * Catalogue des écrans du guide.
 *
 * Clé = nom de fichier sans préfixe numérique (ex. 03_bordereaux-a-imputer.png
 * -> 'bordereaux-a-imputer'). Les descriptions restent volontairement courtes :
 * elles expliquent l'objectif de l'écran et les actions attendues du profil.
 */
const ECRANS = {
  // ---------------------------------------------------------------- commun
  'mon-tableau-de-bord': {
    titre: 'Mon tableau de bord',
    description: "Page d'accueil du profil : indicateurs personnels, alertes et raccourcis vers les tâches les plus fréquentes.",
    workflow: ['Lire les indicateurs et alertes', 'Ouvrir un raccourci', 'Traiter les éléments en attente'],
  },
  'tableau-de-bord': {
    titre: 'Tableau de bord',
    description: "Vue de pilotage opérationnel : volumes, échéances et activités récentes du périmètre du profil.",
    workflow: ['Choisir la période', 'Analyser les indicateurs', 'Accéder au détail d’un bloc'],
  },
  dashboard: {
    titre: 'Tableau de bord de pilotage',
    description: "Synthèse consolidée destinée au pilotage : effectifs, résultats, finances et alertes majeures.",
    workflow: ['Sélectionner l’année ou la période', 'Comparer les indicateurs', 'Exporter ou ouvrir le détail'],
  },
  'tableau-de-bord-du-superviseur': {
    titre: 'Tableau de bord du superviseur',
    description: "Vue transversale du superviseur général : avancement des cours, saisie des notes, absences et alertes pédagogiques.",
    workflow: ['Contrôler les indicateurs', 'Repérer les retards de saisie', 'Ouvrir l’écran concerné'],
  },
  'mon-profil': {
    titre: 'Mon profil',
    description: "Informations personnelles et professionnelles du compte connecté : identité, contacts et rattachements.",
    workflow: ['Vérifier ses informations', 'Mettre à jour les champs modifiables', 'Enregistrer'],
  },
  'mon-compte': {
    titre: 'Mon compte',
    description: "Paramètres de sécurité du compte : mot de passe, double authentification et sessions.",
    workflow: ['Changer le mot de passe', 'Activer ou vérifier le 2FA', 'Contrôler les sessions ouvertes'],
  },
  notifications: {
    titre: 'Notifications',
    description: "Centre de notifications de l’application : alertes métier, échéances et messages système.",
    workflow: ['Lire les notifications récentes', 'Marquer comme lues', 'Ouvrir l’élément concerné'],
  },
  discussions: {
    titre: 'Discussions',
    description: "Messagerie interne permettant d’échanger avec les autres acteurs de l’établissement.",
    workflow: ['Choisir une conversation', 'Rédiger et envoyer un message', 'Joindre un document si nécessaire'],
  },
  historique: {
    titre: 'Historique',
    description: "Journal chronologique des opérations réalisées sur le périmètre : date, acteur, action et résultat.",
    workflow: ['Filtrer par période ou acteur', 'Consulter le détail d’une opération', 'Exporter si besoin'],
  },
  rapports: {
    titre: 'Rapports',
    description: "Rapports et exports disponibles pour le profil, avec filtres de période et de périmètre.",
    workflow: ['Choisir un rapport', 'Renseigner les filtres', 'Générer puis télécharger'],
  },
  effectifs: {
    titre: 'Effectifs',
    description: "Effectifs par niveau, parcours ou classe, avec répartition et évolution.",
    workflow: ['Filtrer par année et niveau', 'Comparer les effectifs', 'Exporter la liste'],
  },
  'effectifs-inscrits': {
    titre: 'Effectifs inscrits',
    description: "Liste et statistiques des étudiants effectivement inscrits pour l’année ou la session sélectionnée.",
    workflow: ['Choisir l’année et le parcours', 'Vérifier les inscrits', 'Exporter ou ouvrir un dossier'],
  },
  calendrier: {
    titre: 'Calendrier',
    description: "Calendrier académique : sessions, examens, périodes de saisie et événements de l’établissement.",
    workflow: ['Choisir la période', 'Consulter un événement', 'S’abonner ou exporter le calendrier'],
  },
  annonces: {
    titre: 'Annonces',
    description: "Publication et consultation des annonces destinées aux étudiants, enseignants ou personnels.",
    workflow: ['Créer ou ouvrir une annonce', 'Choisir le public cible', 'Publier ou archiver'],
  },
  'vie-estudiantine': {
    titre: 'Vie estudiantine',
    description: "Actualités, activités et informations de la vie étudiante.",
    workflow: ['Parcourir les publications', 'Ouvrir une actualité', 'Participer ou réagir'],
  },
  suggestions: {
    titre: 'Suggestions',
    description: "Boîte à idées et suggestions d’amélioration adressées à l’administration.",
    workflow: ['Rédiger une suggestion', 'La soumettre', 'Suivre son traitement'],
  },
  reclamations: {
    titre: 'Réclamations',
    description: "Dépôt et suivi des réclamations (notes, scolarité, discipline, paiement).",
    workflow: ['Créer une réclamation', 'Joindre les pièces', 'Suivre le statut'],
  },
  'traiter-reclam': {
    titre: 'Traiter les réclamations',
    description: "File de traitement des réclamations : instruction, réponse et clôture.",
    workflow: ['Ouvrir une réclamation', 'Instruire le dossier', 'Répondre et clôturer'],
  },
  'recherche-avancee': {
    titre: 'Recherche avancée',
    description: "Recherche multi-critères dans les données du périmètre (étudiants, dossiers, documents, opérations).",
    workflow: ['Renseigner les critères', 'Lancer la recherche', 'Ouvrir un résultat'],
  },

  // ------------------------------------------------------- inscription/scolarité
  sessions: {
    titre: 'Sessions d’inscription',
    description: "Sessions d’inscription par année académique et niveau : période d’ouverture, pièces et frais associés.",
    workflow: ['Créer une session', 'Définir la période et les pièces', 'Ouvrir ou clôturer la session'],
  },
  parcours: {
    titre: 'Parcours',
    description: "Catalogue des parcours de formation : niveaux, UE, crédits et conditions d’accès.",
    workflow: ['Créer ou modifier un parcours', 'Rattacher les UE', 'Vérifier les prérequis'],
  },
  'salles-de-classe': {
    titre: 'Salles de classe',
    description: "Référentiel des salles et de leurs capacités, utilisé pour les emplois du temps et les examens.",
    workflow: ['Créer une salle', 'Renseigner la capacité', 'Affecter aux cours ou examens'],
  },
  'frais-par-parcours': {
    titre: 'Frais par parcours',
    description: "Grille des frais de scolarité par parcours, niveau et année académique.",
    workflow: ['Choisir le parcours', 'Définir les tranches et échéances', 'Enregistrer la grille'],
  },
  frais: {
    titre: 'Frais',
    description: "Référentiel des frais et de leurs règles de calcul (scolarité, services, examens).",
    workflow: ['Créer un type de frais', 'Associer les parcours concernés', 'Activer la facturation'],
  },
  demandes: {
    titre: 'Demandes',
    description: "File des demandes d’inscription ou de réinscription avec leur statut dans le pipeline.",
    workflow: ['Filtrer par statut', 'Ouvrir un dossier', 'Faire avancer l’étape'],
  },
  'demandes-orientation': {
    titre: "Demandes d'orientation",
    description: "Demandes d’orientation des candidats : choix de parcours, pièces et décision du comité.",
    workflow: ['Consulter les demandes', 'Vérifier les pièces', 'Instruire ou orienter'],
  },
  'parcours-orientation': {
    titre: "Parcours d'orientation",
    description: "Parcours proposés à l’orientation, avec leurs débouchés et conditions d’admission.",
    workflow: ['Consulter l’offre', 'Associer les niveaux', 'Publier les parcours'],
  },
  preinscriptions: {
    titre: 'Préinscriptions',
    description: "Préinscriptions reçues : contrôle des informations, des pièces et des vœux du candidat.",
    workflow: ['Ouvrir une préinscription', 'Contrôler le dossier', 'Valider ou demander une correction'],
  },
  'validation-comite': {
    titre: 'Validation comité',
    description: "Séance de validation collégiale : chaque membre examine, vote et signe la décision.",
    workflow: ['Examiner les dossiers à l’ordre du jour', 'Voter', 'Signer la décision'],
  },
  'campagne-de-bourses': {
    titre: 'Campagne de bourses',
    description: "Campagne d’attribution des bourses : critères, candidats et décisions.",
    workflow: ['Ouvrir la campagne', 'Examiner les candidatures', 'Attribuer ou refuser'],
  },
  configurations: {
    titre: 'Configurations',
    description: "Paramétrage du module : règles, barèmes et options appliquées aux dossiers.",
    workflow: ['Choisir la configuration', 'Modifier les paramètres', 'Enregistrer et tester'],
  },
  attributions: {
    titre: 'Attributions',
    description: "Attribution des droits, responsabilités ou avantages aux personnes concernées.",
    workflow: ['Rechercher la personne', 'Choisir l’attribution', 'Valider la période'],
  },
  'mes-bordereaux': {
    titre: 'Mes bordereaux',
    description: "Bordereaux déposés par l’étudiant (ou suivis par le profil) avec leur état d’authentification et d’imputation.",
    workflow: ['Déposer ou consulter un bordereau', 'Suivre son statut', 'Télécharger le reçu'],
  },
  'mon-dossier': {
    titre: 'Mon dossier',
    description: "Dossier administratif de l’étudiant : identité, pièces, inscriptions et suivi.",
    workflow: ['Vérifier les informations', 'Compléter une pièce manquante', 'Suivre la validation'],
  },
  reorientation: {
    titre: 'Réorientation',
    description: "Demandes de réorientation vers un autre parcours ou niveau.",
    workflow: ['Créer une demande', 'Joindre les motifs', 'Suivre la décision'],
  },
  'dossiers-etudiants': {
    titre: 'Dossiers étudiants',
    description: "Base des dossiers étudiants : recherche, complétude et historique administratif.",
    workflow: ['Rechercher un étudiant', 'Contrôler les pièces', 'Ouvrir le dossier complet'],
  },
  dossiers: {
    titre: 'Dossiers',
    description: "Vue des dossiers à traiter ou récemment modifiés, avec leur état d’avancement.",
    workflow: ['Filtrer les dossiers', 'Ouvrir un dossier', 'Appliquer l’action attendue'],
  },
  'cartes-etudiantes': {
    titre: 'Cartes étudiantes',
    description: "Génération et suivi des cartes étudiantes avec photo, matricule et QR code.",
    workflow: ['Sélectionner les étudiants', 'Vérifier la photo', 'Générer ou imprimer les cartes'],
  },
  registres: {
    titre: 'Registres',
    description: "Registres officiels : inscriptions, présences, délibérations et registres réglementaires.",
    workflow: ['Choisir le registre', 'Filtrer par année', 'Consulter ou exporter'],
  },
  'arborescence-dossiers': {
    titre: 'Arborescence des dossiers',
    description: "Classement hiérarchique des dossiers et documents (étudiant, promotion, année).",
    workflow: ['Parcourir l’arborescence', 'Ouvrir un dossier', 'Déplacer ou archiver'],
  },
  televerser: {
    titre: 'Téléverser un document',
    description: "Dépôt d’un document dans un dossier ou une demande, avec contrôle du format et de la taille.",
    workflow: ['Choisir le fichier', 'Contrôler le document', 'Valider le dépôt'],
  },
  'demandes-vae': {
    titre: 'Demandes VAE',
    description: "Demandes de validation des acquis de l’expérience : pièces, expertise et décision.",
    workflow: ['Déposer une demande', 'Fournir le dossier d’expérience', 'Suivre l’instruction'],
  },
  diplomes: {
    titre: 'Diplômes',
    description: "Diplômes obtenus, impressions et vérification d’authenticité.",
    workflow: ['Rechercher un diplômé', 'Consulter le diplôme', 'Générer ou vérifier'],
  },
  'demandes-docs': {
    titre: 'Demandes de documents',
    description: "Demandes de documents administratifs (attestation, relevé, certificat) et leur traitement.",
    workflow: ['Créer ou ouvrir une demande', 'Vérifier les pièces', 'Générer le document'],
  },
  'mes-documents': {
    titre: 'Mes documents',
    description: "Documents personnels disponibles : attestations, relevés, certificats et documents déposés.",
    workflow: ['Parcourir la liste', 'Ouvrir un document', 'Télécharger'],
  },
  'tous-les-documents': {
    titre: 'Tous les documents',
    description: "Vue transversale des documents produits ou déposés, avec filtres et recherche.",
    workflow: ['Filtrer par type ou étudiant', 'Ouvrir un document', 'Contrôler ou télécharger'],
  },
  'types-de-documents': {
    titre: 'Types de documents',
    description: "Référentiel des modèles de documents et de leurs règles de génération.",
    workflow: ['Créer un type', 'Associer le modèle', 'Définir les champs obligatoires'],
  },
  'traiter-demandes': {
    titre: 'Traiter les demandes',
    description: "File de traitement des demandes de documents : vérification, validation et génération.",
    workflow: ['Ouvrir une demande', 'Contrôler les conditions', 'Valider et générer'],
  },
  generer: {
    titre: 'Générer un document',
    description: "Assistant de génération d’un document officiel à partir d’un modèle et des données du dossier.",
    workflow: ['Choisir le modèle', 'Vérifier les champs préremplis', 'Générer et archiver'],
  },
  modeles: {
    titre: 'Modèles de documents',
    description: "Gestion des modèles (contenu, variables, mise en page) utilisés pour les documents officiels.",
    workflow: ['Créer ou importer un modèle', 'Insérer les variables', 'Publier la version'],
  },
  workflows: {
    titre: 'Workflows documentaires',
    description: "Circuits de validation des documents : étapes, acteurs et conditions de passage.",
    workflow: ['Choisir un workflow', 'Définir les étapes', 'Activer le circuit'],
  },
  signatures: {
    titre: 'Signatures',
    description: "Signatures électroniques apposées sur les documents et suivi de leur validité.",
    workflow: ['Ouvrir un document à signer', 'Contrôler le contenu', 'Signer électroniquement'],
  },
  'signature-direction': {
    titre: 'Signature direction',
    description: "File des documents en attente de signature de la direction.",
    workflow: ['Examiner le document', 'Vérifier les pièces', 'Signer ou renvoyer'],
  },
  'cachet-electronique': {
    titre: 'Cachet électronique',
    description: "Configuration et apposition du cachet électronique de l’établissement.",
    workflow: ['Choisir le cachet', 'Vérifier le document', 'Apposer le cachet'],
  },
  'qr-codes': {
    titre: 'QR codes',
    description: "Génération et vérification des QR codes (cartes, badges, documents).",
    workflow: ['Sélectionner les éléments', 'Générer les QR codes', 'Imprimer ou télécharger'],
  },
  'annee-scol': {
    titre: 'Année scolaire',
    description: "Année académique de référence : dates de début et de fin, statut actif et rattachement des données.",
    workflow: ['Créer ou sélectionner l’année', 'Définir les dates et le statut', 'Rattacher les sessions et référentiels'],
  },
  ecole: {
    titre: 'École',
    description: "Fiche de l’établissement : identité, coordonnées, logo et informations officielles.",
    workflow: ['Renseigner l’identité', 'Mettre à jour les coordonnées', 'Enregistrer les paramètres'],
  },
  validations: {
    titre: 'Validations',
    description: "File des éléments en attente de validation (opérations, documents, dossiers).",
    workflow: ['Filtrer les demandes en attente', 'Examiner chaque élément', 'Valider ou renvoyer'],
  },
  rh: {
    titre: 'Ressources humaines',
    description: "Accès au module RH : effectifs, contrats, paie et indicateurs du personnel.",
    workflow: ['Choisir le sous-module', 'Consulter les indicateurs', 'Traiter les échéances'],
  },
  bibliotheque: {
    titre: 'Bibliothèque',
    description: "Catalogue des ouvrages disponibles, avec recherche et consultation des fiches.",
    workflow: ['Rechercher un ouvrage', 'Consulter la fiche et la disponibilité', 'Réserver ou emprunter'],
  },
  'gestion-bibliotheque': {
    titre: 'Gestion de la bibliothèque',
    description: "Administration du fonds documentaire : ouvrages, exemplaires, prêts et retours.",
    workflow: ['Ajouter un ouvrage', 'Gérer les exemplaires', 'Suivre les prêts et retards'],
  },
  'demandes-de-documents': {
    titre: 'Demandes de documents',
    description: "Demandes de documents à traiter par le service concerné, avec pièces et statut.",
    workflow: ['Ouvrir une demande', 'Vérifier les pièces et conditions', 'Valider ou générer le document'],
  },
  'designation-directeur-memoire': {
    titre: 'Désignation du directeur de mémoire',
    description: "Affectation des directeurs de mémoire aux étudiants et suivi des encadrements.",
    workflow: ['Choisir les étudiants', 'Proposer un directeur', 'Valider l’affectation'],
  },
  'membres-du-comite': {
    titre: 'Membres du comité',
    description: "Composition du comité : membres, rôles et droits de vote.",
    workflow: ['Ajouter un membre', 'Définir son rôle', 'Activer ou retirer'],
  },
  'profils-dacces': {
    titre: "Profils d'accès",
    description: "Profils et matrice des habilitations : menus et actions autorisés par rôle.",
    workflow: ['Choisir un profil', 'Cocher les permissions', 'Appliquer immédiatement'],
  },
  utilisateurs: {
    titre: 'Utilisateurs',
    description: "Comptes utilisateurs : création, rôle, activation, blocage et réinitialisation.",
    workflow: ['Créer ou rechercher un compte', 'Attribuer le rôle', 'Activer ou bloquer'],
  },
  configuration: {
    titre: 'Configuration',
    description: "Paramètres généraux de l’application : établissement, année, notifications et options.",
    workflow: ['Choisir une section', 'Modifier les valeurs', 'Enregistrer'],
  },
  systeme: {
    titre: 'Système',
    description: "État technique du système : services, files d’attente, tâches planifiées et versions.",
    workflow: ['Contrôler les services', 'Consulter les journaux', 'Relancer une tâche si nécessaire'],
  },
  sauvegardes: {
    titre: 'Sauvegardes',
    description: "Sauvegardes de la base et des documents : planification, exécution et restauration.",
    workflow: ['Lancer une sauvegarde', 'Vérifier l’intégrité', 'Télécharger ou restaurer'],
  },
  'journal-audit': {
    titre: "Journal d'audit",
    description: "Journal horodaté des actions sensibles : acteur, action, entité, ancienne et nouvelle valeur.",
    workflow: ['Filtrer par acteur ou période', 'Ouvrir une trace', 'Exporter le journal'],
  },
  audits: {
    titre: 'Audits',
    description: "Campagnes d’audit interne : périmètre, contrôles réalisés, constats et plans d’action.",
    workflow: ['Créer une campagne', 'Réaliser les contrôles', 'Consigner les constats'],
  },
  'audit-notes': {
    titre: 'Audit des notes',
    description: "Historique des modifications de notes : ancienne valeur, nouvelle valeur, auteur et date.",
    workflow: ['Filtrer par classe ou période', 'Comparer les valeurs', 'Signaler une anomalie'],
  },
  'non-conformites': {
    titre: 'Non-conformités',
    description: "Déclaration et traitement des non-conformités qualité avec actions correctives.",
    workflow: ['Déclarer une non-conformité', 'Analyser la cause', 'Suivre l’action corrective'],
  },
  'revues-direction': {
    titre: 'Revues de direction',
    description: "Préparation et suivi des revues de direction : ordre du jour, décisions et actions.",
    workflow: ['Préparer la revue', 'Consigner les décisions', 'Suivre les actions'],
  },
  'enquetes-satisfaction': {
    titre: 'Enquêtes de satisfaction',
    description: "Enquêtes de satisfaction des étudiants et personnels : diffusion, réponses et résultats.",
    workflow: ['Créer l’enquête', 'Diffuser', 'Analyser les résultats'],
  },
  conservation: {
    titre: 'Conservation',
    description: "Règles de conservation et de durée de vie des documents d’archives.",
    workflow: ['Définir les durées', 'Appliquer aux catégories', 'Programmer l’élimination'],
  },
  'cycle-de-vie': {
    titre: 'Cycle de vie',
    description: "Étapes de vie d’un document ou dossier : actif, intermédiaire, archivage, élimination.",
    workflow: ['Vérifier l’étape', 'Programmer la transition', 'Valider l’opération'],
  },
  transferts: {
    titre: 'Transferts',
    description: "Transferts de dossiers entre services, sites ou archives.",
    workflow: ['Sélectionner les dossiers', 'Choisir la destination', 'Valider le transfert'],
  },
  corrections: {
    titre: 'Corrections',
    description: "Corrections et régularisations autorisées sur les données ou les opérations.",
    workflow: ['Rechercher l’élément', 'Saisir le motif', 'Appliquer la correction'],
  },

  // ------------------------------------------------------------- finances
  paiements: {
    titre: 'Paiements',
    description: "Paiements des étudiants : saisie, recherche, historique et rattachement aux échéances.",
    workflow: ['Rechercher un étudiant ou un paiement', 'Vérifier le montant et la référence', 'Enregistrer ou consulter le reçu'],
  },
  echeances: {
    titre: 'Échéances',
    description: "Échéancier des frais par étudiant : montants dus, dates limites et statuts.",
    workflow: ['Choisir un étudiant ou une période', 'Contrôler les échéances', 'Marquer un paiement ou une relance'],
  },
  'situation-irreguliere': {
    titre: 'Situation irrégulière',
    description: "Étudiants en retard ou en défaut de paiement, avec motif et ancienneté de la dette.",
    workflow: ['Filtrer les impayés', 'Analyser l’historique', 'Lancer une relance ou une régularisation'],
  },
  'situation-financiere': {
    titre: 'Situation financière',
    description: "Situation détaillée d’un étudiant : total dû, total payé, reste à payer et échéances.",
    workflow: ['Rechercher l’étudiant', 'Lire le solde et l’historique', 'Exporter la situation'],
  },
  'valid-bordereaux': {
    titre: 'Validation des bordereaux',
    description: "Authentification des bordereaux déposés : contrôle du justificatif et saisie des références bancaires.",
    workflow: ['Ouvrir le bordereau', 'Vérifier le PDF et les références', 'Valider ou rejeter avec motif'],
  },
  bordereaux: {
    titre: 'Bordereaux',
    description: "Vue des bordereaux de paiement et de leur statut dans le circuit de validation.",
    workflow: ['Filtrer par statut', 'Ouvrir un bordereau', 'Suivre son traitement'],
  },
  'bordereaux-a-imputer': {
    titre: 'Bordereaux à imputer',
    description: "Bordereaux authentifiés en attente d’imputation comptable sur les échéances.",
    workflow: ['Ouvrir un bordereau validé', 'Saisir le montant constaté', 'Imputer et transmettre'],
  },
  'bordereaux-en-attente': {
    titre: 'Bordereaux en attente',
    description: "Bordereaux en cours d’instruction, en attente d’une pièce ou d’une validation.",
    workflow: ['Identifier le motif d’attente', 'Compléter ou relancer', 'Réorienter le dossier'],
  },
  'bordereaux-traites': {
    titre: 'Bordereaux traités',
    description: "Bordereaux totalement traités et imputés, consultables pour contrôle.",
    workflow: ['Filtrer par période', 'Contrôler l’imputation', 'Exporter le journal'],
  },
  'bordereaux-rejetes': {
    titre: 'Bordereaux rejetés',
    description: "Bordereaux rejetés avec motif, à corriger par l’étudiant ou le service concerné.",
    workflow: ['Consulter le motif', 'Notifier l’étudiant', 'Suivre la nouvelle soumission'],
  },
  'types-de-bordereau': {
    titre: 'Types de bordereau',
    description: "Référentiel des types de bordereaux et des imputations associées.",
    workflow: ['Créer un type', 'Associer les frais', 'Activer'],
  },
  encaissement: {
    titre: 'Encaissement',
    description: "Encaissement au guichet : identification de l’étudiant, montant, mode de paiement et reçu.",
    workflow: ['Rechercher l’étudiant', 'Saisir le paiement', 'Imprimer le reçu'],
  },
  caisse: {
    titre: 'Caisse',
    description: "État de la caisse du jour : fonds, encaissements, décaissements et solde.",
    workflow: ['Ouvrir la caisse', 'Enregistrer les opérations', 'Contrôler le solde'],
  },
  'cloture-caisse': {
    titre: 'Clôture de caisse',
    description: "Clôture journalière : comptage, écart éventuel et validation de la caisse.",
    workflow: ['Compter les espèces', 'Saisir le montant', 'Valider la clôture'],
  },
  'journal-caisse': {
    titre: 'Journal de caisse',
    description: "Détail chronologique des mouvements de caisse avec justificatifs et soldes.",
    workflow: ['Choisir la date', 'Contrôler les mouvements', 'Exporter le journal'],
  },
  'autorisations-provisoires': {
    titre: 'Autorisations provisoires',
    description: "Autorisations accordées en attente de régularisation (accès aux cours, examens ou documents).",
    workflow: ['Créer une autorisation', 'Fixer l’échéance', 'Suivre la régularisation'],
  },
  comptabilite: {
    titre: 'Comptabilité',
    description: "Comptabilité générale : journaux, écritures, balance et grand livre.",
    workflow: ['Choisir le journal', 'Consulter ou saisir une écriture', 'Contrôler la balance'],
  },
  articles: {
    titre: 'Articles',
    description: "Référentiel des articles et prestations utilisés dans les achats et la comptabilité.",
    workflow: ['Créer un article', 'Renseigner l’unité et le prix', 'Activer'],
  },
  mouvements: {
    titre: 'Mouvements',
    description: "Mouvements de stocks ou de trésorerie : entrées, sorties et soldes.",
    workflow: ['Filtrer les mouvements', 'Ouvrir un mouvement', 'Contrôler le justificatif'],
  },
  immobilisations: {
    titre: 'Immobilisations',
    description: "Registre des immobilisations : acquisition, amortissement et valeur nette.",
    workflow: ['Créer une immobilisation', 'Paramétrer l’amortissement', 'Suivre la valeur nette'],
  },
  sites: {
    titre: 'Sites',
    description: "Sites et établissements rattachés, avec leur adresse et leur responsable.",
    workflow: ['Créer un site', 'Renseigner l’adresse', 'Activer'],
  },
  categories: {
    titre: 'Catégories',
    description: "Catégories d’articles, de documents ou d’immobilisations utilisées dans les référentiels.",
    workflow: ['Créer une catégorie', 'Définir les règles associées', 'Enregistrer'],
  },
  affectations: {
    titre: 'Affectations',
    description: "Affectation des biens, salles ou moyens aux personnes et services.",
    workflow: ['Choisir le bien', 'Sélectionner le bénéficiaire', 'Valider l’affectation'],
  },
  assurances: {
    titre: 'Assurances',
    description: "Contrats d’assurance des biens : police, échéances et sinistres.",
    workflow: ['Créer un contrat', 'Renseigner les échéances', 'Suivre les sinistres'],
  },
  'sorties-provisoires': {
    titre: 'Sorties provisoires',
    description: "Biens sortis temporairement avec date de retour et responsable.",
    workflow: ['Enregistrer une sortie', 'Fixer la date de retour', 'Contrôler le retour'],
  },
  cessions: {
    titre: 'Cessions',
    description: "Cessions de biens : motif, valorisation et validation.",
    workflow: ['Sélectionner le bien', 'Renseigner la cession', 'Valider'],
  },
  rebuts: {
    titre: 'Rebuts',
    description: "Biens mis au rebut avec motif, procès-verbal et sortie d’inventaire.",
    workflow: ['Sélectionner les biens', 'Renseigner le motif', 'Valider la mise au rebut'],
  },
  maintenance: {
    titre: 'Maintenance',
    description: "Interventions de maintenance préventive et curative sur les biens.",
    workflow: ['Créer une demande', 'Planifier l’intervention', 'Clôturer avec le rapport'],
  },
  inventaires: {
    titre: 'Inventaires',
    description: "Campagnes d’inventaire physique et rapprochement avec le registre comptable.",
    workflow: ['Lancer une campagne', 'Saisir les constats', 'Générer les écarts'],
  },
  reportings: {
    titre: 'Reportings',
    description: "Tableaux de bord et rapports financiers consolidés.",
    workflow: ['Choisir le rapport', 'Filtrer la période', 'Exporter'],
  },
  'comptes-bancaires': {
    titre: 'Comptes bancaires',
    description: "Comptes bancaires de l’établissement et leurs paramètres.",
    workflow: ['Créer un compte', 'Renseigner les coordonnées', 'Activer'],
  },
  'releves-bancaires': {
    titre: 'Relevés bancaires',
    description: "Import et consultation des relevés bancaires en vue du rapprochement.",
    workflow: ['Importer un relevé', 'Contrôler les lignes', 'Lancer le rapprochement'],
  },
  rapprochement: {
    titre: 'Rapprochement bancaire',
    description: "Rapprochement entre les écritures comptables et les opérations bancaires.",
    workflow: ['Sélectionner le compte et la période', 'Pointer les opérations', 'Valider les écarts'],
  },
  budgets: {
    titre: 'Budgets',
    description: "Préparation, suivi et exécution budgétaire par service ou projet.",
    workflow: ['Créer un budget', 'Saisir les lignes', 'Suivre l’exécution'],
  },
  factures: {
    titre: 'Factures',
    description: "Factures fournisseurs : réception, contrôle et mise en paiement.",
    workflow: ['Enregistrer une facture', 'Contrôler les pièces', 'Valider le paiement'],
  },
  fournisseurs: {
    titre: 'Fournisseurs',
    description: "Référentiel des fournisseurs et de leurs coordonnées.",
    workflow: ['Créer un fournisseur', 'Renseigner les coordonnées', 'Activer'],
  },
  commandes: {
    titre: 'Commandes',
    description: "Commandes d’achat : création, suivi de livraison et réception.",
    workflow: ['Créer une commande', 'Suivre la livraison', 'Réceptionner'],
  },
  'demandes-achat': {
    titre: "Demandes d'achat",
    description: "Demandes d’achat émises par les services et leur circuit de validation.",
    workflow: ['Créer une demande', 'Faire valider', 'Transformer en commande'],
  },
  receptions: {
    titre: 'Réceptions',
    description: "Réception des biens et services commandés, avec contrôle de conformité.",
    workflow: ['Ouvrir la commande', 'Contrôler les quantités', 'Valider la réception'],
  },
  besoins: {
    titre: 'Besoins',
    description: "Expression des besoins des services en biens et services.",
    workflow: ['Décrire le besoin', 'Estimer le coût', 'Transmettre pour validation'],
  },
  'demandes-de-prix': {
    titre: 'Demandes de prix',
    description: "Consultation des fournisseurs et comparaison des offres.",
    workflow: ['Créer la demande', 'Envoyer aux fournisseurs', 'Comparer et retenir'],
  },
  'appels-d-offres': {
    titre: "Appels d'offres",
    description: "Procédures d’appel d’offres : publication, réception des plis et attribution.",
    workflow: ['Publier l’appel', 'Recevoir les offres', 'Évaluer et attribuer'],
  },
  avenants: {
    titre: 'Avenants',
    description: "Avenants aux marchés et contrats : motifs, montants et validation.",
    workflow: ['Créer un avenant', 'Renseigner les modifications', 'Valider'],
  },
  ami: {
    titre: 'Avis à manifestation d’intérêt',
    description: "Publication et traitement des avis à manifestation d’intérêt.",
    workflow: ['Publier l’avis', 'Recevoir les manifestations', 'Présélectionner'],
  },
  prestations: {
    titre: 'Prestations',
    description: "Prestations réalisées par les fournisseurs ou prestataires, avec suivi et facturation.",
    workflow: ['Créer une prestation', 'Suivre l’exécution', 'Facturer'],
  },
  planifications: {
    titre: 'Planifications',
    description: "Planification des marchés et des actions d’achat sur l’année.",
    workflow: ['Créer une planification', 'Associer les besoins', 'Suivre l’avancement'],
  },

  // ----------------------------------------------------------- pédagogie
  enseignants: {
    titre: 'Enseignants',
    description: "Référentiel des enseignants : profil, spécialités, affectations et badge de pointage.",
    workflow: ['Créer ou modifier un enseignant', 'Affecter aux cours', 'Générer le badge'],
  },
  'unites-d-enseignements': {
    titre: "Unités d'enseignement",
    description: "UE et ECUE : crédits, volumes horaires, semestres et prérequis.",
    workflow: ['Créer une UE', 'Ajouter les ECUE', 'Définir crédits et prérequis'],
  },
  'cahiers-de-texte': {
    titre: 'Cahiers de texte',
    description: "Contenu des séances : objectifs, activités, devoirs et ressources.",
    workflow: ['Choisir la classe et la séance', 'Renseigner le contenu', 'Publier pour les étudiants'],
  },
  'cahier-de-presence': {
    titre: 'Cahier de présence',
    description: "Appel et suivi des présences par séance, avec motif d’absence.",
    workflow: ['Ouvrir la séance', 'Marquer les présents et absents', 'Enregistrer'],
  },
  notes: {
    titre: 'Notes',
    description: "Saisie et consultation des notes par classe, UE et type d’évaluation.",
    workflow: ['Choisir la classe et l’UE', 'Saisir les notes', 'Vérifier puis publier'],
  },
  evaluations: {
    titre: 'Évaluations',
    description: "Types et campagnes d’évaluation : devoirs, contrôles, examens et coefficients.",
    workflow: ['Créer une évaluation', 'Définir la date et le coefficient', 'Saisir les notes'],
  },
  bulletins: {
    titre: 'Bulletins',
    description: "Bulletins générés à partir des notes : moyennes, crédits, mentions et décisions.",
    workflow: ['Choisir l’année et la classe', 'Générer les bulletins', 'Contrôler et publier'],
  },
  moyennes: {
    titre: 'Moyennes',
    description: "Calcul et contrôle des moyennes par étudiant, UE et semestre.",
    workflow: ['Sélectionner le périmètre', 'Lancer le calcul', 'Contrôler les anomalies'],
  },
  'deliberations-jury': {
    titre: 'Délibérations & jury',
    description: "Séances de jury : décisions d’admission, de passage ou de redoublement.",
    workflow: ['Préparer la séance', 'Examiner les cas', 'Consigner les décisions'],
  },
  absences: {
    titre: 'Absences',
    description: "Suivi des absences et justificatifs, avec alertes et statistiques.",
    workflow: ['Filtrer les absences', 'Vérifier un justificatif', 'Valider ou sanctionner'],
  },
  'conseils-classe': {
    titre: 'Conseils de classe',
    description: "Préparation et tenue des conseils de classe : synthèse par étudiant et avis.",
    workflow: ['Choisir la classe', 'Consulter les synthèses', 'Saisir les avis'],
  },
  'sanctions-discipline': {
    titre: 'Sanctions & discipline',
    description: "Procédures disciplinaires : faits, convocation, décision et suivi.",
    workflow: ['Ouvrir un dossier', 'Consigner les faits', 'Notifier la décision'],
  },
  rattrapages: {
    titre: 'Rattrapages',
    description: "Sessions de rattrapage : inscription, épreuves et résultats.",
    workflow: ['Créer une session', 'Inscrire les étudiants', 'Saisir les résultats'],
  },
  'sessions-examens': {
    titre: "Sessions d'examens",
    description: "Programmation des examens : dates, salles, surveillants et épreuves.",
    workflow: ['Créer une session', 'Affecter salles et surveillants', 'Publier le planning'],
  },
  'decisions-passage': {
    titre: 'Décisions de passage',
    description: "Décisions de passage en année supérieure ou de redoublement.",
    workflow: ['Préparer les propositions', 'Valider en jury', 'Notifier les étudiants'],
  },
  'parametres-notation': {
    titre: 'Paramètres de notation',
    description: "Règles de calcul : coefficients, compensation, crédits et seuils de validation.",
    workflow: ['Choisir le niveau', 'Définir les règles', 'Enregistrer'],
  },
  equivalences: {
    titre: 'Équivalences',
    description: "Reconnaissance d’UE ou de crédits obtenus ailleurs.",
    workflow: ['Créer une demande', 'Joindre les justificatifs', 'Valider l’équivalence'],
  },
  dispenses: {
    titre: 'Dispenses',
    description: "Dispenses d’assiduité ou d’épreuve accordées à un étudiant.",
    workflow: ['Choisir l’étudiant', 'Renseigner le motif', 'Valider la dispense'],
  },
  'emplois-du-temps': {
    titre: 'Emplois du temps',
    description: "Planning des cours par classe, enseignant et salle.",
    workflow: ['Choisir la classe ou l’enseignant', 'Consulter le planning', 'Détecter les conflits'],
  },
  shifts: {
    titre: 'Shifts',
    description: "Plages horaires de travail utilisées pour le pointage et les plannings.",
    workflow: ['Créer un shift', 'Définir les horaires', 'Activer'],
  },
  planning: {
    titre: 'Planning',
    description: "Planning hebdomadaire des activités ou du personnel.",
    workflow: ['Choisir la semaine', 'Consulter les affectations', 'Ajuster si nécessaire'],
  },
  'planning-personnel': {
    titre: 'Planning du personnel',
    description: "Affectation hebdomadaire des personnels : poste, tâche et horaires.",
    workflow: ['Choisir la semaine', 'Affecter les personnels', 'Publier le planning'],
  },
  terminal: {
    titre: 'Terminal de pointage',
    description: "Pointage des arrivées et départs par QR code ou matricule, avec contrôle de l’identité.",
    workflow: ['Scanner le QR ou saisir le matricule', 'Vérifier l’identité', 'Pointer l’arrivée ou le départ'],
  },

  // ------------------------------------------------------ ressources humaines
  employes: {
    titre: 'Employés',
    description: "Référentiel du personnel : identité, poste, contrat et affectation.",
    workflow: ['Créer ou modifier un employé', 'Renseigner le poste', 'Activer le compte'],
  },
  paie: {
    titre: 'Paie',
    description: "Préparation et exécution de la paie : éléments variables, bulletins et virements.",
    workflow: ['Choisir la période', 'Contrôler les éléments variables', 'Calculer et valider la paie'],
  },
  contrats: {
    titre: 'Contrats',
    description: "Contrats de travail : type, durée, rémunération et avenants.",
    workflow: ['Créer un contrat', 'Renseigner les clauses', 'Suivre les échéances'],
  },
  'heures-supplementaires': {
    titre: 'Heures supplémentaires',
    description: "Saisie et validation des heures supplémentaires effectuées.",
    workflow: ['Saisir les heures', 'Faire valider par le responsable', 'Intégrer à la paie'],
  },
  'prets-avances': {
    titre: 'Prêts et avances',
    description: "Prêts et avances accordés au personnel, avec échéancier de remboursement.",
    workflow: ['Créer une demande', 'Valider le montant', 'Suivre les retenues'],
  },
  prestataires: {
    titre: 'Prestataires',
    description: "Prestataires externes et suivi de leurs interventions.",
    workflow: ['Créer un prestataire', 'Renseigner les coordonnées', 'Suivre les prestations'],
  },
  'indemnites-prestataires': {
    titre: 'Indemnités prestataires',
    description: "Calcul et paiement des indemnités dues aux prestataires.",
    workflow: ['Sélectionner les prestations', 'Calculer les indemnités', 'Valider le paiement'],
  },
  'parametres-paie': {
    titre: 'Paramètres de paie',
    description: "Règles de calcul de la paie : cotisations, primes et retenues.",
    workflow: ['Choisir le paramètre', 'Modifier la valeur', 'Enregistrer'],
  },
  'categories-professionnelles': {
    titre: 'Catégories professionnelles',
    description: "Catégories et échelons du personnel utilisés pour la paie.",
    workflow: ['Créer une catégorie', 'Définir les échelons', 'Associer les employés'],
  },
  'grilles-salariales': {
    titre: 'Grilles salariales',
    description: "Grilles de salaires par catégorie, échelon et ancienneté.",
    workflow: ['Choisir la catégorie', 'Renseigner les montants', 'Publier la grille'],
  },
  'reportings-rh': {
    titre: 'Reportings RH',
    description: "Indicateurs RH : effectifs, masse salariale, absences et turnover.",
    workflow: ['Choisir la période', 'Analyser les indicateurs', 'Exporter'],
  },
  'demandes-de-conge': {
    titre: 'Demandes de congé',
    description: "Demandes de congé du personnel et leur circuit de validation.",
    workflow: ['Créer une demande', 'Faire valider', 'Mettre à jour le solde'],
  },
  'soldes-de-conge': {
    titre: 'Soldes de congé',
    description: "Soldes de congés par employé et par période.",
    workflow: ['Rechercher un employé', 'Consulter le solde', 'Ajuster si nécessaire'],
  },
  'offres-d-emploi': {
    titre: "Offres d'emploi",
    description: "Publication et suivi des offres de recrutement.",
    workflow: ['Créer une offre', 'Publier', 'Suivre les candidatures'],
  },
  formations: {
    titre: 'Formations',
    description: "Plan de formation du personnel : sessions, participants et évaluation.",
    workflow: ['Créer une formation', 'Inscrire les participants', 'Évaluer'],
  },
  candidatures: {
    titre: 'Candidatures',
    description: "Réception et traitement des candidatures aux offres d’emploi.",
    workflow: ['Examiner les CV', 'Présélectionner', 'Planifier les entretiens'],
  },

  // -------------------------------------------------------------- e-learning
  'catalogue-e-learning': {
    titre: 'Catalogue e-learning',
    description: "Cours en ligne publiés pour l’année et le niveau de l’apprenant, avec crédits et tarif.",
    workflow: ['Parcourir le catalogue', 'Vérifier les prérequis', 'Choisir une UE'],
  },
  'gestion-e-learning': {
    titre: 'Gestion e-learning',
    description: "Administration des cours en ligne : création, publication et suivi des inscriptions.",
    workflow: ['Créer un cours', 'Publier', 'Suivre les sélections et la progression'],
  },
  'mes-cours': {
    titre: 'Mes cours',
    description: "Cours en ligne accessibles à l’apprenant après validation du paiement.",
    workflow: ['Ouvrir un cours', 'Suivre les supports', 'Suivre sa progression'],
  },
  'cours-videos': {
    titre: 'Cours vidéo',
    description: "Supports vidéo des cours en ligne avec suivi de visionnage.",
    workflow: ['Choisir une vidéo', 'La visionner', 'Marquer comme terminée'],
  },
  'cours-pdf': {
    titre: 'Cours PDF',
    description: "Supports PDF des cours en ligne, consultables ou téléchargeables selon les droits.",
    workflow: ['Choisir un support', 'Le consulter', 'Marquer comme terminé'],
  },
  quiz: {
    titre: 'Quiz',
    description: "Quiz d’évaluation des connaissances avec score et correction.",
    workflow: ['Démarrer le quiz', 'Répondre aux questions', 'Consulter le résultat'],
  },
  progression: {
    titre: 'Progression',
    description: "Avancement de l’apprenant dans les supports et activités d’un cours.",
    workflow: ['Choisir un cours', 'Consulter le taux d’avancement', 'Reprendre les supports restants'],
  },
  certificats: {
    titre: 'Certificats',
    description: "Certificats de réussite ou d’assiduité délivrés après validation d’un parcours.",
    workflow: ['Vérifier les conditions', 'Générer le certificat', 'Télécharger ou vérifier'],
  },
  devoirs: {
    titre: 'Devoirs',
    description: "Devoirs par semestre : énoncé, date limite, dépôt de la copie et correction.",
    workflow: ['Ouvrir un devoir', 'Déposer la copie', 'Consulter la note et la correction'],
  },
  catalogue: {
    titre: 'Catalogue',
    description: "Catalogue général des formations, cours et ressources disponibles.",
    workflow: ['Rechercher une formation', 'Consulter la fiche', 'S’inscrire ou contacter'],
  },

  // ------------------------------------------------------------------ stages
  'offres-stage': {
    titre: 'Offres de stage',
    description: "Offres de stage publiées par les entreprises partenaires.",
    workflow: ['Parcourir les offres', 'Consulter le détail', 'Postuler'],
  },
  'demandes-stage': {
    titre: 'Demandes de stage',
    description: "Demandes et conventions de stage des étudiants.",
    workflow: ['Créer une demande', 'Joindre la convention', 'Suivre la validation'],
  },
  entreprises: {
    titre: 'Entreprises',
    description: "Référentiel des entreprises partenaires et des contacts.",
    workflow: ['Créer une entreprise', 'Renseigner les contacts', 'Associer les offres'],
  },
};

module.exports = { ECRANS };
