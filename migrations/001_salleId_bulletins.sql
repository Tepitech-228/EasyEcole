-- =============================================================================
-- EasyEcole — Migration SQL : ajout de salleId sur ins_bulletins
-- =============================================================================
-- Contexte : la colonne salleId existe déjà en local via sequelize.sync({ alter: true })
-- mais doit être ajoutée manuellement sur les bases recette/production.
-- =============================================================================

-- Ajout de la colonne
ALTER TABLE `ins_bulletins`
    ADD COLUMN `salleId` INT UNSIGNED NULL COMMENT 'Salle de classe optionnelle pour le bulletin'
    AFTER `niveauEtudeId`;

-- Index pour optimiser les requêtes filtrant par salle
ALTER TABLE `ins_bulletins`
    ADD INDEX `idx_bulletins_salleId` (`salleId`);

-- Foreign key optionnelle (décommenter si vous souhaitez activer la contrainte)
-- ALTER TABLE `ins_bulletins`
--     ADD CONSTRAINT `fk_bulletins_salle`
--     FOREIGN KEY (`salleId`) REFERENCES `ins_salles_de_classe`(`id`)
--     ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Vérification
-- =============================================================================
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = DATABASE()
--   AND table_name = 'ins_bulletins'
--   AND column_name = 'salleId';
