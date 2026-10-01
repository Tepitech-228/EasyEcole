-- ============================================================================
-- 002 — Données de référence : rôles, permissions et liaisons
-- ============================================================================
--
-- GENERE par scripts/generate-migrations-from-sources.cjs
-- Source  : src/core/data/reference-data.ts
--
-- Remplace le module src/core/helpers/ensureReferenceData.ts, qui appliquait
-- ces mêmes listes à CHAQUE démarrage sans versionnement.
--
-- Contenu : 275 permissions, 10 rôles, 308 liaisons.
--
-- IDEMPOTENCE :
--  - permissions : résolution par la clé naturelle `key` (UNIQUE en base)
--  - rôles       : résolution par `nom`
--  - liaisons    : résolution par identifiants naturels + anti-doublon explicite
-- Aucun DELETE : une migration ne détruit jamais de données.
--
-- Remarque MySQL : la fonction VALUES() est dépréciée depuis 8.0.20 au profit
-- des alias de colonnes. Elle reste fonctionnelle ; elle est conservée ici pour
-- garantir la compatibilité avec lesversions MySQL antérieures.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. RÔLES
-- Pas de contrainte UNIQUE fiable sur aut_roles.nom : on fait un INSERT
-- conditionné puis un UPDATE, comme dans ensureReferenceData.ts.
-- ----------------------------------------------------------------------------

-- Rôle : Super Admin
INSERT INTO `aut_roles` (`nom`, `description`, `createdAt`, `updatedAt`)
SELECT 'Super Admin', 'Accès complet à toutes les fonctionnalités', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `aut_roles` WHERE `nom` = 'Super Admin');
UPDATE `aut_roles` SET `description` = 'Accès complet à toutes les fonctionnalités', `deletedAt` = NULL
WHERE `nom` = 'Super Admin';

-- Rôle : Directeur
INSERT INTO `aut_roles` (`nom`, `description`, `createdAt`, `updatedAt`)
SELECT 'Directeur', 'Direction de l''établissement', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `aut_roles` WHERE `nom` = 'Directeur');
UPDATE `aut_roles` SET `description` = 'Direction de l''établissement', `deletedAt` = NULL
WHERE `nom` = 'Directeur';

-- Rôle : Comptable
INSERT INTO `aut_roles` (`nom`, `description`, `createdAt`, `updatedAt`)
SELECT 'Comptable', 'Gestion financière et comptable', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `aut_roles` WHERE `nom` = 'Comptable');
UPDATE `aut_roles` SET `description` = 'Gestion financière et comptable', `deletedAt` = NULL
WHERE `nom` = 'Comptable';

-- Rôle : Enseignant
INSERT INTO `aut_roles` (`nom`, `description`, `createdAt`, `updatedAt`)
SELECT 'Enseignant', 'Corps enseignant', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `aut_roles` WHERE `nom` = 'Enseignant');
UPDATE `aut_roles` SET `description` = 'Corps enseignant', `deletedAt` = NULL
WHERE `nom` = 'Enseignant';

-- Rôle : Apprenant
INSERT INTO `aut_roles` (`nom`, `description`, `createdAt`, `updatedAt`)
SELECT 'Apprenant', 'Étudiant / Apprenant', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `aut_roles` WHERE `nom` = 'Apprenant');
UPDATE `aut_roles` SET `description` = 'Étudiant / Apprenant', `deletedAt` = NULL
WHERE `nom` = 'Apprenant';

-- Rôle : Parent
INSERT INTO `aut_roles` (`nom`, `description`, `createdAt`, `updatedAt`)
SELECT 'Parent', 'Parent d''apprenant', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `aut_roles` WHERE `nom` = 'Parent');
UPDATE `aut_roles` SET `description` = 'Parent d''apprenant', `deletedAt` = NULL
WHERE `nom` = 'Parent';

-- Rôle : Surveillant
INSERT INTO `aut_roles` (`nom`, `description`, `createdAt`, `updatedAt`)
SELECT 'Surveillant', 'Surveillance et discipline', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `aut_roles` WHERE `nom` = 'Surveillant');
UPDATE `aut_roles` SET `description` = 'Surveillance et discipline', `deletedAt` = NULL
WHERE `nom` = 'Surveillant';

-- Rôle : Bibliothécaire
INSERT INTO `aut_roles` (`nom`, `description`, `createdAt`, `updatedAt`)
SELECT 'Bibliothécaire', 'Gestion de la bibliothèque', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `aut_roles` WHERE `nom` = 'Bibliothécaire');
UPDATE `aut_roles` SET `description` = 'Gestion de la bibliothèque', `deletedAt` = NULL
WHERE `nom` = 'Bibliothécaire';

-- Rôle : ESA Compta
INSERT INTO `aut_roles` (`nom`, `description`, `createdAt`, `updatedAt`)
SELECT 'ESA Compta', 'Service Recouvrement (ESA-COMPTA)', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `aut_roles` WHERE `nom` = 'ESA Compta');
UPDATE `aut_roles` SET `description` = 'Service Recouvrement (ESA-COMPTA)', `deletedAt` = NULL
WHERE `nom` = 'ESA Compta';

-- Rôle : Institution
INSERT INTO `aut_roles` (`nom`, `description`, `createdAt`, `updatedAt`)
SELECT 'Institution', 'Établissement / Direction', NOW(), NOW() FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `aut_roles` WHERE `nom` = 'Institution');
UPDATE `aut_roles` SET `description` = 'Établissement / Direction', `deletedAt` = NULL
WHERE `nom` = 'Institution';

-- ----------------------------------------------------------------------------
-- 2. PERMISSIONS
-- ----------------------------------------------------------------------------

INSERT INTO `aut_permissions`
  (`key`, `libelle`, `module`, `type`, `parentKey`, `createdAt`, `updatedAt`)
VALUES
  ('menu.tableau-de-bord', 'Tableau de bord', 'Général', 'menu', NULL, NOW(), NOW()),
  ('menu.inscription', 'Inscription', 'Inscription', 'menu', NULL, NOW(), NOW()),
  ('menu.inscription.sessions', 'Sessions', 'Inscription', 'menu', 'menu.inscription', NOW(), NOW()),
  ('menu.inscription.parcours', 'Parcours', 'Inscription', 'menu', 'menu.inscription', NOW(), NOW()),
  ('menu.inscription.demandes', 'Demandes', 'Inscription', 'menu', 'menu.inscription', NOW(), NOW()),
  ('menu.inscription.cursus', 'Mon cursus', 'Inscription', 'menu', 'menu.inscription', NOW(), NOW()),
  ('menu.inscription.mon-dossier', 'Mon dossier', 'Inscription', 'menu', 'menu.inscription', NOW(), NOW()),
  ('menu.inscription.dossiers-etudiants', 'Dossiers étudiants', 'Inscription', 'menu', 'menu.inscription', NOW(), NOW()),
  ('menu.inscription.cartes', 'Cartes étudiantes', 'Inscription', 'menu', 'menu.inscription', NOW(), NOW()),
  ('menu.inscription.effectifs', 'Effectifs inscrits', 'Inscription', 'menu', 'menu.inscription', NOW(), NOW()),
  ('menu.inscription.paiements', 'Paiements', 'Inscription', 'menu', 'menu.inscription', NOW(), NOW()),
  ('menu.inscription.comptabilite', 'Comptabilité', 'Inscription', 'menu', 'menu.inscription', NOW(), NOW()),
  ('menu.inscription.bordereaux', 'Mes bordereaux', 'Inscription', 'menu', 'menu.inscription', NOW(), NOW()),
  ('menu.inscription.validation-bordereaux', 'Valid. bordereaux', 'Inscription', 'menu', 'menu.inscription', NOW(), NOW()),
  ('menu.inscription.echeances', 'Échéances', 'Inscription', 'menu', 'menu.inscription', NOW(), NOW()),
  ('menu.inscription.salles', 'Salles de classe', 'Inscription', 'menu', 'menu.inscription', NOW(), NOW()),
  ('action.inscription.session.creer', 'Créer une session', 'Inscription', 'action', 'menu.inscription.sessions', NOW(), NOW()),
  ('action.inscription.session.modifier', 'Modifier une session', 'Inscription', 'action', 'menu.inscription.sessions', NOW(), NOW()),
  ('action.inscription.session.supprimer', 'Supprimer une session', 'Inscription', 'action', 'menu.inscription.sessions', NOW(), NOW()),
  ('action.inscription.parcours.creer', 'Créer un parcours', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.parcours.modifier', 'Modifier un parcours', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.parcours.supprimer', 'Supprimer un parcours', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.demande.valider', 'Valider une demande', 'Inscription', 'action', 'menu.inscription.demandes', NOW(), NOW()),
  ('action.inscription.demande.rejeter', 'Rejeter une demande', 'Inscription', 'action', 'menu.inscription.demandes', NOW(), NOW()),
  ('action.inscription.bordereau.valider', 'Valider un bordereau', 'Inscription', 'action', 'menu.inscription.validation-bordereaux', NOW(), NOW()),
  ('action.inscription.echeance.generer', 'Générer des échéances', 'Inscription', 'action', 'menu.inscription.echeances', NOW(), NOW()),
  ('action.inscription.echeance.modifier', 'Modifier une échéance', 'Inscription', 'action', 'menu.inscription.echeances', NOW(), NOW()),
  ('action.inscription.dossier.generer', 'Générer un dossier étudiant', 'Inscription', 'action', 'menu.inscription.dossiers-etudiants', NOW(), NOW()),
  ('action.inscription.dossier.modifier-statut', 'Modifier statut dossier', 'Inscription', 'action', 'menu.inscription.dossiers-etudiants', NOW(), NOW()),
  ('action.inscription.cours.creer', 'Créer un cours', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.cours.modifier', 'Modifier un cours', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.cours.supprimer', 'Supprimer un cours', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.cours.assigner-enseignant', 'Assigner un enseignant', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.cours.retirer-enseignant', 'Retirer un enseignant', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.classe.creer', 'Créer une classe', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.classe.modifier', 'Modifier une classe', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.classe.supprimer', 'Supprimer une classe', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.salle.creer', 'Créer une salle', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.salle.modifier', 'Modifier une salle', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.salle.supprimer', 'Supprimer une salle', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `libelle`    = VALUES(`libelle`),
  `module`    = VALUES(`module`),
  `type`      = VALUES(`type`),
  `parentKey` = VALUES(`parentKey`),
  `deletedAt` = NULL;

INSERT INTO `aut_permissions`
  (`key`, `libelle`, `module`, `type`, `parentKey`, `createdAt`, `updatedAt`)
VALUES
  ('action.inscription.type-note.creer', 'Créer un type de note', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.type-note.modifier', 'Modifier un type de note', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.type-note.supprimer', 'Supprimer un type de note', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.niveau-etude.creer', 'Créer un niveau d''étude', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.niveau-etude.modifier', 'Modifier un niveau d''étude', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.niveau-etude.supprimer', 'Supprimer un niveau d''étude', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.prerequis.creer', 'Créer un prérequis', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.prerequis.modifier', 'Modifier un prérequis', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.prerequis.supprimer', 'Supprimer un prérequis', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.matiere-prerequis.creer', 'Créer une matière prérequis', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.matiere-prerequis.modifier', 'Modifier une matière prérequis', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.matiere-prerequis.supprimer', 'Supprimer une matière prérequis', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.annee-academique.creer', 'Créer une année académique', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.annee-academique.modifier', 'Modifier une année académique', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.annee-academique.supprimer', 'Supprimer une année académique', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.cursus.creer', 'Créer un cursus', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.cursus.modifier', 'Modifier un cursus', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.cursus.supprimer', 'Supprimer un cursus', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.apprenant.supprimer', 'Supprimer un apprenant', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('action.inscription.apprenant.generer-qr', 'Générer QR code apprenant', 'Inscription', 'action', 'menu.inscription.parcours', NOW(), NOW()),
  ('menu.orientation', 'Orientation', 'Orientation', 'menu', NULL, NOW(), NOW()),
  ('menu.orientation.parcours', 'Parcours', 'Orientation', 'menu', 'menu.orientation', NOW(), NOW()),
  ('menu.orientation.demandes', 'Demandes', 'Orientation', 'menu', 'menu.orientation', NOW(), NOW()),
  ('menu.orientation.comite', 'Commission orientation', 'Orientation', 'menu', 'menu.orientation', NOW(), NOW()),
  ('action.orientation.parcours.creer', 'Créer un parcours', 'Orientation', 'action', 'menu.orientation.parcours', NOW(), NOW()),
  ('action.orientation.parcours.modifier', 'Modifier un parcours', 'Orientation', 'action', 'menu.orientation.parcours', NOW(), NOW()),
  ('action.orientation.parcours.supprimer', 'Supprimer un parcours', 'Orientation', 'action', 'menu.orientation.parcours', NOW(), NOW()),
  ('action.orientation.prerequis.creer', 'Créer un prérequis', 'Orientation', 'action', 'menu.orientation.parcours', NOW(), NOW()),
  ('action.orientation.prerequis.modifier', 'Modifier un prérequis', 'Orientation', 'action', 'menu.orientation.parcours', NOW(), NOW()),
  ('action.orientation.prerequis.supprimer', 'Supprimer un prérequis', 'Orientation', 'action', 'menu.orientation.parcours', NOW(), NOW()),
  ('action.orientation.debouche.creer', 'Créer un débouché', 'Orientation', 'action', 'menu.orientation.parcours', NOW(), NOW()),
  ('action.orientation.debouche.modifier', 'Modifier un débouché', 'Orientation', 'action', 'menu.orientation.parcours', NOW(), NOW()),
  ('action.orientation.debouche.supprimer', 'Supprimer un débouché', 'Orientation', 'action', 'menu.orientation.parcours', NOW(), NOW()),
  ('action.orientation.categorie.creer', 'Créer une catégorie', 'Orientation', 'action', 'menu.orientation.parcours', NOW(), NOW()),
  ('action.orientation.categorie.modifier', 'Modifier une catégorie', 'Orientation', 'action', 'menu.orientation.parcours', NOW(), NOW()),
  ('action.orientation.categorie.supprimer', 'Supprimer une catégorie', 'Orientation', 'action', 'menu.orientation.parcours', NOW(), NOW()),
  ('action.orientation.matiere-prerequis.creer', 'Créer une matière prérequis', 'Orientation', 'action', 'menu.orientation.parcours', NOW(), NOW()),
  ('action.orientation.matiere-prerequis.modifier', 'Modifier une matière prérequis', 'Orientation', 'action', 'menu.orientation.parcours', NOW(), NOW()),
  ('action.orientation.matiere-prerequis.supprimer', 'Supprimer une matière prérequis', 'Orientation', 'action', 'menu.orientation.parcours', NOW(), NOW()),
  ('action.orientation.niveau-etude.creer', 'Créer un niveau d''étude', 'Orientation', 'action', 'menu.orientation.parcours', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `libelle`    = VALUES(`libelle`),
  `module`    = VALUES(`module`),
  `type`      = VALUES(`type`),
  `parentKey` = VALUES(`parentKey`),
  `deletedAt` = NULL;

INSERT INTO `aut_permissions`
  (`key`, `libelle`, `module`, `type`, `parentKey`, `createdAt`, `updatedAt`)
VALUES
  ('action.orientation.niveau-etude.modifier', 'Modifier un niveau d''étude', 'Orientation', 'action', 'menu.orientation.parcours', NOW(), NOW()),
  ('action.orientation.niveau-etude.supprimer', 'Supprimer un niveau d''étude', 'Orientation', 'action', 'menu.orientation.parcours', NOW(), NOW()),
  ('menu.cours', 'Cours', 'Cours', 'menu', NULL, NOW(), NOW()),
  ('menu.cours.enseignants', 'Enseignants', 'Cours', 'menu', 'menu.cours', NOW(), NOW()),
  ('menu.cours.liste', 'Cours', 'Cours', 'menu', 'menu.cours', NOW(), NOW()),
  ('menu.cours.presences', 'Présences', 'Cours', 'menu', 'menu.cours', NOW(), NOW()),
  ('menu.cours.mes-presences', 'Mes présences', 'Cours', 'menu', 'menu.cours', NOW(), NOW()),
  ('menu.cours.cahiers-de-texte', 'Cahiers de texte', 'Cours', 'menu', 'menu.cours', NOW(), NOW()),
  ('menu.cours.emplois-du-temps', 'Emplois du temps', 'Cours', 'menu', 'menu.cours', NOW(), NOW()),
  ('menu.cours.notes', 'Notes', 'Cours', 'menu', 'menu.cours', NOW(), NOW()),
  ('action.cours.enseignant.creer', 'Créer un enseignant', 'Cours', 'action', 'menu.cours.enseignants', NOW(), NOW()),
  ('action.cours.enseignant.modifier', 'Modifier un enseignant', 'Cours', 'action', 'menu.cours.enseignants', NOW(), NOW()),
  ('action.cours.cours.creer', 'Créer un cours', 'Cours', 'action', 'menu.cours.liste', NOW(), NOW()),
  ('action.cours.cours.modifier', 'Modifier un cours', 'Cours', 'action', 'menu.cours.liste', NOW(), NOW()),
  ('action.cours.cours.supprimer', 'Supprimer un cours', 'Cours', 'action', 'menu.cours.liste', NOW(), NOW()),
  ('action.cours.presence.generer', 'Générer une présence', 'Cours', 'action', 'menu.cours.presences', NOW(), NOW()),
  ('action.cours.note.saisir', 'Saisir des notes', 'Cours', 'action', 'menu.cours.notes', NOW(), NOW()),
  ('action.cours.note.modifier', 'Modifier des notes', 'Cours', 'action', 'menu.cours.notes', NOW(), NOW()),
  ('menu.evaluations', 'Évaluations', 'Évaluations', 'menu', NULL, NOW(), NOW()),
  ('menu.evaluations.bulletins', 'Bulletins', 'Évaluations', 'menu', 'menu.evaluations', NOW(), NOW()),
  ('menu.evaluations.deliberations', 'Délibérations', 'Évaluations', 'menu', 'menu.evaluations', NOW(), NOW()),
  ('menu.evaluations.moyennes', 'Moyennes', 'Évaluations', 'menu', 'menu.evaluations', NOW(), NOW()),
  ('menu.evaluations.mon-releve', 'Mon relevé', 'Évaluations', 'menu', 'menu.evaluations', NOW(), NOW()),
  ('action.evaluation.bulletin.generer', 'Générer un bulletin', 'Évaluations', 'action', 'menu.evaluations.bulletins', NOW(), NOW()),
  ('action.evaluation.deliberation.organiser', 'Organiser une délibération', 'Évaluations', 'action', 'menu.evaluations.deliberations', NOW(), NOW()),
  ('action.evaluation.moyenne.calculer', 'Calculer les moyennes', 'Évaluations', 'action', 'menu.evaluations.moyennes', NOW(), NOW()),
  ('action.evaluation.deliberation.creer', 'Créer une délibération', 'Évaluations', 'action', 'menu.evaluations.deliberations', NOW(), NOW()),
  ('action.evaluation.deliberation.modifier', 'Modifier une délibération', 'Évaluations', 'action', 'menu.evaluations.deliberations', NOW(), NOW()),
  ('action.evaluation.deliberation.supprimer', 'Supprimer une délibération', 'Évaluations', 'action', 'menu.evaluations.deliberations', NOW(), NOW()),
  ('action.evaluation.deliberation.charger-resultats', 'Charger des résultats', 'Évaluations', 'action', 'menu.evaluations.deliberations', NOW(), NOW()),
  ('action.evaluation.deliberation.modifier-resultat', 'Modifier un résultat', 'Évaluations', 'action', 'menu.evaluations.deliberations', NOW(), NOW()),
  ('action.evaluation.deliberation.cloturer', 'Clôturer une délibération', 'Évaluations', 'action', 'menu.evaluations.deliberations', NOW(), NOW()),
  ('action.evaluation.bulletin.modifier', 'Modifier un bulletin', 'Évaluations', 'action', 'menu.evaluations.bulletins', NOW(), NOW()),
  ('action.evaluation.bulletin.publier', 'Publier un bulletin', 'Évaluations', 'action', 'menu.evaluations.bulletins', NOW(), NOW()),
  ('action.evaluation.bulletin.supprimer', 'Supprimer un bulletin', 'Évaluations', 'action', 'menu.evaluations.bulletins', NOW(), NOW()),
  ('menu.evaluations.rattrapages', 'Rattrapages', 'Évaluations', 'menu', 'menu.evaluations', NOW(), NOW()),
  ('action.evaluation.rattrapage.assigner', 'Assigner automatiquement', 'Évaluations', 'action', 'menu.evaluations.rattrapages', NOW(), NOW()),
  ('action.evaluation.rattrapage.notifier', 'Notifier les étudiants', 'Évaluations', 'action', 'menu.evaluations.rattrapages', NOW(), NOW()),
  ('action.evaluation.rattrapage.saisir-notes', 'Saisir les notes', 'Évaluations', 'action', 'menu.evaluations.rattrapages', NOW(), NOW()),
  ('menu.scolarite', 'Scolarité', 'Scolarité', 'menu', NULL, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `libelle`    = VALUES(`libelle`),
  `module`    = VALUES(`module`),
  `type`      = VALUES(`type`),
  `parentKey` = VALUES(`parentKey`),
  `deletedAt` = NULL;

INSERT INTO `aut_permissions`
  (`key`, `libelle`, `module`, `type`, `parentKey`, `createdAt`, `updatedAt`)
VALUES
  ('menu.scolarite.demandes-docs', 'Demandes docs', 'Scolarité', 'menu', 'menu.scolarite', NOW(), NOW()),
  ('menu.scolarite.traiter-demandes', 'Traiter demandes', 'Scolarité', 'menu', 'menu.scolarite', NOW(), NOW()),
  ('menu.scolarite.reclamations', 'Réclamations', 'Scolarité', 'menu', 'menu.scolarite', NOW(), NOW()),
  ('menu.scolarite.traiter-reclamations', 'Traiter réclam.', 'Scolarité', 'menu', 'menu.scolarite', NOW(), NOW()),
  ('menu.scolarite.registres', 'Registres', 'Scolarité', 'menu', 'menu.scolarite', NOW(), NOW()),
  ('menu.scolarite.calendrier', 'Calendrier', 'Scolarité', 'menu', 'menu.scolarite', NOW(), NOW()),
  ('menu.scolarite.discipline', 'Discipline', 'Scolarité', 'menu', 'menu.scolarite', NOW(), NOW()),
  ('menu.scolarite.conseils', 'Conseils classe', 'Scolarité', 'menu', 'menu.scolarite', NOW(), NOW()),
  ('menu.scolarite.bibliotheque', 'Bibliothèque', 'Scolarité', 'menu', 'menu.scolarite', NOW(), NOW()),
  ('menu.scolarite.bibliotheque.gestion', 'Gestion bibliothèque', 'Scolarité', 'menu', 'menu.scolarite.bibliotheque', NOW(), NOW()),
  ('action.scolarite.document.traiter', 'Traiter un document', 'Scolarité', 'action', 'menu.scolarite.traiter-demandes', NOW(), NOW()),
  ('action.scolarite.reclamation.traiter', 'Traiter une réclamation', 'Scolarité', 'action', 'menu.scolarite.traiter-reclamations', NOW(), NOW()),
  ('action.scolarite.discipline.sanctionner', 'Ajouter une sanction', 'Scolarité', 'action', 'menu.scolarite.discipline', NOW(), NOW()),
  ('menu.elearning', 'E-Learning', 'E-Learning', 'menu', NULL, NOW(), NOW()),
  ('menu.elearning.mes-cours', 'Mes cours', 'E-Learning', 'menu', 'menu.elearning', NOW(), NOW()),
  ('menu.elearning.quiz', 'Quiz', 'E-Learning', 'menu', 'menu.elearning', NOW(), NOW()),
  ('menu.elearning.progression', 'Progression', 'E-Learning', 'menu', 'menu.elearning', NOW(), NOW()),
  ('menu.elearning.certificats', 'Certificats', 'E-Learning', 'menu', 'menu.elearning', NOW(), NOW()),
  ('menu.elearning.devoirs', 'Devoirs', 'E-Learning', 'menu', 'menu.elearning', NOW(), NOW()),
  ('menu.elearning.gestion', 'Gestion', 'E-Learning', 'menu', 'menu.elearning', NOW(), NOW()),
  ('menu.finances', 'Finances', 'Finances', 'menu', NULL, NOW(), NOW()),
  ('menu.finances.paiements', 'Paiements', 'Finances', 'menu', 'menu.finances', NOW(), NOW()),
  ('menu.finances.comptabilite', 'Comptabilité', 'Finances', 'menu', 'menu.finances', NOW(), NOW()),
  ('menu.finances.bordereaux', 'Mes bordereaux', 'Finances', 'menu', 'menu.finances', NOW(), NOW()),
  ('menu.finances.validation-bordereaux', 'Valid. bordereaux', 'Finances', 'menu', 'menu.finances', NOW(), NOW()),
  ('menu.finances.impayes', 'Étudiants en situation irrégulière', 'Finances', 'menu', 'menu.finances', NOW(), NOW()),
  ('menu.finances.situation-financiere', 'Situation financière', 'Finances', 'menu', 'menu.finances', NOW(), NOW()),
  ('action.finances.paiement.enregistrer', 'Enregistrer un paiement', 'Finances', 'action', 'menu.finances.paiements', NOW(), NOW()),
  ('action.finances.paiement.annuler', 'Annuler un paiement', 'Finances', 'action', 'menu.finances.paiements', NOW(), NOW()),
  ('action.finances.comptabilite.consulter', 'Consulter la compta', 'Finances', 'action', 'menu.finances.comptabilite', NOW(), NOW()),
  ('action.comptabilite.journal.creer', 'Créer un journal comptable', 'Finances', 'action', 'menu.finances.comptabilite', NOW(), NOW()),
  ('action.comptabilite.ecriture.valider', 'Valider une écriture comptable', 'Finances', 'action', 'menu.finances.comptabilite', NOW(), NOW()),
  ('menu.achats', 'Achats', 'Achats', 'menu', NULL, NOW(), NOW()),
  ('menu.achats.demandes', 'Demandes achat', 'Achats', 'menu', 'menu.achats', NOW(), NOW()),
  ('menu.achats.commandes', 'Commandes', 'Achats', 'menu', 'menu.achats', NOW(), NOW()),
  ('menu.achats.factures', 'Factures', 'Achats', 'menu', 'menu.achats', NOW(), NOW()),
  ('menu.achats.fournisseurs', 'Fournisseurs', 'Achats', 'menu', 'menu.achats', NOW(), NOW()),
  ('menu.achats.budgets', 'Budgets', 'Achats', 'menu', 'menu.achats', NOW(), NOW()),
  ('menu.stocks', 'Stocks', 'Stocks', 'menu', NULL, NOW(), NOW()),
  ('menu.stocks.articles', 'Articles', 'Stocks', 'menu', 'menu.stocks', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `libelle`    = VALUES(`libelle`),
  `module`    = VALUES(`module`),
  `type`      = VALUES(`type`),
  `parentKey` = VALUES(`parentKey`),
  `deletedAt` = NULL;

INSERT INTO `aut_permissions`
  (`key`, `libelle`, `module`, `type`, `parentKey`, `createdAt`, `updatedAt`)
VALUES
  ('menu.stocks.categories', 'Catégories', 'Stocks', 'menu', 'menu.stocks', NOW(), NOW()),
  ('menu.stocks.mouvements', 'Mouvements', 'Stocks', 'menu', 'menu.stocks', NOW(), NOW()),
  ('menu.stocks.besoins', 'Besoins', 'Stocks', 'menu', 'menu.stocks', NOW(), NOW()),
  ('menu.stocks.demandes-prix', 'Demandes de prix', 'Stocks', 'menu', 'menu.stocks', NOW(), NOW()),
  ('menu.stocks.transferts', 'Transferts', 'Stocks', 'menu', 'menu.stocks', NOW(), NOW()),
  ('menu.stocks.corrections', 'Corrections', 'Stocks', 'menu', 'menu.stocks', NOW(), NOW()),
  ('menu.stocks.rebuts', 'Rebuts', 'Stocks', 'menu', 'menu.stocks', NOW(), NOW()),
  ('menu.stocks.inventaires', 'Inventaires', 'Stocks', 'menu', 'menu.stocks', NOW(), NOW()),
  ('menu.stocks.fournisseurs-stock', 'Fournisseurs', 'Stocks', 'menu', 'menu.stocks', NOW(), NOW()),
  ('menu.stocks.reportings', 'Reportings', 'Stocks', 'menu', 'menu.stocks', NOW(), NOW()),
  ('menu.stocks.cycle-vie', 'Cycle de vie', 'Stocks', 'menu', 'menu.stocks', NOW(), NOW()),
  ('menu.immobilisations', 'Immobilisations', 'Immobilisations', 'menu', NULL, NOW(), NOW()),
  ('menu.immobilisations.liste', 'Immobilisations', 'Immobilisations', 'menu', 'menu.immobilisations', NOW(), NOW()),
  ('menu.immobilisations.sites', 'Sites', 'Immobilisations', 'menu', 'menu.immobilisations', NOW(), NOW()),
  ('menu.immobilisations.categories', 'Catégories', 'Immobilisations', 'menu', 'menu.immobilisations', NOW(), NOW()),
  ('menu.immobilisations.affectations', 'Affectations', 'Immobilisations', 'menu', 'menu.immobilisations', NOW(), NOW()),
  ('menu.immobilisations.assurances', 'Assurances', 'Immobilisations', 'menu', 'menu.immobilisations', NOW(), NOW()),
  ('menu.immobilisations.sorties-provisoires', 'Sorties provisoires', 'Immobilisations', 'menu', 'menu.immobilisations', NOW(), NOW()),
  ('menu.immobilisations.cessions', 'Cessions', 'Immobilisations', 'menu', 'menu.immobilisations', NOW(), NOW()),
  ('menu.immobilisations.rebuts', 'Mises au rebut', 'Immobilisations', 'menu', 'menu.immobilisations', NOW(), NOW()),
  ('menu.immobilisations.maintenance', 'Maintenance', 'Immobilisations', 'menu', 'menu.immobilisations', NOW(), NOW()),
  ('menu.immobilisations.inventaires', 'Inventaires', 'Immobilisations', 'menu', 'menu.immobilisations', NOW(), NOW()),
  ('menu.immobilisations.reportings', 'Reportings', 'Immobilisations', 'menu', 'menu.immobilisations', NOW(), NOW()),
  ('menu.stages', 'Stages', 'Stages', 'menu', NULL, NOW(), NOW()),
  ('menu.stages.offres', 'Offres de stage', 'Stages', 'menu', 'menu.stages', NOW(), NOW()),
  ('menu.stages.demandes-stage', 'Demandes stage', 'Stages', 'menu', 'menu.stages', NOW(), NOW()),
  ('menu.stages.entreprises', 'Entreprises', 'Stages', 'menu', 'menu.stages', NOW(), NOW()),
  ('menu.rh', 'Ressources Humaines', 'R.H', 'menu', NULL, NOW(), NOW()),
  ('menu.rh.employes', 'Employés', 'R.H', 'menu', 'menu.rh', NOW(), NOW()),
  ('menu.rh.offres-emploi', 'Offres d''emploi', 'R.H', 'menu', 'menu.rh', NOW(), NOW()),
  ('menu.rh.candidatures', 'Candidatures', 'R.H', 'menu', 'menu.rh', NOW(), NOW()),
  ('menu.rh.categories-professionnelles', 'Catégories professionnelles', 'R.H', 'menu', 'menu.rh', NOW(), NOW()),
  ('menu.rh.grilles-salariales', 'Grilles salariales', 'R.H', 'menu', 'menu.rh', NOW(), NOW()),
  ('menu.rh.paie', 'Paie', 'R.H', 'menu', 'menu.rh', NOW(), NOW()),
  ('menu.rh.heures-supplementaires', 'Heures supplémentaires', 'R.H', 'menu', 'menu.rh', NOW(), NOW()),
  ('menu.rh.prets', 'Prêts / Avances', 'R.H', 'menu', 'menu.rh', NOW(), NOW()),
  ('menu.rh.prestations', 'Prestations', 'R.H', 'menu', 'menu.rh', NOW(), NOW()),
  ('menu.rh.formations', 'Formations', 'R.H', 'menu', 'menu.rh', NOW(), NOW()),
  ('menu.rh.evaluations', 'Évaluations', 'R.H', 'menu', 'menu.rh', NOW(), NOW()),
  ('menu.rh.reportings', 'Reportings RH', 'R.H', 'menu', 'menu.rh', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `libelle`    = VALUES(`libelle`),
  `module`    = VALUES(`module`),
  `type`      = VALUES(`type`),
  `parentKey` = VALUES(`parentKey`),
  `deletedAt` = NULL;

INSERT INTO `aut_permissions`
  (`key`, `libelle`, `module`, `type`, `parentKey`, `createdAt`, `updatedAt`)
VALUES
  ('action.rh.employe.creer', 'Créer un employé', 'R.H', 'action', 'menu.rh.employes', NOW(), NOW()),
  ('action.rh.employe.modifier', 'Modifier un employé', 'R.H', 'action', 'menu.rh.employes', NOW(), NOW()),
  ('action.rh.paie.generer', 'Générer la paie', 'R.H', 'action', 'menu.rh.paie', NOW(), NOW()),
  ('menu.pointage', 'Pointage', 'Pointage', 'menu', NULL, NOW(), NOW()),
  ('menu.pointage.terminal', 'Terminal', 'Pointage', 'menu', 'menu.pointage', NOW(), NOW()),
  ('menu.pointage.historique', 'Historique', 'Pointage', 'menu', 'menu.pointage', NOW(), NOW()),
  ('menu.pointage.shifts', 'Shifts', 'Pointage', 'menu', 'menu.pointage', NOW(), NOW()),
  ('menu.pointage.absences', 'Absences', 'Pointage', 'menu', 'menu.pointage', NOW(), NOW()),
  ('menu.pointage.planning', 'Planning', 'Pointage', 'menu', 'menu.pointage', NOW(), NOW()),
  ('menu.pointage.rapports', 'Rapports', 'Pointage', 'menu', 'menu.pointage', NOW(), NOW()),
  ('menu.administration', 'Administration', 'Administration', 'menu', NULL, NOW(), NOW()),
  ('menu.administration.utilisateurs', 'Utilisateurs', 'Administration', 'menu', 'menu.administration', NOW(), NOW()),
  ('menu.administration.roles', 'Rôles', 'Administration', 'menu', 'menu.administration', NOW(), NOW()),
  ('menu.administration.qr-codes', 'QR Codes', 'Administration', 'menu', 'menu.administration', NOW(), NOW()),
  ('menu.administration.cartes', 'Cartes', 'Administration', 'menu', 'menu.administration', NOW(), NOW()),
  ('menu.administration.journal-audit', 'Journal audit', 'Administration', 'menu', 'menu.administration', NOW(), NOW()),
  ('menu.administration.configuration', 'Configuration', 'Administration', 'menu', 'menu.administration', NOW(), NOW()),
  ('menu.administration.permissions', 'Permissions', 'Administration', 'menu', 'menu.administration', NOW(), NOW()),
  ('action.administration.utilisateur.creer', 'Créer un utilisateur', 'Administration', 'action', 'menu.administration.utilisateurs', NOW(), NOW()),
  ('action.administration.utilisateur.modifier', 'Modifier un utilisateur', 'Administration', 'action', 'menu.administration.utilisateurs', NOW(), NOW()),
  ('action.administration.utilisateur.supprimer', 'Supprimer un utilisateur', 'Administration', 'action', 'menu.administration.utilisateurs', NOW(), NOW()),
  ('action.administration.permissions.gerer', 'Gérer les permissions', 'Administration', 'action', 'menu.administration.permissions', NOW(), NOW()),
  ('action.administration.institution.modifier', 'Modifier l''institution', 'Administration', 'action', 'menu.administration.configuration', NOW(), NOW()),
  ('action.administration.institution.supprimer', 'Supprimer l''institution', 'Administration', 'action', 'menu.administration.configuration', NOW(), NOW()),
  ('action.administration.enseignant.inscrire', 'Inscrire un enseignant', 'Administration', 'action', 'menu.administration.utilisateurs', NOW(), NOW()),
  ('action.administration.enseignant.generer-qr', 'Générer QR code enseignant', 'Administration', 'action', 'menu.administration.qr-codes', NOW(), NOW()),
  ('action.administration.enseignant.supprimer', 'Supprimer un enseignant', 'Administration', 'action', 'menu.administration.utilisateurs', NOW(), NOW()),
  ('menu.etablissements', 'Etablissements', 'Inscription', 'menu', 'menu.inscription', NOW(), NOW()),
  ('action.etablissement.creer', 'Creer un etablissement', 'Inscription', 'action', 'menu.etablissements', NOW(), NOW()),
  ('action.etablissement.modifier', 'Modifier un etablissement', 'Inscription', 'action', 'menu.etablissements', NOW(), NOW()),
  ('action.etablissement.supprimer', 'Supprimer un etablissement', 'Inscription', 'action', 'menu.etablissements', NOW(), NOW()),
  ('action.immobilisation.rebut.creer', 'Creer un rebut', 'Immobilisations', 'action', 'menu.immobilisations.rebuts', NOW(), NOW()),
  ('action.stocks.transfert.creer', 'Creer un transfert', 'Stocks', 'action', 'menu.stocks', NOW(), NOW()),
  ('action.stocks.transfert.annuler', 'Annuler un transfert', 'Stocks', 'action', 'menu.stocks', NOW(), NOW()),
  ('menu.comite-orientation', 'Comité orientation', 'Administration', 'menu', NULL, NOW(), NOW()),
  ('menu.comite-orientation.preinscriptions', 'Préinscriptions', 'Administration', 'menu', 'menu.comite-orientation', NOW(), NOW()),
  ('menu.reporting', 'Reporting', 'Reporting', 'menu', NULL, NOW(), NOW()),
  ('menu.reporting.dashboard', 'Dashboard', 'Reporting', 'menu', 'menu.reporting', NOW(), NOW()),
  ('menu.reporting.effectifs', 'Effectifs', 'Reporting', 'menu', 'menu.reporting', NOW(), NOW()),
  ('menu.reporting.notes', 'Notes', 'Reporting', 'menu', 'menu.reporting', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `libelle`    = VALUES(`libelle`),
  `module`    = VALUES(`module`),
  `type`      = VALUES(`type`),
  `parentKey` = VALUES(`parentKey`),
  `deletedAt` = NULL;

INSERT INTO `aut_permissions`
  (`key`, `libelle`, `module`, `type`, `parentKey`, `createdAt`, `updatedAt`)
VALUES
  ('menu.reporting.paiements', 'Paiements', 'Reporting', 'menu', 'menu.reporting', NOW(), NOW()),
  ('menu.reporting.rh', 'RH', 'Reporting', 'menu', 'menu.reporting', NOW(), NOW()),
  ('menu.communication', 'Communication', 'Communication', 'menu', NULL, NOW(), NOW()),
  ('menu.communication.vie-estudiantine', 'Vie estudiantine', 'Communication', 'menu', 'menu.communication', NOW(), NOW()),
  ('menu.communication.messagerie', 'Messagerie', 'Communication', 'menu', 'menu.communication', NOW(), NOW()),
  ('menu.communication.discussions', 'Discussions', 'Communication', 'menu', 'menu.communication', NOW(), NOW()),
  ('menu.communication.suggestions', 'Suggestions', 'Communication', 'menu', 'menu.communication', NOW(), NOW()),
  ('menu.communication.annonces', 'Annonces', 'Communication', 'menu', 'menu.communication', NOW(), NOW()),
  ('menu.parametres', 'Paramètres', 'Paramètres', 'menu', NULL, NOW(), NOW()),
  ('menu.parametres.mon-profil', 'Mon profil', 'Paramètres', 'menu', 'menu.parametres', NOW(), NOW()),
  ('menu.parametres.mon-compte', 'Mon compte', 'Paramètres', 'menu', 'menu.parametres', NOW(), NOW()),
  ('menu.parametres.configuration', 'Configuration', 'Paramètres', 'menu', 'menu.parametres', NOW(), NOW()),
  ('menu.parametres.configuration.ecole', 'École', 'Paramètres', 'menu', 'menu.parametres.configuration', NOW(), NOW()),
  ('menu.parametres.configuration.annees-scolaires', 'Années scol.', 'Paramètres', 'menu', 'menu.parametres.configuration', NOW(), NOW()),
  ('menu.parametres.configuration.frais', 'Frais', 'Paramètres', 'menu', 'menu.parametres.configuration', NOW(), NOW()),
  ('menu.parametres.configuration.notifications', 'Notifications', 'Paramètres', 'menu', 'menu.parametres.configuration', NOW(), NOW()),
  ('menu.parametres.configuration.systeme', 'Système', 'Paramètres', 'menu', 'menu.parametres.configuration', NOW(), NOW()),
  ('menu.parametres.configuration.sauvegardes', 'Sauvegardes', 'Paramètres', 'menu', 'menu.parametres.configuration', NOW(), NOW()),
  ('menu.parametres.roles', 'Rôles', 'Paramètres', 'menu', 'menu.parametres', NOW(), NOW()),
  ('menu.parametres.permissions', 'Permissions', 'Paramètres', 'menu', 'menu.parametres', NOW(), NOW()),
  ('action.parametres.configuration.modifier', 'Modifier la config.', 'Paramètres', 'action', 'menu.parametres.configuration', NOW(), NOW()),
  ('action.finance.bordereau.voir', 'Consulter les bordereaux financiers', 'Finance', 'action', NULL, NOW(), NOW()),
  ('action.finance.bordereau.imputer', 'Prévisualiser/imputer un bordereau', 'Finance', 'action', NULL, NOW(), NOW()),
  ('action.finance.bordereau.saisir', 'Saisir un bordereau financier', 'Finance', 'action', NULL, NOW(), NOW()),
  ('menu.bourses', 'Bourses', 'Bourses', 'menu', NULL, NOW(), NOW()),
  ('menu.bourses.configurations', 'Configurations', 'Bourses', 'menu', 'menu.bourses', NOW(), NOW()),
  ('menu.bourses.attributions', 'Attributions', 'Bourses', 'menu', 'menu.bourses', NOW(), NOW()),
  ('action.bourse.configuration.creer', 'Créer une configuration de bourse', 'Bourses', 'action', 'menu.bourses.configurations', NOW(), NOW()),
  ('action.bourse.configuration.modifier', 'Modifier une configuration de bourse', 'Bourses', 'action', 'menu.bourses.configurations', NOW(), NOW()),
  ('action.bourse.attribution.creer', 'Attribuer une bourse', 'Bourses', 'action', 'menu.bourses.attributions', NOW(), NOW()),
  ('action.bourse.attribution.modifier', 'Modifier une attribution de bourse', 'Bourses', 'action', 'menu.bourses.attributions', NOW(), NOW()),
  ('action.bourse.attribution.suspendre', 'Suspendre une bourse', 'Bourses', 'action', 'menu.bourses.attributions', NOW(), NOW()),
  ('action.bourse.attribution.reactiver', 'Réactiver une bourse', 'Bourses', 'action', 'menu.bourses.attributions', NOW(), NOW()),
  ('menu.bourses.campagne', 'Campagne de bourses', 'Bourses', 'menu', 'menu.bourses', NOW(), NOW()),
  ('action.bourse.campagne.creer', 'Créer une campagne de bourses (attribution en masse)', 'Bourses', 'action', 'menu.bourses.campagne', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `libelle`    = VALUES(`libelle`),
  `module`    = VALUES(`module`),
  `type`      = VALUES(`type`),
  `parentKey` = VALUES(`parentKey`),
  `deletedAt` = NULL;

-- ----------------------------------------------------------------------------
-- 3. LIAISONS RÔLE ↔ PERMISSION
--
-- Le SELECT anti-doublon (`NOT EXISTS`) est délibéré : il rend la migration
-- idempotente même si l'index UNIQUE (roleId, permissionId) n'existe pas
-- encore en base. Garantir l'idempotence par le schéma serait fragile ;
-- on la garantit donc par la requête.
--
-- Si un rôle ou une permission référencée n'existe pas, la liaison est
-- simplement ignorée (0 ligne affectée) : la migration ne casse pas.
-- ----------------------------------------------------------------------------

INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.tableau-de-bord'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.sessions'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.parcours'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.demandes'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.dossiers-etudiants'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.cartes'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.effectifs'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.paiements'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.comptabilite'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.validation-bordereaux'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.echeances'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.inscription.session.creer'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.inscription.session.modifier'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.inscription.session.supprimer'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.inscription.parcours.creer'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.inscription.parcours.modifier'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.inscription.parcours.supprimer'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.inscription.demande.valider'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.inscription.demande.rejeter'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.inscription.echeance.generer'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.inscription.dossier.generer'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.inscription.dossier.modifier-statut'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.orientation'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.orientation.parcours'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.orientation.demandes'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.cours'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.cours.enseignants'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.cours.liste'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.cours.presences'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.cours.emplois-du-temps'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.cours.notes'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.cours.enseignant.creer'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.cours.enseignant.modifier'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.cours.cours.creer'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.cours.cours.modifier'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.cours.cours.supprimer'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.cours.note.saisir'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.cours.note.modifier'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.evaluations'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.evaluations.bulletins'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.evaluations.deliberations'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.evaluations.moyennes'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.evaluation.bulletin.generer'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.evaluation.deliberation.organiser'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.evaluation.moyenne.calculer'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.evaluations.rattrapages'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.evaluation.rattrapage.assigner'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.evaluation.rattrapage.notifier'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.evaluation.rattrapage.saisir-notes'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.scolarite'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.scolarite.demandes-docs'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.scolarite.traiter-demandes'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.scolarite.reclamations'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.scolarite.traiter-reclamations'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.scolarite.registres'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.scolarite.calendrier'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.scolarite.discipline'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.scolarite.conseils'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.scolarite.document.traiter'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.scolarite.reclamation.traiter'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.scolarite.discipline.sanctionner'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.finances'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.finances.paiements'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.finances.comptabilite'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.finances.bordereaux'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.finances.validation-bordereaux'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.finances.impayes'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.finances.situation-financiere'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.finances.paiement.enregistrer'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.finances.paiement.annuler'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.stocks'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.stocks.articles'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.stocks.mouvements'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations.liste'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations.sites'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations.categories'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations.affectations'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations.assurances'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations.sorties-provisoires'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations.cessions'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations.rebuts'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations.maintenance'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations.inventaires'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations.reportings'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.rh'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.rh.employes'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.rh.paie'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.rh.employe.creer'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.rh.employe.modifier'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.rh.paie.generer'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.pointage'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.pointage.historique'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.pointage.rapports'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.reporting'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.reporting.dashboard'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.reporting.effectifs'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.reporting.notes'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.reporting.paiements'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.communication'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.communication.vie-estudiantine'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.communication.messagerie'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.communication.annonces'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres.mon-profil'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres.mon-compte'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres.configuration'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.tableau-de-bord'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.paiements'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.comptabilite'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.bordereaux'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.validation-bordereaux'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.echeances'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.inscription.bordereau.valider'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.inscription.echeance.generer'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.inscription.echeance.modifier'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.finances'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.finances.paiements'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.finances.comptabilite'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.finances.bordereaux'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.finances.validation-bordereaux'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.finances.impayes'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.finances.situation-financiere'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.finances.paiement.enregistrer'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.finances.paiement.annuler'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.finances.comptabilite.consulter'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations.liste'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations.sites'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations.categories'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations.affectations'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations.assurances'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations.sorties-provisoires'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations.cessions'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations.rebuts'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations.maintenance'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations.inventaires'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.immobilisations.reportings'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.reporting'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.reporting.paiements'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres.mon-profil'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres.mon-compte'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.tableau-de-bord'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.cours'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.cours.liste'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.cours.presences'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.cours.mes-presences'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.cours.cahiers-de-texte'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.cours.emplois-du-temps'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.cours.notes'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.cours.cours.creer'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.cours.cours.modifier'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.cours.presence.generer'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.cours.note.saisir'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.cours.note.modifier'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.evaluations'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.evaluations.bulletins'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.evaluations.moyennes'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.evaluations.mon-releve'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.evaluation.bulletin.generer'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.evaluations.rattrapages'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.scolarite'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.scolarite.calendrier'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.communication'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.communication.messagerie'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres.mon-profil'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres.mon-compte'
 WHERE r.`nom` = 'Enseignant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.tableau-de-bord'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.cursus'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.mon-dossier'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.paiements'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.bordereaux'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.echeances'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.cours'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.cours.mes-presences'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.cours.emplois-du-temps'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.cours.notes'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.evaluations'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.evaluations.mon-releve'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.elearning'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.elearning.mes-cours'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.elearning.quiz'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.elearning.progression'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.elearning.certificats'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.elearning.devoirs'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.stages'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.stages.offres'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.stages.demandes-stage'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.communication'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.communication.vie-estudiantine'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.communication.messagerie'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.communication.discussions'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.communication.suggestions'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.communication.annonces'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres.mon-profil'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres.mon-compte'
 WHERE r.`nom` = 'Apprenant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.communication'
 WHERE r.`nom` = 'Parent'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.communication.messagerie'
 WHERE r.`nom` = 'Parent'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.cours'
 WHERE r.`nom` = 'Parent'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.cours.emplois-du-temps'
 WHERE r.`nom` = 'Parent'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.evaluations'
 WHERE r.`nom` = 'Parent'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.evaluations.mon-releve'
 WHERE r.`nom` = 'Parent'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription'
 WHERE r.`nom` = 'Parent'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.cursus'
 WHERE r.`nom` = 'Parent'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.mon-dossier'
 WHERE r.`nom` = 'Parent'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres'
 WHERE r.`nom` = 'Parent'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres.mon-compte'
 WHERE r.`nom` = 'Parent'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres.mon-profil'
 WHERE r.`nom` = 'Parent'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.scolarite'
 WHERE r.`nom` = 'Parent'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.scolarite.demandes-docs'
 WHERE r.`nom` = 'Parent'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.scolarite.reclamations'
 WHERE r.`nom` = 'Parent'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.tableau-de-bord'
 WHERE r.`nom` = 'Parent'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.scolarite.discipline.sanctionner'
 WHERE r.`nom` = 'Surveillant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.communication'
 WHERE r.`nom` = 'Surveillant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.communication.messagerie'
 WHERE r.`nom` = 'Surveillant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.cours'
 WHERE r.`nom` = 'Surveillant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.cours.emplois-du-temps'
 WHERE r.`nom` = 'Surveillant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.cours.presences'
 WHERE r.`nom` = 'Surveillant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres'
 WHERE r.`nom` = 'Surveillant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres.mon-compte'
 WHERE r.`nom` = 'Surveillant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres.mon-profil'
 WHERE r.`nom` = 'Surveillant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.pointage'
 WHERE r.`nom` = 'Surveillant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.pointage.absences'
 WHERE r.`nom` = 'Surveillant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.scolarite'
 WHERE r.`nom` = 'Surveillant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.scolarite.discipline'
 WHERE r.`nom` = 'Surveillant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.tableau-de-bord'
 WHERE r.`nom` = 'Surveillant'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres'
 WHERE r.`nom` = 'Bibliothécaire'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres.mon-compte'
 WHERE r.`nom` = 'Bibliothécaire'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres.mon-profil'
 WHERE r.`nom` = 'Bibliothécaire'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.tableau-de-bord'
 WHERE r.`nom` = 'Bibliothécaire'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.finance.bordereau.imputer'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.finance.bordereau.saisir'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.finance.bordereau.voir'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.bourses'
 WHERE r.`nom` = 'Super Admin'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.bourses.configurations'
 WHERE r.`nom` = 'Super Admin'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.bourses.attributions'
 WHERE r.`nom` = 'Super Admin'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.bourses.campagne'
 WHERE r.`nom` = 'Super Admin'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.configuration.creer'
 WHERE r.`nom` = 'Super Admin'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.configuration.modifier'
 WHERE r.`nom` = 'Super Admin'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.attribution.creer'
 WHERE r.`nom` = 'Super Admin'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.attribution.modifier'
 WHERE r.`nom` = 'Super Admin'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.attribution.suspendre'
 WHERE r.`nom` = 'Super Admin'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.attribution.reactiver'
 WHERE r.`nom` = 'Super Admin'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.campagne.creer'
 WHERE r.`nom` = 'Super Admin'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.bourses'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.bourses.configurations'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.bourses.attributions'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.bourses.campagne'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.configuration.creer'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.configuration.modifier'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.attribution.creer'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.attribution.modifier'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.attribution.suspendre'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.attribution.reactiver'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.campagne.creer'
 WHERE r.`nom` = 'Directeur'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.bourses'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.bourses.configurations'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.bourses.attributions'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.configuration.creer'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.configuration.modifier'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.attribution.creer'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.attribution.modifier'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.attribution.suspendre'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.attribution.reactiver'
 WHERE r.`nom` = 'Comptable'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.bourses'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.bourses.configurations'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.bourses.attributions'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.bourses.campagne'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.attribution.creer'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.attribution.modifier'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.attribution.suspendre'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.attribution.reactiver'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.campagne.creer'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.bourses'
 WHERE r.`nom` = 'Institution'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.bourses.configurations'
 WHERE r.`nom` = 'Institution'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.bourses.attributions'
 WHERE r.`nom` = 'Institution'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.bourses.campagne'
 WHERE r.`nom` = 'Institution'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.campagne.creer'
 WHERE r.`nom` = 'Institution'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.bourse.attribution.creer'
 WHERE r.`nom` = 'Institution'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.tableau-de-bord'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.paiements'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.inscription.bordereaux'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.finances'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.finances.paiements'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.finances.comptabilite'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.finances.impayes'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.finances.situation-financiere'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.finances.paiement.enregistrer'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.finances.comptabilite.consulter'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'action.finance.bordereau.voir'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.reporting'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.reporting.paiements'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.communication'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.communication.messagerie'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres.mon-profil'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.parametres.mon-compte'
 WHERE r.`nom` = 'ESA Compta'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.finances.impayes'
 WHERE r.`nom` = 'Institution'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.finances.situation-financiere'
 WHERE r.`nom` = 'Institution'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.finances.comptabilite'
 WHERE r.`nom` = 'Institution'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.id, p.id, NOW(), NOW()
  FROM `aut_roles` r
  JOIN `aut_permissions` p ON p.`key` = 'menu.finances.bordereaux'
 WHERE r.`nom` = 'Institution'
   AND NOT EXISTS (
     SELECT 1 FROM `aut_role_permissions` rp
      WHERE rp.`roleId` = r.id AND rp.`permissionId` = p.id
   )
LIMIT 1;
