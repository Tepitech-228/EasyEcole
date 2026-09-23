-- =============================================================================
-- EasyEcole — Migration SQL 021 : planning rattrapage (samedis par session)
-- =============================================================================
-- Crée la table ins_rattrapage_planning qui stocke les créneaux de rattrapage
-- (samedis générés entre dateDebut et dateFin) avec heure/salle/filière.
--
-- Règle métier :
--   - Un samedi = une date entre dateDebut et dateFin (tous les samedis)
--   - Chaque samedi a une heure de début/fin et une salle
--   - Chaque samedi est lié à une filière (classe) de la session
--
-- Idempotent. Compatible exécution via mysql CLI.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Vérification d'existence de la table avant création
-- -----------------------------------------------------------------------------
SET @tableExists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapage_planning'
);

SET @sql := IF(@tableExists = 0,
  'CREATE TABLE `ins_rattrapage_planning` (
      `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      `rattrapageSessionId` INT UNSIGNED NOT NULL COMMENT "FK vers ins_sessions_rattrapage.id",
      `classeId` INT UNSIGNED NOT NULL COMMENT "FK vers ins_classes.id (filière concernée)",
      `dateSamedi` DATE NOT NULL COMMENT "Date du samedi de rattrapage",
      `heureDebut` TIME NOT NULL COMMENT "Heure de début du créneau",
      `heureFin` TIME NOT NULL COMMENT "Heure de fin du créneau",
      `salleId` INT UNSIGNED NULL COMMENT "FK vers ins_salles_de_classe.id",
      `statut` ENUM(\"programme\",\"convoque\",\"present\",\"absent\",\"saisie_notes\") NOT NULL DEFAULT \"programme\",
      `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      UNIQUE KEY `uq_session_classe_date` (`rattrapageSessionId`, `classeId`, `dateSamedi`),
      KEY `idx_planning_session` (`rattrapageSessionId`),
      KEY `idx_planning_date` (`dateSamedi`),
      KEY `idx_planning_classe` (`classeId`),
      CONSTRAINT `fk_planning_session` FOREIGN KEY (`rattrapageSessionId`) REFERENCES `ins_sessions_rattrapage` (`id`) ON DELETE CASCADE,
      CONSTRAINT `fk_planning_classe` FOREIGN KEY (`classeId`) REFERENCES `ins_classes` (`id`) ON DELETE CASCADE,
      CONSTRAINT `fk_planning_salle` FOREIGN KEY (`salleId`) REFERENCES `ins_salles_de_classe` (`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  'SELECT \'table ins_rattrapage_planning deja presente\'');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- Note : la génération des samedis se fait côté backend (API POST /sessions)
-- par calcul de tous les samedis entre dateDebut et dateFin.
-- =============================================================================
