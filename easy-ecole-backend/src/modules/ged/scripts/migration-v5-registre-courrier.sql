-- Table de registre courrier
CREATE TABLE IF NOT EXISTS `ged_registre_courrier` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sens` ENUM('entrant', 'sortant') NOT NULL,
  `numeroOrdre` INT NOT NULL,
  `annee` INT NOT NULL,
  `dateCourrier` DATE NULL,
  `expediteur` VARCHAR(255) NULL,
  `destinataire` VARCHAR(255) NULL,
  `objet` VARCHAR(255) NOT NULL,
  `modeEnvoi` ENUM('courrier', 'email', 'remise_main_propre', 'fax') NULL,
  `accuseReception` TINYINT(1) NOT NULL DEFAULT 0,
  `referenceDocument` VARCHAR(255) NULL,
  `annotations` TEXT NULL,
  `documentId` INT UNSIGNED NULL,
  `utilisateurId` INT UNSIGNED NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `deletedAt` DATETIME NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_sens_annee` (`sens`, `annee`),
  INDEX `idx_document` (`documentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
