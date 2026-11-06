-- Les chemins de l'arborescence académique peuvent dépasser 255 caractères.
-- Les champs doivent pouvoir stocker le chemin relatif complet sans troncature.
SET @db_name = DATABASE();

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db_name
     AND TABLE_NAME = 'ins_dossiers_demandes'
     AND COLUMN_NAME = 'nomFichier') > 0,
  'ALTER TABLE `ins_dossiers_demandes` MODIFY `nomFichier` TEXT NOT NULL',
  'SELECT ''table ou colonne ins_dossiers_demandes.nomFichier absente'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db_name
     AND TABLE_NAME = 'ins_bordereaux'
     AND COLUMN_NAME = 'fichier') > 0,
  'ALTER TABLE `ins_bordereaux` MODIFY `fichier` TEXT NOT NULL',
  'SELECT ''table ou colonne ins_bordereaux.fichier absente'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
