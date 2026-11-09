/**
 * Définition des guides par profil.
 *
 * L'ordre du tableau est celui des guides générés et de l'index.
 * - `dossier`  : dossier d'images sous docs/guide/images/<dossier>/.
 * - `sources`  : sélection explicite de fichiers (plusieurs dossiers possibles).
 * - `fichiers` : si absent, toutes les images du dossier sont reprises.
 * - `exclure`  : noms de fichiers à ignorer dans une source de dossier.
 *
 * Pour ajouter un profil : créer le dossier d'images correspondant puis
 * ajouter une entrée ici. Le catalogue de descriptions est dans ecrans.cjs.
 */
const PROFILS = [
  {
    cle: 'audit',
    titre: 'Audit & contrôle',
    resume: "Contrôle des traces, notes et mouvements de caisse. Aucun rôle distinct « Audit » n'a été identifié dans les profils observés : les écrans de ce guide sont des vues d'administration et de supervision, et leur accès dépend des habilitations réellement attribuées.",
    sources: [
      {
        dossier: 'admin',
        fichiers: [
          '195_audits.png',
          '39_audit-notes.png',
          '103_journal-audit.png',
          '198_journal-audit-simulation.png',
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
    resume: "Encaissements, reçus, tarifs et suivi de caisse, suivi des impayés et imputation des bordereaux après leur contrôle par le Cabinet comptable.",
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
    resume: "Pilotage pédagogique transversal : consultation, création, modification et publication des emplois du temps du site actif autorisé, suivi des cours, évaluations et présences.",
  },
  {
    cle: 'secretaire',
    dossier: 'secretaire',
    titre: 'Secrétaire',
    resume: "Accueil et traitement administratif des demandes, préparation et impression des documents, suivi des dossiers de scolarité. Le secrétariat ne réalise pas d'encaissement.",
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
    sources: [
      {
        dossier: 'enseignant',
        exclure: ['09_cahiers-de-texte.png', '10_cahier-de-presence.png'],
      },
    ],
    titre: 'Enseignant',
    resume: "Enseignement et évaluation : consultation du planning attribué, cahiers de texte, présences, notes, bulletins, ressources et e-learning. La création et la publication des emplois du temps ne sont pas proposées au rôle Enseignant dans l'application actuelle.",
  },
  {
    cle: 'personnel-administratif',
    dossier: 'personnel-administratif',
    titre: 'Personnel administratif',
    resume: "Appui administratif : inscriptions, scolarité et documents selon les habilitations attribuées. Les opérations de caisse relèvent du Recouvrement (ESA Compta).",
  },
  {
    cle: 'ressources-humaines',
    dossier: 'ressources-humaines',
    titre: 'Ressources humaines',
    resume: "Gestion du personnel : employés, contrats, paie, congés, heures supplémentaires, prestataires et reportings RH.",
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
    resume: "Consultation des emplois du temps et suivi des présences et absences, dans la limite des sites autorisés au compte. Le guide ne contourne pas l'accès refusé lorsqu'aucun site n'est affecté.",
  },
];

module.exports = { PROFILS };
