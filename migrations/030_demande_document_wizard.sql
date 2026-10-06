SET @databaseName := DATABASE();

SET @hasEtapeWizard := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @databaseName
    AND TABLE_NAME = 'scol_demandes_document'
    AND COLUMN_NAME = 'etapeWizard'
);
SET @sql := IF(
  @hasEtapeWizard = 0,
  'ALTER TABLE `scol_demandes_document` ADD COLUMN `etapeWizard` INT UNSIGNED NOT NULL DEFAULT 1',
  'SELECT ''scol_demandes_document.etapeWizard existe déjà'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @hasTourComite := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @databaseName
    AND TABLE_NAME = 'scol_demandes_document'
    AND COLUMN_NAME = 'tourComite'
);
SET @sql := IF(
  @hasTourComite = 0,
  'ALTER TABLE `scol_demandes_document` ADD COLUMN `tourComite` INT UNSIGNED NOT NULL DEFAULT 1',
  'SELECT ''scol_demandes_document.tourComite existe déjà'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @hasPiecesRequises := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @databaseName
    AND TABLE_NAME = 'scol_types_document'
    AND COLUMN_NAME = 'piecesRequises'
);
SET @sql := IF(
  @hasPiecesRequises = 0,
  'ALTER TABLE `scol_types_document` ADD COLUMN `piecesRequises` JSON NULL',
  'SELECT ''scol_types_document.piecesRequises existe déjà'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @hasDraftStatus := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @databaseName
    AND TABLE_NAME = 'scol_demandes_document'
    AND COLUMN_NAME = 'statut'
);
SET @sql := IF(
  @hasDraftStatus = 1,
  'ALTER TABLE `scol_demandes_document` MODIFY COLUMN `statut` ENUM(''brouillon'', ''soumise'', ''en_attente_paiement'', ''paye'', ''en_preparation'', ''en_comite'', ''document_pret'', ''remise'', ''rejetee'', ''annulee'', ''validee'', ''delivree'') NOT NULL DEFAULT ''soumise''',
  'SELECT ''scol_demandes_document.statut est absent'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `scol_demandes_document_pieces` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `demandeId` INT UNSIGNED NOT NULL,
  `cle` VARCHAR(80) NOT NULL,
  `libelle` VARCHAR(160) NOT NULL,
  `nomOriginal` VARCHAR(255) NOT NULL,
  `cheminFichier` VARCHAR(500) NOT NULL,
  `typeMime` VARCHAR(100) NOT NULL,
  `tailleOctets` INT UNSIGNED NOT NULL,
  `version` INT UNSIGNED NOT NULL DEFAULT 1,
  `estCourante` TINYINT(1) NOT NULL DEFAULT 1,
  `statutAudit` ENUM('en_attente', 'validee', 'rejetee') NOT NULL DEFAULT 'en_attente',
  `motifRejet` VARCHAR(255) NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_demande_piece_current` (`demandeId`, `cle`, `estCourante`),
  CONSTRAINT `fk_demande_document_pieces_demande`
    FOREIGN KEY (`demandeId`) REFERENCES `scol_demandes_document` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

CREATE TABLE IF NOT EXISTS `scol_demandes_document_votes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `demandeId` INT UNSIGNED NOT NULL,
  `membreId` INT UNSIGNED NOT NULL,
  `tour` INT UNSIGNED NOT NULL,
  `decision` ENUM('valider', 'corriger') NOT NULL,
  `motif` VARCHAR(255) NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_demande_document_vote_membre_tour` (`demandeId`, `membreId`, `tour`),
  KEY `idx_demande_document_votes_tour` (`demandeId`, `tour`),
  CONSTRAINT `fk_demande_document_votes_demande`
    FOREIGN KEY (`demandeId`) REFERENCES `scol_demandes_document` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_demande_document_votes_membre`
    FOREIGN KEY (`membreId`) REFERENCES `aut_utilisateurs` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
