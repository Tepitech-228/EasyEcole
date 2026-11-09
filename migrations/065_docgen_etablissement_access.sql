-- Rattache les documents DocGen à leur site pour permettre un accès cloisonné.
SET @db := DATABASE();

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA=@db AND TABLE_NAME='docgen_documents' AND COLUMN_NAME='etablissementId')=0,
  'ALTER TABLE `docgen_documents` ADD COLUMN `etablissementId` INT UNSIGNED NULL AFTER `sourceId`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Les anciens documents ne sont réattribués que si leur créateur n'a qu'un seul site.
UPDATE `docgen_documents` AS d
JOIN (
  SELECT `utilisateurId`, MIN(`etablissementId`) AS `etablissementId`
  FROM `aut_utilisateur_etablissements`
  GROUP BY `utilisateurId`
  HAVING COUNT(DISTINCT `etablissementId`) = 1
) AS site_unique ON site_unique.`utilisateurId` = d.`generatedById`
SET d.`etablissementId` = site_unique.`etablissementId`
WHERE d.`etablissementId` IS NULL;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA=@db AND TABLE_NAME='docgen_documents' AND INDEX_NAME='idx_docgen_documents_site_created')=0,
  'CREATE INDEX `idx_docgen_documents_site_created` ON `docgen_documents` (`etablissementId`, `createdAt`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA=@db AND TABLE_NAME='docgen_documents' AND CONSTRAINT_NAME='fk_docgen_documents_site')=0,
  'ALTER TABLE `docgen_documents` ADD CONSTRAINT `fk_docgen_documents_site` FOREIGN KEY (`etablissementId`) REFERENCES `eta_etablissements` (`id`) ON DELETE RESTRICT',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

INSERT INTO `aut_roles` (`nom`, `description`, `createdAt`, `updatedAt`)
SELECT 'Secrétaire', 'Consultation et impression des documents de son établissement', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM `aut_roles` WHERE `nom` = 'Secrétaire'
);

INSERT INTO `aut_permissions` (`key`, `libelle`, `module`, `type`, `parentKey`, `createdAt`, `updatedAt`)
VALUES ('menu.docgen.documents', 'Tous les documents', 'Gestion documentaire', 'menu', NULL, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `libelle` = VALUES(`libelle`),
  `module` = VALUES(`module`),
  `type` = VALUES(`type`),
  `deletedAt` = NULL;

UPDATE `aut_role_permissions` rp
JOIN `aut_roles` r ON r.`id` = rp.`roleId`
JOIN `aut_permissions` p ON p.`id` = rp.`permissionId`
SET rp.`deletedAt` = NULL, rp.`updatedAt` = NOW()
WHERE r.`nom` = 'Secrétaire'
  AND p.`key` = 'menu.docgen.documents'
  AND rp.`deletedAt` IS NOT NULL;

INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.`id`, p.`id`, NOW(), NOW()
FROM `aut_roles` r
JOIN `aut_permissions` p ON p.`key` = 'menu.docgen.documents'
LEFT JOIN `aut_role_permissions` existing ON existing.`roleId` = r.`id` AND existing.`permissionId` = p.`id`
WHERE r.`nom` = 'Secrétaire'
  AND existing.`id` IS NULL;
