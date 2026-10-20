-- Configuration des terminaux ADMS et journal minimal des pointages reçus.
-- Les gabarits visage/empreinte et les photos ne sont jamais transférés ni stockés.
CREATE TABLE IF NOT EXISTS `ins_pointage_terminaux` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `serialNumber` VARCHAR(64) NOT NULL,
  `nom` VARCHAR(120) NOT NULL,
  `sourceIp` VARCHAR(45) NOT NULL,
  `etablissementId` INT UNSIGNED NOT NULL,
  `actif` TINYINT(1) NOT NULL DEFAULT 1,
  `attStamp` INT UNSIGNED NOT NULL DEFAULT 0,
  `lastSeenAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pointage_terminal_serial` (`serialNumber`),
  KEY `idx_pointage_terminal_site` (`etablissementId`, `actif`),
  CONSTRAINT `fk_pointage_terminal_site`
    FOREIGN KEY (`etablissementId`) REFERENCES `eta_etablissements` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `ins_pointage_terminal_events` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `terminalId` INT UNSIGNED NOT NULL,
  `utilisateurId` INT UNSIGNED NULL,
  `etablissementId` INT UNSIGNED NOT NULL,
  `pointageId` INT UNSIGNED NULL,
  `pin` VARCHAR(64) NOT NULL,
  `date` DATE NOT NULL,
  `heure` TIME NOT NULL,
  `statusCode` INT NOT NULL,
  `verifyType` INT NOT NULL,
  `statut` ENUM('enregistre', 'refuse') NOT NULL,
  `motifRefus` VARCHAR(255) NULL,
  `fingerprint` CHAR(64) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pointage_terminal_event_fingerprint` (`fingerprint`),
  KEY `idx_pointage_terminal_event_site_date` (`etablissementId`, `date`),
  KEY `idx_pointage_terminal_event_user_date` (`utilisateurId`, `date`),
  CONSTRAINT `fk_pointage_terminal_event_terminal`
    FOREIGN KEY (`terminalId`) REFERENCES `ins_pointage_terminaux` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pointage_terminal_event_user`
    FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pointage_terminal_event_site`
    FOREIGN KEY (`etablissementId`) REFERENCES `eta_etablissements` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_pointage_terminal_event_pointage`
    FOREIGN KEY (`pointageId`) REFERENCES `ins_pointages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
