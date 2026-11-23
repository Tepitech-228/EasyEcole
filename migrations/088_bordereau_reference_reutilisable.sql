-- Un compte bancaire sélectionné peut être utilisé pour plusieurs bordereaux.
-- L'unicité reste portée par numeroBordereau (uq_bordereaux_numero).
SET @idxExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ins_bordereaux'
    AND INDEX_NAME = 'uq_bordereaux_reference'
);
SET @sql := IF(@idxExists > 0,
  'ALTER TABLE `ins_bordereaux` DROP INDEX `uq_bordereaux_reference`',
  'SELECT ''index uq_bordereaux_reference deja absent''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
