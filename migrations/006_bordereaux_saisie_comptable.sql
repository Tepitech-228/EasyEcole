-- =============================================================================
-- EasyEcole — Migration SQL 006 : saisie comptable des bordereaux (ESA-COMPTA)
-- =============================================================================
-- Contexte : nouveau rôle esa_compta chargé de la saisie comptable des
-- bordereaux uploadés par les étudiants (montant, référence bancaire,
-- numéro officiel du bordereau, moyen de paiement, type d'opération) et de
-- l'imputation FIFO sur les échéances.
--
-- Contenu :
--   1. Colonnes bordereau : numeroBordereau, moyenPaiement
--      (datePaiement + typeOperationId sont déjà couverts par le sync dev ;
--       recréés ici par sécurité pour les bases recette/prod neuves)
--   2. Table ins_types_operations_bordereau + seed des 9 types officiels
--   3. Étension ENUM statut bordereau (en_saisie_comptable, traite)
--   4. Étension ENUM role utilisateurs (esa_compta)
--
-- Idempotent : chaque instruction vérifie l'existence avant application.
-- Base cible : définie dans easy-ecole-backend/.env (DB_NAME, DB_PORT).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Colonnes bordereau
-- -----------------------------------------------------------------------------
SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_bordereaux' AND COLUMN_NAME = 'numeroBordereau'
);
SET @sql := IF(@colExists = 0,
  'ALTER TABLE `ins_bordereaux` ADD COLUMN `numeroBordereau` VARCHAR(100) NULL AFTER `typeOperationId`',
  'SELECT ''colonne numeroBordereau deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_bordereaux' AND COLUMN_NAME = 'moyenPaiement'
);
SET @sql := IF(@colExists = 0,
  'ALTER TABLE `ins_bordereaux` ADD COLUMN `moyenPaiement` ENUM(''virement'',''especes'',''mobile_money'',''cheque'') NULL AFTER `numeroBordereau`',
  'SELECT ''colonne moyenPaiement deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_bordereaux' AND COLUMN_NAME = 'datePaiement'
);
SET @sql := IF(@colExists = 0,
  'ALTER TABLE `ins_bordereaux` ADD COLUMN `datePaiement` DATE NULL AFTER `dateValidation`',
  'SELECT ''colonne datePaiement deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_bordereaux' AND COLUMN_NAME = 'typeOperationId'
);
SET @sql := IF(@colExists = 0,
  'ALTER TABLE `ins_bordereaux` ADD COLUMN `typeOperationId` INT UNSIGNED NULL AFTER `quitusId`',
  'SELECT ''colonne typeOperationId deja presente''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 2) Table types opérations + seed
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ins_types_operations_bordereau` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL,
  `libelle` VARCHAR(100) NOT NULL,
  `actif` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `deletedAt` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_type_operation_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `ins_types_operations_bordereau` (`code`, `libelle`, `actif`, `createdAt`, `updatedAt`)
SELECT t.code, t.libelle, 1, NOW(), NOW()
FROM (
  SELECT 'INSCRIPTION' AS code, 'Frais d''inscription' AS libelle UNION ALL
  SELECT 'SCOLARITE', 'Frais de scolarite' UNION ALL
  SELECT 'SOUTENANCE', 'Soutenance' UNION ALL
  SELECT 'DOCUMENT', 'Demande de document' UNION ALL
  SELECT 'CERTIFICAT', 'Certificat' UNION ALL
  SELECT 'ATTESTATION', 'Attestation' UNION ALL
  SELECT 'DIPLOME', 'Diplome' UNION ALL
  SELECT 'REINSCRIPTION', 'Reinscription' UNION ALL
  SELECT 'AUTRE', 'Autre'
) t
WHERE NOT EXISTS (
  SELECT 1 FROM `ins_types_operations_bordereau` existing
  WHERE existing.`code` = t.code AND existing.`deletedAt` IS NULL
);

-- -----------------------------------------------------------------------------
-- 3) ENUM statut bordereau étendu
-- -----------------------------------------------------------------------------
SET @enumStatut := (
  SELECT COLUMN_TYPE FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_bordereaux' AND COLUMN_NAME = 'statut'
);
SET @sql := IF(@enumStatut NOT LIKE '%en_saisie_comptable%',
  'ALTER TABLE `ins_bordereaux` MODIFY `statut` ENUM(''en_attente'',''valide'',''rejete'',''en_saisie_comptable'',''traite'') NOT NULL DEFAULT ''en_attente''',
  'SELECT ''enum statut deja etendu''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 4) ENUM role utilisateurs avec esa_compta
-- -----------------------------------------------------------------------------
SET @enumRole := (
  SELECT COLUMN_TYPE FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_utilisateurs' AND COLUMN_NAME = 'role'
);
SET @sql := IF(@enumRole NOT LIKE '%esa_compta%',
  'ALTER TABLE `aut_utilisateurs` MODIFY `role` ENUM(''apprenant'',''institution'',''caissier_banque'',''enseignant'',''personnel_administratif'',''ressources_humaines'',''cabinet_comptable'',''esa_compta'',''comite_orientation'',''admin'',''parent'') NOT NULL',
  'SELECT ''enum role deja etendu''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
