-- =============================================================================
-- EasyEcole — Migration SQL 019 : heures, type et enseignant sur ins_ecue ; catégorie sur ins_cours
-- =============================================================================
-- Règle métier (Master Professionnel ACT) :
--   - Chaque ECUE (ins_ecue) a des heures : CM (cmHoraire), TD+TP combinés (tdTpHoraire),
--     et TPE (tpeHoraire) — TPE est une colonne DISTINTE de TD/TP.
--   - Chaque ECUE a un TYPE : F / T / S / C / L / M (colonne type).
--   - Chaque ECUE a un ENSEIGNANT dédié (enseignantId) → FK vers aut_enseignants(id),
--     différent de l'enseignant de l'UE (ins_cours.enseignantId).
--   - Chaque UE (ins_cours) a une CATÉGORIE : MINEURE / MAJEURE / LIBRE (categorieUe).
--
-- Idempotent : chaque ALTER ne s'exécute que si la colonne n'existe pas encore
-- (vérification via information_schema.COLUMNS : TABLE_SCHEMA=DATABASE(),
--  TABLE_NAME, COLUMN_NAME absents).
--
-- Précautions : SET FOREIGN_KEY_CHECKS = 0 est utilisé temporairement lors du
-- ALTER TABLE ADD COLUMN pour la colonne enseignantId, puis réactivé
-- immédiatement après. La présence de la table aut_enseignants et de la FK
-- est vérifiée après exécution via information_schema.KEY_COLUMN_USAGE.
-- =============================================================================

-- =============================================================================
-- PARTIE 1 : Table ins_ecue — 5 nouvelles colonnes
-- =============================================================================

-- 1.1 — Colonne cmHoraire (heures cours magistraux)
SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_ecue'
    AND COLUMN_NAME = 'cmHoraire'
);
SET @sql := IF(@colExists > 0,
  'SELECT ''cmHoraire deja present sur ins_ecue''',
  'ALTER TABLE `ins_ecue` ADD COLUMN `cmHoraire` int(10) unsigned NULL DEFAULT NULL');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1.2 — Colonne tdTpHoraire (heures TD+TP combinés)
SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_ecue'
    AND COLUMN_NAME = 'tdTpHoraire'
);
SET @sql := IF(@colExists > 0,
  'SELECT ''tdTpHoraire deja present sur ins_ecue''',
  'ALTER TABLE `ins_ecue` ADD COLUMN `tdTpHoraire` int(10) unsigned NULL DEFAULT NULL');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1.3 — Colonne tpeHoraire (heures TPE — travaux pratiques extérieurs)
SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_ecue'
    AND COLUMN_NAME = 'tpeHoraire'
);
SET @sql := IF(@colExists > 0,
  'SELECT ''tpeHoraire deja present sur ins_ecue''',
  'ALTER TABLE `ins_ecue` ADD COLUMN `tpeHoraire` int(10) unsigned NULL DEFAULT NULL');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1.4 — Colonne type (type d'enseignement : F/T/S/C/L/M)
SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_ecue'
    AND COLUMN_NAME = 'type'
);
SET @sql := IF(@colExists > 0,
  'SELECT ''type deja present sur ins_ecue''',
  'ALTER TABLE `ins_ecue` ADD COLUMN `type` enum(''F'',''T'',''S'',''C'',''L'',''M'') NULL DEFAULT NULL');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1.5 — Colonne enseignantId (FK vers aut_enseignants(id))
-- Ajout de la colonne d'abord, puis création de la FK séparément.
SET @tableExists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_enseignants'
);

SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_ecue'
    AND COLUMN_NAME = 'enseignantId'
);

SET @sql := IF(@colExists > 0,
  'SELECT ''enseignantId deja present sur ins_ecue''',
  'ALTER TABLE `ins_ecue` ADD COLUMN `enseignantId` int(10) unsigned NULL DEFAULT NULL');

SET FOREIGN_KEY_CHECKS = 0;
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET FOREIGN_KEY_CHECKS = 1;

-- 1.6 — Création de la FK ins_ecue_ibfk_enseignant si la colonne existe et la FK pas encore
SET @fkExists := (
  SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_ecue'
    AND CONSTRAINT_NAME = 'ins_ecue_ibfk_enseignant'
);

SET @sql := IF(@fkExists > 0,
  'SELECT ''FK ins_ecue_ibfk_enseignant deja presente''',
  IF(@tableExists > 0,
    'ALTER TABLE `ins_ecue` ADD CONSTRAINT `ins_ecue_ibfk_enseignant` FOREIGN KEY (`enseignantId`) REFERENCES `aut_enseignants`(`id`) ON DELETE SET NULL',
    'SELECT ''ATTENTION: aut_enseignants absente, FK inseree'''));

SET FOREIGN_KEY_CHECKS = 0;
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET FOREIGN_KEY_CHECKS = 1;

-- 1.7 — Vérification de la FK ins_ecue_ibfk_enseignant
SET @fkExists := (
  SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_ecue'
    AND CONSTRAINT_NAME = 'ins_ecue_ibfk_enseignant'
);
SET @sql := IF(@fkExists > 0,
  'SELECT ''FK ins_ecue_ibfk_enseignant confirmee''',
  'SELECT ''ATTENTION: FK ins_ecue_ibfk_enseignant absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- =============================================================================
-- PARTIE 2 : Table ins_cours — 1 nouvelle colonne
-- =============================================================================

-- 2.1 — Colonne categorieUe (catégorie de l'unité d'enseignement)
SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_cours'
    AND COLUMN_NAME = 'categorieUe'
);
SET @sql := IF(@colExists > 0,
  'SELECT ''categorieUe deja present sur ins_cours''',
  'ALTER TABLE `ins_cours` ADD COLUMN `categorieUe` enum(''MINEURE'',''MAJEURE'',''LIBRE'') NULL DEFAULT NULL');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- =============================================================================
-- PARTIE 3 : Vérification finale (VERBOSE)
-- =============================================================================

-- 3.1 — Vérification des colonnes ins_ecue
SELECT '=== Verification finale : ins_ecue ===' as resultat;
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_ecue'
ORDER BY ORDINAL_POSITION;

-- 3.2 — Vérification des colonnes ins_cours
SELECT '=== Verification finale : ins_cours ===' as resultat;
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_cours'
ORDER BY ORDINAL_POSITION;

-- 3.3 — Vérification FK ins_ecue_ibfk_enseignant
SELECT '=== Verification FK ===' as resultat;
SET @fkExists := (
  SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_ecue'
    AND CONSTRAINT_NAME = 'ins_ecue_ibfk_enseignant'
);
SET @sql := IF(@fkExists > 0,
  'SELECT ''FK ins_ecue_ibfk_enseignant confirmee''',
  'SELECT ''ATTENTION: FK ins_ecue_ibfk_enseignant absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
