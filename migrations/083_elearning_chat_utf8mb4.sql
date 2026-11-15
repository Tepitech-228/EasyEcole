-- =============================================================================
-- 083 — Support UTF-8 complet (emoji) pour le chat e-learning
--
-- PROBLÈME
--   Les tables `elearning_salons` et `elearning_messages` ont été créées en
--   utf8mb3. L'API utilise un icône emoji comme photo de salon (ex. « 💻 »)
--   et les messages peuvent contenir des emojis. MySQL rejette alors l'INSERT
--   avec ER_INCORRECT_STRING_VALUE (1366), ce qui fait échouer la création du
--   salon en HTTP 400 (SequelizeDatabaseError).
--
-- SOLUTION
--   Conversion des tables de chat en utf8mb4 (4 octets par caractère). Les
--   colonnes numériques et les contraintes sont conservées ; l'opération est
--   sans perte de données et peut être rejouée sans risque.
-- =============================================================================

SET @db := DATABASE();

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'elearning_salons'
     AND TABLE_COLLATION NOT LIKE 'utf8mb4%') > 0,
  'ALTER TABLE `elearning_salons` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'elearning_messages'
     AND TABLE_COLLATION NOT LIKE 'utf8mb4%') > 0,
  'ALTER TABLE `elearning_messages` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'elearning_notifications'
     AND TABLE_COLLATION NOT LIKE 'utf8mb4%') > 0,
  'ALTER TABLE `elearning_notifications` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
