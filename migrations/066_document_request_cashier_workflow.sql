SET @databaseName := DATABASE();

SET @hasRecuEtudiant := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @databaseName
    AND TABLE_NAME = 'scol_recus_caisse'
    AND COLUMN_NAME = 'etudiantId'
);
SET @sql := IF(
  @hasRecuEtudiant = 0,
  'ALTER TABLE `scol_recus_caisse` ADD COLUMN `etudiantId` INT UNSIGNED NULL AFTER `demandeDocumentId`',
  'SELECT ''scol_recus_caisse.etudiantId existe déjà'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @hasRecuType := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @databaseName
    AND TABLE_NAME = 'scol_recus_caisse'
    AND COLUMN_NAME = 'typeDocumentId'
);
SET @sql := IF(
  @hasRecuType = 0,
  'ALTER TABLE `scol_recus_caisse` ADD COLUMN `typeDocumentId` INT UNSIGNED NULL AFTER `etudiantId`',
  'SELECT ''scol_recus_caisse.typeDocumentId existe déjà'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @hasRecuReference := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @databaseName
    AND TABLE_NAME = 'scol_recus_caisse'
    AND COLUMN_NAME = 'referencePaiement'
);
SET @sql := IF(
  @hasRecuReference = 0,
  'ALTER TABLE `scol_recus_caisse` ADD COLUMN `referencePaiement` VARCHAR(100) NULL AFTER `modePaiement`',
  'SELECT ''scol_recus_caisse.referencePaiement existe déjà'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE `scol_recus_caisse`
  MODIFY COLUMN `demandeDocumentId` INT UNSIGNED NULL;

UPDATE `scol_recus_caisse` r
LEFT JOIN `scol_demandes_document` d ON d.id = r.demandeDocumentId
SET r.etudiantId = COALESCE(r.etudiantId, d.etudiantId),
    r.typeDocumentId = COALESCE(r.typeDocumentId, d.typeDocumentId)
WHERE r.etudiantId IS NULL OR r.typeDocumentId IS NULL;

SET @hasRecuEtudiantFk := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @databaseName
    AND TABLE_NAME = 'scol_recus_caisse'
    AND CONSTRAINT_NAME = 'fk_recu_caisse_etudiant'
);
SET @sql := IF(
  @hasRecuEtudiantFk = 0,
  'ALTER TABLE `scol_recus_caisse` ADD CONSTRAINT `fk_recu_caisse_etudiant` FOREIGN KEY (`etudiantId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT ''fk_recu_caisse_etudiant existe déjà'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @hasRecuTypeFk := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @databaseName
    AND TABLE_NAME = 'scol_recus_caisse'
    AND CONSTRAINT_NAME = 'fk_recu_caisse_type_document'
);
SET @sql := IF(
  @hasRecuTypeFk = 0,
  'ALTER TABLE `scol_recus_caisse` ADD CONSTRAINT `fk_recu_caisse_type_document` FOREIGN KEY (`typeDocumentId`) REFERENCES `scol_types_document` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT ''fk_recu_caisse_type_document existe déjà'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @hasRecuLookupIndex := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @databaseName
    AND TABLE_NAME = 'scol_recus_caisse'
    AND INDEX_NAME = 'idx_recu_document_student_type'
);
SET @sql := IF(
  @hasRecuLookupIndex = 0,
  'CREATE INDEX `idx_recu_document_student_type` ON `scol_recus_caisse` (`etudiantId`, `typeDocumentId`, `demandeDocumentId`)',
  'SELECT ''idx_recu_document_student_type existe déjà'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @hasDemandeSemestre := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @databaseName
    AND TABLE_NAME = 'scol_demandes_document'
    AND COLUMN_NAME = 'semestre'
);
SET @sql := IF(
  @hasDemandeSemestre = 0,
  'ALTER TABLE `scol_demandes_document` ADD COLUMN `semestre` VARCHAR(30) NULL AFTER `anneeAcademiqueId`',
  'SELECT ''scol_demandes_document.semestre existe déjà'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
