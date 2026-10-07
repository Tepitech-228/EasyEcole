-- =============================================================================
-- EasyEcole — Migration SQL : table des shifts (horaires de travail pointage)
-- =============================================================================
-- Contexte : la page /pointage/shifts était une maquette (données en dur).
-- Cette table persiste les shifts : nom, heures début/fin, jours, actif.
-- Idempotent : ne fait rien si la table existe déjà.
-- =============================================================================

CREATE TABLE IF NOT EXISTS `ins_shifts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nom` VARCHAR(100) NOT NULL,
  `heureDebut` TIME NOT NULL,
  `heureFin` TIME NOT NULL,
  `jours` JSON NOT NULL,
  `actif` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_shifts_actif` (`actif`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
