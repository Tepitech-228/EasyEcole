-- Marque les pièces qu'un étudiant doit remplacer après le contrôle du comité.
SET @tableExists := (SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_dossiers_demandes');
SET @columnExists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_dossiers_demandes' AND COLUMN_NAME = 'correctionDemandee');
SET @sql := IF(@tableExists = 1 AND @columnExists = 0,
  'ALTER TABLE `ins_dossiers_demandes` ADD COLUMN `correctionDemandee` TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT ''colonne ins_dossiers_demandes.correctionDemandee deja presente ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;