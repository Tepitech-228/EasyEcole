-- ============================================================================
-- 035 — ins_pointages : contrainte UNIQUE (utilisateurId, date)
-- ============================================================================
--
-- CONTRAINTE CIBLÉE, hors générateur : les uniques composites ne sont pas
-- exprimables via UNIQUE_INDEX_DEFS (mono-colonne uniquement). L'index est
-- aussi déclaré dans le modèle Pointage.ts
--   indexes: [{ unique: true, fields: ['utilisateurId', 'date'] }]
-- pour le sync alter de développement — mais la PRODUCTION n'exécute AUCUN
-- sync alter (cf. DatabaseConnection.ts, « SCHÉMA — synchronisation
-- automatique DÉSACTIVÉE »). Cette migration est donc le seul chemin vers la
-- production.
--
-- RÔLE MÉTIER : un seul pointage par utilisateur et par jour (arrivée puis
-- départ sur la même ligne). Sans cette contrainte, deux scans concurrents
-- peuvent créer deux lignes : le contrôle findOne-then-create du contrôleur
-- (PointageController) n'est pas atomique.
--
-- IDEMPOTENCE : MySQL n'a pas de CREATE INDEX IF NOT EXISTS ; on interroge
-- information_schema et on construit le DDL dynamiquement. Un index existant
-- couvrant exactement (utilisateurId, date) est conservé. Aucun DELETE.
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
     WHERE x.cols = 'utilisateurId,date'
  ) > 0,
  'CREATE UNIQUE INDEX `uq_ins_pointages_utilisateur_date` ON `ins_pointages` (`utilisateurId`, `date`)',
  'DO 0'
);
PREPARE stmt_1 FROM @ddl_1;
EXECUTE stmt_1;
DEALLOCATE PREPARE stmt_1;
