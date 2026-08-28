-- =============================================================================
-- EasyEcole — Migration SQL : MODULE DE PLANIFICATION ET AFFECTATION DES COURS
-- =============================================================================
-- Contexte métier :
--  1. Une salle est affectée à une classe (groupe) pour UNE PORTÉE TEMPORELLE
--     (dateDebut → dateFin, typiquement une année académique ou plus).
--     Ex : salle "Amphi 100" ↔ classe "L1-INFO-MATIN" pour 2026-2027.
--  2. Un cours EXISTANT (ins_cours) est affecté à un enseignant / une classe /
--     un créneau / une salle / un jour, avec gestion JOUR/SOIR et détection
--     de conflits (côté base via index, côté service via logique).
--
-- Tables concernées :
--  - ins_salles_de_classes      (faire évoluer : code, etage, type, regime, statut)
--  - ins_seances                (faire évoluer : regime, creneauId, classeGroupeId,
--                                 niveauEtudeId, parcoursId, anneeAcademiqueId,
--                                 semestreAcademiqueId + index anti-conflit)
--  - ins_creneaux               (NOUVELLE table : grille horaire JOUR/SOIR)
--  - ins_affectations_salles_classes (NOUVELLE table : salle ↔ classe datée)
--
-- Le MODULE COURS (ins_cours) n'est PAS modifié : les cours existants sont
-- réutilisés tels quels.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ins_salles_de_classes : enrichissement de la fiche salle
-- -----------------------------------------------------------------------------
ALTER TABLE `ins_salles_de_classes`
    ADD COLUMN `code` VARCHAR(50) NULL COMMENT 'Code unique de la salle (ex: B204)' AFTER `id`,
    ADD COLUMN `etage` VARCHAR(50) NULL COMMENT 'Étage de la salle' AFTER `description`,
    ADD COLUMN `type` ENUM('COURS','AMPHITHEATRE','LABORATOIRE','INFORMATIQUE','AUTRE') NULL DEFAULT 'COURS' COMMENT 'Type de salle' AFTER `etage`,
    ADD COLUMN `regime` ENUM('JOUR','SOIR','JOUR_ET_SOIR') NULL DEFAULT 'JOUR_ET_SOIR' COMMENT 'Régime autorisé (JOUR, SOIR ou les deux)' AFTER `type`,
    ADD COLUMN `statut` ENUM('DISPONIBLE','INDISPONIBLE') NULL DEFAULT 'DISPONIBLE' COMMENT 'Disponibilité de la salle' AFTER `regime`;

-- Index d'unicité du code de salle (code unique par établissement)
ALTER TABLE `ins_salles_de_classes`
    ADD UNIQUE INDEX `uk_salle_code_etab` (`code`, `etablissementId`);

-- Index pour le filtrage des salles par type / régime / statut
ALTER TABLE `ins_salles_de_classes`
    ADD INDEX `idx_salle_type` (`type`),
    ADD INDEX `idx_salle_regime` (`regime`),
    ADD INDEX `idx_salle_statut` (`statut`);

-- -----------------------------------------------------------------------------
-- 1b. ins_classes : ajout de l'option matin/soir/en ligne sur la CLASSE
-- -----------------------------------------------------------------------------
ALTER TABLE `ins_classes`
    ADD COLUMN `option` ENUM('JOUR','SOIR','EN_LIGNE') NULL COMMENT 'Option de la classe : cours du jour, du soir ou en ligne' AFTER `description`;

-- Index pour filtrer les classes par option (ex. effectifs JOUR / SOIR / EN_LIGNE)
ALTER TABLE `ins_classes`
    ADD INDEX `idx_classe_option` (`option`);

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
-- 4. ins_seances : enrichissement pour la planification (Option 1 — réutilise
--    le squelette de planning existant)
-- -----------------------------------------------------------------------------
ALTER TABLE `ins_seances`
    ADD COLUMN `regime` ENUM('JOUR','SOIR','JOUR_ET_SOIR') NULL COMMENT 'Régime de la séance' AFTER `salleDeClasseId`,
    ADD COLUMN `creneauId` INT UNSIGNED NULL COMMENT 'FK → ins_creneaux' AFTER `regime`,
    ADD COLUMN `classeGroupeId` INT UNSIGNED NULL COMMENT 'FK → ins_classes (groupe/classe)' AFTER `creneauId`,
    ADD COLUMN `niveauEtudeId` INT UNSIGNED NULL COMMENT 'FK → ins_niveaux_etudes' AFTER `classeGroupeId`,
    ADD COLUMN `parcoursId` INT UNSIGNED NULL COMMENT 'FK → ins_parcours' AFTER `niveauEtudeId`,
    ADD COLUMN `anneeAcademiqueId` INT UNSIGNED NULL COMMENT 'FK → ins_annees_academiques' AFTER `parcoursId`,
    ADD COLUMN `semestreAcademiqueId` INT UNSIGNED NULL COMMENT 'FK → ins_semestres_academiques' AFTER `anneeAcademiqueId`;

-- Index composés anti-conflits (performance + intégrité côté base)
ALTER TABLE `ins_seances`
    ADD INDEX `idx_seance_enseignant_creneau` (`enseignantId`, `jourSemaine`, `creneauId`, `anneeAcademiqueId`),
    ADD INDEX `idx_seance_salle_creneau` (`salleDeClasseId`, `jourSemaine`, `creneauId`, `anneeAcademiqueId`),
    ADD INDEX `idx_seance_classe_creneau` (`classeGroupeId`, `jourSemaine`, `creneauId`, `anneeAcademiqueId`),
    ADD INDEX `idx_seance_regime` (`regime`),
    ADD INDEX `idx_seance_annee` (`anneeAcademiqueId`);

-- -----------------------------------------------------------------------------
-- 5. Foreign keys (optionnelles mais recommandées)
--    Note : l'existant n'utilise pas systématiquement les FK ; on les ajoute
--    de façon ciblée et sûre.
-- -----------------------------------------------------------------------------

-- ins_creneaux → ins_annees/... (aucune FK nécessaire en interne)
ALTER TABLE `ins_seances`
    ADD CONSTRAINT `fk_seance_creneau` FOREIGN KEY (`creneauId`) REFERENCES `ins_creneaux`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `fk_seance_classe_groupe` FOREIGN KEY (`classeGroupeId`) REFERENCES `ins_classes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `fk_seance_niveau` FOREIGN KEY (`niveauEtudeId`) REFERENCES `ins_niveaux_etudes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `fk_seance_parcours` FOREIGN KEY (`parcoursId`) REFERENCES `ins_parcours`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `fk_seance_annee` FOREIGN KEY (`anneeAcademiqueId`) REFERENCES `ins_annees_academiques`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `fk_seance_semestre` FOREIGN KEY (`semestreAcademiqueId`) REFERENCES `ins_semestres_academiques`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `ins_affectations_salles_classes`
    ADD CONSTRAINT `fk_aff_salle` FOREIGN KEY (`salleId`) REFERENCES `ins_salles_de_classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `fk_aff_classe` FOREIGN KEY (`classeId`) REFERENCES `ins_classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `fk_aff_annee` FOREIGN KEY (`anneeAcademiqueId`) REFERENCES `ins_annees_academiques`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Vérification
-- =============================================================================
-- SELECT table_name, column_name, column_type
-- FROM information_schema.columns
-- WHERE table_schema = DATABASE()
--   AND table_name IN ('ins_salles_de_classes','ins_creneaux','ins_seances','ins_affectations_salles_classes')
-- ORDER BY table_name, ordinal_position;
