-- =============================================================================
-- EasyEcole — Migration SQL 021 : dateGradingDeadline + enseignantGradientId
-- Contexte : le modèle Sequelize RattrapageInscription (RattrapageInscription.ts,
-- lignes ~75-80) déclare deux nouvelles propriétés :
--   • dateGradingDeadline → DATE, date limite de saisie des notes (= date de la
--     session + 3 jours, i.e. mercredi). Auto-set par RattrapageController.
--   • enseignantGradientId → INT, FK vers aut_enseignants.id, correcteur assigné
--     pour la session (enforcement dans saveNotes : seul l'enseignant désigné
--     peut saisir les notes de ses copies).
-- Idempotent : ne fait rien si les colonnes existent déjà.
-- =============================================================================

-- 1. Colonne dateGradingDeadline
SET @col1 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapages_inscriptions' AND COLUMN_NAME = 'dateGradingDeadline'
);
SET @sql1 := IF(@col1 = 0,
  'ALTER TABLE `ins_rattrapages_inscriptions` ADD COLUMN `dateGradingDeadline` DATE NULL COMMENT ''Date limite de saisie des notes (session + 3 jours)''',
  'SELECT ''colonne dateGradingDeadline deja presente''');
PREPARE stmt1 FROM @sql1; EXECUTE stmt1; DEALLOCATE PREPARE stmt1;

-- 2. Colonne enseignantGradientId (FK vers aut_enseignants.id)
SET @col2 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapages_inscriptions' AND COLUMN_NAME = 'enseignantGradientId'
);
SET @sql2 := IF(@col2 = 0,
  'ALTER TABLE `ins_rattrapages_inscriptions` ADD COLUMN `enseignantGradientId` INT UNSIGNED NULL COMMENT ''FK vers aut_enseignants.id (correcteur assigné pour la session)''',
  'SELECT ''colonne enseignantGradientId deja presente''');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- 3. Index + contrainte de clé étrangère (idempotent)
SET @fkExists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapages_inscriptions'
    AND CONSTRAINT_NAME = 'fk_rattrapage_enseignant_gradient'
);
SET @sql3 := IF(@fkExists = 0,
  'ALTER TABLE `ins_rattrapages_inscriptions`
   ADD CONSTRAINT `fk_rattrapage_enseignant_gradient` FOREIGN KEY (`enseignantGradientId`) REFERENCES `aut_enseignants` (`id`) ON DELETE SET NULL',
  'SELECT ''contrainte fk_rattrapage_enseignant_gradient deja presente''');
PREPARE stmt3 FROM @sql3; EXECUTE stmt3; DEALLOCATE PREPARE stmt3;

SET @idxExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapages_inscriptions' AND INDEX_NAME = 'idx_rattrapage_enseignant_gradient'
);
SET @sql4 := IF(@idxExists = 0,
  'ALTER TABLE `ins_rattrapages_inscriptions` ADD INDEX `idx_rattrapage_enseignant_gradient` (`enseignantGradientId`)',
  'SELECT ''index idx_rattrapage_enseignant_gradient deja present''');
PREPARE stmt4 FROM @sql4; EXECUTE stmt4; DEALLOCATE PREPARE stmt4;