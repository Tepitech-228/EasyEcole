SET @databaseName := DATABASE();

SET @hasRelevesSemestresDates := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @databaseName
    AND TABLE_NAME = 'scol_demandes_document'
    AND COLUMN_NAME = 'relevesSemestresDates'
);
SET @sql := IF(
  @hasRelevesSemestresDates = 0,
  'ALTER TABLE `scol_demandes_document` ADD COLUMN `relevesSemestresDates` JSON NULL',
  'SELECT ''scol_demandes_document.relevesSemestresDates existe déjà'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
