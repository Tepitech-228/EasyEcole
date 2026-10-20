ALTER TABLE `ins_demandes_inscription`
  ADD COLUMN `consentementHikvisionAt` DATETIME NULL;

CREATE TABLE IF NOT EXISTS `ins_hikvision_enrollments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `terminalId` INT UNSIGNED NOT NULL,
  `utilisateurId` INT UNSIGNED NOT NULL,
  `etablissementId` INT UNSIGNED NOT NULL,
  `employeeNo` VARCHAR(64) NOT NULL,
  `statut` ENUM('en_attente', 'en_cours', 'termine') NOT NULL DEFAULT 'en_attente',
  `tentatives` INT UNSIGNED NOT NULL DEFAULT 0,
  `prochaineTentativeAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `derniereErreur` VARCHAR(500) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_hikvision_enrollment_terminal_user` (`terminalId`, `utilisateurId`),
  KEY `idx_hikvision_enrollment_retry` (`statut`, `prochaineTentativeAt`),
  CONSTRAINT `fk_hikvision_enrollment_terminal`
    FOREIGN KEY (`terminalId`) REFERENCES `ins_pointage_terminaux` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hikvision_enrollment_user`
    FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hikvision_enrollment_site`
    FOREIGN KEY (`etablissementId`) REFERENCES `eta_etablissements` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
