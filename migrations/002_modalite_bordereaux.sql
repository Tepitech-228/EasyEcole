-- =============================================================================
-- EasyEcole — Migration SQL : ajout de modalite sur ins_bordereaux
-- =============================================================================
-- Contexte : la colonne modalite existe déjà en local via sequelize.sync({ alter: true })
-- mais doit être ajoutée manuellement sur les bases recette/production.
-- Idempotent : ne fait rien si la colonne/index existent déjà.
-- =============================================================================

-- 1. Colonne modalite
SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_bordereaux' AND COLUMN_NAME = 'modalite'
);
SET @sql := IF(@colExists = 0,
  'ALTER TABLE `ins_bordereaux` ADD COLUMN `modalite` VARCHAR(50) NULL COMMENT ''Modalité de paiement (comptant, 3_versements, 10_mensualites)'' AFTER `statut`',
  'SELECT ''colonne modalite deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Index de filtrage par modalité
SET @idxExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_bordereaux' AND INDEX_NAME = 'idx_bordereaux_modalite'
);
SET @sql := IF(@idxExists = 0,
  'ALTER TABLE `ins_bordereaux` ADD INDEX `idx_bordereaux_modalite` (`modalite`)',
  'SELECT ''index idx_bordereaux_modalite deja present''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;