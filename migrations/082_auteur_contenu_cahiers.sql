SET @db := DATABASE();

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_blocs_cahier_de_texte' AND COLUMN_NAME = 'auteurEnseignantId') = 0,
  'ALTER TABLE `ins_blocs_cahier_de_texte` ADD COLUMN `auteurEnseignantId` INT UNSIGNED NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_presences' AND COLUMN_NAME = 'auteurEnseignantId') = 0,
  'ALTER TABLE `ins_presences` ADD COLUMN `auteurEnseignantId` INT UNSIGNED NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE `ins_blocs_cahier_de_texte` AS bloc
INNER JOIN `ins_cahiers_de_texte` AS cahier
  ON cahier.`id` = bloc.`cahierDeTexteId`
LEFT JOIN `ins_cours` AS cours
  ON cours.`id` = cahier.`coursId`
SET bloc.`auteurEnseignantId` = COALESCE(cahier.`enseignantId`, cours.`enseignantId`)
WHERE bloc.`auteurEnseignantId` IS NULL
  AND COALESCE(cahier.`enseignantId`, cours.`enseignantId`) IS NOT NULL;

UPDATE `ins_presences` AS presence
INNER JOIN `ins_listes_presences` AS liste
  ON liste.`id` = presence.`listePresenceId`
LEFT JOIN `ins_cours` AS cours
  ON cours.`id` = liste.`coursId`
SET presence.`auteurEnseignantId` = COALESCE(liste.`enseignantId`, cours.`enseignantId`)
WHERE presence.`auteurEnseignantId` IS NULL
  AND COALESCE(liste.`enseignantId`, cours.`enseignantId`) IS NOT NULL;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_blocs_cahier_de_texte' AND INDEX_NAME = 'idx_ins_blocs_texte_auteur_cahier') = 0,
  'CREATE INDEX `idx_ins_blocs_texte_auteur_cahier` ON `ins_blocs_cahier_de_texte` (`auteurEnseignantId`, `cahierDeTexteId`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ins_presences' AND INDEX_NAME = 'idx_ins_presences_auteur_liste') = 0,
  'CREATE INDEX `idx_ins_presences_auteur_liste` ON `ins_presences` (`auteurEnseignantId`, `listePresenceId`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
