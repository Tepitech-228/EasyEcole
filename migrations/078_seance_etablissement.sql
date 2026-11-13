SET @db := DATABASE();

SET @columnExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'ins_seances'
    AND COLUMN_NAME = 'etablissementId'
);
SET @sql := IF(@columnExists = 0,
  'ALTER TABLE `ins_seances` ADD COLUMN `etablissementId` INT UNSIGNED NULL AFTER `titre`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Preserve the site of existing schedules where it can be inferred reliably.
UPDATE `ins_seances` AS s
LEFT JOIN `ins_cours` AS c ON c.`id` = s.`coursId`
LEFT JOIN `ins_classes` AS cl ON cl.`id` = c.`classeId`
LEFT JOIN `ins_parcours` AS p ON p.`id` = c.`parcoursId`
SET s.`etablissementId` = COALESCE(c.`etablissementId`, cl.`etablissementId`, p.`etablissementId`)
WHERE s.`etablissementId` IS NULL
  AND COALESCE(c.`etablissementId`, cl.`etablissementId`, p.`etablissementId`) IS NOT NULL;

SET @indexExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'ins_seances'
    AND INDEX_NAME = 'idx_ins_seances_etablissement'
);
SET @sql := IF(@indexExists = 0,
  'CREATE INDEX `idx_ins_seances_etablissement` ON `ins_seances` (`etablissementId`)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
