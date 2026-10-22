-- Online-only assessment cycle: two semester assignments and one confidential
-- in-person exam per course and academic year. Existing assessment records are
-- retained; legacy rows remain outside the new semester uniqueness constraint.
SET @sql := CONCAT(
  'ALTER TABLE `elearning_devoirs` ',
  CONCAT_WS(', ',
    IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'elearning_devoirs' AND COLUMN_NAME = 'semestre') = 0, 'ADD COLUMN `semestre` TINYINT UNSIGNED NULL', NULL),
    IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'elearning_devoirs' AND COLUMN_NAME = 'anneeAcademiqueId') = 0, 'ADD COLUMN `anneeAcademiqueId` INT UNSIGNED NULL', NULL),
    IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'elearning_devoirs' AND COLUMN_NAME = 'statut') = 0, 'ADD COLUMN `statut` ENUM(''brouillon'', ''publie'', ''ferme'') NOT NULL DEFAULT ''brouillon''', NULL),
    IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'elearning_devoirs' AND COLUMN_NAME = 'consignes') = 0, 'ADD COLUMN `consignes` TEXT NULL', NULL),
    IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'elearning_devoirs' AND COLUMN_NAME = 'poids') = 0, 'ADD COLUMN `poids` DECIMAL(5,2) NOT NULL DEFAULT 50.00', NULL),
    IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'elearning_devoirs' AND COLUMN_NAME = 'datePublication') = 0, 'ADD COLUMN `datePublication` DATETIME NULL', NULL),
    IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'elearning_devoirs' AND COLUMN_NAME = 'sujetFichier') = 0, 'ADD COLUMN `sujetFichier` VARCHAR(500) NULL', NULL)
  )
);
SET @sql := IF(@sql = 'ALTER TABLE `elearning_devoirs` ', 'SELECT 1', @sql);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fkExists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'elearning_devoirs'
    AND CONSTRAINT_NAME = 'fk_elearning_devoirs_annee' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(@fkExists = 0,
  'ALTER TABLE `elearning_devoirs` ADD CONSTRAINT `fk_elearning_devoirs_annee` FOREIGN KEY (`anneeAcademiqueId`) REFERENCES `ins_annees_academiques` (`id`) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idxExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'elearning_devoirs'
    AND INDEX_NAME = 'uq_elearning_devoir_cours_annee_semestre'
);
SET @sql := IF(@idxExists = 0,
  'ALTER TABLE `elearning_devoirs` ADD UNIQUE KEY `uq_elearning_devoir_cours_annee_semestre` (`coursId`, `anneeAcademiqueId`, `semestre`)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := CONCAT(
  'ALTER TABLE `elearning_soumissions_devoirs` ',
  CONCAT_WS(', ',
    IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'elearning_soumissions_devoirs' AND COLUMN_NAME = 'dateCorrection') = 0, 'ADD COLUMN `dateCorrection` DATETIME NULL', NULL),
    IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'elearning_soumissions_devoirs' AND COLUMN_NAME = 'corrigePar') = 0, 'ADD COLUMN `corrigePar` INT UNSIGNED NULL', NULL)
  )
);
SET @sql := IF(@sql = 'ALTER TABLE `elearning_soumissions_devoirs` ', 'SELECT 1', @sql);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fkExists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'elearning_soumissions_devoirs'
    AND CONSTRAINT_NAME = 'fk_elearning_soumissions_corrige_par' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(@fkExists = 0,
  'ALTER TABLE `elearning_soumissions_devoirs` ADD CONSTRAINT `fk_elearning_soumissions_corrige_par` FOREIGN KEY (`corrigePar`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `elearning_examens` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `coursId` INT UNSIGNED NOT NULL,
  `anneeAcademiqueId` INT UNSIGNED NOT NULL,
  `dateExamen` DATETIME NULL,
  `lieu` VARCHAR(255) NULL,
  `dureeMinutes` INT UNSIGNED NULL,
  `sujetFichier` VARCHAR(500) NOT NULL,
  `statut` ENUM('brouillon', 'publie', 'termine') NOT NULL DEFAULT 'brouillon',
  `creePar` INT UNSIGNED NOT NULL,
  `createdAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_elearning_examen_cours_annee` (`coursId`, `anneeAcademiqueId`),
  KEY `idx_elearning_examens_annee` (`anneeAcademiqueId`),
  CONSTRAINT `fk_elearning_examens_cours` FOREIGN KEY (`coursId`)
    REFERENCES `elearning_cours` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_elearning_examens_annee` FOREIGN KEY (`anneeAcademiqueId`)
    REFERENCES `ins_annees_academiques` (`id`),
  CONSTRAINT `fk_elearning_examens_cree_par` FOREIGN KEY (`creePar`)
    REFERENCES `aut_utilisateurs` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

CREATE TABLE IF NOT EXISTS `elearning_notes_examens` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `examenId` INT UNSIGNED NOT NULL,
  `utilisateurId` INT UNSIGNED NOT NULL,
  `note` DECIMAL(5,2) NOT NULL,
  `commentaire` TEXT NULL,
  `saisiePar` INT UNSIGNED NOT NULL,
  `createdAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_elearning_note_examen_etudiant` (`examenId`, `utilisateurId`),
  CONSTRAINT `fk_elearning_notes_examens_examen` FOREIGN KEY (`examenId`)
    REFERENCES `elearning_examens` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_elearning_notes_examens_utilisateur` FOREIGN KEY (`utilisateurId`)
    REFERENCES `aut_utilisateurs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_elearning_notes_examens_saisie_par` FOREIGN KEY (`saisiePar`)
    REFERENCES `aut_utilisateurs` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
