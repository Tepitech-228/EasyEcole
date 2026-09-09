-- =============================================================================
-- EasyEcole — Migration SQL : ajout de corrigePar sur ins_rattrapages_inscriptions
-- =============================================================================
-- Contexte : le modèle Sequelize RattrapageInscription (RattrapageInscription.ts,
-- lignes ~75-78) déclare la propriété corrigePar (DataTypes.STRING(36), allowNull: true)
-- et le contrôleur RattrapageController.ts la remplit lors de l'enregistrement des
-- notes (saveNotes, ligne ~187).
-- La colonne est absente des bases recette/production, ce qui provoque
-- ER_BAD_FIELD_ERROR (errno 1054) / "Unknown column 'corrigePar'" sur :
--   - GET /api/v1/inscription/rattrapages              (getAll)
--   - GET /api/v1/inscription/rattrapages/demandes     (getDemandes)
--   - GET /api/v1/inscription/rattrapages/mes-demandes (getMesDemandes, apprenant valide)
-- Idempotent : ne fait rien si la colonne existe déjà.
-- =============================================================================

-- 1. Colonne corrigePar (NULL autorisé pour ne pas casser les lignes existantes)
SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_rattrapages_inscriptions' AND COLUMN_NAME = 'corrigePar'
);
SET @sql := IF(@colExists = 0,
  'ALTER TABLE `ins_rattrapages_inscriptions` ADD COLUMN `corrigePar` VARCHAR(36) NULL COMMENT ''Identifiant de l''''utilisateur (enseignant/institution) ayant corrigé le rattrapage''',
  'SELECT ''colonne corrigePar deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;