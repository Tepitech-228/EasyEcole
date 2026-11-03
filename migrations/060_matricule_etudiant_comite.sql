-- Keep the student's proposed matricule separate from the login identifier.
-- and record each committee member's explicit confirmation.

SET @columnExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'aut_apprenants'
    AND COLUMN_NAME = 'matriculeEtudiant'
);
SET @sql := IF(@columnExists = 0,
  'ALTER TABLE `aut_apprenants` ADD COLUMN `matriculeEtudiant` VARCHAR(64) NULL',
  'SELECT ''aut_apprenants.matriculeEtudiant already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @columnExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ins_demandes_inscription'
    AND COLUMN_NAME = 'matriculeEtudiant'
);
SET @sql := IF(@columnExists = 0,
  'ALTER TABLE `ins_demandes_inscription` ADD COLUMN `matriculeEtudiant` VARCHAR(64) NULL',
  'SELECT ''ins_demandes_inscription.matriculeEtudiant already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @columnExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ins_comite_votes'
    AND COLUMN_NAME = 'matriculeConfirme'
);
SET @sql := IF(@columnExists = 0,
  'ALTER TABLE `ins_comite_votes` ADD COLUMN `matriculeConfirme` VARCHAR(64) NULL',
  'SELECT ''ins_comite_votes.matriculeConfirme already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @indexExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ins_demandes_inscription'
    AND INDEX_NAME = 'idx_ins_demandes_matricule_etudiant'
);
SET @sql := IF(@indexExists = 0,
  'CREATE INDEX `idx_ins_demandes_matricule_etudiant` ON `ins_demandes_inscription` (`matriculeEtudiant`)',
  'SELECT ''idx_ins_demandes_matricule_etudiant already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
