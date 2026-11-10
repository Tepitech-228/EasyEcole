SET @boitePostaleNullable := (
  SELECT IS_NULLABLE
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'aut_adresses_apprenants'
    AND COLUMN_NAME = 'boitePostale'
  LIMIT 1
);
SET @sql := IF(@boitePostaleNullable = 'NO',
  'ALTER TABLE `aut_adresses_apprenants` MODIFY COLUMN `boitePostale` VARCHAR(255) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @proprietaireNullable := (
  SELECT IS_NULLABLE
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'aut_adresses_apprenants'
    AND COLUMN_NAME = 'prorietaireBoitePostale'
  LIMIT 1
);
SET @sql := IF(@proprietaireNullable = 'NO',
  'ALTER TABLE `aut_adresses_apprenants` MODIFY COLUMN `prorietaireBoitePostale` VARCHAR(255) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
