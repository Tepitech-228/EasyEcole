SET @saisiParExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ins_bordereaux'
    AND COLUMN_NAME = 'saisiParId'
);
SET @sql := IF(@saisiParExists = 0,
  'ALTER TABLE `ins_bordereaux` ADD COLUMN `saisiParId` INT UNSIGNED NULL AFTER `valideParId`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @dateSaisieExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ins_bordereaux'
    AND COLUMN_NAME = 'dateSaisieComptable'
);
SET @sql := IF(@dateSaisieExists = 0,
  'ALTER TABLE `ins_bordereaux` ADD COLUMN `dateSaisieComptable` DATETIME NULL AFTER `saisiParId`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @indexExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ins_bordereaux'
    AND INDEX_NAME = 'idx_ins_bordereaux_saisie_comptable'
);
SET @sql := IF(@indexExists = 0,
  'CREATE INDEX `idx_ins_bordereaux_saisie_comptable` ON `ins_bordereaux` (`dateSaisieComptable`, `saisiParId`)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
