SET @db := DATABASE();

SET @columnExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'ins_seances'
    AND COLUMN_NAME = 'publieeLe'
);
SET @sql := IF(@columnExists = 0,
  'ALTER TABLE `ins_seances` ADD COLUMN `publieeLe` DATETIME NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE `ins_seances`
SET `publieeLe` = COALESCE(`updatedAt`, `createdAt`, CURRENT_TIMESTAMP)
WHERE `publieeLe` IS NULL;

CREATE TABLE IF NOT EXISTS `ins_seance_pointages` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `seanceId` INT UNSIGNED NOT NULL,
  `date` DATE NOT NULL,
  `enseignantId` INT UNSIGNED NOT NULL,
  `utilisateurId` INT UNSIGNED NOT NULL,
  `etablissementId` INT UNSIGNED NOT NULL,
  `heureDebutReelle` TIME NULL,
  `heureFinReelle` TIME NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ins_seance_pointages_seance_date` (`seanceId`, `date`),
  KEY `idx_ins_seance_pointages_site_date` (`etablissementId`, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
