-- =============================================================================
-- EasyEcole — Migration SQL 007 : pipeline d'inscription (validation comité)
-- =============================================================================
-- Flux définitif : Étudiant → Cabinet (authentification bordereau) →
-- ESA-COMPTA (saisie + imputation) → Comité (validation finale = création
-- étudiant/matricule/cours).
--
-- Ajoute sur ins_demandes_inscription :
--   statutPipeline  : soumis | authentifie | saisie_validee | transmis_comite
--                     | valide | correction_demandee | rejete   (NULL = legacy)
--   motifPipeline   : motif de correction/rejet (comité)
--
-- Idempotent.
-- =============================================================================

SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_demandes_inscription' AND COLUMN_NAME = 'statutPipeline'
);
SET @sql := IF(@colExists = 0,
  'ALTER TABLE `ins_demandes_inscription` ADD COLUMN `statutPipeline` VARCHAR(30) NULL DEFAULT NULL AFTER `matricule`',
  'SELECT ''colonne statutPipeline deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_demandes_inscription' AND COLUMN_NAME = 'motifPipeline'
);
SET @sql := IF(@colExists = 0,
  'ALTER TABLE `ins_demandes_inscription` ADD COLUMN `motifPipeline` TEXT NULL AFTER `statutPipeline`',
  'SELECT ''colonne motifPipeline deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index de consultation des files par acteur (cabinet / esa-compta / comité)
SET @idxExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_demandes_inscription' AND INDEX_NAME = 'idx_demandes_statut_pipeline'
);
SET @sql := IF(@idxExists = 0,
  'ALTER TABLE `ins_demandes_inscription` ADD INDEX `idx_demandes_statut_pipeline` (`statutPipeline`)',
  'SELECT ''index deja present''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
