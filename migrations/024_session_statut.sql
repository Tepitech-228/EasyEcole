-- =============================================================================
-- EasyEcole — Migration SQL 024 : statut session inscription (ouverte/cloturee)
-- =============================================================================
SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_sessions' AND COLUMN_NAME = 'statut'
);
SET @sql := IF(@colExists = 0,
  'ALTER TABLE `ins_sessions` ADD COLUMN `statut` ENUM("ouverte","cloturee") NOT NULL DEFAULT "ouverte" AFTER `description`',
  'SELECT "colonne statut deja presente"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
