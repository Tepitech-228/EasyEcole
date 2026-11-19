-- Ajouter le numéro de compte bancaire aux profils enseignants.
SET @db := DATABASE();

SET @columnExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'aut_enseignants'
    AND COLUMN_NAME = 'numeroCompteBancaire'
);
SET @sql := IF(@columnExists = 0,
  'ALTER TABLE `aut_enseignants` ADD COLUMN `numeroCompteBancaire` VARCHAR(255) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
