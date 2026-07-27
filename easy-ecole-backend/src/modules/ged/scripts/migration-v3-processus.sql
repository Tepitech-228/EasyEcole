-- ============================================================================
-- EasyEcole - GED Module - Migration v3
-- Description: Ajoute le système de processus générateur pour les documents,
--              le lieu de stockage, et le chiffrement.
-- Target: MySQL 5.7+ / 8.x, InnoDB, utf8mb4
-- Idempotent: YES (safe to run multiple times)
-- ============================================================================

START TRANSACTION;

-- ============================================================================
-- 1. Création de la table ged_processus
-- ============================================================================
CREATE TABLE IF NOT EXISTS `ged_processus` (
  `id` CHAR(36) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `libelle` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `module_source` VARCHAR(50) NULL,
  `is_actif` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_processus_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 2. Ajout des colonnes dans ged_documents
-- ============================================================================

-- processus_generateur_id
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'processus_generateur_id');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `processus_generateur_id` CHAR(36) NULL AFTER `locked_at`',
  'SELECT "processus_generateur_id already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- storage_location
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'storage_location');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `storage_location` VARCHAR(50) NOT NULL DEFAULT ''local'' AFTER `processus_generateur_id`',
  'SELECT "storage_location already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- is_encrypted
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'is_encrypted');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `is_encrypted` BOOLEAN NOT NULL DEFAULT FALSE AFTER `storage_location`',
  'SELECT "is_encrypted already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- encryption_key_id
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'encryption_key_id');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `encryption_key_id` VARCHAR(255) NULL AFTER `is_encrypted`',
  'SELECT "encryption_key_id already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- 3. Ajout de la clé étrangère et de l'index
-- ============================================================================

SET @fk_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents'
  AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'fk_documents_processus');
SET @fk_query := IF(@fk_exists = 0,
  'ALTER TABLE `ged_documents` ADD CONSTRAINT `fk_documents_processus` FOREIGN KEY (`processus_generateur_id`) REFERENCES `ged_processus`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT "fk_documents_processus already exists"');
PREPARE stmt FROM @fk_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index
SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND INDEX_NAME = 'idx_documents_processus');
SET @idx_query := IF(@idx_exists = 0,
  'ALTER TABLE `ged_documents` ADD INDEX `idx_documents_processus` (`processus_generateur_id`)',
  'SELECT "idx_documents_processus already exists"');
PREPARE stmt FROM @idx_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- 4. Seed des processus générateurs
-- ============================================================================

INSERT IGNORE INTO `ged_processus` (`id`, `code`, `libelle`, `description`, `module_source`, `is_actif`) VALUES
  (UUID(), 'INSCRIPTION',         'Inscription',              'Documents liés au processus d\'inscription',            'inscription',   TRUE),
  (UUID(), 'BULLETIN',            'Bulletin de notes',        'Bulletins de notes générés par l\'application',         'bulletins',     TRUE),
  (UUID(), 'SCOLARITE_DEMANDE',   'Demande de scolarité',     'Demandes de certificats et attestations de scolarité',  'scolarite',     TRUE),
  (UUID(), 'DELIBERATION',        'Délibération',             'Procès-verbaux et résultats de délibérations',          'deliberation',  TRUE),
  (UUID(), 'DIPLOME',             'Diplôme',                  'Diplômes et suppléments au diplôme',                    'diplome',       TRUE),
  (UUID(), 'VAE',                 'VAE',                      'Validation des Acquis de l\'Expérience',                'vae',           TRUE),
  (UUID(), 'RECLAMATION',         'Réclamation',              'Réclamations et recours',                               'reclamation',   TRUE),
  (UUID(), 'UPLOAD_MANUEL',       'Upload manuel',            'Documents téléversés manuellement par un utilisateur',  NULL,            TRUE),
  (UUID(), 'BORDEREAU',           'Bordereau',                'Bordereaux de transmission',                            'bordereau',     TRUE),
  (UUID(), 'ORIENTATION',         'Orientation',              'Documents liés à l\'orientation des apprenants',        'orientation',   TRUE),
  (UUID(), 'STAGE',               'Stage',                    'Conventions et rapports de stage',                      'stage',         TRUE);

-- ============================================================================
-- Done
-- ============================================================================
COMMIT;
