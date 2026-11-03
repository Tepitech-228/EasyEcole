CREATE TABLE IF NOT EXISTS `elearning_centres_examens` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nom` VARCHAR(160) NOT NULL,
  `code` VARCHAR(40) NOT NULL,
  `ville` VARCHAR(120) NOT NULL,
  `adresse` VARCHAR(500) NULL,
  `telephone` VARCHAR(40) NULL,
  `capacite` INT UNSIGNED NOT NULL,
  `responsableId` INT UNSIGNED NOT NULL,
  `actif` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_elearning_centre_code` (`code`),
  KEY `idx_elearning_centre_responsable` (`responsableId`),
  CONSTRAINT `fk_elearning_centre_responsable` FOREIGN KEY (`responsableId`) REFERENCES `aut_utilisateurs` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `elearning_sessions_examens` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `examenId` INT UNSIGNED NOT NULL,
  `centreId` INT UNSIGNED NOT NULL,
  `dateExamen` DATETIME NOT NULL,
  `capacite` INT UNSIGNED NOT NULL,
  `statut` ENUM('ouverte', 'fermee', 'annulee') NOT NULL DEFAULT 'ouverte',
  `creePar` INT UNSIGNED NOT NULL,
  `createdAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_elearning_session_exam_date` (`examenId`, `dateExamen`),
  KEY `idx_elearning_session_centre_date` (`centreId`, `dateExamen`),
  CONSTRAINT `fk_elearning_session_exam` FOREIGN KEY (`examenId`) REFERENCES `elearning_examens` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_elearning_session_centre` FOREIGN KEY (`centreId`) REFERENCES `elearning_centres_examens` (`id`),
  CONSTRAINT `fk_elearning_session_creator` FOREIGN KEY (`creePar`) REFERENCES `aut_utilisateurs` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `elearning_reservations_examens` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `examenId` INT UNSIGNED NOT NULL,
  `sessionId` INT UNSIGNED NOT NULL,
  `utilisateurId` INT UNSIGNED NOT NULL,
  `statut` ENUM('reservee', 'presente', 'absente', 'annulee') NOT NULL DEFAULT 'reservee',
  `marquePar` INT UNSIGNED NULL,
  `createdAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_elearning_reservation_exam_student` (`examenId`, `utilisateurId`),
  KEY `idx_elearning_reservation_session` (`sessionId`, `statut`),
  CONSTRAINT `fk_elearning_reservation_exam` FOREIGN KEY (`examenId`) REFERENCES `elearning_examens` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_elearning_reservation_session` FOREIGN KEY (`sessionId`) REFERENCES `elearning_sessions_examens` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_elearning_reservation_student` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_elearning_reservation_marker` FOREIGN KEY (`marquePar`) REFERENCES `aut_utilisateurs` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;