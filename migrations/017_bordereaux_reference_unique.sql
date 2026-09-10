-- =============================================================================
-- EasyEcole — Migration SQL 017 : unicité référence bancaire et numéro de bordereau (anti-doublon)
-- =============================================================================
-- Ajoute deux INDEX UNIQUES sur la table ins_bordereaux :
--   - uq_bordereaux_reference  sur referenceBancaire
--   - uq_bordereaux_numero     sur numeroBordereau
--
-- Idempotent : chaque index n'est créé que s'il n'existe pas déjà
-- (vérification via information_schema.STATISTICS avant exécution).
--
-- PRÉREQUIS IMPORTANT (à valider avant déploiement en production) :
--   Avant d'exécuter cette migration, il faut vérifier qu'il n'y a
--   AUCUN doublon exact parmi les valeurs non nulles des colonnes
--   referenceBancaire et numeroBordereau. Un index UNIQUE MySQL avec
--   le collationnement utf8mb4_unicode_ci est INSENSIBLE à la casse,
--   mais les différences d'espaces ou d'accents pourraient provoquer
--   un conflit. Si des doublons existent, il faut les purger ou les
--   normaliser avant d'ajouter les index.
--
--   Exemple de requête de vérification (à exécuter avant la migration) :
--     SELECT referenceBancaire, COUNT(*) as nb FROM ins_bordereaux
--       WHERE referenceBancaire IS NOT NULL GROUP BY referenceBancaire HAVING nb > 1;
--     SELECT numeroBordereau, COUNT(*) as nb FROM ins_bordereaux
--       WHERE numeroBordereau IS NOT NULL GROUP BY numeroBordereau HAVING nb > 1;
-- =============================================================================

-- 1. Index unique sur referenceBancaire
SET @idxExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_bordereaux'
    AND COLUMN_NAME = 'referenceBancaire'
    AND INDEX_NAME = 'uq_bordereaux_reference'
);
SET @sql := IF(@idxExists = 0,
  'ALTER TABLE `ins_bordereaux` ADD UNIQUE INDEX `uq_bordereaux_reference` (`referenceBancaire`)',
  'SELECT ''index uq_bordereaux_reference deja present''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Index unique sur numeroBordereau
SET @idxExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_bordereaux'
    AND COLUMN_NAME = 'numeroBordereau'
    AND INDEX_NAME = 'uq_bordereaux_numero'
);
SET @sql := IF(@idxExists = 0,
  'ALTER TABLE `ins_bordereaux` ADD UNIQUE INDEX `uq_bordereaux_numero` (`numeroBordereau`)',
  'SELECT ''index uq_bordereaux_numero deja present''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
