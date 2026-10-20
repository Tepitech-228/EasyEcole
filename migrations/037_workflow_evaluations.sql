-- Workflow des évaluations : publication officielle, échéance, blocages et audit.
-- Les évaluations préexistantes restent publiées et conservent leurs notes.
SET @db := DATABASE();

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='ins_listes_notes_evaluation' AND COLUMN_NAME='datePublication')=0,
  'ALTER TABLE `ins_listes_notes_evaluation` ADD COLUMN `datePublication` DATETIME NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='ins_listes_notes_evaluation' AND COLUMN_NAME='statutGestion')=0,
  'ALTER TABLE `ins_listes_notes_evaluation` ADD COLUMN `statutGestion` ENUM(''brouillon'',''publie'',''annulee'') NOT NULL DEFAULT ''publie''',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='ins_listes_notes_evaluation' AND COLUMN_NAME='saisieBloquee')=0,
  'ALTER TABLE `ins_listes_notes_evaluation` ADD COLUMN `saisieBloquee` TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='ins_listes_notes_evaluation' AND COLUMN_NAME='verrouillageDefinitif')=0,
  'ALTER TABLE `ins_listes_notes_evaluation` ADD COLUMN `verrouillageDefinitif` TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='ins_listes_notes_evaluation' AND COLUMN_NAME='motifBlocage')=0,
  'ALTER TABLE `ins_listes_notes_evaluation` ADD COLUMN `motifBlocage` TEXT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='ins_listes_notes_evaluation' AND COLUMN_NAME='bloqueePar')=0,
  'ALTER TABLE `ins_listes_notes_evaluation` ADD COLUMN `bloqueePar` INT UNSIGNED NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='ins_listes_notes_evaluation' AND COLUMN_NAME='dateLimiteSaisie')='date',
  'ALTER TABLE `ins_listes_notes_evaluation` MODIFY COLUMN `dateLimiteSaisie` DATETIME NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE `ins_listes_notes_evaluation`
SET `datePublication` = `createdAt`
WHERE `datePublication` IS NULL AND `statutGestion` = 'publie';

UPDATE `ins_listes_notes_evaluation`
SET `dateLimiteSaisie` = DATE_ADD(`datePublication`, INTERVAL 14 DAY)
WHERE `dateLimiteSaisie` IS NULL AND `datePublication` IS NOT NULL;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='ins_notes_evaluation' AND COLUMN_NAME='verrouillee')=0,
  'ALTER TABLE `ins_notes_evaluation` ADD COLUMN `verrouillee` TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='ins_notes_evaluation' AND COLUMN_NAME='motifVerrouillage')=0,
  'ALTER TABLE `ins_notes_evaluation` ADD COLUMN `motifVerrouillage` TEXT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='ins_notes_evaluation' AND COLUMN_NAME='verrouilleePar')=0,
  'ALTER TABLE `ins_notes_evaluation` ADD COLUMN `verrouilleePar` INT UNSIGNED NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='ins_audit_notes' AND COLUMN_NAME='action')=0,
  'ALTER TABLE `ins_audit_notes` ADD COLUMN `action` VARCHAR(40) NOT NULL DEFAULT ''modification_note''',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `ins_audit_evaluations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `evaluationId` INT UNSIGNED NOT NULL,
  `effectuePar` INT UNSIGNED NOT NULL,
  `action` VARCHAR(40) NOT NULL,
  `motif` TEXT NULL,
  `ancienneValeur` TEXT NULL,
  `nouvelleValeur` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_eval_evaluation_date` (`evaluationId`, `createdAt`),
  KEY `idx_audit_eval_actor_date` (`effectuePar`, `createdAt`),
  CONSTRAINT `fk_audit_eval_evaluation` FOREIGN KEY (`evaluationId`) REFERENCES `ins_listes_notes_evaluation` (`id`),
  CONSTRAINT `fk_audit_eval_actor` FOREIGN KEY (`effectuePar`) REFERENCES `aut_utilisateurs` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='elearning_notifications' AND COLUMN_NAME='evaluationId')=0,
  'ALTER TABLE `elearning_notifications` ADD COLUMN `evaluationId` INT UNSIGNED NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='elearning_notifications' AND INDEX_NAME='uq_notification_evaluation_event')=0,
  'CREATE UNIQUE INDEX `uq_notification_evaluation_event` ON `elearning_notifications` (`utilisateurId`, `evaluationId`, `type`(48))',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
