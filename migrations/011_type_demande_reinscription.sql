-- =============================================================================
-- EasyEcole — Migration SQL 011 : badge 1ère/réinscription au comité
-- =============================================================================
-- Ajoute sur ins_demandes_inscription le champ typeDemande :
--   'inscription'  → dossiers de 1ère inscription (badge 🟢)
--   'reinscription'→ dossiers de réinscription (badge 🔵, vérif spécifique quitus /
--                     bordereaux année écoulée / demande DG / autorisation provisoire)
--   NULL           → legacy (traité comme 'inscription')
--
-- Idempotent.
-- =============================================================================

SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_demandes_inscription' AND COLUMN_NAME = 'typeDemande'
);
SET @sql := IF(@colExists = 0,
  'ALTER TABLE `ins_demandes_inscription` ADD COLUMN `typeDemande` VARCHAR(20) NULL DEFAULT ''inscription'' AFTER `matricule`',
  'SELECT ''colonne typeDemande deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
