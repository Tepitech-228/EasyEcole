SET @databaseName := DATABASE();

SET @hasEstSignataireApi := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @databaseName
    AND TABLE_NAME = 'aut_comite_orientations'
    AND COLUMN_NAME = 'estSignataireApi'
);
SET @sql := IF(
  @hasEstSignataireApi = 0,
  'ALTER TABLE `aut_comite_orientations` ADD COLUMN `estSignataireApi` TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT ''aut_comite_orientations.estSignataireApi existe déjà'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @hasDocgenDocumentId := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @databaseName
    AND TABLE_NAME = 'scol_demandes_document'
    AND COLUMN_NAME = 'docgenDocumentId'
);
SET @sql := IF(
  @hasDocgenDocumentId = 0,
  'ALTER TABLE `scol_demandes_document` ADD COLUMN `docgenDocumentId` INT UNSIGNED NULL',
  'SELECT ''scol_demandes_document.docgenDocumentId existe déjà'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @hasSignatairesAutorisation := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @databaseName
    AND TABLE_NAME = 'scol_demandes_document'
    AND COLUMN_NAME = 'signatairesAutorisation'
);
SET @sql := IF(
  @hasSignatairesAutorisation = 0,
  'ALTER TABLE `scol_demandes_document` ADD COLUMN `signatairesAutorisation` JSON NULL',
  'SELECT ''scol_demandes_document.signatairesAutorisation existe déjà'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @hasSignaturesAutorisation := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @databaseName
    AND TABLE_NAME = 'scol_demandes_document'
    AND COLUMN_NAME = 'signaturesAutorisation'
);
SET @sql := IF(
  @hasSignaturesAutorisation = 0,
  'ALTER TABLE `scol_demandes_document` ADD COLUMN `signaturesAutorisation` JSON NULL',
  'SELECT ''scol_demandes_document.signaturesAutorisation existe déjà'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
