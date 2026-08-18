-- =============================================================================
-- EasyEcole — Migration SQL : ajout de corrigePar sur ins_rattrapages_inscriptions
-- =============================================================================
-- Contexte : le modèle Sequelize RattrapageInscription (RattrapageInscription.ts,
-- lignes ~75-78) déclare la propriété corrigePar (DataTypes.STRING(36), allowNull: true)
-- et le contrôleur RattrapageController.ts la remplit lors de l'enregistrement des
-- notes (saveNotes, ligne ~187).
-- La colonne est absente des bases recette/production, ce qui provoque
-- ER_BAD_FIELD_ERROR (errno 1054) / "Unknown column 'corrigePar'" sur :
--   - GET /api/v1/inscription/rattrapages            (getAll)
--   - GET /api/v1/inscription/rattrapages/demandes   (getDemandes)
--   - GET /api/v1/inscription/rattrapages/mes-demandes (getMesDemandes, apprenant valide)
-- =============================================================================

-- Base cible : définie dans easy-ecole-backend/.env (DB_NAME=easyecole, DB_PORT=3306).
-- Ajuster le nom si la base recette/production diffère.
USE `easyecole`;

-- Ajout de la colonne (NULL autorisé pour ne pas casser les lignes existantes)
ALTER TABLE `ins_rattrapages_inscriptions`
    ADD COLUMN `corrigePar` VARCHAR(36) NULL
    COMMENT 'Identifiant de l''utilisateur (enseignant/institution) ayant corrigé le rattrapage';

-- =============================================================================
-- Vérification
-- =============================================================================
-- SELECT column_name, data_type, is_nullable, column_comment
-- FROM information_schema.columns
-- WHERE table_schema = DATABASE()
--   AND table_name = 'ins_rattrapages_inscriptions'
--   AND column_name = 'corrigePar';
