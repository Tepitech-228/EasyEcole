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
    workflow: ['Rechercher un cours existant', 'Ouvrir ou créer son cahier', 'Ajouter les blocs des séances réellement dispensées'],
  },
  'cahier-texte-exemple': {
    titre: 'Cahiers de texte — exemple fictif',
    description: "Illustration de la liste des cahiers associés à des cours existants. Les noms, classes et codes affichés sont fictifs.",
    workflow: ['Filtrer par niveau, classe ou parcours', 'Rechercher le cours déjà attribué', 'Ouvrir le cahier concerné'],
  },
  'cahier-texte-nouveau-exemple': {
    titre: 'Nouveau cahier de texte — formulaire fictif',
    description: "Illustration du formulaire qui rattache un cahier à un cours déjà existant, avec l’enseignant et une description facultative.",
    workflow: ['Choisir parmi les cours', 'Sélectionner le cours attribué', 'Vérifier l’enseignant avant d’enregistrer'],
  },
  'cahier-texte-detail-exemple': {
    titre: 'Cahier de texte — séances fictives',
    description: "Illustration de blocs de cours comportant un horaire et un contenu pédagogique d’exemple, sans enregistrement.",
    workflow: ['Vérifier le cours et la classe', 'Relire la date et les horaires du bloc', 'Vérifier que le contenu décrit la séance réellement dispensée'],
  },
  'cahier-texte-nouveau-bloc-exemple': {
    titre: 'Cahier de texte — formulaire de séance',
    description: "Exemple du formulaire de création d’un bloc : date, heure de début, heure de fin et contenu sont obligatoires.",
    workflow: ['Renseigner la date et les deux horaires', 'Décrire le contenu effectivement traité', 'Enregistrer uniquement après vérification'],
  },
  'cahier-de-presence': {
    titre: 'Cahier de présence',
    description: "Listes et feuilles de présence par séance. Les actions disponibles dépendent du rôle : l’enseignant renseigne les états lors de la création d’une séance, tandis que le Surveillant peut modifier l’état d’une feuille existante dans son périmètre autorisé.",
    workflow: ['Ouvrir une liste autorisée', 'Vérifier la séance et les participants', 'Saisir les états selon les droits du rôle et contrôler le résultat'],
  },
  'presence-liste-exemple': {
    titre: 'Listes de présence — exemple fictif',
    description: "Illustration de la liste de présence d’un cours existant. Les personnes et le cours affichés sont fictifs.",
    workflow: ['Filtrer ou rechercher une liste', 'Ouvrir la liste correspondant au cours', 'Créer une liste seulement si elle n’existe pas'],
  },
  'presence-nouvelle-liste-exemple': {
    titre: 'Nouvelle liste de présence — formulaire fictif',
    description: "Illustration du formulaire de création d’une liste rattachée à un cours existant.",
    workflow: ['Choisir un cours existant', 'Vérifier l’enseignant', 'Enregistrer la liste après contrôle'],
  },
  'presence-feuille-exemple': {
    titre: 'Feuille de présence — exemple fictif',
    description: "Exemple de feuille avec les états Présent, Absent et Absence justifiée. Aucun état n’a été enregistré.",
    workflow: ['Vérifier le cours, la date et les horaires', 'Contrôler chaque état de présence', 'Signer uniquement après vérification si cette action est disponible'],
  },
  'presence-nouvelle-seance-exemple': {
    titre: 'Nouvelle séance de présence — exemple fictif',
    description: "Illustration du formulaire qui associe une date et des horaires aux participants et à leur état de présence.",
    workflow: ['Renseigner la date et les horaires', 'Vérifier la liste des participants', 'Renseigner les états puis enregistrer'],
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
    description: "Planning des cours par classe, enseignant et salle. Les profils Institution, Administrateur et Superviseur général peuvent gérer et publier le planning dans leur périmètre autorisé ; les autres profils le consultent.",
    workflow: ['Vérifier le site actif autorisé', 'Consulter ou gérer les séances selon le rôle', 'Vérifier les conflits puis publier le planning si le rôle le permet'],
  },
  'emploi-du-temps-exemple-superviseur': {
    titre: 'Emploi du temps — exemple fictif',
    description: "Simulation visuelle d’un planning avec des cours, dates, enseignants et salles fictifs. Elle ne modifie ni n’enregistre aucune séance.",
    workflow: ['Vérifier le site actif autorisé', 'Contrôler les cours, horaires, enseignants et salles', 'Ne publier qu’après vérification du planning réel'],
  },
  'nouvelle-seance-emploi-du-temps-exemple': {
    titre: 'Nouvelle séance — formulaire fictif',
    description: "Simulation du formulaire de planification avec des cours, une salle, un enseignant et des dates fictifs. Aucun enregistrement n’est effectué.",
    workflow: ['Choisir un cours existant', 'Compléter les dates et horaires', 'Contrôler le site et les conflits avant d’enregistrer'],
  },
  'publication-emploi-du-temps-exemple': {
    titre: 'Publication du planning — exemple fictif',
    description: "Simulation du message de confirmation et des nombres de destinataires. Aucune notification n’est envoyée.",
    workflow: ['Vérifier le planning réel', 'Publier depuis le site actif autorisé', 'Contrôler la confirmation et les destinataires'],
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

const ECRANS_PAR_PROFIL = {
  recouvrement: {
    'valid-bordereaux': {
      titre: 'Validation des bordereaux',
      description: "Cette capture montre l’écran d’authentification du Cabinet comptable. Le Recouvrement intervient après cette étape et traite les bordereaux authentifiés depuis « Bordereaux à imputer ».",
      workflow: [
        'Ne pas valider ni rejeter le bordereau depuis cet écran',
        'Orienter toute anomalie de justificatif vers le Cabinet comptable',
        'Traiter le dossier depuis « Bordereaux à imputer » après authentification',
      ],
    },
  },
  etudiants: {
    parcours: {
      titre: 'Parcours',
      description: "Catalogue en consultation des formations publiées. L’étudiant ne crée ni ne modifie les filières, les UE ou les cours ; cette gestion relève de l’administration.",
      workflow: ['Parcourir les filières publiées', 'Ouvrir une fiche pour consulter le niveau et les conditions d’accès', 'Contacter le secrétariat si une information manque'],
    },
    demandes: {
      titre: 'Demandes d’inscription',
      description: "Espace personnel pour démarrer ou reprendre une demande d’inscription, puis suivre son traitement par les services de l’établissement.",
      workflow: ['Cliquer sur Nouvelle demande si une session est ouverte', 'Compléter les étapes Filière, Documents, Informations et Récapitulatif', 'Soumettre le dossier puis suivre son statut'],
    },
    'demandes-orientation': {
      titre: "Demandes d'orientation",
      description: "Création et suivi d’une demande d’orientation à partir des filières proposées par l’établissement.",
      workflow: ['Ouvrir le catalogue des parcours existants', 'Ajouter les choix souhaités au panier', 'Soumettre la demande et consulter la réponse de l’administration'],
    },
    'parcours-orientation': {
      titre: "Parcours d'orientation",
      description: "Catalogue en consultation des parcours proposés pour préparer une demande d’orientation. La création et la publication des parcours sont réservées à l’administration.",
      workflow: ['Filtrer les parcours publiés', 'Consulter les prérequis et débouchés', 'Ajouter un parcours au panier de demande d’orientation'],
    },
    'mes-bordereaux': {
      titre: 'Mes bordereaux',
      description: "Dépôt et suivi des justificatifs de paiement de l’étudiant. Le contrôle et l’imputation sont réalisés par les services de recouvrement et de comptabilité.",
      workflow: ['Déposer un justificatif lisible', 'Suivre son statut et le motif en cas de rejet', 'Télécharger le reçu lorsqu’il est disponible'],
    },
    'mon-dossier': {
      titre: 'Mon dossier',
      description: "Consultation du dossier personnel, de ses pièces et de l’avancement des démarches.",
      workflow: ['Vérifier les informations personnelles', 'Remplacer uniquement les pièces signalées en correction', 'Suivre la validation par les services compétents'],
    },
    reorientation: {
      titre: 'Réorientation',
      description: "Soumission et suivi d’une demande de changement de parcours. La décision appartient à l’administration.",
      workflow: ['Choisir le parcours cible parmi ceux proposés', 'Expliquer le motif et joindre les pièces demandées', 'Soumettre la demande et suivre la décision'],
    },
    reclamations: {
      titre: 'Réclamations',
      description: "Dépôt et suivi des réclamations personnelles concernant notamment les notes, la scolarité ou un paiement.",
      workflow: ['Choisir le sujet de la réclamation', 'Décrire les faits et joindre les justificatifs utiles', 'Soumettre puis consulter la réponse'],
    },
    calendrier: {
      titre: 'Calendrier',
      description: "Consultation des dates et événements publiés par l’établissement.",
      workflow: ['Choisir la période à consulter', 'Ouvrir un événement pour lire ses détails', 'Contacter le service concerné en cas de question'],
    },
    bibliotheque: {
      titre: 'Bibliothèque',
      description: "Consultation des ressources et informations de bibliothèque mises à disposition de l’étudiant.",
      workflow: ['Rechercher une ressource disponible', 'Ouvrir sa fiche', 'Suivre les consignes affichées pour la consulter ou l’emprunter'],
    },
    annonces: {
      titre: 'Annonces',
      description: "Lecture des annonces publiées à destination des étudiants. La création et la publication sont réservées aux profils habilités.",
      workflow: ['Parcourir les annonces publiées', 'Ouvrir une annonce pour lire son contenu', 'Suivre les consignes et dates qui y figurent'],
    },
    'vie-estudiantine': {
      titre: 'Vie estudiantine',
      description: "Consultation des informations et activités étudiantes publiées par l’établissement.",
      workflow: ['Parcourir les actualités disponibles', 'Ouvrir une publication', 'Suivre les modalités de participation indiquées'],
    },
    suggestions: {
      titre: 'Suggestions',
      description: "Envoi d’une proposition d’amélioration à l’administration et suivi de son traitement.",
      workflow: ['Rédiger une suggestion', 'La soumettre', 'Consulter son état de traitement'],
    },
    paiements: {
      titre: 'Paiements',
      description: "Consultation des échéances et des informations de paiement de son propre dossier. Le recouvrement confirme les règlements et traite la caisse.",
      workflow: ['Consulter le montant et l’état des échéances', 'Suivre les instructions de paiement communiquées par l’établissement', 'Déposer ou suivre le justificatif dans Mes bordereaux'],
    },
    echeances: {
      titre: 'Échéances',
      description: "Consultation des montants dus, dates limites et états de règlement. L’étudiant ne valide pas lui-même un paiement.",
      workflow: ['Filtrer les échéances par période ou statut', 'Lire le montant et la date limite', 'Contacter le recouvrement si le statut ne correspond pas au paiement effectué'],
    },
    discussions: {
      titre: 'Discussions',
      description: "Messagerie interne pour échanger avec les personnes et services accessibles selon les droits du compte.",
      workflow: ['Ouvrir une conversation', 'Rédiger et envoyer un message', 'Joindre un fichier si l’écran le permet'],
    },
    'mon-profil': {
      titre: 'Mon profil',
      description: "Consultation et mise à jour des champs personnels que l’application autorise à modifier.",
      workflow: ['Vérifier son identité et ses coordonnées', 'Corriger les champs modifiables', 'Enregistrer et vérifier le résultat'],
    },
    'mon-compte': {
      titre: 'Mon compte',
      description: "Gestion des paramètres de sécurité du compte étudiant.",
      workflow: ['Changer son mot de passe', 'Configurer la double authentification si elle est activée', 'Se déconnecter après usage sur un appareil partagé'],
    },
    diplomes: {
      titre: 'Diplômes',
      description: "Consultation des informations et documents de diplôme qui concernent l’étudiant. La création et la modification des diplômes sont réservées à l’administration.",
      workflow: ['Consulter les informations disponibles sur son diplôme', 'Vérifier son identité et les données affichées', 'Télécharger le document si cette option est proposée'],
    },
    'demandes-docs': {
      titre: 'Demandes de documents',
      description: "Création et suivi d’une demande personnelle de document. La vérification, la préparation et la délivrance sont réalisées par les services compétents.",
      workflow: ['Choisir le type de document et renseigner les informations demandées', 'Joindre les pièces ou sélectionner le reçu requis', 'Vérifier le récapitulatif, soumettre puis suivre la demande'],
    },
    'mes-documents': {
      titre: 'Mes documents',
      description: "Suivi des demandes de documents et téléchargement des documents personnels lorsqu’ils sont prêts.",
      workflow: ['Consulter l’état de ses demandes', 'Ouvrir le détail pour connaître l’action attendue', 'Télécharger le document disponible'],
    },
    'demandes-vae': {
      titre: 'Demandes VAE',
      description: "Soumission et suivi d’une demande personnelle de VAE, VAP ou équivalence. L’instruction et la décision sont réservées à l’administration.",
      workflow: ['Choisir le type de demande', 'Compléter les informations et déposer les justificatifs demandés', 'Soumettre le dossier et suivre son instruction'],
    },
    'inscription-wizard-filiere': {
      titre: 'Wizard d’inscription — Filière',
      description: "Capture de démonstration de la première étape. L’étudiant choisit un mode et une filière déjà publiée ; il ne crée pas d’UE.",
      workflow: ['Choisir Présentiel ou En ligne', 'En Présentiel, sélectionner une filière publiée', 'Cliquer sur Continuer'],
    },
    'inscription-wizard-documents': {
      titre: 'Wizard d’inscription — Documents',
      description: "Capture de démonstration avec des pièces fictives : la liste réelle dépend des exigences publiées pour la session choisie.",
      workflow: ['Choisir une session disponible', 'Téléverser les pièces affichées et le bordereau demandé', 'Cliquer sur Soumettre les pièces'],
    },
    'inscription-wizard-informations': {
      titre: 'Wizard d’inscription — Informations',
      description: "Capture de démonstration de l’étape où l’étudiant vérifie ses données personnelles, son site et sa photo.",
      workflow: ['Compléter les champs personnels obligatoires', 'Choisir le site correspondant à la session', 'Ajouter la photo puis cliquer sur Valider et continuer'],
    },
    'inscription-wizard-recapitulatif': {
      titre: 'Wizard d’inscription — Récapitulatif',
      description: "Capture de démonstration avec des données et pièces fictives ; le récapitulatif précède la demande d’autorisation provisoire.",
      workflow: ['Relire le mode, la filière et la session', 'Vérifier les pièces et les informations personnelles', 'Cliquer sur Soumettre la demande d’autorisation provisoire'],
    },
    'inscription-wizard-statut': {
      titre: 'Wizard d’inscription — Statut',
      description: "Capture illustrative de l’écran de suivi après soumission. Cette image ne représente pas une demande réelle.",
      workflow: ['Lire le statut affiché', 'Ouvrir Demandes ou Mon dossier pour le détail', 'Suivre une correction si elle est demandée'],
    },
    'demande-document-wizard-pieces': {
      titre: 'Wizard document — Pièces',
      description: "Capture de démonstration de la première étape : joindre les pièces demandées au document choisi.",
      workflow: ['Vérifier la liste des justificatifs', 'Téléverser un fichier lisible au format accepté', 'Cliquer sur Suivant'],
    },
    'demande-document-wizard-verification': {
      titre: 'Wizard document — Vérification',
      description: "Capture de démonstration de l’étape de contrôle des pièces avant transmission.",
      workflow: ['Vérifier chaque pièce et son nom', 'Compléter les pièces obligatoires manquantes', 'Cliquer sur Suivant'],
    },
    'demande-document-wizard-soumission': {
      titre: 'Wizard document — Soumission',
      description: "Capture de démonstration de l’étape finale de transmission d’une demande de document.",
      workflow: ['Relire le type de document et les frais', 'Vérifier que toutes les pièces obligatoires sont présentes', 'Cliquer sur Soumettre la demande'],
    },
  },
};

const PROCEDURES_PAR_PROFIL = {
  recouvrement: [
    {
      titre: 'Encaisser un règlement et remettre le reçu',
      introduction: "Utilisez le parcours correspondant à la nature du règlement : « Encaissement documents » pour une demande de document payante, ou « Paiements » pour les autres encaissements. Saisissez uniquement un règlement effectivement reçu. Les captures sont illustratives et ne créent aucune opération.",
      captures: ['paiements'],
      sections: [
        {
          titre: 'Avant d’enregistrer le paiement',
          etapes: [
            {
              action: 'Rechercher l’étudiant avec son matricule ou ses informations d’identification, puis vérifier le dossier ou la demande concernée.',
              pourquoi: 'Cela évite de rattacher le règlement à la mauvaise personne ou à la mauvaise opération.',
              responsable: 'ESA Compta / Recouvrement',
            },
            {
              action: 'Vérifier le montant attendu, la nature du paiement et l’échéance ou le document concerné.',
              pourquoi: 'Le montant reçu doit correspondre à une somme due et être affecté à la bonne opération.',
              responsable: 'ESA Compta / Recouvrement',
            },
          ],
        },
        {
          titre: 'Enregistrer et remettre le reçu',
          etapes: [
            {
              action: 'Choisir le moyen de paiement proposé et enregistrer le montant réellement reçu, avec les références demandées.',
              pourquoi: 'La saisie doit refléter l’encaissement effectif ; ne marquez pas comme payé un montant seulement annoncé ou justifié par un bordereau non contrôlé.',
              responsable: 'ESA Compta / Recouvrement',
            },
            {
              action: 'Après confirmation de l’enregistrement, vérifier le numéro, la date, le montant et le mode sur le reçu.',
              pourquoi: 'Le reçu est la preuve remise à l’étudiant et permet de retrouver l’opération.',
              responsable: 'ESA Compta / Recouvrement',
            },
            {
              action: 'Imprimer ou remettre le reçu, puis vérifier l’opération dans le journal de caisse ou l’historique des paiements.',
              pourquoi: 'Le contrôle final confirme que le paiement est visible et correctement rattaché.',
              responsable: 'ESA Compta / Recouvrement',
            },
          ],
        },
      ],
    },
    {
      titre: 'Saisir et imputer un bordereau authentifié',
      introduction: "Le Cabinet comptable contrôle le justificatif et authentifie le bordereau. ESA Compta effectue ensuite la saisie et l’imputation. N’utilisez pas le circuit d’imputation pour remplacer ou contourner le contrôle du Cabinet.",
      captures: ['bordereaux-a-imputer', 'bordereau-imputation-simulation', 'bordereaux-traites'],
      sections: [
        {
          titre: 'Contrôler le dossier avant saisie',
          etapes: [
            {
              action: 'Ouvrir « Bordereaux à imputer », puis filtrer par année, niveau, parcours ou type d’opération si nécessaire.',
              pourquoi: 'Les filtres aident à retrouver le bordereau dans la file des dossiers authentifiés.',
              responsable: 'ESA Compta / Recouvrement',
            },
            {
              action: 'Vérifier le statut, l’étudiant, le type d’opération, le montant et les références du bordereau.',
              pourquoi: 'L’imputation doit correspondre au justificatif contrôlé par le Cabinet et au dossier financier de l’étudiant.',
              responsable: 'ESA Compta / Recouvrement',
            },
            {
              action: 'En cas de bordereau absent, rejeté ou incohérent, suspendre le traitement et contacter le Cabinet comptable ou le service concerné.',
              pourquoi: 'Le Recouvrement ne modifie pas la décision d’authentification et ne doit pas imputer un dossier non contrôlé.',
              responsable: 'ESA Compta / Recouvrement',
            },
          ],
        },
        {
          titre: 'Saisir, prévisualiser et confirmer',
          etapes: [
            {
              action: 'Ouvrir le traitement et vérifier ou compléter le montant, la référence bancaire, le numéro de bordereau, le moyen de paiement, la banque, le type d’opération et la date.',
              pourquoi: 'Ces champs servent à enregistrer le paiement et à le rattacher aux échéances correctes.',
              responsable: 'ESA Compta / Recouvrement',
            },
            {
              action: 'Si le type d’opération est MIXTE, relire la composition calculée automatiquement par l’application avant de continuer.',
              pourquoi: 'La ventilation entre inscription et scolarité est calculée par le système ; elle ne doit pas être remplacée par une estimation manuelle.',
              responsable: 'ESA Compta / Recouvrement',
            },
            {
              action: 'Lancer l’aperçu du traitement, contrôler la répartition proposée et les avertissements, puis confirmer la saisie uniquement si les données sont exactes.',
              pourquoi: 'L’aperçu permet de repérer une incohérence avant l’imputation comptable.',
              responsable: 'ESA Compta / Recouvrement',
            },
            {
              action: 'Retrouver le bordereau dans « Bordereaux traités » et consulter son état d’imputation.',
              pourquoi: 'Cette vérification confirme le résultat enregistré et facilite le suivi ultérieur.',
              responsable: 'ESA Compta / Recouvrement',
            },
          ],
        },
      ],
    },
    {
      titre: 'Suivre les impayés et vérifier une situation financière',
      introduction: 'Utilisez les écrans de situation pour répondre à une question sur un solde ou repérer une échéance en retard. Une échéance affichée impayée ne prouve pas à elle seule qu’aucun règlement n’a été remis : vérifiez les paiements et les justificatifs avant de répondre.',
      captures: ['situation-irreguliere', 'situation-financiere'],
      sections: [
        {
          titre: 'Vérifier le dossier',
          etapes: [
            {
              action: 'Rechercher l’étudiant par matricule et sélectionner la bonne année académique.',
              pourquoi: 'Un même étudiant peut avoir plusieurs dossiers ou périodes de paiement.',
              responsable: 'ESA Compta / Recouvrement',
            },
            {
              action: 'Comparer les sommes dues, les paiements enregistrés, les échéances et leurs dates limites.',
              pourquoi: 'Cette comparaison distingue un retard réel d’un paiement déjà reçu mais pas encore rapproché.',
              responsable: 'ESA Compta / Recouvrement',
            },
            {
              action: 'Si un reçu existe mais que la situation ne reflète pas le paiement, vérifier l’historique et les références avant toute nouvelle saisie.',
              pourquoi: 'Éviter une double saisie ou une relance injustifiée.',
              responsable: 'ESA Compta / Recouvrement',
            },
            {
              action: 'Communiquer uniquement le solde confirmé et orienter l’étudiant vers le service compétent lorsqu’une pièce ou une décision manque.',
              pourquoi: 'Les informations communiquées doivent correspondre à l’état vérifié du dossier.',
              responsable: 'ESA Compta / Recouvrement',
            },
          ],
        },
      ],
    },
    {
      titre: 'Clôturer et contrôler la caisse',
      introduction: 'La clôture compare le montant théorique calculé par l’application au montant réellement compté. Une différence doit être signalée et expliquée ; ne modifiez pas le montant réel pour faire disparaître un écart.',
      sections: [
        {
          titre: 'Clôture de fin de journée',
          etapes: [
            {
              action: 'Dans « Clôture caisse », vérifier la date, le caissier, le montant théorique et le statut de la clôture.',
              pourquoi: 'Vous devez clôturer la bonne session et confirmer les opérations qui lui sont rattachées.',
              responsable: 'ESA Compta / Recouvrement',
            },
            {
              action: 'Compter les fonds réellement présents et rapprocher ce total des reçus et opérations de caisse.',
              pourquoi: 'Le montant réel doit provenir du comptage, et non être recopié automatiquement depuis le montant théorique.',
              responsable: 'ESA Compta / Recouvrement',
            },
            {
              action: 'Si la clôture n’est pas encore ouverte, cliquer sur « Ouvrir une clôture » ; sélectionner ensuite la ligne ouverte à clôturer.',
              pourquoi: 'L’application rattache la clôture au caissier et aux encaissements de la session.',
              responsable: 'ESA Compta / Recouvrement',
            },
            {
              action: 'Saisir le montant réellement compté, vérifier l’écart affiché et cliquer sur « Valider la clôture » seulement après le rapprochement.',
              pourquoi: 'La clôture conserve les montants théorique et réel ainsi que l’écart constaté.',
              responsable: 'ESA Compta / Recouvrement',
            },
            {
              action: 'En cas d’écart ou d’opération manquante, conserver les références des reçus et prévenir le responsable avant de finaliser.',
              pourquoi: 'Une clôture ne remplace pas l’analyse ni la déclaration d’une anomalie de caisse.',
              responsable: 'ESA Compta / Recouvrement',
            },
          ],
        },
      ],
    },
  ],
  etudiants: [
    {
      titre: "Inscription — de la demande à la décision du comité",
      introduction: "L’étudiant choisit parmi les formations publiées et transmet son dossier. Il ne crée ni filière, ni UE, ni cours. Les captures suivantes illustrent l’interface avec des données de démonstration ; aucune demande n’a été créée ni transmise.",
      sections: [
        {
          titre: 'Dans votre espace étudiant',
          etapes: [
            {
              action: 'Dans Demandes, cliquer sur Nouvelle demande et choisir une session ouverte.',
              pourquoi: 'La session détermine la période d’inscription et les pièces exigées.',
              responsable: 'Étudiant',
            },
            {
              action: 'À l’étape Filière, choisir le mode proposé et une filière déjà publiée.',
              pourquoi: 'Vous exprimez votre choix parmi l’offre existante ; la création des formations et des UE est réservée à l’administration.',
              responsable: 'Étudiant',
            },
            {
              action: 'À l’étape Documents, téléverser les pièces demandées et le bordereau de paiement si l’écran le demande.',
              pourquoi: 'Les pièces permettent le contrôle du dossier et le bordereau justifie le paiement.',
              responsable: 'Étudiant',
            },
            {
              action: 'À l’étape Informations, vérifier les renseignements personnels et ajouter la photo demandée.',
              pourquoi: 'Les données doivent correspondre à la personne inscrite et aux documents fournis.',
              responsable: 'Étudiant',
            },
            {
              action: 'À l’étape Récapitulatif, relire le dossier, cliquer sur Soumettre la demande d’autorisation provisoire, puis confirmer avec Oui, valider.',
              pourquoi: 'La vérification finale évite de transmettre un dossier incomplet ou erroné.',
              responsable: 'Étudiant',
            },
          ],
        },
        {
          titre: 'Contrôles internes et suivi',
          etapes: [
            {
              action: 'Le Cabinet comptable contrôle le bordereau et le valide ou le rejette avec un motif.',
              pourquoi: 'Le justificatif doit être authentifié avant que le paiement soit imputé.',
              responsable: 'Cabinet comptable',
            },
            {
              action: 'Après le contrôle, ESA Compta (Recouvrement) effectue la saisie ou l’imputation comptable.',
              pourquoi: 'Cette étape rattache le paiement au dossier et met à jour la situation financière.',
              responsable: 'ESA Compta / Recouvrement',
            },
            {
              action: 'Le Comité d’orientation examine le dossier transmis et enregistre sa décision.',
              pourquoi: 'La décision d’admission relève du comité, pas de l’étudiant ni du secrétariat.',
              responsable: 'Comité d’orientation',
            },
            {
              action: 'Dans Demandes ou Mon dossier, consulter le statut et le motif. En cas de correction demandée, ne modifier que les éléments signalés.',
              pourquoi: 'Le suivi indique l’action attendue et évite de renvoyer inutilement tout le dossier.',
              responsable: 'Étudiant',
            },
          ],
        },
      ],
    },
    {
      titre: 'Demande de document administratif',
      introduction: 'Le wizard étudiant comporte trois étapes : Pièces, Vérification et Soumission. Les captures utilisent une demande fictive, non transmise. Le secrétariat prépare les documents ; le Recouvrement traite les paiements requis.',
      sections: [
        {
          titre: 'Avant d’ouvrir le wizard',
          etapes: [
            {
              action: 'Dans Demandes de documents, choisir le type de document. Pour un relevé de notes, choisir aussi l’année académique et le semestre.',
              pourquoi: 'Ces informations déterminent le document et la période à préparer.',
              responsable: 'Étudiant',
            },
            {
              action: 'Pour un document payant, sélectionner un reçu valide, puis cliquer sur Continuer vers le wizard.',
              pourquoi: 'Le reçu permet de rattacher le paiement à la demande ; sans reçu, suivre les instructions du service de recouvrement.',
              responsable: 'Étudiant / Recouvrement',
            },
          ],
        },
        {
          titre: 'Dans le wizard et après la soumission',
          etapes: [
            {
              action: 'Pièces : joindre les justificatifs demandés et vérifier que chaque fichier est lisible.',
              pourquoi: 'Une pièce manquante ou illisible peut bloquer le traitement.',
              responsable: 'Étudiant',
            },
            {
              action: 'Vérification : relire le type de document, la période, le reçu et les pièces avant de continuer.',
              pourquoi: 'La vérification permet de corriger les erreurs avant transmission.',
              responsable: 'Étudiant',
            },
            {
              action: 'Soumission : cliquer sur Soumettre la demande, puis suivre son statut dans Demandes de documents et Mes documents.',
              pourquoi: 'La demande est alors transmise au service chargé de la préparer et de la valider.',
              responsable: 'Étudiant',
            },
            {
              action: 'Si un paiement est en attente, contacter le Recouvrement. Pour la préparation ou l’impression, suivre le statut affiché et les consignes du Secrétariat.',
              pourquoi: 'Le Secrétariat prépare et imprime les documents ; il ne réalise pas les opérations de caisse.',
              responsable: 'Recouvrement / Secrétariat',
            },
          ],
        },
      ],
    },
  ],
  enseignant: [
    {
      titre: 'Cahier de texte — vérifier le planning, créer le cahier et saisir une séance',
      introduction: "Les captures ci-dessous sont des illustrations statiques avec des données entièrement fictives. Elles ne créent aucun cours, cahier ou bloc. Un cahier doit être rattaché à un cours déjà attribué à l’enseignant ; si le cours n’existe pas ou n’apparaît pas, demander son affectation au service chargé de la planification.",
      captures: [
        'cahier-texte-exemple',
        'cahier-texte-nouveau-exemple',
        'cahier-texte-detail-exemple',
        'cahier-texte-nouveau-bloc-exemple',
      ],
      sections: [
        {
          titre: 'Vérifier que le cours est programmé',
          etapes: [
            {
              action: 'Ouvrir Emplois du temps et sélectionner la date, la classe ou l’enseignant pour consulter le planning.',
              pourquoi: 'Le cahier et ses blocs doivent correspondre à un cours et à une séance réellement programmés.',
              responsable: 'Enseignant',
            },
            {
              action: 'Si le cours ou le site n’apparaît pas, ne pas créer ni publier un emploi du temps depuis ce compte ; transmettre l’anomalie à l’administration ou au responsable de planification.',
              pourquoi: 'La création et la publication de l’emploi du temps sont réservées aux profils Institution, Administrateur et Superviseur général.',
              responsable: 'Enseignant, puis Institution / Administrateur',
            },
          ],
        },
        {
          titre: 'Créer le cahier à partir d’un cours existant',
          etapes: [
            {
              action: 'Ouvrir Cours > Cahiers de texte, puis filtrer par niveau, classe ou parcours et rechercher le cours.',
              pourquoi: 'Les filtres évitent d’ouvrir un cahier appartenant à une autre classe.',
              responsable: 'Enseignant',
            },
            {
              action: 'Si aucun cahier n’existe, cliquer sur Nouveau cahier de texte, activer Choisir parmi les cours et sélectionner le cours déjà attribué.',
              pourquoi: 'L’enseignant rattache le cahier à l’offre de cours existante ; il ne crée ni UE ni cours depuis ce formulaire.',
              responsable: 'Enseignant',
            },
            {
              action: 'Vérifier l’enseignant associé, ajouter une description si utile, puis cliquer sur Enregistrer.',
              pourquoi: 'L’enregistrement crée le cahier dans l’application ; la capture de démonstration, elle, ne sauvegarde rien.',
              responsable: 'Enseignant',
            },
          ],
        },
        {
          titre: 'Ajouter le contenu d’une séance',
          etapes: [
            {
              action: 'Ouvrir le cahier du cours et cliquer sur Nouveau bloc.',
              pourquoi: 'Chaque bloc décrit une séance dans le cahier sélectionné.',
              responsable: 'Enseignant',
            },
            {
              action: 'Renseigner la date, l’heure de début, l’heure de fin et le contenu réellement traité.',
              pourquoi: 'Ces champs sont requis et permettent de rapprocher le cahier de la séance planifiée.',
              responsable: 'Enseignant',
            },
            {
              action: 'Relire le contenu puis cliquer sur Enregistrer ; vérifier ensuite que le bloc apparaît dans le tableau.',
              pourquoi: 'L’enregistrement est une opération persistante ; contrôler le résultat évite les doublons ou les erreurs de date.',
              responsable: 'Enseignant',
            },
          ],
        },
      ],
    },
    {
      titre: 'Présences — créer une liste et enregistrer les états d’une séance',
      introduction: "Les captures de cette procédure présentent des apprenants et des états entièrement fictifs. Elles ne créent ni liste ni présence. Les droits et contrôles varient selon le rôle connecté et le site autorisé.",
      captures: [
        'presence-liste-exemple',
        'presence-nouvelle-liste-exemple',
        'presence-feuille-exemple',
        'presence-nouvelle-seance-exemple',
      ],
      sections: [
        {
          titre: 'Ouvrir ou créer la liste du cours',
          etapes: [
            {
              action: 'Ouvrir Cours > Présences, puis filtrer ou rechercher la liste liée au cours et à la classe concernés.',
              pourquoi: 'Réutiliser la bonne liste conserve l’historique des séances et évite les doublons.',
              responsable: 'Enseignant',
            },
            {
              action: 'Ouvrir la liste existante. Si elle n’existe pas, cliquer sur Nouvelle liste, choisir le cours existant, vérifier l’enseignant et enregistrer.',
              pourquoi: 'Une liste de présence est rattachée au cours ; les sélecteurs ne donnent pas le droit de créer un cours.',
              responsable: 'Enseignant',
            },
          ],
        },
        {
          titre: 'Renseigner une séance et les participants',
          etapes: [
            {
              action: 'Dans la liste, cliquer sur Nouvelle présence, puis renseigner la date, l’heure de début et l’heure de fin.',
              pourquoi: 'La feuille doit correspondre à la séance réellement tenue.',
              responsable: 'Enseignant',
            },
            {
              action: 'Contrôler les participants affichés et attribuer à chacun l’état exact : Présent, Absent, Absence justifiée ou Non renseigné.',
              pourquoi: 'Les états saisis dans le formulaire sont enregistrés avec la séance.',
              responsable: 'Enseignant',
            },
            {
              action: 'Relire les horaires et les états, puis cliquer sur Enregistrer. Vérifier la feuille après le retour à la liste.',
              pourquoi: 'L’enregistrement crée la séance et ses états ; toute correction ultérieure doit respecter les droits du rôle.',
              responsable: 'Enseignant',
            },
            {
              action: 'Signer la feuille seulement après contrôle si le bouton Signer la feuille est proposé.',
              pourquoi: 'La signature est une action engageante et n’est disponible que dans les conditions prévues par le rôle et la feuille.',
              responsable: 'Enseignant',
            },
          ],
        },
        {
          titre: 'Cas du Surveillant',
          etapes: [
            {
              action: 'Accéder uniquement aux listes et sites autorisés par le compte ; si l’écran indique qu’aucun site actif n’est autorisé, demander l’affectation au responsable.',
              pourquoi: 'La simulation ne doit pas contourner les restrictions de site.',
              responsable: 'Surveillant / Administrateur',
            },
            {
              action: 'Sur une feuille existante, choisir l’état dans le sélecteur affiché puis vérifier le résultat.',
              pourquoi: 'Pour le rôle Surveillant, le changement de sélection enregistre immédiatement l’état ; il n’y a pas de bouton Enregistrer distinct sur cette cellule.',
              responsable: 'Surveillant',
            },
          ],
        },
      ],
    },
  ],
  'superviseur-general': [
    {
      titre: 'Emploi du temps — planifier, contrôler les conflits et publier',
      introduction: "Le Superviseur général peut créer, modifier, supprimer et publier les séances du site actif autorisé. La capture réelle montre « Aucun site actif sélectionné » ; les suivantes sont des simulations avec des données entièrement fictives. Il faut d’abord sélectionner un site auquel le compte est affecté. La publication envoie les notifications uniquement pour les cours de ce site.",
      captures: ['emplois-du-temps', 'emploi-du-temps-exemple-superviseur', 'nouvelle-seance-emploi-du-temps-exemple', 'publication-emploi-du-temps-exemple'],
      sections: [
        {
          titre: 'Préparer les séances du planning',
          etapes: [
            {
              action: 'Sélectionner un site actif auquel le compte est autorisé, puis ouvrir Emplois du temps.',
              pourquoi: 'La création, la modification et la publication sont limitées au site actif du Superviseur général.',
              responsable: 'Superviseur général / Administrateur',
            },
            {
              action: 'Choisir la semaine et, si nécessaire, filtrer par enseignant ou classe. Cliquer sur une plage libre du calendrier pour ouvrir Nouvelle séance.',
              pourquoi: 'Le clic sur la grille préremplit la date, l’heure et le jour de la semaine.',
              responsable: 'Superviseur général',
            },
            {
              action: 'Cocher Choisir parmi les cours et sélectionner le cours existant ; renseigner la salle, les dates de début et de fin, les horaires, l’enseignant et la description utile.',
              pourquoi: 'La séance doit être rattachée à un cours du site actif et à un enseignant affecté à ce site.',
              responsable: 'Superviseur général',
            },
            {
              action: 'Cliquer sur Enregistrer. Lire les conflits retournés et corriger les chevauchements avant de forcer une sauvegarde.',
              pourquoi: 'Le contrôle signale les collisions d’horaires ; ne forcer l’enregistrement qu’après validation explicite.',
              responsable: 'Superviseur général',
            },
            {
              action: 'Pour corriger une séance, cliquer sur son bloc puis Enregistrer après vérification ; utiliser Supprimer uniquement après confirmation.',
              pourquoi: 'La modification et la suppression sont des opérations persistantes sur le planning.',
              responsable: 'Superviseur général',
            },
          ],
        },
        {
          titre: 'Contrôler et publier',
          etapes: [
            {
              action: 'Parcourir les séances de la semaine et vérifier cours, enseignant, salle, dates, horaires et absence de conflit.',
              pourquoi: 'La publication informe les personnes concernées par les séances du site.',
              responsable: 'Superviseur général',
            },
            {
              action: 'Cliquer sur Publier l’EDT, puis attendre le message de confirmation et contrôler les nombres d’enseignants et d’étudiants notifiés.',
              pourquoi: 'La publication déclenche les notifications aux enseignants, étudiants et parents concernés par le planning du site actif.',
              responsable: 'Superviseur général',
            },
            {
              action: 'Si aucun site actif n’est disponible, arrêter la procédure et demander l’affectation du compte ; ne pas tenter de publier sans périmètre.',
              pourquoi: 'Le serveur refuse la publication sans site actif autorisé.',
              responsable: 'Superviseur général / Administrateur',
            },
          ],
        },
      ],
    },
  ],
  surveillant: [
    {
      titre: 'Présences — accès limité au site autorisé',
      introduction: "La capture de démonstration affiche « Aucun site actif autorisé pour ce surveillant ». Elle illustre un refus d’accès réel du compte de démonstration, et non une feuille de présence opérationnelle. Ne pas contourner cette restriction pour obtenir une capture.",
      captures: ['cahier-de-presence'],
      sections: [
        {
          titre: 'Avant de traiter une présence',
          etapes: [
            {
              action: 'Vérifier que le site actif est affecté au compte. En cas de refus, demander l’affectation ou la correction des habilitations à l’Administrateur.',
              pourquoi: 'Les listes et présences sont limitées au périmètre autorisé.',
              responsable: 'Surveillant / Administrateur',
            },
            {
              action: 'Après autorisation, ouvrir la liste de présence de la séance concernée et vérifier le cours, la date et les participants.',
              pourquoi: 'Le contrôle du contexte évite de modifier la feuille d’une autre classe ou séance.',
              responsable: 'Surveillant',
            },
          ],
        },
        {
          titre: 'Corriger un état sur une feuille existante',
          etapes: [
            {
              action: 'Choisir le statut exact dans le sélecteur de la cellule de présence, puis relire l’état affiché.',
              pourquoi: 'Dans l’interface Surveillant, le changement de sélection enregistre immédiatement l’état ; aucun bouton Enregistrer distinct n’est affiché.',
              responsable: 'Surveillant',
            },
            {
              action: 'Pour une séance ou une liste absente, ne pas inventer le cours ni changer de site ; demander l’intervention du service habilité.',
              pourquoi: 'Le rôle et le périmètre de site déterminent les listes disponibles.',
              responsable: 'Surveillant / Administration',
            },
          ],
        },
      ],
    },
  ],
};

module.exports = { ECRANS, ECRANS_PAR_PROFIL, PROCEDURES_PAR_PROFIL };
