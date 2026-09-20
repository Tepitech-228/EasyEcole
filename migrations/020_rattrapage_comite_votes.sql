-- =============================================================================
-- EasyEcole — Migration SQL 020 : validation collégiale du comité (rattrapage)
-- =============================================================================
-- Règle métier :
--   • Unanimité requise pour VALIDER : tous les membres doivent voter
--     'valide' pour que la demande de rattrapage soit validée.
--   • Un seul REJET suffit : dès qu'un membre vote 'rejete', la demande
--     est bloquée (rejet collectif par une seule voix).
--
-- Crée la table ins_rattrapage_comite_votes qui trace chaque vote d'un
-- membre du comité d'orientation sur une demande de rattrapage.
--
-- Idempotent : vérifie l'existence de la table via information_schema.TABLES
-- avant création. Compatible exécution via mysql CLI.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Vérification d'existence de la table avant création
-- -----------------------------------------------------------------------------
SET @tableExists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapage_comite_votes'
);

SET @sql := IF(@tableExists = 0,
  'CREATE TABLE `ins_rattrapage_comite_votes` (
      `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      `rattrapageInscriptionId` INT UNSIGNED NOT NULL COMMENT "FK vers ins_rattrapages_inscriptions.id",
      `membreId` INT UNSIGNED NOT NULL COMMENT "FK vers aut_utilisateurs.id (role comite_orientation)",
      `decision` ENUM("valide","correction_demandee","rejete") NOT NULL,
      `motif` TEXT NULL,
      `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      UNIQUE KEY `uq_vote` (`rattrapageInscriptionId`, `membreId`),
      KEY `idx_comite_votes_demande` (`rattrapageInscriptionId`),
      KEY `idx_comite_votes_membre` (`membreId`),
      CONSTRAINT `fk_rattrapage_comite_votes_demande` FOREIGN KEY (`rattrapageInscriptionId`) REFERENCES `ins_rattrapages_inscriptions` (`id`) ON DELETE CASCADE,
      CONSTRAINT `fk_rattrapage_comite_votes_membre` FOREIGN KEY (`membreId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  'SELECT ''table ins_rattrapage_comite_votes deja presente''');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- Note : la table est créée avec ENGINE=InnoDB pour garantir les contraintes
-- de clé étrangère et le comportement ON DELETE CASCADE.
-- Le charset utf8mb4 supporte l'ensemble des caractères Unicode (emojis,
-- caractères spéciaux dans les motifs de vote).
-- =============================================================================
