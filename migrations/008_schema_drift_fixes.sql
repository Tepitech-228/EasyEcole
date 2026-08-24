-- =============================================================================
-- EasyEcole — Migration SQL 008 : corrections de dérive de schéma (MariaDB)
-- =============================================================================
-- Colonnes déclarées dans les modèles Sequelize mais absentes de certaines
-- bases (drift historique). Idempotent.
--   1. ins_bordereaux.modalite      ENUM('1x','3x','10x') DEFAULT '1x'
--   2. aut_apprenants.periode       ENUM('matin','soir') NULL
-- =============================================================================

SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_bordereaux' AND COLUMN_NAME = 'modalite'
);
SET @sql := IF(@colExists = 0,
  'ALTER TABLE `ins_bordereaux` ADD COLUMN `modalite` ENUM(''1x'',''3x'',''10x'') NOT NULL DEFAULT ''1x'' AFTER `montant`',
  'SELECT ''colonne modalite deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_apprenants' AND COLUMN_NAME = 'periode'
);
SET @sql := IF(@colExists = 0,
  'ALTER TABLE `aut_apprenants` ADD COLUMN `periode` ENUM(''matin'',''soir'') NULL DEFAULT NULL AFTER `statutEtudiant`',
  'SELECT ''colonne periode deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_echeances' AND COLUMN_NAME = 'montantPaye'
);
SET @sql := IF(@colExists = 0,
  'ALTER TABLE `ins_echeances` ADD COLUMN `montantPaye` FLOAT NULL DEFAULT 0 AFTER `montant`',
  'SELECT ''colonne montantPaye deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_apprenants' AND COLUMN_NAME = 'periode'
);
SET @sql := IF(@colExists = 1,
  'SELECT ''periode ok''', 'SELECT ''periode manquante''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_dossiers_etudiants' AND COLUMN_NAME = 'fraisScolariteSnapshot'
);
SET @sql := IF(@colExists = 0,
  'ALTER TABLE `ins_dossiers_etudiants` ADD COLUMN `fraisScolariteSnapshot` TEXT NULL',
  'SELECT ''ok''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_dossiers_etudiants' AND COLUMN_NAME = 'cartePath'
);
SET @sql := IF(@colExists = 0,
  'ALTER TABLE `ins_dossiers_etudiants` ADD COLUMN `cartePath` VARCHAR(255) NULL, ADD COLUMN `carteGeneree` TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT ''ok''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
