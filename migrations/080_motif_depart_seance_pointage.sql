SET @db := DATABASE();

SET @columnExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'ins_seance_pointages'
    AND COLUMN_NAME = 'motifDepart'
);
SET @sql := IF(@columnExists = 0,
  'ALTER TABLE `ins_seance_pointages` ADD COLUMN `motifDepart` VARCHAR(500) NULL AFTER `heureFinReelle`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
