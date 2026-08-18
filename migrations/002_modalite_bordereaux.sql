-- =============================================================================
-- EasyEcole — Migration SQL : ajout de modalite sur ins_bordereaux
-- =============================================================================
-- Contexte : la colonne modalite existe déjà en local via sequelize.sync({ alter: true })
-- mais doit être ajoutée manuellement sur les bases recette/production.
-- =============================================================================

-- Ajout de la colonne
ALTER TABLE `ins_bordereaux`
    ADD COLUMN `modalite` VARCHAR(50) NULL COMMENT 'Modalité de paiement (comptant, 3_versements, 10_mensualites)'
    AFTER `statut`;

-- Index pour optimiser les requêtes filtrant par modalité
ALTER TABLE `ins_bordereaux`
    ADD INDEX `idx_bordereaux_modalite` (`modalite`);

-- =============================================================================
-- Vérification
-- =============================================================================
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = DATABASE()
--   AND table_name = 'ins_bordereaux'
--   AND column_name = 'modalite';
