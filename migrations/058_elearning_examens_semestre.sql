-- Période d'examen dérivée du semestre de l'UE source.
-- S1-S4 conservent leur semestre ; S5-S6 sont regroupés en examen annuel.
SET @db := DATABASE();

SET @columnExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'elearning_examens'
    AND COLUMN_NAME = 'semestre'
);
SET @sql := IF(@columnExists = 0,
  'ALTER TABLE `elearning_examens` ADD COLUMN `semestre` ENUM(''semestre1'',''semestre2'',''semestre3'',''semestre4'',''annuel'') NOT NULL DEFAULT ''annuel'' AFTER `anneeAcademiqueId`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE `elearning_examens` examen
JOIN `elearning_cours` enligne ON enligne.`id` = examen.`coursId`
JOIN `ins_cours` ue ON ue.`id` = CAST(enligne.`ueId` AS UNSIGNED)
SET examen.`semestre` = CASE ue.`semestre`
  WHEN 'semestre1' THEN 'semestre1'
  WHEN 'semestre2' THEN 'semestre2'
  WHEN 'semestre3' THEN 'semestre3'
  WHEN 'semestre4' THEN 'semestre4'
  WHEN 'semestre5' THEN 'annuel'
  WHEN 'semestre6' THEN 'annuel'
  ELSE 'annuel'
END;

SET @oldIndexExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'elearning_examens'
    AND INDEX_NAME = 'uq_elearning_examen_cours_annee'
);
SET @sql := IF(@oldIndexExists > 0,
  'ALTER TABLE `elearning_examens` DROP INDEX `uq_elearning_examen_cours_annee`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @newIndexExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'elearning_examens'
    AND INDEX_NAME = 'uq_elearning_examen_cours_annee_semestre'
);
SET @sql := IF(@newIndexExists = 0,
  'CREATE UNIQUE INDEX `uq_elearning_examen_cours_annee_semestre` ON `elearning_examens` (`coursId`, `anneeAcademiqueId`, `semestre`)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
