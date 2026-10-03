-- A filière peut exister dans plusieurs grades (ex. Licence 1, 2 et 3).
-- Retire les anciens index UNIQUE portant uniquement sur titre; conserve
-- les index composites qui peuvent inclure cette colonne.
SET SESSION group_concat_max_len = 65535;

SET @tableExists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_parcours'
);
SET @dropIndexes := (
  SELECT GROUP_CONCAT(
    CONCAT('DROP INDEX `', REPLACE(index_name, '`', '``'), '`')
    SEPARATOR ', '
  )
  FROM (
    SELECT INDEX_NAME AS index_name
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'ins_parcours'
      AND NON_UNIQUE = 0
      AND INDEX_NAME <> 'PRIMARY'
    GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1 AND MAX(COLUMN_NAME) = 'titre'
  ) AS title_indexes
);
SET @sql := IF(
  @tableExists = 1 AND @dropIndexes IS NOT NULL,
  CONCAT('ALTER TABLE `ins_parcours` ', @dropIndexes),
  'SELECT ''aucun index UNIQUE simple sur ins_parcours.titre a retirer'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
