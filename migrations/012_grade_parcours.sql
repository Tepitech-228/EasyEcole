-- =============================================================================
-- EasyEcole — Migration SQL 012 : grade sur parcours (arborescence PHASE 1 wizard)
-- =============================================================================
-- Ajoute sur ins_parcours le champ grade :
--   ins_parcours.type  → cycle / parcours (LICENCE, MASTER, DOCTORAT, BTS, MBA)
--   ins_parcours.grade → grade (ex : Licence Professionnelle, Master Professionnel, ...)
--   ins_parcours.titre → la filière
-- Cela permet de construire l'arborescence : parcours -> grade -> filière
-- utilisée à la PHASE 1 du wizard d'inscription.
--
-- Idempotent. Les données existantes restent inchangées (grade NULL = 'Sans grade').
-- =============================================================================

SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_parcours' AND COLUMN_NAME = 'grade'
);
SET @sql := IF(@colExists = 0,
  'ALTER TABLE `ins_parcours` ADD COLUMN `grade` VARCHAR(100) NULL AFTER `type`',
  'SELECT ''colonne grade deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
