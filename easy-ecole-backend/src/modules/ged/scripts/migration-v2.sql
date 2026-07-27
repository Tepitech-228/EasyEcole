-- ============================================================================
-- EasyEcole - GED Module - Migration v2
-- Description: Adds archival management, confidentiality, document types,
--              domain classification, audittrail, disposal workflow,
--              role-based permissions, and reference numbering.
-- Target: MySQL 5.7+ / 8.x, InnoDB, utf8mb4
-- Idempotent: YES (safe to run multiple times)
-- ============================================================================

START TRANSACTION;

-- ============================================================================
-- 1. ged_domains
-- ============================================================================
CREATE TABLE IF NOT EXISTS `ged_domains` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(10) UNIQUE NOT NULL,
  `label` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `ged_domains` (`id`, `code`, `label`) VALUES
  (1, 'SCOL',  'Scolarité'),
  (2, 'RH',    'Ressources Humaines'),
  (3, 'FIN',   'Finances'),
  (4, 'REC',   'Recherche'),
  (5, 'GOUV',  'Gouvernance'),
  (6, 'PAT',   'Patrimoine'),
  (7, 'EXT',   'Documents externes');

-- ============================================================================
-- 2. ged_document_types
-- ============================================================================
CREATE TABLE IF NOT EXISTS `ged_document_types` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `domain_id` INT NOT NULL,
  `code` VARCHAR(50) UNIQUE NOT NULL,
  `short_code` VARCHAR(10) NOT NULL,
  `label` VARCHAR(150) NOT NULL,
  `default_confidentiality` ENUM('public','interne','restreint','confidentiel') NOT NULL DEFAULT 'interne',
  `dua_duration_years` INT NULL,
  `is_permanent` BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (`domain_id`) REFERENCES `ged_domains`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `ged_document_types` (`id`, `domain_id`, `code`, `short_code`, `label`, `default_confidentiality`, `dua_duration_years`, `is_permanent`) VALUES
  -- SCOL (domain_id = 1)
  (1,  1, 'releve_notes',         'REL',  'Relevé de notes',             'interne',       5,  FALSE),
  (2,  1, 'diplome',              'DIPL', 'Diplôme',                     'confidentiel',   NULL, TRUE),
  (3,  1, 'pv_jury',              'PV',   'Procès-verbal de jury',       'restreint',      NULL, TRUE),
  (4,  1, 'fiche_inscription',    'FINS', 'Fiche d\'inscription',        'confidentiel',   10,  FALSE),
  (5,  1, 'certificat_scolarite',  'CERT', 'Certificat de scolarité',    'public',         5,   FALSE),
  (6,  1, 'attestation_reussite', 'AR',   'Attestation de réussite',     'public',         NULL, TRUE),
  (7,  1, 'convention_stage',     'CONV', 'Convention de stage',         'interne',        10,  FALSE),
  (8,  1, 'contrat_formation',    'CFORM','Contrat de formation',        'confidentiel',   10,  FALSE),
  (28, 1, 'bulletin',             'BULL', 'Bulletin de notes',           'restreint',      10,  FALSE),
  (29, 1, 'dossier_inscription',  'DOSS', "Dossier d'inscription",      'confidentiel',   10,  FALSE),
  -- RH (domain_id = 2)
  (9,  2, 'contrat_travail',      'CTR',  'Contrat de travail',          'confidentiel',   50,  FALSE),
  (10, 2, 'bulletin_paie',        'BULL', 'Bulletin de paie',            'confidentiel',   5,   FALSE),
  (11, 2, 'cv',                   'CV',   'Curriculum vitae',            'interne',        2,   FALSE),
  (12, 2, 'attestation_travail',  'ATT',  'Attestation de travail',      'interne',        5,   FALSE),
  -- FIN (domain_id = 3)
  (13, 3, 'facture',              'FACT', 'Facture',                     'interne',        10,  FALSE),
  (14, 3, 'quitus',               'QUIT', 'Quitus',                      'interne',        10,  FALSE),
  (15, 3, 'bordereau',            'BORD', 'Bordereau',                   'interne',        10,  FALSE),
  -- REC (domain_id = 4)
  (16, 4, 'publication',          'PUB',  'Publication',                 'public',         NULL, TRUE),
  (17, 4, 'these',                'THESE','Thèse',                       'public',         NULL, TRUE),
  (18, 4, 'rapport_recherche',    'RAPR', 'Rapport de recherche',        'interne',        10,  FALSE),
  -- GOUV (domain_id = 5)
  (19, 5, 'deliberation',         'DELIB','Délibération',                'restreint',      NULL, TRUE),
  (20, 5, 'proces_verbal',        'PVRB', 'Procès-verbal',               'restreint',      NULL, TRUE),
  (21, 5, 'reglement_interieur',  'REGL', 'Règlement intérieur',         'public',         NULL, TRUE),
  -- PAT (domain_id = 6)
  (22, 6, 'inventaire',           'INVT', 'Inventaire',                  'interne',        10,  FALSE),
  (23, 6, 'bon_commande',         'BC',   'Bon de commande',             'interne',        5,   FALSE),
  (24, 6, 'contrat_fournisseur',  'CF',   'Contrat fournisseur',         'confidentiel',   10,  FALSE),
  -- EXT (domain_id = 7)
  (25, 7, 'convention_externe',   'CONVX','Convention externe',          'interne',        10,  FALSE),
  (26, 7, 'document_entrant',     'DENT', 'Document entrant',            'interne',        5,   FALSE),
  (27, 7, 'courrier',             'COUR', 'Courrier',                    'interne',        5,   FALSE);

-- ============================================================================
-- 3. ged_reference_counters
-- ============================================================================
CREATE TABLE IF NOT EXISTS `ged_reference_counters` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `domain_code` VARCHAR(10) NOT NULL,
  `year` INT NOT NULL,
  `last_sequence` INT NOT NULL DEFAULT 0,
  UNIQUE KEY `unique_domain_year` (`domain_code`, `year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 4. ged_audit_logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS `ged_audit_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `document_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `action_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `details` TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 5. ged_disposal_records
-- ============================================================================
CREATE TABLE IF NOT EXISTS `ged_disposal_records` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `document_id` INT UNSIGNED NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `requested_by` INT UNSIGNED NOT NULL,
  `requested_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('en_attente','validee','rejetee') NOT NULL DEFAULT 'en_attente',
  `confirmed_by` INT UNSIGNED NULL,
  `confirmed_at` DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 6. ged_document_access_grants
-- ============================================================================
CREATE TABLE IF NOT EXISTS `ged_document_access_grants` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `document_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `granted_by` INT UNSIGNED NOT NULL,
  `granted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 7. ged_role_permissions
-- ============================================================================
CREATE TABLE IF NOT EXISTS `ged_role_permissions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `confidentiality_level` ENUM('public','interne','restreint','confidentiel') NOT NULL,
  `role` VARCHAR(50) NOT NULL,
  UNIQUE KEY `unique_level_role` (`confidentiality_level`, `role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `ged_role_permissions` (`confidentiality_level`, `role`) VALUES
  -- PUBLIC: accessible by most roles
  ('public', 'apprenant'),
  ('public', 'enseignant'),
  ('public', 'ressources_humaines'),
  ('public', 'caissier_banque'),
  ('public', 'cabinet_comptable'),
  ('public', 'comite_orientation'),
  -- INTERNE: institution, admin + same as public
  ('interne', 'institution'),
  ('interne', 'admin'),
  ('interne', 'enseignant'),
  ('interne', 'ressources_humaines'),
  ('interne', 'caissier_banque'),
  ('interne', 'cabinet_comptable'),
  ('interne', 'comite_orientation'),
  -- RESTREINT: limited to management
  ('restreint', 'institution'),
  ('restreint', 'admin'),
  -- CONFIDENTIEL: admin only
  ('confidentiel', 'admin');

-- ============================================================================
-- 8. ALTER TABLE ged_documents — add new columns
-- ============================================================================

-- Add domain_id
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'domain_id');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `domain_id` INT NULL AFTER `categorie`',
  'SELECT \"domain_id already exists\"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add document_type_id
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'document_type_id');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `document_type_id` INT NULL AFTER `domain_id`',
  'SELECT \"document_type_id already exists\"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add classification_path
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'classification_path');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `classification_path` VARCHAR(255) NULL AFTER `document_type_id`',
  'SELECT \"classification_path already exists\"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add source_type
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'source_type');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `source_type` ENUM(''genere_application'',''numerise_interne'',''recu_externe'') NOT NULL DEFAULT ''numerise_interne'' AFTER `classification_path`',
  'SELECT \"source_type already exists\"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add external_issuer
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'external_issuer');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `external_issuer` VARCHAR(150) NULL AFTER `source_type`',
  'SELECT \"external_issuer already exists\"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add reception_date
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'reception_date');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `reception_date` DATE NOT NULL DEFAULT (CURRENT_DATE) AFTER `external_issuer`',
  'SELECT \"reception_date already exists\"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add confidentiality_level
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'confidentiality_level');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `confidentiality_level` ENUM(''public'',''interne'',''restreint'',''confidentiel'') NOT NULL DEFAULT ''interne'' AFTER `reception_date`',
  'SELECT \"confidentiality_level already exists\"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add lifecycle_status
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'lifecycle_status');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `lifecycle_status` ENUM(''courant'',''intermediaire'',''definitif'',''a_detruire'') NOT NULL DEFAULT ''courant'' AFTER `confidentiality_level`',
  'SELECT \"lifecycle_status already exists\"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add dua_end_date
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'dua_end_date');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `dua_end_date` DATE NULL AFTER `lifecycle_status`',
  'SELECT \"dua_end_date already exists\"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add integrity_hash
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'integrity_hash');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `integrity_hash` VARCHAR(64) NULL AFTER `dua_end_date`',
  'SELECT \"integrity_hash already exists\"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add version_major
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'version_major');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `version_major` INT NOT NULL DEFAULT 1 AFTER `integrity_hash`',
  'SELECT \"version_major already exists\"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add version_minor
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'version_minor');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `version_minor` INT NOT NULL DEFAULT 0 AFTER `version_major`',
  'SELECT \"version_minor already exists\"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add version_comment
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'version_comment');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `version_comment` VARCHAR(255) NULL AFTER `version_minor`',
  'SELECT \"version_comment already exists\"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add parent_document_id
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'parent_document_id');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `parent_document_id` INT UNSIGNED NULL AFTER `version_comment`',
  'SELECT \"parent_document_id already exists\"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add is_current_version
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'is_current_version');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `is_current_version` BOOLEAN NOT NULL DEFAULT TRUE AFTER `parent_document_id`',
  'SELECT \"is_current_version already exists\"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add is_locked
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'is_locked');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `is_locked` BOOLEAN NOT NULL DEFAULT FALSE AFTER `is_current_version`',
  'SELECT \"is_locked already exists\"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add locked_by
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'locked_by');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `locked_by` INT UNSIGNED NULL AFTER `is_locked`',
  'SELECT \"locked_by already exists\"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add locked_at
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'locked_at');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `locked_at` DATETIME NULL AFTER `locked_by`',
  'SELECT \"locked_at already exists\"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add annee_academique_id
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'annee_academique_id');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `annee_academique_id` INT UNSIGNED NULL AFTER `locked_at`',
  'SELECT \"annee_academique_id already exists\"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add parcours_id
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'parcours_id');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `parcours_id` INT UNSIGNED NULL AFTER `annee_academique_id`',
  'SELECT \"parcours_id already exists\"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add niveau_etude_id
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'niveau_etude_id');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `niveau_etude_id` INT UNSIGNED NULL AFTER `parcours_id`',
  'SELECT \"niveau_etude_id already exists\"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- semestre
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'semestre');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `semestre` ENUM(''semestre1'',''semestre2'',''semestre3'',''semestre4'',''semestre5'',''semestre6'') NULL AFTER `niveau_etude_id`',
  'SELECT "semestre already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- classe_id
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'classe_id');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `classe_id` INT UNSIGNED NULL AFTER `semestre`',
  'SELECT "classe_id already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- salle_id
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'salle_id');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `salle_id` INT UNSIGNED NULL AFTER `classe_id`',
  'SELECT "salle_id already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- cursus_apprenant_id
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'cursus_apprenant_id');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `cursus_apprenant_id` INT UNSIGNED NULL AFTER `salle_id`',
  'SELECT "cursus_apprenant_id already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- inscription_dossier_id
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'inscription_dossier_id');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `inscription_dossier_id` INT UNSIGNED NULL AFTER `cursus_apprenant_id`',
  'SELECT "inscription_dossier_id already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- bulletin_id
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'bulletin_id');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `bulletin_id` INT UNSIGNED NULL AFTER `inscription_dossier_id`',
  'SELECT "bulletin_id already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- bordereau_id
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND COLUMN_NAME = 'bordereau_id');
SET @query := IF(@exist = 0,
  'ALTER TABLE `ged_documents` ADD COLUMN `bordereau_id` INT UNSIGNED NULL AFTER `bulletin_id`',
  'SELECT "bordereau_id already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- 8b. Foreign keys on ged_documents (add only if they do not exist)
-- ============================================================================

-- FK domain_id -> ged_domains(id)
SET @fk_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents'
  AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'fk_documents_domain');
SET @fk_query := IF(@fk_exists = 0,
  'ALTER TABLE `ged_documents` ADD CONSTRAINT `fk_documents_domain` FOREIGN KEY (`domain_id`) REFERENCES `ged_domains`(`id`)',
  'SELECT \"fk_documents_domain already exists\"');
PREPARE stmt FROM @fk_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- FK document_type_id -> ged_document_types(id)
SET @fk_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents'
  AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'fk_documents_document_type');
SET @fk_query := IF(@fk_exists = 0,
  'ALTER TABLE `ged_documents` ADD CONSTRAINT `fk_documents_document_type` FOREIGN KEY (`document_type_id`) REFERENCES `ged_document_types`(`id`)',
  'SELECT \"fk_documents_document_type already exists\"');
PREPARE stmt FROM @fk_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- FK parent_document_id -> ged_documents(id)
SET @fk_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents'
  AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'fk_documents_parent');
SET @fk_query := IF(@fk_exists = 0,
  'ALTER TABLE `ged_documents` ADD CONSTRAINT `fk_documents_parent` FOREIGN KEY (`parent_document_id`) REFERENCES `ged_documents`(`id`)',
  'SELECT \"fk_documents_parent already exists\"');
PREPARE stmt FROM @fk_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- 9. Migration of existing data (default values for new columns)
-- ============================================================================
UPDATE `ged_documents` SET
  `domain_id` = 1,
  `document_type_id` = 1,
  `confidentiality_level` = 'interne',
  `lifecycle_status` = CASE
    WHEN `statut` = 'archive' THEN 'definitif'
    ELSE 'courant'
  END,
  `version_major` = 1,
  `version_minor` = 0,
  `is_current_version` = TRUE,
  `is_locked` = FALSE
WHERE `domain_id` IS NULL;

-- ============================================================================
-- 10. Generate references for documents without one
--     Pattern: {DOMAIN_CODE}-{SHORT_CODE}-{YEAR}-{SEQUENCE:05d}
--     Note: Run via Node.js script for production backfill.
--     This section is intentionally empty for idempotent CLI execution.
--     Use the ReferenceService or a custom script to backfill.
-- ============================================================================

-- ============================================================================
-- 11. FULLTEXT index on ged_documents for search
-- ============================================================================
SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_documents' AND INDEX_NAME = 'ft_search');
SET @idx_query := IF(@idx_exists = 0,
  'ALTER TABLE `ged_documents` ADD FULLTEXT INDEX `ft_search` (`titre`, `reference`, `contenuTexte`, `tags`, `auteur`)',
  'SELECT \"ft_search already exists\"');
PREPARE stmt FROM @idx_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- 12. Add foreign keys on new tables (after all tables exist)
-- ============================================================================
SET FOREIGN_KEY_CHECKS = 0;

-- ged_audit_logs -> ged_documents
SET @fk_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_audit_logs'
  AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'fk_audit_document');
SET @fk_query := IF(@fk_exists = 0,
  'ALTER TABLE `ged_audit_logs` ADD CONSTRAINT `fk_audit_document` FOREIGN KEY (`document_id`) REFERENCES `ged_documents`(`id`)',
  'SELECT 1');
PREPARE stmt FROM @fk_query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ged_disposal_records -> ged_documents
SET @fk_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_disposal_records'
  AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'fk_disposal_document');
SET @fk_query := IF(@fk_exists = 0,
  'ALTER TABLE `ged_disposal_records` ADD CONSTRAINT `fk_disposal_document` FOREIGN KEY (`document_id`) REFERENCES `ged_documents`(`id`)',
  'SELECT 1');
PREPARE stmt FROM @fk_query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ged_document_access_grants -> ged_documents
SET @fk_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_document_access_grants'
  AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'fk_access_document');
SET @fk_query := IF(@fk_exists = 0,
  'ALTER TABLE `ged_document_access_grants` ADD CONSTRAINT `fk_access_document` FOREIGN KEY (`document_id`) REFERENCES `ged_documents`(`id`)',
  'SELECT 1');
PREPARE stmt FROM @fk_query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- Done
-- ============================================================================
COMMIT;
