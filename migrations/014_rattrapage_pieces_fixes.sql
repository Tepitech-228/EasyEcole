-- =============================================================================
-- EasyEcole — Migration SQL 014 : pièces fixes du rattrapage (demandes sans session)
-- =============================================================================
-- Adoucit ins_rattrapage_documents_deposes pour supporter les demandes de
-- rattrapage créées SANS session (3 pièces fixes au lieu des pièces paramétrées) :
--   documentRequisId → devient nullable (référence la pièce requise de session,
--                       NULL pour une pièce fixe de demande sans session)
--   codeDocument     → nouveau champ : code de la pièce fixe
--                      (autorisation_provisoire | quitus_bordereaux | bordereau_rattrapage)
--
-- Idempotent. Les données existantes restent inchangées.
-- =============================================================================

SET @col1 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapage_documents_deposes' AND COLUMN_NAME = 'codeDocument'
);
SET @sql1 := IF(@col1 = 0,
  'ALTER TABLE `ins_rattrapage_documents_deposes` ADD COLUMN `codeDocument` VARCHAR(60) NULL AFTER `documentRequisId`',
  'SELECT ''colonne codeDocument deja presente''');
PREPARE stmt FROM @sql1; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- documentRequisId → nullable
SET @sql2 := 'ALTER TABLE `ins_rattrapage_documents_deposes` MODIFY COLUMN `documentRequisId` INT UNSIGNED NULL';
PREPARE stmt FROM @sql2; EXECUTE stmt; DEALLOCATE PREPARE stmt;
