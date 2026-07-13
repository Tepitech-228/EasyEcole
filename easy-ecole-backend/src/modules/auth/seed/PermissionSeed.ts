import { Permission } from "../models/Permission";

const ALL_PERMISSIONS: Array<{ key: string; libelle: string; module: string; type: 'menu' | 'action'; parentKey?: string }> = [
    // ============ TABLEAU DE BORD ============
    { key: 'menu.tableau-de-bord', libelle: 'Tableau de bord', module: 'Général', type: 'menu' },

    // ============ INSCRIPTION ============
    { key: 'menu.inscription', libelle: 'Inscription', module: 'Inscription', type: 'menu' },
    { key: 'menu.inscription.sessions', libelle: 'Sessions', module: 'Inscription', type: 'menu', parentKey: 'menu.inscription' },
    { key: 'menu.inscription.parcours', libelle: 'Parcours', module: 'Inscription', type: 'menu', parentKey: 'menu.inscription' },
    { key: 'menu.inscription.demandes', libelle: 'Demandes', module: 'Inscription', type: 'menu', parentKey: 'menu.inscription' },
    { key: 'menu.inscription.cursus', libelle: 'Mon cursus', module: 'Inscription', type: 'menu', parentKey: 'menu.inscription' },
    { key: 'menu.inscription.mon-dossier', libelle: 'Mon dossier', module: 'Inscription', type: 'menu', parentKey: 'menu.inscription' },
    { key: 'menu.inscription.dossiers-etudiants', libelle: 'Dossiers étudiants', module: 'Inscription', type: 'menu', parentKey: 'menu.inscription' },
    { key: 'menu.inscription.paiements', libelle: 'Paiements', module: 'Inscription', type: 'menu', parentKey: 'menu.inscription' },
    { key: 'menu.inscription.comptabilite', libelle: 'Comptabilité', module: 'Inscription', type: 'menu', parentKey: 'menu.inscription' },
    { key: 'menu.inscription.bordereaux', libelle: 'Mes bordereaux', module: 'Inscription', type: 'menu', parentKey: 'menu.inscription' },
    { key: 'menu.inscription.validation-bordereaux', libelle: 'Valid. bordereaux', module: 'Inscription', type: 'menu', parentKey: 'menu.inscription' },
    { key: 'menu.inscription.echeances', libelle: 'Échéances', module: 'Inscription', type: 'menu', parentKey: 'menu.inscription' },
    // Actions Inscription
    { key: 'action.inscription.session.creer', libelle: 'Créer une session', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.sessions' },
    { key: 'action.inscription.session.modifier', libelle: 'Modifier une session', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.sessions' },
    { key: 'action.inscription.session.supprimer', libelle: 'Supprimer une session', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.sessions' },
    { key: 'action.inscription.parcours.creer', libelle: 'Créer un parcours', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.parcours.modifier', libelle: 'Modifier un parcours', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.parcours.supprimer', libelle: 'Supprimer un parcours', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.demande.valider', libelle: 'Valider une demande', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.demandes' },
    { key: 'action.inscription.demande.rejeter', libelle: 'Rejeter une demande', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.demandes' },
    { key: 'action.inscription.bordereau.valider', libelle: 'Valider un bordereau', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.validation-bordereaux' },
    { key: 'action.inscription.echeance.generer', libelle: 'Générer des échéances', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.echeances' },
    { key: 'action.inscription.echeance.modifier', libelle: 'Modifier une échéance', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.echeances' },
    { key: 'action.inscription.dossier.generer', libelle: 'Générer un dossier étudiant', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.dossiers-etudiants' },
    { key: 'action.inscription.dossier.modifier-statut', libelle: 'Modifier statut dossier', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.dossiers-etudiants' },
    { key: 'action.inscription.cours.creer', libelle: 'Créer un cours', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.cours.modifier', libelle: 'Modifier un cours', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.cours.supprimer', libelle: 'Supprimer un cours', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.cours.assigner-enseignant', libelle: 'Assigner un enseignant', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.cours.retirer-enseignant', libelle: 'Retirer un enseignant', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.classe.creer', libelle: 'Créer une classe', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.classe.modifier', libelle: 'Modifier une classe', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.classe.supprimer', libelle: 'Supprimer une classe', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.salle.creer', libelle: 'Créer une salle', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.salle.modifier', libelle: 'Modifier une salle', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.salle.supprimer', libelle: 'Supprimer une salle', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.type-note.creer', libelle: 'Créer un type de note', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.type-note.modifier', libelle: 'Modifier un type de note', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.type-note.supprimer', libelle: 'Supprimer un type de note', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.niveau-etude.creer', libelle: 'Créer un niveau d\'étude', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.niveau-etude.modifier', libelle: 'Modifier un niveau d\'étude', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.niveau-etude.supprimer', libelle: 'Supprimer un niveau d\'étude', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.prerequis.creer', libelle: 'Créer un prérequis', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.prerequis.modifier', libelle: 'Modifier un prérequis', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.prerequis.supprimer', libelle: 'Supprimer un prérequis', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.matiere-prerequis.creer', libelle: 'Créer une matière prérequis', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.matiere-prerequis.modifier', libelle: 'Modifier une matière prérequis', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.matiere-prerequis.supprimer', libelle: 'Supprimer une matière prérequis', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.annee-academique.creer', libelle: 'Créer une année académique', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.annee-academique.modifier', libelle: 'Modifier une année académique', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.annee-academique.supprimer', libelle: 'Supprimer une année académique', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.cursus.creer', libelle: 'Créer un cursus', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.cursus.modifier', libelle: 'Modifier un cursus', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.cursus.supprimer', libelle: 'Supprimer un cursus', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.apprenant.supprimer', libelle: 'Supprimer un apprenant', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },
    { key: 'action.inscription.apprenant.generer-qr', libelle: 'Générer QR code apprenant', module: 'Inscription', type: 'action', parentKey: 'menu.inscription.parcours' },

    // ============ ORIENTATION ============
    { key: 'menu.orientation', libelle: 'Orientation', module: 'Orientation', type: 'menu' },
    { key: 'menu.orientation.parcours', libelle: 'Parcours', module: 'Orientation', type: 'menu', parentKey: 'menu.orientation' },
    { key: 'menu.orientation.demandes', libelle: 'Demandes', module: 'Orientation', type: 'menu', parentKey: 'menu.orientation' },
    { key: 'menu.orientation.comite', libelle: 'Commission orientation', module: 'Orientation', type: 'menu', parentKey: 'menu.orientation' },
    // Actions Orientation
    { key: 'action.orientation.parcours.creer', libelle: 'Créer un parcours', module: 'Orientation', type: 'action', parentKey: 'menu.orientation.parcours' },
    { key: 'action.orientation.parcours.modifier', libelle: 'Modifier un parcours', module: 'Orientation', type: 'action', parentKey: 'menu.orientation.parcours' },
    { key: 'action.orientation.parcours.supprimer', libelle: 'Supprimer un parcours', module: 'Orientation', type: 'action', parentKey: 'menu.orientation.parcours' },
    { key: 'action.orientation.prerequis.creer', libelle: 'Créer un prérequis', module: 'Orientation', type: 'action', parentKey: 'menu.orientation.parcours' },
    { key: 'action.orientation.prerequis.modifier', libelle: 'Modifier un prérequis', module: 'Orientation', type: 'action', parentKey: 'menu.orientation.parcours' },
    { key: 'action.orientation.prerequis.supprimer', libelle: 'Supprimer un prérequis', module: 'Orientation', type: 'action', parentKey: 'menu.orientation.parcours' },
    { key: 'action.orientation.debouche.creer', libelle: 'Créer un débouché', module: 'Orientation', type: 'action', parentKey: 'menu.orientation.parcours' },
    { key: 'action.orientation.debouche.modifier', libelle: 'Modifier un débouché', module: 'Orientation', type: 'action', parentKey: 'menu.orientation.parcours' },
    { key: 'action.orientation.debouche.supprimer', libelle: 'Supprimer un débouché', module: 'Orientation', type: 'action', parentKey: 'menu.orientation.parcours' },
    { key: 'action.orientation.categorie.creer', libelle: 'Créer une catégorie', module: 'Orientation', type: 'action', parentKey: 'menu.orientation.parcours' },
    { key: 'action.orientation.categorie.modifier', libelle: 'Modifier une catégorie', module: 'Orientation', type: 'action', parentKey: 'menu.orientation.parcours' },
    { key: 'action.orientation.categorie.supprimer', libelle: 'Supprimer une catégorie', module: 'Orientation', type: 'action', parentKey: 'menu.orientation.parcours' },
    { key: 'action.orientation.matiere-prerequis.creer', libelle: 'Créer une matière prérequis', module: 'Orientation', type: 'action', parentKey: 'menu.orientation.parcours' },
    { key: 'action.orientation.matiere-prerequis.modifier', libelle: 'Modifier une matière prérequis', module: 'Orientation', type: 'action', parentKey: 'menu.orientation.parcours' },
    { key: 'action.orientation.matiere-prerequis.supprimer', libelle: 'Supprimer une matière prérequis', module: 'Orientation', type: 'action', parentKey: 'menu.orientation.parcours' },
    { key: 'action.orientation.niveau-etude.creer', libelle: 'Créer un niveau d\'étude', module: 'Orientation', type: 'action', parentKey: 'menu.orientation.parcours' },
    { key: 'action.orientation.niveau-etude.modifier', libelle: 'Modifier un niveau d\'étude', module: 'Orientation', type: 'action', parentKey: 'menu.orientation.parcours' },
    { key: 'action.orientation.niveau-etude.supprimer', libelle: 'Supprimer un niveau d\'étude', module: 'Orientation', type: 'action', parentKey: 'menu.orientation.parcours' },

    // ============ COURS ============
    { key: 'menu.cours', libelle: 'Cours', module: 'Cours', type: 'menu' },
    { key: 'menu.cours.enseignants', libelle: 'Enseignants', module: 'Cours', type: 'menu', parentKey: 'menu.cours' },
    { key: 'menu.cours.liste', libelle: 'Cours', module: 'Cours', type: 'menu', parentKey: 'menu.cours' },
    { key: 'menu.cours.presences', libelle: 'Présences', module: 'Cours', type: 'menu', parentKey: 'menu.cours' },
    { key: 'menu.cours.mes-presences', libelle: 'Mes présences', module: 'Cours', type: 'menu', parentKey: 'menu.cours' },
    { key: 'menu.cours.cahiers-de-texte', libelle: 'Cahiers de texte', module: 'Cours', type: 'menu', parentKey: 'menu.cours' },
    { key: 'menu.cours.emplois-du-temps', libelle: 'Emplois du temps', module: 'Cours', type: 'menu', parentKey: 'menu.cours' },
    { key: 'menu.cours.notes', libelle: 'Notes', module: 'Cours', type: 'menu', parentKey: 'menu.cours' },
    { key: 'action.cours.enseignant.creer', libelle: 'Créer un enseignant', module: 'Cours', type: 'action', parentKey: 'menu.cours.enseignants' },
    { key: 'action.cours.enseignant.modifier', libelle: 'Modifier un enseignant', module: 'Cours', type: 'action', parentKey: 'menu.cours.enseignants' },
    { key: 'action.cours.cours.creer', libelle: 'Créer un cours', module: 'Cours', type: 'action', parentKey: 'menu.cours.liste' },
    { key: 'action.cours.cours.modifier', libelle: 'Modifier un cours', module: 'Cours', type: 'action', parentKey: 'menu.cours.liste' },
    { key: 'action.cours.cours.supprimer', libelle: 'Supprimer un cours', module: 'Cours', type: 'action', parentKey: 'menu.cours.liste' },
    { key: 'action.cours.presence.generer', libelle: 'Générer une présence', module: 'Cours', type: 'action', parentKey: 'menu.cours.presences' },
    { key: 'action.cours.note.saisir', libelle: 'Saisir des notes', module: 'Cours', type: 'action', parentKey: 'menu.cours.notes' },
    { key: 'action.cours.note.modifier', libelle: 'Modifier des notes', module: 'Cours', type: 'action', parentKey: 'menu.cours.notes' },

    // ============ ÉVALUATIONS ============
    { key: 'menu.evaluations', libelle: 'Évaluations', module: 'Évaluations', type: 'menu' },
    { key: 'menu.evaluations.bulletins', libelle: 'Bulletins', module: 'Évaluations', type: 'menu', parentKey: 'menu.evaluations' },
    { key: 'menu.evaluations.deliberations', libelle: 'Délibérations', module: 'Évaluations', type: 'menu', parentKey: 'menu.evaluations' },
    { key: 'menu.evaluations.moyennes', libelle: 'Moyennes', module: 'Évaluations', type: 'menu', parentKey: 'menu.evaluations' },
    { key: 'menu.evaluations.mon-releve', libelle: 'Mon relevé', module: 'Évaluations', type: 'menu', parentKey: 'menu.evaluations' },
    { key: 'action.evaluation.bulletin.generer', libelle: 'Générer un bulletin', module: 'Évaluations', type: 'action', parentKey: 'menu.evaluations.bulletins' },
    { key: 'action.evaluation.deliberation.organiser', libelle: 'Organiser une délibération', module: 'Évaluations', type: 'action', parentKey: 'menu.evaluations.deliberations' },
    { key: 'action.evaluation.moyenne.calculer', libelle: 'Calculer les moyennes', module: 'Évaluations', type: 'action', parentKey: 'menu.evaluations.moyennes' },
    { key: 'action.evaluation.deliberation.creer', libelle: 'Créer une délibération', module: 'Évaluations', type: 'action', parentKey: 'menu.evaluations.deliberations' },
    { key: 'action.evaluation.deliberation.modifier', libelle: 'Modifier une délibération', module: 'Évaluations', type: 'action', parentKey: 'menu.evaluations.deliberations' },
    { key: 'action.evaluation.deliberation.supprimer', libelle: 'Supprimer une délibération', module: 'Évaluations', type: 'action', parentKey: 'menu.evaluations.deliberations' },
    { key: 'action.evaluation.deliberation.charger-resultats', libelle: 'Charger des résultats', module: 'Évaluations', type: 'action', parentKey: 'menu.evaluations.deliberations' },
    { key: 'action.evaluation.deliberation.modifier-resultat', libelle: 'Modifier un résultat', module: 'Évaluations', type: 'action', parentKey: 'menu.evaluations.deliberations' },
    { key: 'action.evaluation.deliberation.cloturer', libelle: 'Clôturer une délibération', module: 'Évaluations', type: 'action', parentKey: 'menu.evaluations.deliberations' },
    { key: 'action.evaluation.bulletin.modifier', libelle: 'Modifier un bulletin', module: 'Évaluations', type: 'action', parentKey: 'menu.evaluations.bulletins' },
    { key: 'action.evaluation.bulletin.publier', libelle: 'Publier un bulletin', module: 'Évaluations', type: 'action', parentKey: 'menu.evaluations.bulletins' },
    { key: 'action.evaluation.bulletin.supprimer', libelle: 'Supprimer un bulletin', module: 'Évaluations', type: 'action', parentKey: 'menu.evaluations.bulletins' },
    { key: 'menu.evaluations.rattrapages', libelle: 'Rattrapages', module: 'Évaluations', type: 'menu', parentKey: 'menu.evaluations' },
    { key: 'action.evaluation.rattrapage.assigner', libelle: 'Assigner automatiquement', module: 'Évaluations', type: 'action', parentKey: 'menu.evaluations.rattrapages' },
    { key: 'action.evaluation.rattrapage.notifier', libelle: 'Notifier les étudiants', module: 'Évaluations', type: 'action', parentKey: 'menu.evaluations.rattrapages' },
    { key: 'action.evaluation.rattrapage.saisir-notes', libelle: 'Saisir les notes', module: 'Évaluations', type: 'action', parentKey: 'menu.evaluations.rattrapages' },

    // ============ SCOLARITÉ ============
    { key: 'menu.scolarite', libelle: 'Scolarité', module: 'Scolarité', type: 'menu' },
    { key: 'menu.scolarite.demandes-docs', libelle: 'Demandes docs', module: 'Scolarité', type: 'menu', parentKey: 'menu.scolarite' },
    { key: 'menu.scolarite.traiter-demandes', libelle: 'Traiter demandes', module: 'Scolarité', type: 'menu', parentKey: 'menu.scolarite' },
    { key: 'menu.scolarite.reclamations', libelle: 'Réclamations', module: 'Scolarité', type: 'menu', parentKey: 'menu.scolarite' },
    { key: 'menu.scolarite.traiter-reclamations', libelle: 'Traiter réclam.', module: 'Scolarité', type: 'menu', parentKey: 'menu.scolarite' },
    { key: 'menu.scolarite.registres', libelle: 'Registres', module: 'Scolarité', type: 'menu', parentKey: 'menu.scolarite' },
    { key: 'menu.scolarite.calendrier', libelle: 'Calendrier', module: 'Scolarité', type: 'menu', parentKey: 'menu.scolarite' },
    { key: 'menu.scolarite.discipline', libelle: 'Discipline', module: 'Scolarité', type: 'menu', parentKey: 'menu.scolarite' },
    { key: 'menu.scolarite.conseils', libelle: 'Conseils classe', module: 'Scolarité', type: 'menu', parentKey: 'menu.scolarite' },
    { key: 'menu.scolarite.bibliotheque', libelle: 'Bibliothèque', module: 'Scolarité', type: 'menu', parentKey: 'menu.scolarite' },
    { key: 'menu.scolarite.bibliotheque.gestion', libelle: 'Gestion bibliothèque', module: 'Scolarité', type: 'menu', parentKey: 'menu.scolarite.bibliotheque' },
    { key: 'action.scolarite.document.traiter', libelle: 'Traiter un document', module: 'Scolarité', type: 'action', parentKey: 'menu.scolarite.traiter-demandes' },
    { key: 'action.scolarite.reclamation.traiter', libelle: 'Traiter une réclamation', module: 'Scolarité', type: 'action', parentKey: 'menu.scolarite.traiter-reclamations' },
    { key: 'action.scolarite.discipline.sanctionner', libelle: 'Ajouter une sanction', module: 'Scolarité', type: 'action', parentKey: 'menu.scolarite.discipline' },

    // ============ E-LEARNING ============
    { key: 'menu.elearning', libelle: 'E-Learning', module: 'E-Learning', type: 'menu' },
    { key: 'menu.elearning.mes-cours', libelle: 'Mes cours', module: 'E-Learning', type: 'menu', parentKey: 'menu.elearning' },
    { key: 'menu.elearning.quiz', libelle: 'Quiz', module: 'E-Learning', type: 'menu', parentKey: 'menu.elearning' },
    { key: 'menu.elearning.progression', libelle: 'Progression', module: 'E-Learning', type: 'menu', parentKey: 'menu.elearning' },
    { key: 'menu.elearning.certificats', libelle: 'Certificats', module: 'E-Learning', type: 'menu', parentKey: 'menu.elearning' },
    { key: 'menu.elearning.devoirs', libelle: 'Devoirs', module: 'E-Learning', type: 'menu', parentKey: 'menu.elearning' },
    { key: 'menu.elearning.gestion', libelle: 'Gestion', module: 'E-Learning', type: 'menu', parentKey: 'menu.elearning' },

    // ============ FINANCES ============
    { key: 'menu.finances', libelle: 'Finances', module: 'Finances', type: 'menu' },
    { key: 'menu.finances.paiements', libelle: 'Paiements', module: 'Finances', type: 'menu', parentKey: 'menu.finances' },
    { key: 'menu.finances.comptabilite', libelle: 'Comptabilité', module: 'Finances', type: 'menu', parentKey: 'menu.finances' },
    { key: 'menu.finances.bordereaux', libelle: 'Mes bordereaux', module: 'Finances', type: 'menu', parentKey: 'menu.finances' },
    { key: 'menu.finances.validation-bordereaux', libelle: 'Valid. bordereaux', module: 'Finances', type: 'menu', parentKey: 'menu.finances' },
    { key: 'action.finances.paiement.enregistrer', libelle: 'Enregistrer un paiement', module: 'Finances', type: 'action', parentKey: 'menu.finances.paiements' },
    { key: 'action.finances.paiement.annuler', libelle: 'Annuler un paiement', module: 'Finances', type: 'action', parentKey: 'menu.finances.paiements' },
    { key: 'action.finances.comptabilite.consulter', libelle: 'Consulter la compta', module: 'Finances', type: 'action', parentKey: 'menu.finances.comptabilite' },
    { key: 'action.comptabilite.journal.creer', libelle: 'Créer un journal comptable', module: 'Finances', type: 'action', parentKey: 'menu.finances.comptabilite' },
    { key: 'action.comptabilite.ecriture.valider', libelle: 'Valider une écriture comptable', module: 'Finances', type: 'action', parentKey: 'menu.finances.comptabilite' },

    // ============ ACHATS ============
    { key: 'menu.achats', libelle: 'Achats', module: 'Achats', type: 'menu' },
    { key: 'menu.achats.demandes', libelle: 'Demandes achat', module: 'Achats', type: 'menu', parentKey: 'menu.achats' },
    { key: 'menu.achats.commandes', libelle: 'Commandes', module: 'Achats', type: 'menu', parentKey: 'menu.achats' },
    { key: 'menu.achats.factures', libelle: 'Factures', module: 'Achats', type: 'menu', parentKey: 'menu.achats' },
    { key: 'menu.achats.fournisseurs', libelle: 'Fournisseurs', module: 'Achats', type: 'menu', parentKey: 'menu.achats' },
    { key: 'menu.achats.budgets', libelle: 'Budgets', module: 'Achats', type: 'menu', parentKey: 'menu.achats' },

    // ============ STOCKS ============
    { key: 'menu.stocks', libelle: 'Stocks', module: 'Stocks', type: 'menu' },
    { key: 'menu.stocks.articles', libelle: 'Articles', module: 'Stocks', type: 'menu', parentKey: 'menu.stocks' },
    { key: 'menu.stocks.mouvements', libelle: 'Mouvements', module: 'Stocks', type: 'menu', parentKey: 'menu.stocks' },
    { key: 'menu.stocks.fournisseurs-stock', libelle: 'Fournisseurs', module: 'Stocks', type: 'menu', parentKey: 'menu.stocks' },

    // ============ IMMOBILISATIONS ============
    { key: 'menu.immobilisations', libelle: 'Immobilisations', module: 'Immobilisations', type: 'menu' },
    { key: 'menu.immobilisations.liste', libelle: 'Immobilisations', module: 'Immobilisations', type: 'menu', parentKey: 'menu.immobilisations' },
    { key: 'menu.immobilisations.sites', libelle: 'Sites', module: 'Immobilisations', type: 'menu', parentKey: 'menu.immobilisations' },
    { key: 'menu.immobilisations.categories', libelle: 'Catégories', module: 'Immobilisations', type: 'menu', parentKey: 'menu.immobilisations' },
    { key: 'menu.immobilisations.maintenance', libelle: 'Maintenance', module: 'Immobilisations', type: 'menu', parentKey: 'menu.immobilisations' },

    // ============ STAGES ============
    { key: 'menu.stages', libelle: 'Stages', module: 'Stages', type: 'menu' },
    { key: 'menu.stages.offres', libelle: 'Offres de stage', module: 'Stages', type: 'menu', parentKey: 'menu.stages' },
    { key: 'menu.stages.demandes-stage', libelle: 'Demandes stage', module: 'Stages', type: 'menu', parentKey: 'menu.stages' },
    { key: 'menu.stages.entreprises', libelle: 'Entreprises', module: 'Stages', type: 'menu', parentKey: 'menu.stages' },

    // ============ RESSOURCES HUMAINES ============
    { key: 'menu.rh', libelle: 'Ressources Humaines', module: 'R.H', type: 'menu' },
    { key: 'menu.rh.employes', libelle: 'Employés', module: 'R.H', type: 'menu', parentKey: 'menu.rh' },
    { key: 'menu.rh.offres-emploi', libelle: 'Offres d\'emploi', module: 'R.H', type: 'menu', parentKey: 'menu.rh' },
    { key: 'menu.rh.candidatures', libelle: 'Candidatures', module: 'R.H', type: 'menu', parentKey: 'menu.rh' },
    { key: 'menu.rh.paie', libelle: 'Paie', module: 'R.H', type: 'menu', parentKey: 'menu.rh' },
    { key: 'menu.rh.prestations', libelle: 'Prestations', module: 'R.H', type: 'menu', parentKey: 'menu.rh' },
    { key: 'action.rh.employe.creer', libelle: 'Créer un employé', module: 'R.H', type: 'action', parentKey: 'menu.rh.employes' },
    { key: 'action.rh.employe.modifier', libelle: 'Modifier un employé', module: 'R.H', type: 'action', parentKey: 'menu.rh.employes' },
    { key: 'action.rh.paie.generer', libelle: 'Générer la paie', module: 'R.H', type: 'action', parentKey: 'menu.rh.paie' },

    // ============ POINTAGE ============
    { key: 'menu.pointage', libelle: 'Pointage', module: 'Pointage', type: 'menu' },
    { key: 'menu.pointage.terminal', libelle: 'Terminal', module: 'Pointage', type: 'menu', parentKey: 'menu.pointage' },
    { key: 'menu.pointage.historique', libelle: 'Historique', module: 'Pointage', type: 'menu', parentKey: 'menu.pointage' },
    { key: 'menu.pointage.shifts', libelle: 'Shifts', module: 'Pointage', type: 'menu', parentKey: 'menu.pointage' },
    { key: 'menu.pointage.absences', libelle: 'Absences', module: 'Pointage', type: 'menu', parentKey: 'menu.pointage' },
    { key: 'menu.pointage.planning', libelle: 'Planning', module: 'Pointage', type: 'menu', parentKey: 'menu.pointage' },
    { key: 'menu.pointage.rapports', libelle: 'Rapports', module: 'Pointage', type: 'menu', parentKey: 'menu.pointage' },

    // ============ ADMINISTRATION ============
    { key: 'menu.administration', libelle: 'Administration', module: 'Administration', type: 'menu' },
    { key: 'menu.administration.utilisateurs', libelle: 'Utilisateurs', module: 'Administration', type: 'menu', parentKey: 'menu.administration' },
    { key: 'menu.administration.roles', libelle: 'Rôles', module: 'Administration', type: 'menu', parentKey: 'menu.administration' },
    { key: 'menu.administration.qr-codes', libelle: 'QR Codes', module: 'Administration', type: 'menu', parentKey: 'menu.administration' },
    { key: 'menu.administration.cartes', libelle: 'Cartes', module: 'Administration', type: 'menu', parentKey: 'menu.administration' },
    { key: 'menu.administration.journal-audit', libelle: 'Journal audit', module: 'Administration', type: 'menu', parentKey: 'menu.administration' },
    { key: 'menu.administration.configuration', libelle: 'Configuration', module: 'Administration', type: 'menu', parentKey: 'menu.administration' },
    { key: 'menu.administration.permissions', libelle: 'Permissions', module: 'Administration', type: 'menu', parentKey: 'menu.administration' },
    { key: 'action.administration.utilisateur.creer', libelle: 'Créer un utilisateur', module: 'Administration', type: 'action', parentKey: 'menu.administration.utilisateurs' },
    { key: 'action.administration.utilisateur.modifier', libelle: 'Modifier un utilisateur', module: 'Administration', type: 'action', parentKey: 'menu.administration.utilisateurs' },
    { key: 'action.administration.utilisateur.supprimer', libelle: 'Supprimer un utilisateur', module: 'Administration', type: 'action', parentKey: 'menu.administration.utilisateurs' },
    { key: 'action.administration.permissions.gerer', libelle: 'Gérer les permissions', module: 'Administration', type: 'action', parentKey: 'menu.administration.permissions' },
    { key: 'action.administration.institution.modifier', libelle: 'Modifier l\'institution', module: 'Administration', type: 'action', parentKey: 'menu.administration.configuration' },
    { key: 'action.administration.institution.supprimer', libelle: 'Supprimer l\'institution', module: 'Administration', type: 'action', parentKey: 'menu.administration.configuration' },
    { key: 'action.administration.enseignant.inscrire', libelle: 'Inscrire un enseignant', module: 'Administration', type: 'action', parentKey: 'menu.administration.utilisateurs' },
    { key: 'action.administration.enseignant.generer-qr', libelle: 'Générer QR code enseignant', module: 'Administration', type: 'action', parentKey: 'menu.administration.qr-codes' },
    { key: 'action.administration.enseignant.supprimer', libelle: 'Supprimer un enseignant', module: 'Administration', type: 'action', parentKey: 'menu.administration.utilisateurs' },

    // ============ COMITÉ ORIENTATION ============
    { key: 'menu.comite-orientation', libelle: 'Comité orientation', module: 'Administration', type: 'menu' },
    { key: 'menu.comite-orientation.preinscriptions', libelle: 'Préinscriptions', module: 'Administration', type: 'menu', parentKey: 'menu.comite-orientation' },

    // ============ REPORTING ============
    { key: 'menu.reporting', libelle: 'Reporting', module: 'Reporting', type: 'menu' },
    { key: 'menu.reporting.dashboard', libelle: 'Dashboard', module: 'Reporting', type: 'menu', parentKey: 'menu.reporting' },
    { key: 'menu.reporting.effectifs', libelle: 'Effectifs', module: 'Reporting', type: 'menu', parentKey: 'menu.reporting' },
    { key: 'menu.reporting.notes', libelle: 'Notes', module: 'Reporting', type: 'menu', parentKey: 'menu.reporting' },
    { key: 'menu.reporting.paiements', libelle: 'Paiements', module: 'Reporting', type: 'menu', parentKey: 'menu.reporting' },
    { key: 'menu.reporting.rh', libelle: 'RH', module: 'Reporting', type: 'menu', parentKey: 'menu.reporting' },

    // ============ COMMUNICATION ============
    { key: 'menu.communication', libelle: 'Communication', module: 'Communication', type: 'menu' },
    { key: 'menu.communication.vie-estudiantine', libelle: 'Vie estudiantine', module: 'Communication', type: 'menu', parentKey: 'menu.communication' },
    { key: 'menu.communication.messagerie', libelle: 'Messagerie', module: 'Communication', type: 'menu', parentKey: 'menu.communication' },
    { key: 'menu.communication.discussions', libelle: 'Discussions', module: 'Communication', type: 'menu', parentKey: 'menu.communication' },
    { key: 'menu.communication.suggestions', libelle: 'Suggestions', module: 'Communication', type: 'menu', parentKey: 'menu.communication' },
    { key: 'menu.communication.annonces', libelle: 'Annonces', module: 'Communication', type: 'menu', parentKey: 'menu.communication' },

    // ============ PARAMÈTRES ============
    { key: 'menu.parametres', libelle: 'Paramètres', module: 'Paramètres', type: 'menu' },
    { key: 'menu.parametres.mon-profil', libelle: 'Mon profil', module: 'Paramètres', type: 'menu', parentKey: 'menu.parametres' },
    { key: 'menu.parametres.mon-compte', libelle: 'Mon compte', module: 'Paramètres', type: 'menu', parentKey: 'menu.parametres' },
    { key: 'menu.parametres.configuration', libelle: 'Configuration', module: 'Paramètres', type: 'menu', parentKey: 'menu.parametres' },
    { key: 'menu.parametres.configuration.ecole', libelle: 'École', module: 'Paramètres', type: 'menu', parentKey: 'menu.parametres.configuration' },
    { key: 'menu.parametres.configuration.annees-scolaires', libelle: 'Années scol.', module: 'Paramètres', type: 'menu', parentKey: 'menu.parametres.configuration' },
    { key: 'menu.parametres.configuration.frais', libelle: 'Frais', module: 'Paramètres', type: 'menu', parentKey: 'menu.parametres.configuration' },
    { key: 'menu.parametres.configuration.notifications', libelle: 'Notifications', module: 'Paramètres', type: 'menu', parentKey: 'menu.parametres.configuration' },
    { key: 'menu.parametres.configuration.systeme', libelle: 'Système', module: 'Paramètres', type: 'menu', parentKey: 'menu.parametres.configuration' },
    { key: 'menu.parametres.configuration.sauvegardes', libelle: 'Sauvegardes', module: 'Paramètres', type: 'menu', parentKey: 'menu.parametres.configuration' },
    { key: 'menu.parametres.roles', libelle: 'Rôles', module: 'Paramètres', type: 'menu', parentKey: 'menu.parametres' },
    { key: 'menu.parametres.permissions', libelle: 'Permissions', module: 'Paramètres', type: 'menu', parentKey: 'menu.parametres' },
    { key: 'action.parametres.configuration.modifier', libelle: 'Modifier la config.', module: 'Paramètres', type: 'action', parentKey: 'menu.parametres.configuration' },
];

export class PermissionSeed {
    static async init(): Promise<void> {
        try {
            const count = await Permission.count();
            if (count > 0) {
                return;
            }

            for (const perm of ALL_PERMISSIONS) {
                await Permission.findOrCreate({
                    where: { key: perm.key },
                    defaults: {
                        key: perm.key,
                        libelle: perm.libelle,
                        module: perm.module,
                        type: perm.type,
                        parentKey: perm.parentKey ?? null
                    }
                });
            }
        } catch (error) {
            console.error('Erreur lors du seed des permissions:', error);
        }
    }
}
