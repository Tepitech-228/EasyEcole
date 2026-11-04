/**
 * Définition des guides par profil.
 *
 * L'ordre du tableau est celui des guides générés et de l'index.
 * - `dossier`  : dossier d'images sous docs/guide/images/<dossier>/.
 * - `sources`  : sélection explicite de fichiers (plusieurs dossiers possibles).
 * - `fichiers` : si absent, toutes les images du dossier sont reprises.
 *
 * Pour ajouter un profil : créer le dossier d'images correspondant puis
 * ajouter une entrée ici. Le catalogue de descriptions est dans ecrans.cjs.
 */
const PROFILS = [
  {
    cle: 'audit',
    titre: 'Audit & contrôle',
    resume: "Traçabilité des actions, contrôle des notes et des caisses, vérification des comptes et des habilitations. Ce guide rassemble les écrans d'audit du profil administrateur et les vues de contrôle du superviseur général.",
    sources: [
      {
        dossier: 'admin',
        fichiers: [
          '195_audits.png',
          '39_audit-notes.png',
          '103_journal-audit.png',
          '137_journal-caisse.png',
          '101_utilisateurs.png',
          '106_profils-dacces.png',
          '115_sauvegardes.png',
        ],
      },
      {
        dossier: 'superviseur-general',
        fichiers: ['18_historique.png', '21_rapports.png'],
      },
    ],
  },
  {
    cle: 'recouvrement',
    dossier: 'esa-compta',
    titre: 'Recouvrement (ESA Compta)',
    resume: "Suivi des impayés, authentification des bordereaux, imputation comptable et situation financière des étudiants. C'est le profil opérationnel du service recouvrement.",
  },
  {
    cle: 'comptable',
    dossier: 'cabinet-comptable',
    titre: 'Comptabilité (Cabinet comptable)',
    resume: "Contrôle des paiements et échéances, validation des bordereaux, comptabilité générale, immobilisations et reportings du cabinet comptable.",
  },
  {
    cle: 'comite-orientation',
    dossier: 'comite-orientation',
    titre: "Comité d'orientation",
    resume: "Traitement des préinscriptions, validation des dossiers en comité, campagnes de bourses et demandes de documents.",
  },
  {
    cle: 'etudiants',
    dossier: 'apprenant',
    titre: 'Étudiants (Apprenants)',
    resume: "Parcours de l'étudiant : inscription, dossier, réinscription, paiements et échéances, notes et bulletins, documents, vie estudiantine et e-learning.",
  },
  {
    cle: 'superviseur-general',
    dossier: 'superviseur-general',
    titre: 'Superviseur général',
    resume: "Pilotage pédagogique transversal : salles, emplois du temps, sessions d'examens, notes et délibérations, présence des enseignants et indicateurs de supervision.",
  },
  {
    cle: 'secretaire',
    dossier: 'secretaire',
    titre: 'Secrétaire',
    resume: "Accueil et traitement des dossiers : encaissements et caisse, demandes de documents, inscriptions, scolarité, notes, bulletins et appui administratif.",
  },
  {
    cle: 'institution',
    dossier: 'institution',
    titre: 'Direction (Institution)',
    resume: "Vue complète de l'établissement : pilotage, inscriptions, scolarité, finances, ressources humaines, qualité, documents officiels et administration.",
  },
  {
    cle: 'admin',
    dossier: 'admin',
    titre: 'Administrateur',
    resume: "Administration du système : comptes et rôles, configuration, sauvegardes, sécurité, menus, modules transverses et supervision technique.",
  },
  {
    cle: 'enseignant',
    dossier: 'enseignant',
    titre: 'Enseignant',
    resume: "Enseignement et évaluation : cahiers de texte, présences, notes, bulletins, conseils de classe, ressources et e-learning.",
  },
  {
    cle: 'personnel-administratif',
    dossier: 'personnel-administratif',
    titre: 'Personnel administratif',
    resume: "Appui administratif : inscriptions, scolarité, caisse, documents, notes et finances selon les habilitations attribuées.",
  },
  {
    cle: 'ressources-humaines',
    dossier: 'ressources-humaines',
    titre: 'Ressources humaines',
    resume: "Gestion du personnel : employés, contrats, paie, congés, heures supplémentaires, prestataires et reportings RH.",
  },
  {
    cle: 'caissier-banque',
    dossier: 'caissier-banque',
    titre: 'Caissier banque',
    resume: "Opérations de caisse et de banque : encaissements, paiements, situations financières, bordereaux et comptabilité.",
  },
  {
    cle: 'parent',
    dossier: 'parent',
    titre: "Espace parents",
    resume: "Suivi de l'enfant : dossier, notes et bulletins, absences, emploi du temps, paiements et demandes de documents.",
  },
  {
    cle: 'surveillant',
    dossier: 'surveillant',
    titre: 'Surveillant',
    resume: "Surveillance et discipline : emploi du temps, cahier de présence, absences et pointage.",
  },
];

module.exports = { PROFILS };
