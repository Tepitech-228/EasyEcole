-- =============================================================================
-- EasyEcole — Migration SQL : ajout de transactionId sur ins_paiements_inscription
-- =============================================================================
-- Contexte : le modèle Sequelize PaiementInscription (PaiementInscription.ts) déclare
-- la propriété transactionId (DataTypes.STRING => VARCHAR(255), allowNull: true)
-- et le contrôleur PaiementInscriptionController.ts la remplit lors des paiements
-- Mobile Money Cinetpay (createMobileMoneyPayment, ligne ~399).
-- La colonne est absente des bases recette/production, ce qui provoque
-- ER_BAD_FIELD_ERROR (errno 1054) / "Unknown column 'transactionId'" sur le GET.
-- =============================================================================

-- Base cible : définie dans easy-ecole-backend/.env (DB_NAME=easyecole, DB_PORT=3306).
-- Ajuster le nom si la base recette/production diffère.
USE `easyecole`;

-- Ajout de la colonne (NULL autorisé pour ne pas casser les lignes existantes)
ALTER TABLE `ins_paiements_inscription`
    ADD COLUMN `transactionId` VARCHAR(255) NULL
    COMMENT 'Identifiant de transaction Cinetpay (Mobile Money), format INSC-<timestamp>-<random>'
    AFTER `dateValidation`;

-- Index pour optimiser la recherche par transactionId
-- (checkMobileMoneyPayment : PaiementInscription.findOne({ where: { transactionId } }))
ALTER TABLE `ins_paiements_inscription`
    ADD INDEX `idx_paiements_inscription_transactionId` (`transactionId`);

-- =============================================================================
-- Vérification
-- =============================================================================
-- SELECT column_name, data_type, is_nullable, column_comment
-- FROM information_schema.columns
-- WHERE table_schema = DATABASE()
--   AND table_name = 'ins_paiements_inscription'
--   AND column_name = 'transactionId';