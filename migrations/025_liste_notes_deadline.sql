-- 025 — Deadline de saisie des notes d'examen (14 jours) pour alertes SG/DG
-- Ajoute dateLimiteSaisie sur ins_listes_notes_evaluation (calculée à la création : date + 14j pour les examens)

SET @dbname = DATABASE();
SET @tablename = 'ins_listes_notes_evaluation';
SET @columnname = 'dateLimiteSaisie';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT ''colonne dateLimiteSaisie deja presente''',
  'ALTER TABLE `ins_listes_notes_evaluation` ADD COLUMN `dateLimiteSaisie` DATE NULL AFTER `date`'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index pour le cron quotidien (recherche des listes en retard)
SET @preparedStatement2 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND INDEX_NAME = 'idx_listes_deadline') > 0,
  'SELECT ''index idx_listes_deadline deja present''',
  'CREATE INDEX `idx_listes_deadline` ON `ins_listes_notes_evaluation` (`dateLimiteSaisie`, `typeNoteEvaluationId`)'
));
PREPARE stmt2 FROM @preparedStatement2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
