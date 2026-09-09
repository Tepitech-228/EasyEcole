-- =============================================================================
-- EasyEcole — Migration SQL 016 : QR code de pointage pour le personnel administratif
-- =============================================================================
-- Ajoute la colonne qrCode sur aut_personnel_administratif (même pattern que
-- aut_enseignants) ainsi qu'un index unique. Idempotent : ne fait rien si la
-- colonne existe déjà.
-- =============================================================================

-- 1. Colonne qrCode
SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_personnel_administratif' AND COLUMN_NAME = 'qrCode'
);
SET @sql := IF(@colExists = 0,
  'ALTER TABLE `aut_personnel_administratif` ADD COLUMN `qrCode` VARCHAR(255) NULL AFTER `matricule`',
  'SELECT ''colonne qrCode deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Index unique sur qrCode
SET @idxExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_personnel_administratif'
    AND COLUMN_NAME = 'qrCode'
    AND INDEX_NAME = 'aut_personnel_administratif_qrCode'
);
SET @sql := IF(@idxExists = 0,
  'ALTER TABLE `aut_personnel_administratif` ADD UNIQUE INDEX `aut_personnel_administratif_qrCode` (`qrCode`)',
  'SELECT ''index qrCode deja present''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;