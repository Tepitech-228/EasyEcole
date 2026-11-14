SET @db := DATABASE();

-- A shared cohort register is not owned by one course or one teacher.
SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_listes_presences' AND COLUMN_NAME = 'coursId') > 0
  AND (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_listes_presences' AND COLUMN_NAME = 'coursId' AND IS_NULLABLE = 'NO') > 0,
  'ALTER TABLE `ins_listes_presences` MODIFY COLUMN `coursId` INT UNSIGNED NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_listes_presences' AND COLUMN_NAME = 'enseignantId') > 0
  AND (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_listes_presences' AND COLUMN_NAME = 'enseignantId' AND IS_NULLABLE = 'NO') > 0,
  'ALTER TABLE `ins_listes_presences` MODIFY COLUMN `enseignantId` INT UNSIGNED NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_cahiers_de_texte' AND COLUMN_NAME = 'coursId') > 0
  AND (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_cahiers_de_texte' AND COLUMN_NAME = 'coursId' AND IS_NULLABLE = 'NO') > 0,
  'ALTER TABLE `ins_cahiers_de_texte` MODIFY COLUMN `coursId` INT UNSIGNED NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_cahiers_de_texte' AND COLUMN_NAME = 'enseignantId') > 0
  AND (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_cahiers_de_texte' AND COLUMN_NAME = 'enseignantId' AND IS_NULLABLE = 'NO') > 0,
  'ALTER TABLE `ins_cahiers_de_texte` MODIFY COLUMN `enseignantId` INT UNSIGNED NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_listes_presences' AND COLUMN_NAME = 'parcoursId') = 0,
  'ALTER TABLE `ins_listes_presences` ADD COLUMN `parcoursId` INT UNSIGNED NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_listes_presences' AND COLUMN_NAME = 'niveauEtudeId') = 0,
  'ALTER TABLE `ins_listes_presences` ADD COLUMN `niveauEtudeId` INT UNSIGNED NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_listes_presences' AND COLUMN_NAME = 'etablissementId') = 0,
  'ALTER TABLE `ins_listes_presences` ADD COLUMN `etablissementId` INT UNSIGNED NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_cahiers_de_texte' AND COLUMN_NAME = 'parcoursId') = 0,
  'ALTER TABLE `ins_cahiers_de_texte` ADD COLUMN `parcoursId` INT UNSIGNED NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_cahiers_de_texte' AND COLUMN_NAME = 'niveauEtudeId') = 0,
  'ALTER TABLE `ins_cahiers_de_texte` ADD COLUMN `niveauEtudeId` INT UNSIGNED NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_cahiers_de_texte' AND COLUMN_NAME = 'etablissementId') = 0,
  'ALTER TABLE `ins_cahiers_de_texte` ADD COLUMN `etablissementId` INT UNSIGNED NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_listes_presences' AND INDEX_NAME = 'uq_ins_liste_presence_cohorte') = 0,
  'CREATE UNIQUE INDEX `uq_ins_liste_presence_cohorte` ON `ins_listes_presences` (`etablissementId`, `parcoursId`, `niveauEtudeId`)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_cahiers_de_texte' AND INDEX_NAME = 'uq_ins_cahier_texte_cohorte') = 0,
  'CREATE UNIQUE INDEX `uq_ins_cahier_texte_cohorte` ON `ins_cahiers_de_texte` (`etablissementId`, `parcoursId`, `niveauEtudeId`)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
