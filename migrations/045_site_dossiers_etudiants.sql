-- Rattache les comptes financiers étudiants à un site.
SET @db := DATABASE();

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA=@db AND TABLE_NAME='ins_dossiers_etudiants' AND COLUMN_NAME='etablissementId')=0,
  'ALTER TABLE `ins_dossiers_etudiants` ADD COLUMN `etablissementId` INT UNSIGNED NULL AFTER `utilisateurId`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Complète le site des cursus historiques à partir de leur classe/parcours.
UPDATE `ins_cursus_apprenants` AS ca
LEFT JOIN `ins_classes` AS cl ON cl.`id` = ca.`classeId`
LEFT JOIN `ins_parcours` AS p ON p.`id` = ca.`parcoursId`
SET ca.`etablissementId` = COALESCE(cl.`etablissementId`, p.`etablissementId`)
WHERE ca.`etablissementId` IS NULL
  AND COALESCE(cl.`etablissementId`, p.`etablissementId`) IS NOT NULL;

-- Priorité au site unique du cursus (site explicite, classe ou parcours).
UPDATE `ins_dossiers_etudiants` AS d
JOIN (
  SELECT sites.`utilisateurId`, MIN(sites.`siteId`) AS `etablissementId`
  FROM (
    SELECT ca.`utilisateurId`,
           COALESCE(ca.`etablissementId`, cl.`etablissementId`, p.`etablissementId`) AS `siteId`
    FROM `ins_cursus_apprenants` AS ca
    LEFT JOIN `ins_classes` AS cl ON cl.`id` = ca.`classeId`
    LEFT JOIN `ins_parcours` AS p ON p.`id` = ca.`parcoursId`
    WHERE ca.`deletedAt` IS NULL
      AND COALESCE(ca.`etablissementId`, cl.`etablissementId`, p.`etablissementId`) IS NOT NULL
  ) AS sites
  GROUP BY sites.`utilisateurId`
  HAVING COUNT(DISTINCT sites.`siteId`) = 1
) AS site_unique ON site_unique.`utilisateurId` = d.`utilisateurId`
SET d.`etablissementId` = site_unique.`etablissementId`
WHERE d.`etablissementId` IS NULL;

-- À défaut de cursus, n'utilise les bordereaux historiques que si leur site est unique.
UPDATE `ins_dossiers_etudiants` AS d
JOIN (
  SELECT b.`utilisateurId`, MIN(b.`etablissementId`) AS `etablissementId`
  FROM `ins_bordereaux` AS b
  WHERE b.`etablissementId` IS NOT NULL
    AND b.`deletedAt` IS NULL
  GROUP BY b.`utilisateurId`
  HAVING COUNT(DISTINCT b.`etablissementId`) = 1
) AS site_unique ON site_unique.`utilisateurId` = d.`utilisateurId`
SET d.`etablissementId` = site_unique.`etablissementId`
WHERE d.`etablissementId` IS NULL;

-- Une base mono-site permet un rattachement sûr des comptes historiques restants.
UPDATE `ins_dossiers_etudiants`
SET `etablissementId` = (
  SELECT `id` FROM `eta_etablissements` WHERE `actif` = 1 LIMIT 1
)
WHERE `etablissementId` IS NULL
  AND (SELECT COUNT(*) FROM `eta_etablissements` WHERE `actif` = 1) = 1;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA=@db AND TABLE_NAME='ins_dossiers_etudiants' AND INDEX_NAME='idx_dossier_site_statut')=0,
  'CREATE INDEX `idx_dossier_site_statut` ON `ins_dossiers_etudiants` (`etablissementId`, `statut`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='ins_dossiers_etudiants' AND CONSTRAINT_NAME='fk_dossier_etudiant_site')=0,
  'ALTER TABLE `ins_dossiers_etudiants` ADD CONSTRAINT `fk_dossier_etudiant_site` FOREIGN KEY (`etablissementId`) REFERENCES `eta_etablissements` (`id`) ON DELETE RESTRICT',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
