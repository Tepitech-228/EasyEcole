-- Online-only assessment cycle: two semester assignments and one confidential
-- in-person exam per course and academic year. Existing assessment records are
-- retained; legacy rows remain outside the new semester uniqueness constraint.
ALTER TABLE `elearning_devoirs`
  ADD COLUMN IF NOT EXISTS `semestre` TINYINT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS `anneeAcademiqueId` INT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS `statut` ENUM('brouillon', 'publie', 'ferme') NOT NULL DEFAULT 'brouillon',
  ADD COLUMN IF NOT EXISTS `consignes` TEXT NULL,
  ADD COLUMN IF NOT EXISTS `poids` DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  ADD COLUMN IF NOT EXISTS `datePublication` DATETIME NULL,
  ADD COLUMN IF NOT EXISTS `sujetFichier` VARCHAR(500) NULL;

ALTER TABLE `elearning_devoirs`
  ADD CONSTRAINT `fk_elearning_devoirs_annee` FOREIGN KEY IF NOT EXISTS (`anneeAcademiqueId`)
    REFERENCES `ins_annees_academiques` (`id`) ON DELETE SET NULL,
  ADD UNIQUE KEY IF NOT EXISTS `uq_elearning_devoir_cours_annee_semestre`
    (`coursId`, `anneeAcademiqueId`, `semestre`);

ALTER TABLE `elearning_soumissions_devoirs`
  ADD COLUMN IF NOT EXISTS `dateCorrection` DATETIME NULL,
  ADD COLUMN IF NOT EXISTS `corrigePar` INT UNSIGNED NULL;

ALTER TABLE `elearning_soumissions_devoirs`
  ADD CONSTRAINT `fk_elearning_soumissions_corrige_par` FOREIGN KEY IF NOT EXISTS (`corrigePar`)
    REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL;

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
