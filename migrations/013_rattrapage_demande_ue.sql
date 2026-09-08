-- =============================================================================
-- EasyEcole — Migration SQL 013 : rattrapage à la demande (UE + demande sans session)
-- =============================================================================
-- Ajoute sur ins_rattrapages_inscriptions :
--   uesDemandees → liste JSON des UE/matières non validées choisies par l'étudiant
--   periode      → période (ex: année académique) pour rattacher une demande
--                  orpheline à une future session de rattrapage
--
-- Idempotent. Les données existantes restent inchangées.
-- =============================================================================

SET @col1 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapages_inscriptions' AND COLUMN_NAME = 'uesDemandees'
);
SET @sql1 := IF(@col1 = 0,
  'ALTER TABLE `ins_rattrapages_inscriptions` ADD COLUMN `uesDemandees` JSON NULL AFTER `bordereauId`',
  'SELECT ''colonne uesDemandees deja presente''');
PREPARE stmt FROM @sql1; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col2 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapages_inscriptions' AND COLUMN_NAME = 'periode'
);
SET @sql2 := IF(@col2 = 0,
  'ALTER TABLE `ins_rattrapages_inscriptions` ADD COLUMN `periode` VARCHAR(120) NULL AFTER `uesDemandees`',
  'SELECT ''colonne periode deja presente''');
PREPARE stmt FROM @sql2; EXECUTE stmt; DEALLOCATE PREPARE stmt;
