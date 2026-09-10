-- =============================================================================
-- EasyEcole — Migration SQL 018 : classeId nullable sur ins_cursus_apprenants
-- =============================================================================
-- Règle métier : un étudiant, à la fin de son inscription, DOIT avoir un cursus
-- (parcours) même si aucune classe ne lui est encore affectée. La classe sera
-- affectée plus tard.
--
-- Action : rendre la colonne classeId de la table ins_cursus_apprenants NULLABLE.
-- Type actuel : int(10) unsigned, NOT NULL. La colonne est référencée par la
-- contrainte FK ins_cursus_apprenants_ibfk_3476 vers ins_classes(id) — cette FK
-- est CONSERVÉE.
--
-- Idempotent : la colonne n'est modifiée que si elle est actuellement NOT NULL
-- (vérification via information_schema.COLUMNS avec IS_NULLABLE = 'YES').
--
-- Précautions : SET FOREIGN_KEY_CHECKS = 0 est utilisé temporairement lors du
-- ALTER TABLE MODIFY COLUMN car la colonne est sous contrainte FK. Les FK sont
-- réactivées immédiatement après. La présence de la FK est vérifiée après
-- exécution via information_schema.KEY_COLUMN_USAGE.
-- =============================================================================

-- 1. Rendre classeId nullable (si ce n'est pas déjà le cas)
SET @isNullable := (
  SELECT IS_NULLABLE FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_cursus_apprenants'
    AND COLUMN_NAME = 'classeId'
);

SET @sql := IF(@isNullable = 'YES',
  'SELECT ''classeId deja nullable, rien a modifier''',
  'ALTER TABLE `ins_cursus_apprenants` MODIFY COLUMN `classeId` int(10) unsigned NULL DEFAULT NULL');

SET FOREIGN_KEY_CHECKS = 0;
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET FOREIGN_KEY_CHECKS = 1;

-- 2. Vérifier que la contrainte FK ins_cursus_apprenants_ibfk_3476 existe toujours
SET @fkExists := (
  SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_cursus_apprenants'
    AND CONSTRAINT_NAME = 'ins_cursus_apprenants_ibfk_3476'
);

SET @sql := IF(@fkExists > 0,
  'SELECT ''FK ins_cursus_apprenants_ibfk_3476 conservee''',
  'SELECT ''ATTENTION: FK ins_cursus_apprenants_ibfk_3476 manquante''');

PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
