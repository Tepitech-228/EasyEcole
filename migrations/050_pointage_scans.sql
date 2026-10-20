CREATE TABLE IF NOT EXISTS `ins_pointage_scans` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `heure` TIME NOT NULL,
  `pointageId` INT UNSIGNED NOT NULL,
  `createdAt` DATETIME NULL,
  `updatedAt` DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ins_pointage_scans_pointage` (`pointageId`, `id`),
  CONSTRAINT `fk_ins_pointage_scans_pointage`
    FOREIGN KEY (`pointageId`) REFERENCES `ins_pointages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
