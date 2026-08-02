-- ============================================================================
-- EasyEcole - GED Module - Migration v4
-- Description: Adds tag management tables (tags + document_tags junction)
-- Target: MySQL 5.7+ / 8.x, InnoDB, utf8mb4
-- Idempotent: YES (safe to run multiple times)
-- ============================================================================

START TRANSACTION;

-- ============================================================================
-- 1. Tags table
-- ============================================================================
CREATE TABLE IF NOT EXISTS `ged_tags` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(100) NOT NULL,
  `couleur` VARCHAR(7) DEFAULT '#3B82F6',
  `description` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_tag_nom` (`nom`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 2. Document ⇔ Tag junction table
-- ============================================================================
CREATE TABLE IF NOT EXISTS `ged_document_tags` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `documentId` INT UNSIGNED NOT NULL,
  `tagId` INT UNSIGNED NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_document_tag` (`documentId`, `tagId`),
  KEY `idx_document_tags_document` (`documentId`),
  KEY `idx_document_tags_tag` (`tagId`),
  CONSTRAINT `fk_document_tags_document` FOREIGN KEY (`documentId`) REFERENCES `ged_documents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_document_tags_tag` FOREIGN KEY (`tagId`) REFERENCES `ged_tags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 3. Seed default tags
-- ============================================================================
INSERT IGNORE INTO `ged_tags` (`nom`, `couleur`, `description`) VALUES
  ('important', '#EF4444', 'Document important'),
  ('archive', '#8B5CF6', 'Document archivé'),
  ('a_reviser', '#F59E0B', 'Document à réviser'),
  ('provisoire', '#10B981', 'Document provisoire'),
  ('definitif', '#3B82F6', 'Document finalisé'),
  ('confidentiel', '#DC2626', 'Document confidentiel');

COMMIT;
