-- Correction idempotente du schéma d'évaluations et de notifications.
-- La migration 037 cible un ancien nom de table pour les notifications.
SET @db := DATABASE();

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA=@db AND TABLE_NAME='ins_listes_notes_evaluation' AND COLUMN_NAME='datePublication')=0,
  'ALTER TABLE `ins_listes_notes_evaluation` ADD COLUMN `datePublication` DATETIME NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE `ins_listes_notes_evaluation`
SET `datePublication` = `createdAt`
WHERE `datePublication` IS NULL AND `statutGestion` = 'publie';

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA=@db AND TABLE_NAME='elearning_notifications' AND COLUMN_NAME='evaluationId')=0,
  'ALTER TABLE `elearning_notifications` ADD COLUMN `evaluationId` INT UNSIGNED NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA=@db AND TABLE_NAME='elearning_notifications' AND INDEX_NAME='uq_notification_evaluation_event')=0,
  'CREATE UNIQUE INDEX `uq_notification_evaluation_event` ON `elearning_notifications` (`utilisateurId`, `evaluationId`, `type`(48))',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
