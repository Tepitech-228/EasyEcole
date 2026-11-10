-- Reprise sûre de la migration 058 : le nouvel index unique est créé avant
-- la suppression de l'ancien index, afin de ne jamais laisser la table sans
-- contrainte d'unicité si la création échoue.
SET @db := DATABASE();

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
