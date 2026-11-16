-- Preserve address records left behind by physically deleted learners.
-- The association uses ON DELETE SET NULL, so the foreign-key column must allow NULL.
SET @adresseTableExists := (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'aut_adresses_apprenants'
);
SET @apprenantTableExists := (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'aut_apprenants'
);
SET @apprenantIdColumnExists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'aut_adresses_apprenants'
    AND COLUMN_NAME = 'apprenantId'
);

SET @sql := IF(
  @adresseTableExists > 0 AND @apprenantIdColumnExists > 0,
  'ALTER TABLE `aut_adresses_apprenants` MODIFY COLUMN `apprenantId` INT UNSIGNED NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- An address remains useful after its learner row was removed; detach only the
-- broken reference rather than deleting the address or inventing a replacement learner.
SET @sql := IF(
  @adresseTableExists > 0 AND @apprenantTableExists > 0 AND @apprenantIdColumnExists > 0,
  'UPDATE `aut_adresses_apprenants` AS adresse LEFT JOIN `aut_apprenants` AS apprenant ON apprenant.`id` = adresse.`apprenantId` SET adresse.`apprenantId` = NULL WHERE adresse.`apprenantId` IS NOT NULL AND apprenant.`id` IS NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
