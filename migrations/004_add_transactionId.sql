-- =============================================================================
-- EasyEcole — Migration SQL : ajout de transactionId sur ins_paiements_inscription
-- =============================================================================
-- Contexte : le modèle Sequelize PaiementInscription (PaiementInscription.ts) déclare
-- la propriété transactionId (DataTypes.STRING => VARCHAR(255), allowNull: true)
-- et le contrôleur PaiementInscriptionController.ts la remplit lors des paiements
-- Mobile Money Cinetpay (createMobileMoneyPayment, ligne ~399).
-- La colonne est absente des bases recette/production, ce qui provoque
-- ER_BAD_FIELD_ERROR (errno 1054) / "Unknown column 'transactionId'" sur le GET.
-- Idempotent : ne fait rien si la colonne/index existent déjà.
-- =============================================================================

-- 1. Colonne transactionId (NULL autorisé pour ne pas casser les lignes existantes)
SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_paiements_inscription' AND COLUMN_NAME = 'transactionId'
);
SET @sql := IF(@colExists = 0,
  'ALTER TABLE `ins_paiements_inscription` ADD COLUMN `transactionId` VARCHAR(255) NULL COMMENT ''Identifiant de transaction Cinetpay (Mobile Money), format INSC-<timestamp>-<random>'' AFTER `dateValidation`',
  'SELECT ''colonne transactionId deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Index pour optimiser la recherche par transactionId
--    (checkMobileMoneyPayment : PaiementInscription.findOne({ where: { transactionId } }))
SET @idxExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_paiements_inscription' AND INDEX_NAME = 'idx_paiements_inscription_transactionId'
);
SET @sql := IF(@idxExists = 0,
  'ALTER TABLE `ins_paiements_inscription` ADD INDEX `idx_paiements_inscription_transactionId` (`transactionId`)',
  'SELECT ''index idx_paiements_inscription_transactionId deja present''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;