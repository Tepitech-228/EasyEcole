SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ins_ecue'
    AND COLUMN_NAME = 'vhHoraire'
);
SET @sql := IF(@colExists > 0,
  'SELECT ''vhHoraire deja present sur ins_ecue''',
  'ALTER TABLE `ins_ecue` ADD COLUMN `vhHoraire` int(10) unsigned NULL DEFAULT NULL');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
