-- =============================================================================
-- EasyEcole — Migration SQL 009 : validation collégiale du comité (unanimité)
-- =============================================================================
-- Règle métier :
--   • Unanimité requise pour VALIDER : tous les membres doivent voter
--     'valide' pour que le dossier soit validé.
--   • Un seul REJET suffit : dès qu'un membre vote 'rejete', le dossier
--     est bloqué (rejet collectif par un seul voix).
--
-- Crée la table ins_comite_votes qui trace chaque vote d'un membre du
-- comité d'orientation sur un dossier d'inscription.
--
-- Idempotent : vérifie l'existence de la table via information_schema.TABLES
-- avant création. Compatible exécution via mysql CLI.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Vérification d'existence de la table avant création
-- -----------------------------------------------------------------------------
SET @tableExists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_comite_votes'
);

SET @sql := IF(@tableExists = 0,
  'CREATE TABLE `ins_comite_votes` (
     `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
     `demandeInscriptionId` INT UNSIGNED NOT NULL COMMENT "FK vers ins_demandes_inscription.id",
     `membreId` INT UNSIGNED NOT NULL COMMENT "FK vers aut_utilisateurs.id (role comite_orientation)",
     `decision` ENUM("valide","correction_demandee","rejete") NOT NULL,
     `motif` TEXT NULL,
     `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
     `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     PRIMARY KEY (`id`),
     UNIQUE KEY `uq_vote` (`demandeInscriptionId`, `membreId`),
     KEY `idx_comite_votes_demande` (`demandeInscriptionId`),
     KEY `idx_comite_votes_membre` (`membreId`),
     CONSTRAINT `fk_comite_votes_demande` FOREIGN KEY (`demandeInscriptionId`) REFERENCES `ins_demandes_inscription` (`id`) ON DELETE CASCADE,
     CONSTRAINT `fk_comite_votes_membre` FOREIGN KEY (`membreId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE CASCADE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  'SELECT ''table ins_comite_votes deja presente''');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- Note : la table est créée avec ENGINE=InnoDB pour garantir les contraintes
-- de clé étrangère et le comportement ON DELETE CASCADE.
-- Le charset utf8mb4 supporte l'ensemble des caractères Unicode (emojis,
-- caractères spéciaux dans les motifs de vote).
-- =============================================================================
