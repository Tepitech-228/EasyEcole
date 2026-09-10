-- =============================================================================
-- EasyEcole — Migration SQL : indexes manquants pour performances
-- =============================================================================
-- Colonnes déjà présentes en local, indexes à ajouter sur recette/prod.
-- Idempotent : chaque index n'est créé que s'il est absent et seulement si la table existe.
-- =============================================================================

-- Bulletins : filtrage par cursus + année + semestre (requête fréquente mon-suivi)
SET @tableExists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_bulletins'
);
SET @idxExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_bulletins' AND INDEX_NAME = 'idx_bulletins_cursus_annee_semestre'
);
SET @sql := IF(@tableExists = 1 AND @idxExists = 0,
  'ALTER TABLE `ins_bulletins` ADD INDEX `idx_bulletins_cursus_annee_semestre` (`cursusApprenantId`, `anneeAcademiqueId`, `semestre`)',
  'SELECT ''index deja present ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Bulletins : filtrage par classe + année (génération bulletins)
SET @tableExists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_bulletins'
);
SET @idxExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_bulletins' AND INDEX_NAME = 'idx_bulletins_classe_annee'
);
SET @sql := IF(@tableExists = 1 AND @idxExists = 0,
  'ALTER TABLE `ins_bulletins` ADD INDEX `idx_bulletins_classe_annee` (`classeId`, `anneeAcademiqueId`)',
  'SELECT ''index deja present ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Bulletins : filtrage par utilisateur (mes bulletins)
SET @tableExists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_bulletins'
);
SET @idxExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_bulletins' AND INDEX_NAME = 'idx_bulletins_utilisateur'
);
SET @sql := IF(@tableExists = 1 AND @idxExists = 0,
  'ALTER TABLE `ins_bulletins` ADD INDEX `idx_bulletins_utilisateur` (`utilisateurId`)',
  'SELECT ''index deja present ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Lignes de bulletin : filtrage par cours (export PV)
SET @tableExists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_lignes_bulletins'
);
SET @idxExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_lignes_bulletins' AND INDEX_NAME = 'idx_lignes_bulletins_cours'
);
SET @sql := IF(@tableExists = 1 AND @idxExists = 0,
  'ALTER TABLE `ins_lignes_bulletins` ADD INDEX `idx_lignes_bulletins_cours` (`coursId`)',
  'SELECT ''index deja present ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Notes : filtrage par participant + année (mes notes)
SET @tableExists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_notes_evaluations'
);
SET @idxExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_notes_evaluations' AND INDEX_NAME = 'idx_notes_participant_annee'
);
SET @sql := IF(@tableExists = 1 AND @idxExists = 0,
  'ALTER TABLE `ins_notes_evaluations` ADD INDEX `idx_notes_participant_annee` (`coursParticipantId`, `anneeAcademiqueId`)',
  'SELECT ''index deja present ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Cursus apprenant : filtrage par classe + année + statut (inscription)
SET @tableExists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_cursus_apprenants'
);
SET @idxExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_cursus_apprenants' AND INDEX_NAME = 'idx_cursus_classe_annee_statut'
);
SET @sql := IF(@tableExists = 1 AND @idxExists = 0,
  'ALTER TABLE `ins_cursus_apprenants` ADD INDEX `idx_cursus_classe_annee_statut` (`classeId`, `anneeAcademiqueId`, `statutReinscription`)',
  'SELECT ''index deja present ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Cursus apprenant : filtrage par utilisateur (mon cursus)
SET @tableExists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_cursus_apprenants'
);
SET @idxExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_cursus_apprenants' AND INDEX_NAME = 'idx_cursus_utilisateur'
);
SET @sql := IF(@tableExists = 1 AND @idxExists = 0,
  'ALTER TABLE `ins_cursus_apprenants` ADD INDEX `idx_cursus_utilisateur` (`utilisateurId`)',
  'SELECT ''index deja present ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Paiements : filtrage par inscription + date (historique paiements)
SET @tableExists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_paiements'
);
SET @idxExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_paiements' AND INDEX_NAME = 'idx_paiements_inscription_date'
);
SET @sql := IF(@tableExists = 1 AND @idxExists = 0,
  'ALTER TABLE `ins_paiements` ADD INDEX `idx_paiements_inscription_date` (`inscriptionId`, `datePaiement`)',
  'SELECT ''index deja present ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Présences : filtrage par séance (appel)
SET @tableExists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_presences'
);
SET @idxExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_presences' AND INDEX_NAME = 'idx_presences_seance'
);
SET @sql := IF(@tableExists = 1 AND @idxExists = 0,
  'ALTER TABLE `ins_presences` ADD INDEX `idx_presences_seance` (`seanceId`)',
  'SELECT ''index deja present ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Cours : filtrage par classe + enseignant (planning)
SET @tableExists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_cours'
);
SET @idxExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_cours' AND INDEX_NAME = 'idx_cours_classe_enseignant'
);
SET @sql := IF(@tableExists = 1 AND @idxExists = 0,
  'ALTER TABLE `ins_cours` ADD INDEX `idx_cours_classe_enseignant` (`classeId`, `enseignantId`)',
  'SELECT ''index deja present ou table absente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;