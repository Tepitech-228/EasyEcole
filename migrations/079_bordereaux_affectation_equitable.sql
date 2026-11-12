SET @db := DATABASE();

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_bordereaux' AND COLUMN_NAME = 'auditAssigneAId') = 0,
  'ALTER TABLE `ins_bordereaux` ADD COLUMN `auditAssigneAId` INT UNSIGNED NULL, ADD COLUMN `auditAssigneLe` DATETIME NULL, ADD COLUMN `auditPrisEnChargeLe` DATETIME NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_bordereaux' AND COLUMN_NAME = 'recouvrementAssigneAId') = 0,
  'ALTER TABLE `ins_bordereaux` ADD COLUMN `recouvrementAssigneAId` INT UNSIGNED NULL, ADD COLUMN `recouvrementAssigneLe` DATETIME NULL, ADD COLUMN `recouvrementPrisEnChargeLe` DATETIME NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_bordereaux' AND INDEX_NAME = 'idx_bordereau_audit_affectation') = 0,
  'CREATE INDEX `idx_bordereau_audit_affectation` ON `ins_bordereaux` (`statut`, `auditAssigneAId`, `etablissementId`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_bordereaux' AND INDEX_NAME = 'idx_bordereau_recouvrement_affectation') = 0,
  'CREATE INDEX `idx_bordereau_recouvrement_affectation` ON `ins_bordereaux` (`statut`, `recouvrementAssigneAId`, `etablissementId`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `ins_bordereau_agents_presence` (
  `utilisateurId` INT UNSIGNED NOT NULL,
  `etape` ENUM('audit', 'recouvrement') NOT NULL,
  `etablissementId` INT UNSIGNED NULL,
  `derniereActivite` DATETIME NOT NULL,
  PRIMARY KEY (`utilisateurId`, `etape`),
  KEY `idx_bordereau_presence_etape_site_activite` (`etape`, `etablissementId`, `derniereActivite`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `ins_bordereau_affectation_verrous` (
  `etape` ENUM('audit', 'recouvrement') NOT NULL,
  PRIMARY KEY (`etape`)
) ENGINE=InnoDB;

INSERT IGNORE INTO `ins_bordereau_affectation_verrous` (`etape`)
VALUES ('audit'), ('recouvrement');
