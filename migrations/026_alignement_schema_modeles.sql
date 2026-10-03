-- =============================================================================
-- EasyEcole — Migration SQL 026 : alignement du schéma sur les modeles
-- =============================================================================
-- Constat : après application des migrations 001 à 025, la base ne contenait
-- toujours pas tout ce que décrivent les modèles Sequelize. L'écart n'était pas
-- visible jusqu'ici, car il était comblé « en douce » au démarrage par
-- sequelize.sync({ alter: true }). Cette synchronisation est désormais
-- désactivée en production (cf. DatabaseConnection.ts), ce qui rend l'écart
-- bloquant : l'application interroge des tables et des colonnes inexistantes.
--
-- Contenu : 8 tables absentes + 22 colonnes absentes + 8 clés étrangères,
-- et suppression de 3 colonnes obsolètes remplacées par leurs versions
-- normalisées (ue/ecue → ueId/ecueId, demandeId → rattrapageInscriptionId).
--
-- Idempotent : chaque création de table, chaque colonne et chaque clé étrangère
-- n'est appliquée que si elle est absente, et seulement si la table parente
-- existe. La migration peut donc être rejouée sans effet de bord.
--
-- Note : ins_rattrapage_notes.rattrapageInscriptionId est NOT NULL et porte une
-- clé étrangère. Son ajout suppose la table vide (cas actuel). Sur une base
-- historique qui contiendrait déjà des notes de rattrapage, renseigner d'abord
-- les lignes existantes avant de lancer cette migration.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tables absentes
-- -----------------------------------------------------------------------------

-- Bourses : barème de calcul
CREATE TABLE IF NOT EXISTS `brs_configurations` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `nom` VARCHAR(150) NOT NULL,
  `type` ENUM('TOTAL', 'PARTIELLE') NOT NULL,
  `taux` DECIMAL(5,2) NOT NULL,
  `description` TEXT,
  `statut` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  `deletedAt` DATETIME,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB COLLATE utf8mb3_general_ci;

-- Bourses : attribution d'une aide à un dossier étudiant
CREATE TABLE IF NOT EXISTS `brs_attributions` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `dossierEtudiantId` INTEGER UNSIGNED NOT NULL,
  `configurationId` INTEGER UNSIGNED NOT NULL,
  `niveauEtudeId` INTEGER UNSIGNED DEFAULT NULL COMMENT 'Niveau d''études ciblé (L1, M1, etc.) — renseigné lors d''une attribution par campagne',
  `type` ENUM('TOTAL', 'PARTIELLE') NOT NULL,
  `taux` DECIMAL(5,2) NOT NULL,
  `dateDebut` DATE NOT NULL,
  `dateFin` DATE DEFAULT NULL,
  `statut` ENUM('ACTIVE', 'SUSPENDUE', 'EXPIREE') NOT NULL DEFAULT 'ACTIVE',
  `motif` TEXT,
  `valideParId` INTEGER UNSIGNED NOT NULL,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  `deletedAt` DATETIME,
  PRIMARY KEY (`id`),
  KEY `brs_attributions_dossierEtudiantId` (`dossierEtudiantId`),
  KEY `brs_attributions_configurationId` (`configurationId`),
  KEY `brs_attributions_niveauEtudeId` (`niveauEtudeId`),
  KEY `brs_attributions_valideParId` (`valideParId`)
) ENGINE=InnoDB COLLATE utf8mb3_general_ci;

-- GED : documents requis par niveau d'études
CREATE TABLE IF NOT EXISTS `ins_document_requis_niveau` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(100) NOT NULL,
  `libelle` VARCHAR(255) NOT NULL,
  `niveau` VARCHAR(60) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `ordre` INT UNSIGNED NOT NULL DEFAULT '0',
  `obligatoire` TINYINT(1) NOT NULL DEFAULT '1',
  `createdAt` DATETIME DEFAULT NULL,
  `updatedAt` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ins_document_requis_niveau_niveau_code` (`niveau`,`code`),
  KEY `ins_document_requis_niveau_niveau` (`niveau`),
  KEY `ins_document_requis_niveau_ordre` (`ordre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Rapports : agrégats (tableaux de bord)
CREATE TABLE IF NOT EXISTS `rpt_documents_academiques` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `typeDocument` VARCHAR(255),
  `periode` VARCHAR(255),
  `nbDemandes` INTEGER DEFAULT 0,
  `nbDelivres` INTEGER DEFAULT 0,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB COLLATE utf8mb3_general_ci;

CREATE TABLE IF NOT EXISTS `rpt_effectifs_rh` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `departementId` INTEGER UNSIGNED,
  `date` DATE,
  `nbEmployes` INTEGER DEFAULT 0,
  `nbActifs` INTEGER DEFAULT 0,
  `masseSalariale` DECIMAL(12,2) DEFAULT 0,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB COLLATE utf8mb3_general_ci;

CREATE TABLE IF NOT EXISTS `rpt_factures` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `mois` VARCHAR(255),
  `nbFactures` INTEGER DEFAULT 0,
  `montantTotal` DECIMAL(12,2) DEFAULT 0,
  `statut` VARCHAR(255),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB COLLATE utf8mb3_general_ci;

CREATE TABLE IF NOT EXISTS `rpt_paie` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `periode` VARCHAR(255),
  `nbBulletins` INTEGER DEFAULT 0,
  `totalGains` DECIMAL(12,2) DEFAULT 0,
  `totalRetenues` DECIMAL(12,2) DEFAULT 0,
  `netTotal` DECIMAL(12,2) DEFAULT 0,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB COLLATE utf8mb3_general_ci;

CREATE TABLE IF NOT EXISTS `rpt_presences` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `coursId` INTEGER UNSIGNED,
  `seanceId` INTEGER UNSIGNED,
  `date` DATE,
  `nbPresent` INTEGER DEFAULT 0,
  `nbAbsent` INTEGER DEFAULT 0,
  `taux` FLOAT DEFAULT 0,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB COLLATE utf8mb3_general_ci;

-- -----------------------------------------------------------------------------
-- 2. Colonnes absentes
-- -----------------------------------------------------------------------------

-- Inscriptions : montant d'origine de l'échéance (avant remise)
SET @tableExists := (SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_echeances');
SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_echeances' AND COLUMN_NAME = 'montantOriginal');
SET @sql := IF(@tableExists = 1 AND @colExists = 0,
  'ALTER TABLE `ins_echeances` ADD COLUMN `montantOriginal` FLOAT UNSIGNED NULL',
  'SELECT ''colonne ins_echeances.montantOriginal deja presente ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Inscriptions : bourse (2 colonnes)
SET @tableExists := (SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_demandes_inscription');
SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_demandes_inscription' AND COLUMN_NAME = 'estBoursier');
SET @sql := IF(@tableExists = 1 AND @colExists = 0,
  'ALTER TABLE `ins_demandes_inscription` ADD COLUMN `estBoursier` TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT ''colonne ins_demandes_inscription.estBoursier deja presente ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_demandes_inscription' AND COLUMN_NAME = 'documentBourse');
SET @sql := IF(@tableExists = 1 AND @colExists = 0,
  'ALTER TABLE `ins_demandes_inscription` ADD COLUMN `documentBourse` VARCHAR(255) NULL',
  'SELECT ''colonne ins_demandes_inscription.documentBourse deja presente ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- GED : chiffrement et localisation du fichier (noms snake_case mappés par le modèle)
SET @tableExists := (SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents');
SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'processus_generateur_id');
SET @sql := IF(@tableExists = 1 AND @colExists = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `processus_generateur_id` CHAR(36) NULL',
  'SELECT ''colonne ged_documents.processus_generateur_id deja presente ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'storage_location');
SET @sql := IF(@tableExists = 1 AND @colExists = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `storage_location` VARCHAR(50) NOT NULL DEFAULT ''local''',
  'SELECT ''colonne ged_documents.storage_location deja presente ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'is_encrypted');
SET @sql := IF(@tableExists = 1 AND @colExists = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `is_encrypted` TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT ''colonne ged_documents.is_encrypted deja presente ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'encryption_key_id');
SET @sql := IF(@tableExists = 1 AND @colExists = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `encryption_key_id` VARCHAR(255) NULL',
  'SELECT ''colonne ged_documents.encryption_key_id deja presente ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- GED : processus générateur (noms snake_case mappés par le modèle)
SET @tableExists := (SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_processus');
SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_processus' AND COLUMN_NAME = 'module_source');
SET @sql := IF(@tableExists = 1 AND @colExists = 0,
  'ALTER TABLE `ged_processus` ADD COLUMN `module_source` VARCHAR(50) NULL',
  'SELECT ''colonne ged_processus.module_source deja presente ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_processus' AND COLUMN_NAME = 'is_actif');
SET @sql := IF(@tableExists = 1 AND @colExists = 0,
  'ALTER TABLE `ged_processus` ADD COLUMN `is_actif` TINYINT(1) NOT NULL DEFAULT 1',
  'SELECT ''colonne ged_processus.is_actif deja presente ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Rattrapages : UE / ECUE concernés
SET @tableExists := (SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapage_enseignants');
SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapage_enseignants' AND COLUMN_NAME = 'ueId');
SET @sql := IF(@tableExists = 1 AND @colExists = 0,
  'ALTER TABLE `ins_rattrapage_enseignants` ADD COLUMN `ueId` INT UNSIGNED NULL',
  'SELECT ''colonne ins_rattrapage_enseignants.ueId deja presente ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapage_enseignants' AND COLUMN_NAME = 'ecueId');
SET @sql := IF(@tableExists = 1 AND @colExists = 0,
  'ALTER TABLE `ins_rattrapage_enseignants` ADD COLUMN `ecueId` INT UNSIGNED NULL',
  'SELECT ''colonne ins_rattrapage_enseignants.ecueId deja presente ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Rattrapages : séance de planification
SET @tableExists := (SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapages_inscriptions');
SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapages_inscriptions' AND COLUMN_NAME = 'planningId');
SET @sql := IF(@tableExists = 1 AND @colExists = 0,
  'ALTER TABLE `ins_rattrapages_inscriptions` ADD COLUMN `planningId` INT UNSIGNED NULL',
  'SELECT ''colonne ins_rattrapages_inscriptions.planningId deja presente ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Rattrapages : note rattachée à une inscription en rattrapage
SET @tableExists := (SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapage_notes');
SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapage_notes' AND COLUMN_NAME = 'rattrapageInscriptionId');
SET @sql := IF(@tableExists = 1 AND @colExists = 0,
  'ALTER TABLE `ins_rattrapage_notes` ADD COLUMN `rattrapageInscriptionId` INT UNSIGNED NOT NULL',
  'SELECT ''colonne ins_rattrapage_notes.rattrapageInscriptionId deja presente ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Scolarité : reçu de caisse et caissier
SET @tableExists := (SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'scol_demandes_document');
SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'scol_demandes_document' AND COLUMN_NAME = 'referencePaiement');
SET @sql := IF(@tableExists = 1 AND @colExists = 0,
  'ALTER TABLE `scol_demandes_document` ADD COLUMN `referencePaiement` VARCHAR(100) NULL COMMENT ''N° chèque, référence mobile money, etc.''',
  'SELECT ''colonne scol_demandes_document.referencePaiement deja presente ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'scol_demandes_document' AND COLUMN_NAME = 'recuCaisseId');
SET @sql := IF(@tableExists = 1 AND @colExists = 0,
  'ALTER TABLE `scol_demandes_document` ADD COLUMN `recuCaisseId` INT UNSIGNED NULL',
  'SELECT ''colonne scol_demandes_document.recuCaisseId deja presente ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'scol_demandes_document' AND COLUMN_NAME = 'caissierId');
SET @sql := IF(@tableExists = 1 AND @colExists = 0,
  'ALTER TABLE `scol_demandes_document` ADD COLUMN `caissierId` INT UNSIGNED NULL',
  'SELECT ''colonne scol_demandes_document.caissierId deja presente ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Apprenants : pièce d'identité (type + numéro)
SET @tableExists := (SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_apprenants');
SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_apprenants' AND COLUMN_NAME = 'typePieceIdentite');
SET @sql := IF(@tableExists = 1 AND @colExists = 0,
  'ALTER TABLE `aut_apprenants` ADD COLUMN `typePieceIdentite` VARCHAR(255) NULL',
  'SELECT ''colonne aut_apprenants.typePieceIdentite deja presente ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_apprenants' AND COLUMN_NAME = 'numeroPiece');
SET @sql := IF(@tableExists = 1 AND @colExists = 0,
  'ALTER TABLE `aut_apprenants` ADD COLUMN `numeroPiece` VARCHAR(255) NULL',
  'SELECT ''colonne aut_apprenants.numeroPiece deja presente ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Comité d'orientation : le membre est prescripteur
-- (colonne lue par le seed des comptes : sans elle, le démarrage échoue)
SET @tableExists := (SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_comite_orientations');
SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_comite_orientations' AND COLUMN_NAME = 'estPrescripteur');
SET @sql := IF(@tableExists = 1 AND @colExists = 0,
  'ALTER TABLE `aut_comite_orientations` ADD COLUMN `estPrescripteur` TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT ''colonne aut_comite_orientations.estPrescripteur deja presente ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Établissement : site web
SET @tableExists := (SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eta_etablissements');
SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eta_etablissements' AND COLUMN_NAME = 'site');
SET @sql := IF(@tableExists = 1 AND @colExists = 0,
  'ALTER TABLE `eta_etablissements` ADD COLUMN `site` VARCHAR(100) NULL',
  'SELECT ''colonne eta_etablissements.site deja presente ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Bordereaux : composition et banque de règlement
SET @tableExists := (SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_bordereaux');
SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_bordereaux' AND COLUMN_NAME = 'composition');
SET @sql := IF(@tableExists = 1 AND @colExists = 0,
  'ALTER TABLE `ins_bordereaux` ADD COLUMN `composition` TEXT NULL',
  'SELECT ''colonne ins_bordereaux.composition deja presente ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_bordereaux' AND COLUMN_NAME = 'banque');
SET @sql := IF(@tableExists = 1 AND @colExists = 0,
  'ALTER TABLE `ins_bordereaux` ADD COLUMN `banque` ENUM(''ib_bank'', ''ecobank'', ''orabank'') NULL',
  'SELECT ''colonne ins_bordereaux.banque deja presente ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 3. Colonnes obsolètes
-- -----------------------------------------------------------------------------
-- Remplacées par des colonnes normalisées (cf. section 4). Elles ne sont
-- supprimées que si la table est vide : sur une base historique ayant des
-- données, la migration les laisse en place (une colonne en trop est sans
-- conséquence, l'application ne les utilise plus) et le message ci-dessous
-- signale qu'un nettoyage manuel reste possible.

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapage_enseignants' AND COLUMN_NAME = 'ue');
SET @rows := (SELECT IFNULL(COUNT(*), 0) FROM `ins_rattrapage_enseignants`);
SET @sql := IF(@colExists = 1 AND @rows = 0,
  'ALTER TABLE `ins_rattrapage_enseignants` DROP COLUMN `ue`',
  'SELECT ''ins_rattrapage_enseignants.ue conservee (table non vide) ou deja supprimee''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapage_enseignants' AND COLUMN_NAME = 'ecue');
SET @sql := IF(@colExists = 1 AND @rows = 0,
  'ALTER TABLE `ins_rattrapage_enseignants` DROP COLUMN `ecue`',
  'SELECT ''ins_rattrapage_enseignants.ecue conservee (table non vide) ou deja supprimee''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- uq_demande_ue porte sur cette seule colonne : il est supprimé avec elle.
-- fk_notes_demande (migration 023) pointe vers ins_rattrapages_inscriptions.id,
-- exactement comme la nouvelle colonne rattrapageInscriptionId : c'est sa
-- version obsolète. Elle doit tomber avant la colonne, MySQL refusant de
-- supprimer une colonne référencée par une clé étrangère.
SET @fkExists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapage_notes'
    AND CONSTRAINT_NAME = 'fk_notes_demande' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sql := IF(@fkExists = 1,
  'ALTER TABLE `ins_rattrapage_notes` DROP FOREIGN KEY `fk_notes_demande`',
  'SELECT ''fk_notes_demande deja supprimee''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapage_notes' AND COLUMN_NAME = 'demandeId');
SET @rows := (SELECT IFNULL(COUNT(*), 0) FROM `ins_rattrapage_notes`);
SET @sql := IF(@colExists = 1 AND @rows = 0,
  'ALTER TABLE `ins_rattrapage_notes` DROP COLUMN `demandeId`',
  'SELECT ''ins_rattrapage_notes.demandeId conservee (table non vide) ou deja supprimee''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 4. Index sur les colonnes d'identification
-- -----------------------------------------------------------------------------
-- Sur une table vide, les clés étrangères créent déjà leur index : ces.index
-- couvrent le cas des tables déjà peuplées avant la migration.

SET @tableExists := (SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'brs_attributions');
SET @idxExists := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'brs_attributions' AND INDEX_NAME = 'brs_attributions_dossierEtudiantId');
SET @sql := IF(@tableExists = 1 AND @idxExists = 0,
  'ALTER TABLE `brs_attributions` ADD INDEX `brs_attributions_dossierEtudiantId` (`dossierEtudiantId`)',
  'SELECT ''index brs_attributions_dossierEtudiantId deja present ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idxExists := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'brs_attributions' AND INDEX_NAME = 'brs_attributions_configurationId');
SET @sql := IF(@tableExists = 1 AND @idxExists = 0,
  'ALTER TABLE `brs_attributions` ADD INDEX `brs_attributions_configurationId` (`configurationId`)',
  'SELECT ''index brs_attributions_configurationId deja present ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idxExists := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'brs_attributions' AND INDEX_NAME = 'brs_attributions_niveauEtudeId');
SET @sql := IF(@tableExists = 1 AND @idxExists = 0,
  'ALTER TABLE `brs_attributions` ADD INDEX `brs_attributions_niveauEtudeId` (`niveauEtudeId`)',
  'SELECT ''index brs_attributions_niveauEtudeId deja present ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idxExists := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'brs_attributions' AND INDEX_NAME = 'brs_attributions_valideParId');
SET @sql := IF(@tableExists = 1 AND @idxExists = 0,
  'ALTER TABLE `brs_attributions` ADD INDEX `brs_attributions_valideParId` (`valideParId`)',
  'SELECT ''index brs_attributions_valideParId deja present ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 5. Clés étrangères (créées après les colonnes : MySQL exige la colonne)
-- -----------------------------------------------------------------------------
-- Bourses : l'attribution pointe vers un dossier, un barème, un niveau et un
-- validateur. Clés nommées (fk_026_*) pour rester stables entre installations.

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'brs_attributions' AND COLUMN_NAME = 'dossierEtudiantId');
SET @fkExists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'brs_attributions' AND CONSTRAINT_NAME = 'fk_026_attributions_dossier');
SET @sql := IF(@colExists = 1 AND @fkExists = 0,
  'ALTER TABLE `brs_attributions` ADD CONSTRAINT `fk_026_attributions_dossier` FOREIGN KEY (`dossierEtudiantId`) REFERENCES `ins_dossiers_etudiants` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE',
  'SELECT ''fk_026_attributions_dossier deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fkExists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'brs_attributions' AND CONSTRAINT_NAME = 'fk_026_attributions_configuration');
SET @sql := IF(@colExists = 1 AND @fkExists = 0,
  'ALTER TABLE `brs_attributions` ADD CONSTRAINT `fk_026_attributions_configuration` FOREIGN KEY (`configurationId`) REFERENCES `brs_configurations` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE',
  'SELECT ''fk_026_attributions_configuration deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fkExists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'brs_attributions' AND CONSTRAINT_NAME = 'fk_026_attributions_niveau');
SET @sql := IF(@colExists = 1 AND @fkExists = 0,
  'ALTER TABLE `brs_attributions` ADD CONSTRAINT `fk_026_attributions_niveau` FOREIGN KEY (`niveauEtudeId`) REFERENCES `ins_niveaux_etudes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT ''fk_026_attributions_niveau deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fkExists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'brs_attributions' AND CONSTRAINT_NAME = 'fk_026_attributions_validePar');
SET @sql := IF(@colExists = 1 AND @fkExists = 0,
  'ALTER TABLE `brs_attributions` ADD CONSTRAINT `fk_026_attributions_validePar` FOREIGN KEY (`valideParId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE',
  'SELECT ''fk_026_attributions_validePar deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- GED : document généré par un processus
SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'processus_generateur_id');
SET @fkExists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND CONSTRAINT_NAME = 'fk_026_documents_processus');
SET @sql := IF(@colExists = 1 AND @fkExists = 0,
  'ALTER TABLE `ged_documents` ADD CONSTRAINT `fk_026_documents_processus` FOREIGN KEY (`processus_generateur_id`) REFERENCES `ged_processus` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT ''fk_026_documents_processus deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Rattrapages : UE et ECUE concernés
SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapage_enseignants' AND COLUMN_NAME = 'ueId');
SET @fkExists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapage_enseignants' AND CONSTRAINT_NAME = 'fk_026_rattrapage_enseignants_ue');
SET @sql := IF(@colExists = 1 AND @fkExists = 0,
  'ALTER TABLE `ins_rattrapage_enseignants` ADD CONSTRAINT `fk_026_rattrapage_enseignants_ue` FOREIGN KEY (`ueId`) REFERENCES `ins_cours` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT ''fk_026_rattrapage_enseignants_ue deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fkExists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapage_enseignants' AND CONSTRAINT_NAME = 'fk_026_rattrapage_enseignants_ecue');
SET @sql := IF(@colExists = 1 AND @fkExists = 0,
  'ALTER TABLE `ins_rattrapage_enseignants` ADD CONSTRAINT `fk_026_rattrapage_enseignants_ecue` FOREIGN KEY (`ecueId`) REFERENCES `ins_cours` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT ''fk_026_rattrapage_enseignants_ecue deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Rattrapages : séance planifiée
SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapages_inscriptions' AND COLUMN_NAME = 'planningId');
SET @fkExists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapages_inscriptions' AND CONSTRAINT_NAME = 'fk_026_rattrapages_planning');
SET @sql := IF(@colExists = 1 AND @fkExists = 0,
  'ALTER TABLE `ins_rattrapages_inscriptions` ADD CONSTRAINT `fk_026_rattrapages_planning` FOREIGN KEY (`planningId`) REFERENCES `ins_rattrapage_planning` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT ''fk_026_rattrapages_planning deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Rattrapages : note rattachée à une inscription
SET @fkExists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapage_notes' AND CONSTRAINT_NAME = 'fk_026_rattrapage_notes_inscription');
SET @sql := IF(@colExists = 1 AND @fkExists = 0,
  'ALTER TABLE `ins_rattrapage_notes` ADD CONSTRAINT `fk_026_rattrapage_notes_inscription` FOREIGN KEY (`rattrapageInscriptionId`) REFERENCES `ins_rattrapages_inscriptions` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE',
  'SELECT ''fk_026_rattrapage_notes_inscription deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Scolarité : reçu de caisse et caissier
SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'scol_demandes_document' AND COLUMN_NAME = 'recuCaisseId');
SET @fkExists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'scol_demandes_document' AND CONSTRAINT_NAME = 'fk_026_demande_document_recu');
SET @sql := IF(@colExists = 1 AND @fkExists = 0,
  'ALTER TABLE `scol_demandes_document` ADD CONSTRAINT `fk_026_demande_document_recu` FOREIGN KEY (`recuCaisseId`) REFERENCES `scol_recus_caisse` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT ''fk_026_demande_document_recu deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fkExists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'scol_demandes_document' AND CONSTRAINT_NAME = 'fk_026_demande_document_caissier');
SET @sql := IF(@colExists = 1 AND @fkExists = 0,
  'ALTER TABLE `scol_demandes_document` ADD CONSTRAINT `fk_026_demande_document_caissier` FOREIGN KEY (`caissierId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT ''fk_026_demande_document_caissier deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Réorientation scolaire : parcours actuel et parcours visé
-- Ces deux clés sont déclarées dans le modèle (DemandeReorientation.belongsTo
-- Parcours) et produites par les migrations, mais elles avaient disparu des
-- bases existantes : les anciennes synchronisations au démarrage reformataient
-- les clés étrangères sans les conserver. Sans elles, une réorientation pouvait
-- pointer vers un parcours supprimé.
SET @tableExists := (SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'scol_demandes_reorientation');
SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'scol_demandes_reorientation' AND COLUMN_NAME = 'parcoursActuelId');
SET @fkExists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'scol_demandes_reorientation'
    AND CONSTRAINT_NAME = 'fk_026_reorientation_parcours_actuel');
SET @sql := IF(@tableExists = 1 AND @colExists = 1 AND @fkExists = 0,
  'ALTER TABLE `scol_demandes_reorientation` ADD CONSTRAINT `fk_026_reorientation_parcours_actuel` FOREIGN KEY (`parcoursActuelId`) REFERENCES `ins_parcours` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT ''fk_026_reorientation_parcours_actuel deja presente ou colonne absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fkExists := (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'scol_demandes_reorientation'
    AND CONSTRAINT_NAME = 'fk_026_reorientation_parcours_cible');
SET @sql := IF(@tableExists = 1 AND @colExists = 1 AND @fkExists = 0,
  'ALTER TABLE `scol_demandes_reorientation` ADD CONSTRAINT `fk_026_reorientation_parcours_cible` FOREIGN KEY (`parcoursCibleId`) REFERENCES `ins_parcours` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT ''fk_026_reorientation_parcours_cible deja presente ou colonne absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;