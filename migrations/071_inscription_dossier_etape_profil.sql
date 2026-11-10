SET @db := DATABASE();

SET @profilRequisExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'ins_dossiers_inscription'
    AND COLUMN_NAME = 'profilRequis'
);
SET @sql := IF(@profilRequisExists = 0,
  'ALTER TABLE `ins_dossiers_inscription` ADD COLUMN `profilRequis` VARCHAR(20) NOT NULL DEFAULT ''tous'' AFTER `description`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @etapeExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'ins_dossiers_inscription'
    AND COLUMN_NAME = 'etape'
);
SET @sql := IF(@etapeExists = 0,
  'ALTER TABLE `ins_dossiers_inscription` ADD COLUMN `etape` VARCHAR(20) NOT NULL DEFAULT ''complementaire'' AFTER `profilRequis`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE `ins_dossiers_inscription`
  MODIFY COLUMN `etape` VARCHAR(20) NOT NULL DEFAULT 'complementaire';

UPDATE `ins_dossiers_inscription`
SET
  `etape` = CASE
    WHEN LOWER(COALESCE(`titre`, '')) LIKE '%bordereau%' THEN 'premiere'
    ELSE 'complementaire'
  END,
  `profilRequis` = CASE
    WHEN LOWER(COALESCE(`titre`, '')) LIKE '%bordereau%' THEN 'tous'
    WHEN `profilRequis` IN ('nouveau', 'ancien') THEN `profilRequis`
    ELSE 'tous'
  END;
