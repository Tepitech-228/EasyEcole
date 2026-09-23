-- =============================================================================
-- EasyEcole — Migration SQL 022 : désignation enseignants rattrapage
-- =============================================================================
-- Crée la table ins_rattrapage_enseignants qui désigne un(e) enseignant(e)
-- par créneau de rattrapage (samedi) et filière.
--
-- Règle métier :
--   - Un enseignant peut être désigné pour plusieurs créneaux
--   - Un créneau (samedi + filière) ne peut avoir qu'un seul enseignant
--   - L'UE/ECUE est précisée pour la désignation
--
-- Idempotent. Compatible exécution via mysql CLI.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Vérification d'existence de la table avant création
-- -----------------------------------------------------------------------------
SET @tableExists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapage_enseignants'
);

SET @sql := IF(@tableExists = 0,
  'CREATE TABLE `ins_rattrapage_enseignants` (
      `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      `rattrapagePlanningId` INT UNSIGNED NOT NULL COMMENT "FK vers ins_rattrapage_planning.id",
      `enseignantId` INT UNSIGNED NOT NULL COMMENT "FK vers aut_enseignants.id",
      `ue` VARCHAR(255) NULL COMMENT "UE concernée (libellé)",
      `ecue` VARCHAR(255) NULL COMMENT "ECUE concernée (libellé)",
      `statut` ENUM(\"designe\",\"confirmé\",\"annulé\") NOT NULL DEFAULT \"designe\",
      `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      UNIQUE KEY `uq_planning_enseignant` (`rattrapagePlanningId`, `enseignantId`),
      KEY `idx_ens_planning` (`rattrapagePlanningId`),
      KEY `idx_ens_enseignant` (`enseignantId`),
      CONSTRAINT `fk_ens_planning` FOREIGN KEY (`rattrapagePlanningId`) REFERENCES `ins_rattrapage_planning` (`id`) ON DELETE CASCADE,
      CONSTRAINT `fk_ens_enseignant` FOREIGN KEY (`enseignantId`) REFERENCES `aut_enseignants` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  'SELECT \'table ins_rattrapage_enseignants deja presente\'');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- Note : la désignation se fait via PUT /sessions/:id/planning/designer
-- par l'Institution (pas par l'Admin).
-- =============================================================================
