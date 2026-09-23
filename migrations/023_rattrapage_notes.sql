-- =============================================================================
-- EasyEcole — Migration SQL 023 : notes rattrapage (historique)
-- =============================================================================
-- Crée la table ins_rattrapage_notes qui stocke les notes de rattrapage
-- avec conservation de la note originale (audit).
--
-- Règle métier :
--   - note_originale : note avant rattrapage (conservée)
--   - note_rattrapage : note obtenue au rattrapage
--   - Le bulletin utilise COALESCE(note_rattrapage, note_originale)
--   - L'historique des deux notes est conservé (pas d'écrasement)
--
-- Idempotent. Compatible exécution via mysql CLI.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Vérification d'existence de la table avant création
-- -----------------------------------------------------------------------------
SET @tableExists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapage_notes'
);

SET @sql := IF(@tableExists = 0,
  'CREATE TABLE `ins_rattrapage_notes` (
      `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
      `demandeId` INT UNSIGNED NOT NULL COMMENT "FK vers ins_rattrapages_inscriptions.id",
      `etudiantId` INT UNSIGNED NOT NULL COMMENT "FK vers aut_utilisateurs.id",
      `ueId` INT UNSIGNED NULL COMMENT "FK vers ins_cours.id (UE/matière)",
      `note_originale` DECIMAL(5,2) NULL COMMENT "Note avant rattrapage",
      `note_rattrapage` DECIMAL(5,2) NULL COMMENT "Note obtenue au rattrapage",
      `saisiPar` INT UNSIGNED NULL COMMENT "FK vers aut_utilisateurs.id (enseignant correcteur)",
      `statut` ENUM(\"en_attente\",\"saisie\",\"validée\") NOT NULL DEFAULT \"en_attente\",
      `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      UNIQUE KEY `uq_demande_ue` (`demandeId`, `ueId`),
      KEY `idx_notes_demande` (`demandeId`),
      KEY `idx_notes_etudiant` (`etudiantId`),
      KEY `idx_notes_ue` (`ueId`),
      KEY `idx_notes_saisi_par` (`saisiPar`),
      CONSTRAINT `fk_notes_demande` FOREIGN KEY (`demandeId`) REFERENCES `ins_rattrapages_inscriptions` (`id`) ON DELETE CASCADE,
      CONSTRAINT `fk_notes_etudiant` FOREIGN KEY (`etudiantId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE CASCADE,
      CONSTRAINT `fk_notes_ue` FOREIGN KEY (`ueId`) REFERENCES `ins_cours` (`id`) ON DELETE SET NULL,
      CONSTRAINT `fk_notes_saisi_par` FOREIGN KEY (`saisiPar`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  'SELECT \'table ins_rattrapage_notes deja presente\'');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- Note : la saisie des notes se fait via PUT /sessions/:id/notes
-- par l'enseignant désigné (il ne voit que ses créneaux).
-- =============================================================================
