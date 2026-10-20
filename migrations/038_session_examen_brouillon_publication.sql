-- Les nouvelles sessions restent invisibles jusqu’à leur publication officielle.
SET @db := DATABASE();
SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='ins_sessions_examens' AND COLUMN_NAME='datePublication')=0,
  'ALTER TABLE `ins_sessions_examens` ADD COLUMN `datePublication` DATETIME NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE `ins_sessions_examens`
  MODIFY COLUMN `statut` ENUM('brouillon','publie','planifiee','en_cours','terminee','cloturee','annulee') NOT NULL DEFAULT 'brouillon';

UPDATE `ins_sessions_examens`
SET `datePublication` = `createdAt`
WHERE `datePublication` IS NULL AND `statut` <> 'brouillon';
