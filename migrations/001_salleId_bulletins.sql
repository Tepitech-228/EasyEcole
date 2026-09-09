-- =============================================================================
-- EasyEcole — Migration SQL : ajout de salleId sur ins_bulletins
-- =============================================================================
-- Contexte : la colonne salleId existe déjà en local via sequelize.sync({ alter: true })
-- mais doit être ajoutée manuellement sur les bases recette/production.
-- Idempotent : ne fait rien si la colonne/index existent déjà.
-- =============================================================================

-- 1. Colonne salleId
SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_bulletins' AND COLUMN_NAME = 'salleId'
);
SET @sql := IF(@colExists = 0,
  'ALTER TABLE `ins_bulletins` ADD COLUMN `salleId` INT UNSIGNED NULL COMMENT ''Salle de classe optionnelle pour le bulletin'' AFTER `niveauEtudeId`',
  'SELECT ''colonne salleId deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Index de filtrage par salle
SET @idxExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_bulletins' AND INDEX_NAME = 'idx_bulletins_salleId'
);
SET @sql := IF(@idxExists = 0,
  'ALTER TABLE `ins_bulletins` ADD INDEX `idx_bulletins_salleId` (`salleId`)',
  'SELECT ''index idx_bulletins_salleId deja present''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Foreign key optionnelle (décommenter si vous souhaitez activer la contrainte)
-- ALTER TABLE `ins_bulletins`
--     ADD CONSTRAINT `fk_bulletins_salle`
--     FOREIGN KEY (`salleId`) REFERENCES `ins_salles_de_classe`(`id`)
--     ON DELETE SET NULL ON UPDATE CASCADE;