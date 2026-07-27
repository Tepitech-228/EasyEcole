ALTER TABLE `ged_documents` ADD COLUMN `verification_code` VARCHAR(8) NULL AFTER `numero_courrier`;
CREATE TABLE IF NOT EXISTS `ged_notifications` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `documentId` INT UNSIGNED NOT NULL,
  `type` ENUM('dua_expiration', 'dua_approche', 'destruction_imminente', 'signature_demandee', 'signature_effectuee') NOT NULL,
  `message` VARCHAR(500) NOT NULL,
  `destinataireId` INT UNSIGNED NULL,
  `lu` TINYINT(1) NOT NULL DEFAULT 0,
  `luAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_notif_document` (`documentId`),
  INDEX `idx_notif_destinataire` (`destinataireId`),
  INDEX `idx_notif_lu` (`lu`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
