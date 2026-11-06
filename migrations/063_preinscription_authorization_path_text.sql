-- Les chemins des autorisations provisoires utilisent la même arborescence longue
-- que les pièces d'inscription et doivent donc être stockés sans limite VARCHAR.
SET @db_name = DATABASE();

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db_name
     AND TABLE_NAME = 'ins_pre_inscriptions'
     AND COLUMN_NAME = 'autorisationPDF') > 0,
  'ALTER TABLE `ins_pre_inscriptions` MODIFY `autorisationPDF` TEXT NULL',
  'SELECT ''table ou colonne ins_pre_inscriptions.autorisationPDF absente'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
