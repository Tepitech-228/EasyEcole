-- Affecte les bordereaux au service de recouvrement du site concerné.
SET @db := DATABASE();

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA=@db AND TABLE_NAME='ins_bordereaux' AND COLUMN_NAME='etablissementId')=0,
  'ALTER TABLE `ins_bordereaux` ADD COLUMN `etablissementId` INT UNSIGNED NULL AFTER `utilisateurId`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE `ins_bordereaux` AS b
JOIN (
  SELECT `utilisateurId`, MIN(`etablissementId`) AS `etablissementId`
  FROM `aut_utilisateur_etablissements`
  GROUP BY `utilisateurId`
  HAVING COUNT(DISTINCT `etablissementId`) = 1
) AS site_unique ON site_unique.`utilisateurId` = b.`utilisateurId`
SET b.`etablissementId` = site_unique.`etablissementId`
WHERE b.`etablissementId` IS NULL;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA=@db AND TABLE_NAME='ins_bordereaux' AND INDEX_NAME='idx_bordereau_site_statut_date')=0,
  'CREATE INDEX `idx_bordereau_site_statut_date` ON `ins_bordereaux` (`etablissementId`, `statut`, `dateSoumission`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='ins_bordereaux' AND CONSTRAINT_NAME='fk_bordereau_site')=0,
  'ALTER TABLE `ins_bordereaux` ADD CONSTRAINT `fk_bordereau_site` FOREIGN KEY (`etablissementId`) REFERENCES `eta_etablissements` (`id`) ON DELETE RESTRICT',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
