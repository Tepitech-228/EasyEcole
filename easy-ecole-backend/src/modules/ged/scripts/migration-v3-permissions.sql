-- ============================================================================
-- EasyEcole - GED Module - Migration v3
-- Description: Adds granular action permissions to ged_role_permissions,
--              updates existing rows with sensible defaults.
-- Target: MySQL 5.7+ / 8.x, InnoDB, utf8mb4
-- Idempotent: YES (safe to run multiple times)
-- ============================================================================

START TRANSACTION;

-- ============================================================================
-- 1. Add action columns to ged_role_permissions
-- ============================================================================
SET @exist_can_view := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_role_permissions' AND COLUMN_NAME = 'can_view');
SET @query := IF(@exist_can_view = 0,
  'ALTER TABLE `ged_role_permissions`
   ADD COLUMN `can_view`   BOOLEAN NOT NULL DEFAULT TRUE,
   ADD COLUMN `can_upload` BOOLEAN NOT NULL DEFAULT FALSE,
   ADD COLUMN `can_delete` BOOLEAN NOT NULL DEFAULT FALSE,
   ADD COLUMN `can_manage` BOOLEAN NOT NULL DEFAULT FALSE',
  'SELECT "Permission columns already exist"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- 2. Set sensible defaults based on role and confidentiality level
-- ============================================================================

-- ADMIN: full access on all levels
UPDATE `ged_role_permissions`
SET can_view = TRUE, can_upload = TRUE, can_delete = TRUE, can_manage = TRUE
WHERE role = 'admin';

-- INSTITUTION: full access on public/interne/restreint, view-only on confidentiel
UPDATE `ged_role_permissions`
SET can_view = TRUE, can_upload = TRUE, can_delete = TRUE, can_manage = TRUE
WHERE role = 'institution' AND confidentiality_level IN ('public', 'interne', 'restreint');

UPDATE `ged_role_permissions`
SET can_view = TRUE, can_upload = FALSE, can_delete = FALSE, can_manage = FALSE
WHERE role = 'institution' AND confidentiality_level = 'confidentiel';

-- ENSEIGNANT: view + upload on public/interne, view-only on restreint
UPDATE `ged_role_permissions`
SET can_view = TRUE, can_upload = TRUE, can_delete = FALSE, can_manage = FALSE
WHERE role = 'enseignant' AND confidentiality_level IN ('public', 'interne');

UPDATE `ged_role_permissions`
SET can_view = TRUE, can_upload = FALSE, can_delete = FALSE, can_manage = FALSE
WHERE role = 'enseignant' AND confidentiality_level = 'restreint';

-- APPRENANT: view + upload on public only
UPDATE `ged_role_permissions`
SET can_view = TRUE, can_upload = TRUE, can_delete = FALSE, can_manage = FALSE
WHERE role = 'apprenant' AND confidentiality_level = 'public';

-- RESSOURCES_HUMAINES, CAISSIER_BANQUE, CABINET_COMPTABLE, COMITE_ORIENTATION:
-- view + upload on public/interne
UPDATE `ged_role_permissions`
SET can_view = TRUE, can_upload = TRUE, can_delete = FALSE, can_manage = FALSE
WHERE role IN ('ressources_humaines', 'caissier_banque', 'cabinet_comptable', 'comite_orientation')
  AND confidentiality_level IN ('public', 'interne');

COMMIT;
