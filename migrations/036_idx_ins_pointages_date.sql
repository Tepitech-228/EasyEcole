-- ============================================================================
-- 036 — ins_pointages : index des lectures par date
-- ============================================================================
--
-- PROBLÈME (mesuré : EXPLAIN sur la base de dev) : aucune indexation sur `date`.
--   - getAllPointages  : ORDER BY date DESC, heureArrivee DESC  -> type=ALL + Using filesort
--   - getRapport       : WHERE date BETWEEN ? AND ?             -> type=ALL + Using where
-- L'unique composite (utilisateurId, date) [migration 035] ne peut PAS servir
-- ces accès (il commence par utilisateurId, pas par date).
--
-- SOLUTION : index composite (date, heureArrivee).
--   - préfixe `date`         -> sert le filtre de plage de getRapport
--   - (date, heureArrivee)   -> balayé à l'envers, sert l'ORDER BY date DESC,
--                               heureArrivee DESC de getAllPointages (évite filesort)
--
-- ADDITIF et RÉVERSIBLE (aucune donnée touchée) :
--   rollback manuel = DROP INDEX `idx_ins_pointages_date` ON `ins_pointages`;
--   (le runner est forward-only ; ce commentaire documente le retour arrière.)
--
-- IDEMPOTENCE : MySQL n'a pas de CREATE INDEX IF NOT EXISTS ; on interroge
-- information_schema et on construit le DDL dynamiquement. Un index existant
-- couvrant exactement (date, heureArrivee) est conservé. Aucun DELETE.
-- ============================================================================

SET @ddl_1 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_pointages') = 1
  AND NOT (
    SELECT COUNT(*) FROM (
      SELECT INDEX_NAME,
             GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
        FROM information_schema.statistics
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'ins_pointages'
       GROUP BY INDEX_NAME
    ) x
     WHERE x.cols = 'date,heureArrivee'
  ) > 0,
  'CREATE INDEX `idx_ins_pointages_date` ON `ins_pointages` (`date`, `heureArrivee`)',
  'DO 0'
);
PREPARE stmt_1 FROM @ddl_1;
EXECUTE stmt_1;
DEALLOCATE PREPARE stmt_1;
