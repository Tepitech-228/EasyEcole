-- =============================================================================
-- EasyEcole — Migration SQL 010 : MODULE DE PLANIFICATION ET AFFECTATION DES COURS
-- =============================================================================
-- Contexte métier :
--  1. Une salle est affectée à une classe (groupe) pour UNE PORTÉE TEMPORELLE
--     (dateDebut → dateFin, typiquement une année académique ou plus).
--  2. Un cours EXISTANT (ins_cours) est affecté à un enseignant / une classe /
--     un créneau / une salle / un jour, avec gestion JOUR/SOIR et détection
--     de conflits (côté base via index, côté service via logique).
--
-- Réécrite en IDEMPOTENT (12/09/2026) : chaque colonne, index et contrainte est
-- ajouté sous garde information_schema + PREPARE/EXECUTE — rejouable à volonté,
-- quel que soit l'état de la base (déjà synchronisée par Sequelize ou non).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ins_salles_de_classes : enrichissement de la fiche salle
-- -----------------------------------------------------------------------------
SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_salles_de_classes' AND COLUMN_NAME='code');
SET @sql := IF(@colExists=0, 'ALTER TABLE `ins_salles_de_classes` ADD COLUMN `code` VARCHAR(50) NULL COMMENT ''Code unique de la salle (ex: B204)'' AFTER `id`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_salles_de_classes' AND COLUMN_NAME='etage');
SET @sql := IF(@colExists=0, 'ALTER TABLE `ins_salles_de_classes` ADD COLUMN `etage` VARCHAR(50) NULL COMMENT ''Étage de la salle'' AFTER `description`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_salles_de_classes' AND COLUMN_NAME='type');
SET @sql := IF(@colExists=0, 'ALTER TABLE `ins_salles_de_classes` ADD COLUMN `type` ENUM(''COURS'',''AMPHITHEATRE'',''LABORATOIRE'',''INFORMATIQUE'',''AUTRE'') NULL DEFAULT ''COURS'' COMMENT ''Type de salle'' AFTER `etage`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_salles_de_classes' AND COLUMN_NAME='regime');
SET @sql := IF(@colExists=0, 'ALTER TABLE `ins_salles_de_classes` ADD COLUMN `regime` ENUM(''JOUR'',''SOIR'',''JOUR_ET_SOIR'') NULL DEFAULT ''JOUR_ET_SOIR'' COMMENT ''Régime autorisé (JOUR, SOIR ou les deux)'' AFTER `type`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_salles_de_classes' AND COLUMN_NAME='statut');
SET @sql := IF(@colExists=0, 'ALTER TABLE `ins_salles_de_classes` ADD COLUMN `statut` ENUM(''DISPONIBLE'',''INDISPONIBLE'') NULL DEFAULT ''DISPONIBLE'' COMMENT ''Disponibilité de la salle'' AFTER `regime`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index d'unicité du code de salle (code unique par établissement)
SET @idxExists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_salles_de_classes' AND INDEX_NAME='uk_salle_code_etab');
SET @sql := IF(@idxExists=0, 'ALTER TABLE `ins_salles_de_classes` ADD UNIQUE INDEX `uk_salle_code_etab` (`code`, `etablissementId`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index pour le filtrage des salles par type / régime / statut
SET @idxExists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_salles_de_classes' AND INDEX_NAME='idx_salle_type');
SET @sql := IF(@idxExists=0, 'ALTER TABLE `ins_salles_de_classes` ADD INDEX `idx_salle_type` (`type`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idxExists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_salles_de_classes' AND INDEX_NAME='idx_salle_regime');
SET @sql := IF(@idxExists=0, 'ALTER TABLE `ins_salles_de_classes` ADD INDEX `idx_salle_regime` (`regime`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idxExists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_salles_de_classes' AND INDEX_NAME='idx_salle_statut');
SET @sql := IF(@idxExists=0, 'ALTER TABLE `ins_salles_de_classes` ADD INDEX `idx_salle_statut` (`statut`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 1b. ins_classes : ajout de l'option matin/soir/en ligne sur la CLASSE
-- -----------------------------------------------------------------------------
SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_classes' AND COLUMN_NAME='option');
SET @sql := IF(@colExists=0, 'ALTER TABLE `ins_classes` ADD COLUMN `option` ENUM(''JOUR'',''SOIR'',''EN_LIGNE'') NULL COMMENT ''Option de la classe : cours du jour, du soir ou en ligne'' AFTER `description`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index pour filtrer les classes par option (ex. effectifs JOUR / SOIR / EN_LIGNE)
SET @idxExists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_classes' AND INDEX_NAME='idx_classe_option');
SET @sql := IF(@idxExists=0, 'ALTER TABLE `ins_classes` ADD INDEX `idx_classe_option` (`option`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 2. ins_creneaux : NOUVELLE table de grille horaire (JOUR / SOIR)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ins_creneaux` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL COMMENT 'Code du créneau (ex: J1, J2, S1)',
    `libelle` VARCHAR(100) NOT NULL COMMENT 'Libellé affichable (ex: 08:00 - 10:00)',
    `heureDebut` TIME NOT NULL COMMENT 'Heure de début',
    `heureFin` TIME NOT NULL COMMENT 'Heure de fin',
    `regime` ENUM('JOUR','SOIR','JOUR_ET_SOIR') NOT NULL COMMENT 'Régime du créneau',
    `statut` ENUM('ACTIF','INACTIF') NOT NULL DEFAULT 'ACTIF' COMMENT 'Statut du créneau',
    `etablissementId` INT UNSIGNED NULL,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deletedAt` DATETIME NULL,
    UNIQUE KEY `uk_creneau_code_etab` (`code`, `etablissementId`),
    KEY `idx_creneau_regime` (`regime`),
    KEY `idx_creneau_statut` (`statut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 3. ins_affectations_salles_classes : NOUVELLE table
--    salle ↔ classe pour une portée temporelle (année académique ou plus)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ins_affectations_salles_classes` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `salleId` INT UNSIGNED NOT NULL COMMENT 'FK → ins_salles_de_classes',
    `classeId` INT UNSIGNED NOT NULL COMMENT 'FK → ins_classes (le groupe est une Classe)',
    `anneeAcademiqueId` INT UNSIGNED NULL COMMENT 'FK → ins_annees_academiques',
    `regime` ENUM('JOUR','SOIR','JOUR_ET_SOIR') NOT NULL COMMENT 'Régime de l''affectation',
    `dateDebut` DATE NOT NULL COMMENT 'Début de validité de l''affectation',
    `dateFin` DATE NOT NULL COMMENT 'Fin de validité de l''affectation',
    `etablissementId` INT UNSIGNED NULL,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deletedAt` DATETIME NULL,
    KEY `idx_aff_salle` (`salleId`),
    KEY `idx_aff_classe` (`classeId`),
    KEY `idx_aff_annee` (`anneeAcademiqueId`),
    -- Index anti-chevauchement : une salle ne doit pas être affectée à deux
    -- classes sur des périodes qui se chevauchent (le contrôle fin est fait en service).
    KEY `idx_aff_salle_periode` (`salleId`, `dateDebut`, `dateFin`),
    KEY `idx_aff_classe_periode` (`classeId`, `dateDebut`, `dateFin`),
    -- Contrainte d'intégrité : la fin doit être >= au début
    CONSTRAINT `chk_aff_dateFin_ge_dateDebut` CHECK (`dateFin` >= `dateDebut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- 4. ins_seances : enrichissement pour la planification
-- -----------------------------------------------------------------------------
SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_seances' AND COLUMN_NAME='regime');
SET @sql := IF(@colExists=0, 'ALTER TABLE `ins_seances` ADD COLUMN `regime` ENUM(''JOUR'',''SOIR'',''JOUR_ET_SOIR'') NULL COMMENT ''Régime de la séance'' AFTER `salleDeClasseId`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_seances' AND COLUMN_NAME='creneauId');
SET @sql := IF(@colExists=0, 'ALTER TABLE `ins_seances` ADD COLUMN `creneauId` INT UNSIGNED NULL COMMENT ''FK → ins_creneaux'' AFTER `regime`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_seances' AND COLUMN_NAME='classeGroupeId');
SET @sql := IF(@colExists=0, 'ALTER TABLE `ins_seances` ADD COLUMN `classeGroupeId` INT UNSIGNED NULL COMMENT ''FK → ins_classes (groupe/classe)'' AFTER `creneauId`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_seances' AND COLUMN_NAME='niveauEtudeId');
SET @sql := IF(@colExists=0, 'ALTER TABLE `ins_seances` ADD COLUMN `niveauEtudeId` INT UNSIGNED NULL COMMENT ''FK → ins_niveaux_etudes'' AFTER `classeGroupeId`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_seances' AND COLUMN_NAME='parcoursId');
SET @sql := IF(@colExists=0, 'ALTER TABLE `ins_seances` ADD COLUMN `parcoursId` INT UNSIGNED NULL COMMENT ''FK → ins_parcours'' AFTER `niveauEtudeId`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_seances' AND COLUMN_NAME='anneeAcademiqueId');
SET @sql := IF(@colExists=0, 'ALTER TABLE `ins_seances` ADD COLUMN `anneeAcademiqueId` INT UNSIGNED NULL COMMENT ''FK → ins_annees_academiques'' AFTER `parcoursId`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_seances' AND COLUMN_NAME='semestreAcademiqueId');
SET @sql := IF(@colExists=0, 'ALTER TABLE `ins_seances` ADD COLUMN `semestreAcademiqueId` INT UNSIGNED NULL COMMENT ''FK → ins_semestres_academiques'' AFTER `anneeAcademiqueId`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index composés anti-conflits (performance + intégrité côté base)
SET @idxExists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_seances' AND INDEX_NAME='idx_seance_enseignant_creneau');
SET @sql := IF(@idxExists=0, 'ALTER TABLE `ins_seances` ADD INDEX `idx_seance_enseignant_creneau` (`enseignantId`, `jourSemaine`, `creneauId`, `anneeAcademiqueId`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idxExists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_seances' AND INDEX_NAME='idx_seance_salle_creneau');
SET @sql := IF(@idxExists=0, 'ALTER TABLE `ins_seances` ADD INDEX `idx_seance_salle_creneau` (`salleDeClasseId`, `jourSemaine`, `creneauId`, `anneeAcademiqueId`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idxExists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_seances' AND INDEX_NAME='idx_seance_classe_creneau');
SET @sql := IF(@idxExists=0, 'ALTER TABLE `ins_seances` ADD INDEX `idx_seance_classe_creneau` (`classeGroupeId`, `jourSemaine`, `creneauId`, `anneeAcademiqueId`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idxExists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_seances' AND INDEX_NAME='idx_seance_regime');
SET @sql := IF(@idxExists=0, 'ALTER TABLE `ins_seances` ADD INDEX `idx_seance_regime` (`regime`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idxExists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ins_seances' AND INDEX_NAME='idx_seance_annee');
SET @sql := IF(@idxExists=0, 'ALTER TABLE `ins_seances` ADD INDEX `idx_seance_annee` (`anneeAcademiqueId`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 5. Foreign keys (optionnelles mais recommandées), ajoutées seulement si absentes
-- -----------------------------------------------------------------------------
SET @fkExists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='ins_seances' AND CONSTRAINT_NAME='fk_seance_creneau' AND CONSTRAINT_TYPE='FOREIGN KEY');
SET @sql := IF(@fkExists=0, 'ALTER TABLE `ins_seances` ADD CONSTRAINT `fk_seance_creneau` FOREIGN KEY (`creneauId`) REFERENCES `ins_creneaux`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fkExists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='ins_seances' AND CONSTRAINT_NAME='fk_seance_classe_groupe' AND CONSTRAINT_TYPE='FOREIGN KEY');
SET @sql := IF(@fkExists=0, 'ALTER TABLE `ins_seances` ADD CONSTRAINT `fk_seance_classe_groupe` FOREIGN KEY (`classeGroupeId`) REFERENCES `ins_classes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fkExists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='ins_seances' AND CONSTRAINT_NAME='fk_seance_niveau' AND CONSTRAINT_TYPE='FOREIGN KEY');
SET @sql := IF(@fkExists=0, 'ALTER TABLE `ins_seances` ADD CONSTRAINT `fk_seance_niveau` FOREIGN KEY (`niveauEtudeId`) REFERENCES `ins_niveaux_etudes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fkExists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='ins_seances' AND CONSTRAINT_NAME='fk_seance_parcours' AND CONSTRAINT_TYPE='FOREIGN KEY');
SET @sql := IF(@fkExists=0, 'ALTER TABLE `ins_seances` ADD CONSTRAINT `fk_seance_parcours` FOREIGN KEY (`parcoursId`) REFERENCES `ins_parcours`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fkExists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='ins_seances' AND CONSTRAINT_NAME='fk_seance_annee' AND CONSTRAINT_TYPE='FOREIGN KEY');
SET @sql := IF(@fkExists=0, 'ALTER TABLE `ins_seances` ADD CONSTRAINT `fk_seance_annee` FOREIGN KEY (`anneeAcademiqueId`) REFERENCES `ins_annees_academiques`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fkExists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='ins_seances' AND CONSTRAINT_NAME='fk_seance_semestre' AND CONSTRAINT_TYPE='FOREIGN KEY');
SET @sql := IF(@fkExists=0, 'ALTER TABLE `ins_seances` ADD CONSTRAINT `fk_seance_semestre` FOREIGN KEY (`semestreAcademiqueId`) REFERENCES `ins_semestres_academiques`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fkExists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='ins_affectations_salles_classes' AND CONSTRAINT_NAME='fk_aff_salle' AND CONSTRAINT_TYPE='FOREIGN KEY');
SET @sql := IF(@fkExists=0, 'ALTER TABLE `ins_affectations_salles_classes` ADD CONSTRAINT `fk_aff_salle` FOREIGN KEY (`salleId`) REFERENCES `ins_salles_de_classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fkExists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='ins_affectations_salles_classes' AND CONSTRAINT_NAME='fk_aff_classe' AND CONSTRAINT_TYPE='FOREIGN KEY');
SET @sql := IF(@fkExists=0, 'ALTER TABLE `ins_affectations_salles_classes` ADD CONSTRAINT `fk_aff_classe` FOREIGN KEY (`classeId`) REFERENCES `ins_classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fkExists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='ins_affectations_salles_classes' AND CONSTRAINT_NAME='fk_aff_annee' AND CONSTRAINT_TYPE='FOREIGN KEY');
SET @sql := IF(@fkExists=0, 'ALTER TABLE `ins_affectations_salles_classes` ADD CONSTRAINT `fk_aff_annee` FOREIGN KEY (`anneeAcademiqueId`) REFERENCES `ins_annees_academiques`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- =============================================================================
-- Vérification
-- =============================================================================
-- SELECT table_name, column_name, column_type
-- FROM information_schema.columns
-- WHERE table_schema = DATABASE()
--   AND table_name IN ('ins_salles_de_classes','ins_creneaux','ins_seances','ins_affectations_salles_classes')
-- ORDER BY table_name, ordinal_position;