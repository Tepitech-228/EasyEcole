SET @databaseName := DATABASE();

SET @hasDiplomeRecu := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @databaseName
    AND TABLE_NAME = 'scol_demandes_document'
    AND COLUMN_NAME = 'diplomeRecu'
);
SET @sql := IF(
  @hasDiplomeRecu = 0,
  'ALTER TABLE `scol_demandes_document` ADD COLUMN `diplomeRecu` ENUM(''BAC'', ''LICENCE'', ''MASTER'') NULL',
  'SELECT ''scol_demandes_document.diplomeRecu existe déjà'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @hasDateDiplomeRecu := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @databaseName
    AND TABLE_NAME = 'scol_demandes_document'
    AND COLUMN_NAME = 'dateDiplomeRecu'
);
SET @sql := IF(
  @hasDateDiplomeRecu = 0,
  'ALTER TABLE `scol_demandes_document` ADD COLUMN `dateDiplomeRecu` DATE NULL',
  'SELECT ''scol_demandes_document.dateDiplomeRecu existe déjà'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @hasRelevesSemestresRecus := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @databaseName
    AND TABLE_NAME = 'scol_demandes_document'
    AND COLUMN_NAME = 'relevesSemestresRecus'
);
SET @sql := IF(
  @hasRelevesSemestresRecus = 0,
  'ALTER TABLE `scol_demandes_document` ADD COLUMN `relevesSemestresRecus` JSON NULL',
  'SELECT ''scol_demandes_document.relevesSemestresRecus existe déjà'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @hasSemestresAutorises := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @databaseName
    AND TABLE_NAME = 'scol_demandes_document'
    AND COLUMN_NAME = 'semestresAutorises'
);
SET @sql := IF(
  @hasSemestresAutorises = 0,
  'ALTER TABLE `scol_demandes_document` ADD COLUMN `semestresAutorises` JSON NULL',
  'SELECT ''scol_demandes_document.semestresAutorises existe déjà'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
