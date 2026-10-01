-- ============================================================================
-- 004 — Index de performance (filtres et agrégations fréquents)
-- ============================================================================
--
-- GENERE par scripts/generate-migrations-from-sources.cjs
-- Source  : PERFORMANCE_INDEX_DEFS (src/core/helpers/ensureUniqueIndexes.ts)
-- Contenu : 12 index.
--
-- Règle : un index existant dont les colonnes de tête couvrent la définition
-- est conservé tel quel (logique `isCovered`).
-- ============================================================================

-- cpt_ecritures_comptables (compteDebitId)
SET @ddl_1 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cpt_ecritures_comptables') = 1
  AND NOT ((
    SELECT COUNT(*) FROM (
      SELECT INDEX_NAME,
             GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
        FROM information_schema.statistics
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'cpt_ecritures_comptables'
       GROUP BY INDEX_NAME
    ) x
     WHERE x.cols = 'compteDebitId' OR x.cols LIKE 'compteDebitId,%'
  ) > 0),
  'CREATE INDEX `idx_cpt_ecritures_comptables_compteDebitId` ON `cpt_ecritures_comptables` (`compteDebitId`)',
  'DO 0'
);
PREPARE stmt_1 FROM @ddl_1;
EXECUTE stmt_1;
DEALLOCATE PREPARE stmt_1;

-- cpt_ecritures_comptables (compteCreditId)
SET @ddl_2 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cpt_ecritures_comptables') = 1
  AND NOT ((
    SELECT COUNT(*) FROM (
      SELECT INDEX_NAME,
             GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
        FROM information_schema.statistics
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'cpt_ecritures_comptables'
       GROUP BY INDEX_NAME
    ) x
     WHERE x.cols = 'compteCreditId' OR x.cols LIKE 'compteCreditId,%'
  ) > 0),
  'CREATE INDEX `idx_cpt_ecritures_comptables_compteCreditId` ON `cpt_ecritures_comptables` (`compteCreditId`)',
  'DO 0'
);
PREPARE stmt_2 FROM @ddl_2;
EXECUTE stmt_2;
DEALLOCATE PREPARE stmt_2;

-- ins_seances (jourSemaine, dateDebut, dateFin)
SET @ddl_3 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_seances') = 1
  AND NOT ((
    SELECT COUNT(*) FROM (
      SELECT INDEX_NAME,
             GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
        FROM information_schema.statistics
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'ins_seances'
       GROUP BY INDEX_NAME
    ) x
     WHERE x.cols = 'jourSemaine,dateDebut,dateFin' OR x.cols LIKE 'jourSemaine,dateDebut,dateFin,%'
  ) > 0),
  'CREATE INDEX `idx_ins_seances_jourSemaine_dateDebut_dateFin` ON `ins_seances` (`jourSemaine`, `dateDebut`, `dateFin`)',
  'DO 0'
);
PREPARE stmt_3 FROM @ddl_3;
EXECUTE stmt_3;
DEALLOCATE PREPARE stmt_3;

-- ins_seances (coursId)
SET @ddl_4 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_seances') = 1
  AND NOT ((
    SELECT COUNT(*) FROM (
      SELECT INDEX_NAME,
             GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
        FROM information_schema.statistics
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'ins_seances'
       GROUP BY INDEX_NAME
    ) x
     WHERE x.cols = 'coursId' OR x.cols LIKE 'coursId,%'
  ) > 0),
  'CREATE INDEX `idx_ins_seances_coursId` ON `ins_seances` (`coursId`)',
  'DO 0'
);
PREPARE stmt_4 FROM @ddl_4;
EXECUTE stmt_4;
DEALLOCATE PREPARE stmt_4;

-- ins_seances (enseignantId)
SET @ddl_5 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_seances') = 1
  AND NOT ((
    SELECT COUNT(*) FROM (
      SELECT INDEX_NAME,
             GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
        FROM information_schema.statistics
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'ins_seances'
       GROUP BY INDEX_NAME
    ) x
     WHERE x.cols = 'enseignantId' OR x.cols LIKE 'enseignantId,%'
  ) > 0),
  'CREATE INDEX `idx_ins_seances_enseignantId` ON `ins_seances` (`enseignantId`)',
  'DO 0'
);
PREPARE stmt_5 FROM @ddl_5;
EXECUTE stmt_5;
DEALLOCATE PREPARE stmt_5;

-- ins_echeances (statut, dateLimite)
SET @ddl_6 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_echeances') = 1
  AND NOT ((
    SELECT COUNT(*) FROM (
      SELECT INDEX_NAME,
             GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
        FROM information_schema.statistics
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'ins_echeances'
       GROUP BY INDEX_NAME
    ) x
     WHERE x.cols = 'statut,dateLimite' OR x.cols LIKE 'statut,dateLimite,%'
  ) > 0),
  'CREATE INDEX `idx_ins_echeances_statut_dateLimite` ON `ins_echeances` (`statut`, `dateLimite`)',
  'DO 0'
);
PREPARE stmt_6 FROM @ddl_6;
EXECUTE stmt_6;
DEALLOCATE PREPARE stmt_6;

-- ins_echeances (dossierEtudiantId)
SET @ddl_7 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_echeances') = 1
  AND NOT ((
    SELECT COUNT(*) FROM (
      SELECT INDEX_NAME,
             GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
        FROM information_schema.statistics
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'ins_echeances'
       GROUP BY INDEX_NAME
    ) x
     WHERE x.cols = 'dossierEtudiantId' OR x.cols LIKE 'dossierEtudiantId,%'
  ) > 0),
  'CREATE INDEX `idx_ins_echeances_dossierEtudiantId` ON `ins_echeances` (`dossierEtudiantId`)',
  'DO 0'
);
PREPARE stmt_7 FROM @ddl_7;
EXECUTE stmt_7;
DEALLOCATE PREPARE stmt_7;

-- ins_bulletins (classeId, anneeAcademiqueId, semestre)
SET @ddl_8 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_bulletins') = 1
  AND NOT ((
    SELECT COUNT(*) FROM (
      SELECT INDEX_NAME,
             GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
        FROM information_schema.statistics
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'ins_bulletins'
       GROUP BY INDEX_NAME
    ) x
     WHERE x.cols = 'classeId,anneeAcademiqueId,semestre' OR x.cols LIKE 'classeId,anneeAcademiqueId,semestre,%'
  ) > 0),
  'CREATE INDEX `idx_ins_bulletins_classeId_anneeAcademiqueId_semestre` ON `ins_bulletins` (`classeId`, `anneeAcademiqueId`, `semestre`)',
  'DO 0'
);
PREPARE stmt_8 FROM @ddl_8;
EXECUTE stmt_8;
DEALLOCATE PREPARE stmt_8;

-- ins_bulletins (cursusApprenantId)
SET @ddl_9 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_bulletins') = 1
  AND NOT ((
    SELECT COUNT(*) FROM (
      SELECT INDEX_NAME,
             GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
        FROM information_schema.statistics
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'ins_bulletins'
       GROUP BY INDEX_NAME
    ) x
     WHERE x.cols = 'cursusApprenantId' OR x.cols LIKE 'cursusApprenantId,%'
  ) > 0),
  'CREATE INDEX `idx_ins_bulletins_cursusApprenantId` ON `ins_bulletins` (`cursusApprenantId`)',
  'DO 0'
);
PREPARE stmt_9 FROM @ddl_9;
EXECUTE stmt_9;
DEALLOCATE PREPARE stmt_9;

-- ins_listes_notes_evaluation (coursId)
SET @ddl_10 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_listes_notes_evaluation') = 1
  AND NOT ((
    SELECT COUNT(*) FROM (
      SELECT INDEX_NAME,
             GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
        FROM information_schema.statistics
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'ins_listes_notes_evaluation'
       GROUP BY INDEX_NAME
    ) x
     WHERE x.cols = 'coursId' OR x.cols LIKE 'coursId,%'
  ) > 0),
  'CREATE INDEX `idx_ins_listes_notes_evaluation_coursId` ON `ins_listes_notes_evaluation` (`coursId`)',
  'DO 0'
);
PREPARE stmt_10 FROM @ddl_10;
EXECUTE stmt_10;
DEALLOCATE PREPARE stmt_10;

-- ins_listes_notes_evaluation (enseignantId)
SET @ddl_11 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_listes_notes_evaluation') = 1
  AND NOT ((
    SELECT COUNT(*) FROM (
      SELECT INDEX_NAME,
             GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
        FROM information_schema.statistics
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'ins_listes_notes_evaluation'
       GROUP BY INDEX_NAME
    ) x
     WHERE x.cols = 'enseignantId' OR x.cols LIKE 'enseignantId,%'
  ) > 0),
  'CREATE INDEX `idx_ins_listes_notes_evaluation_enseignantId` ON `ins_listes_notes_evaluation` (`enseignantId`)',
  'DO 0'
);
PREPARE stmt_11 FROM @ddl_11;
EXECUTE stmt_11;
DEALLOCATE PREPARE stmt_11;

-- ins_listes_notes_evaluation (anneeAcademiqueId)
SET @ddl_12 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_listes_notes_evaluation') = 1
  AND NOT ((
    SELECT COUNT(*) FROM (
      SELECT INDEX_NAME,
             GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
        FROM information_schema.statistics
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'ins_listes_notes_evaluation'
       GROUP BY INDEX_NAME
    ) x
     WHERE x.cols = 'anneeAcademiqueId' OR x.cols LIKE 'anneeAcademiqueId,%'
  ) > 0),
  'CREATE INDEX `idx_ins_listes_notes_evaluation_anneeAcademiqueId` ON `ins_listes_notes_evaluation` (`anneeAcademiqueId`)',
  'DO 0'
);
PREPARE stmt_12 FROM @ddl_12;
EXECUTE stmt_12;
DEALLOCATE PREPARE stmt_12;

