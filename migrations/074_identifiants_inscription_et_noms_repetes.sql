SET @nomPrenomsIndex := (
  SELECT index_name
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'aut_utilisateurs'
    AND non_unique = 0
    AND index_name <> 'PRIMARY'
  GROUP BY index_name
  HAVING COUNT(*) = 2
    AND SUM(column_name = 'nom') = 1
    AND SUM(column_name = 'prenoms') = 1
  LIMIT 1
);
SET @sql := IF(@nomPrenomsIndex IS NOT NULL,
  CONCAT('ALTER TABLE `aut_utilisateurs` DROP INDEX `', REPLACE(@nomPrenomsIndex, '`', '``'), '`'),
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
