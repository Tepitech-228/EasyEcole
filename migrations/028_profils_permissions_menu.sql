-- Synchronise les nouvelles clés du menu. Les changements faits ensuite dans
-- l'écran Profils ne sont pas réappliqués au redémarrage.

CREATE TEMPORARY TABLE `tmp_menu_permissions` (
  `key` VARCHAR(255) NOT NULL PRIMARY KEY,
  `libelle` VARCHAR(255) NOT NULL,
  `module` VARCHAR(100) NOT NULL,
  `type` VARCHAR(20) NOT NULL,
  `parentKey` VARCHAR(255) NULL
) ENGINE=MEMORY;

INSERT INTO `tmp_menu_permissions` (`key`, `libelle`, `module`, `type`, `parentKey`) VALUES
  ('menu.evaluations.equivalences', 'Équivalences', 'Évaluations', 'menu', 'menu.evaluations'),
  ('menu.evaluations.dispenses', 'Dispenses', 'Évaluations', 'menu', 'menu.evaluations'),
  ('menu.evaluations.parametres-notation', 'Paramètres notation', 'Évaluations', 'menu', 'menu.evaluations'),
  ('menu.evaluations.deliberations-jury', 'Délibérations & Jury', 'Évaluations', 'menu', 'menu.evaluations'),
  ('menu.scolarite.sanctions-discipline', 'Sanctions & Discipline', 'Scolarité', 'menu', 'menu.scolarite'),
  ('menu.rh.parametres-paie', 'Paramètres paie', 'R.H', 'menu', 'menu.rh'),
  ('menu.rh.contrats', 'Contrats', 'R.H', 'menu', 'menu.rh'),
  ('menu.rh.planning-personnel', 'Planning personnel', 'R.H', 'menu', 'menu.rh'),
  ('menu.ged', 'Archivages numériques', 'Archivages numériques', 'menu', NULL),
  ('menu.ged.catalogue', 'Catalogue', 'Archivages numériques', 'menu', 'menu.ged'),
  ('menu.ged.recherche', 'Recherche avancée', 'Archivages numériques', 'menu', 'menu.ged'),
  ('menu.ged.dossiers', 'Dossiers', 'Archivages numériques', 'menu', 'menu.ged'),
  ('menu.ged.televerser', 'Téléverser', 'Archivages numériques', 'menu', 'menu.ged'),
  ('menu.ged.conservation', 'Conservation', 'Archivages numériques', 'menu', 'menu.ged'),
  ('menu.ged.bordereaux', 'Bordereaux de conservation', 'Archivages numériques', 'menu', 'menu.ged'),
  ('menu.finances.bordereaux-a-traiter', 'Bordereaux à imputer', 'Finances', 'menu', 'menu.finances'),
  ('menu.finances.types-bordereaux', 'Types de bordereau', 'Finances', 'menu', 'menu.finances'),
  ('menu.finances.comite-validation', 'Validation comité', 'Finances', 'menu', 'menu.finances'),
  ('menu.administration.comite-membres', 'Membres du comité', 'Administration', 'menu', 'menu.administration');

SET @permissionsTableExists := (SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_permissions');
SET @sql := IF(@permissionsTableExists = 1,
  'INSERT INTO `aut_permissions` (`key`, `libelle`, `module`, `type`, `parentKey`, `createdAt`, `updatedAt`) SELECT `key`, `libelle`, `module`, `type`, `parentKey`, NOW(), NOW() FROM `tmp_menu_permissions` ON DUPLICATE KEY UPDATE `libelle` = VALUES(`libelle`), `module` = VALUES(`module`), `type` = VALUES(`type`), `parentKey` = VALUES(`parentKey`), `deletedAt` = NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TEMPORARY TABLE `tmp_profils_permissions_menu` (
  `roleNom` VARCHAR(100) NOT NULL,
  `permissionKey` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`roleNom`, `permissionKey`)
) ENGINE=MEMORY;

INSERT INTO `tmp_profils_permissions_menu` (`roleNom`, `permissionKey`) VALUES
  ('Directeur', 'menu.administration.roles'),
  ('Directeur', 'menu.administration.utilisateurs'),
  ('Directeur', 'menu.administration.qr-codes'),
  ('Directeur', 'menu.administration.journal-audit'),
  ('Directeur', 'menu.administration.configuration'),
  ('Directeur', 'menu.evaluations.equivalences'),
  ('Directeur', 'menu.evaluations.dispenses'),
  ('Directeur', 'menu.evaluations.parametres-notation'),
  ('Directeur', 'menu.evaluations.deliberations-jury'),
  ('Directeur', 'menu.scolarite.sanctions-discipline'),
  ('Directeur', 'menu.rh.planning-personnel'),
  ('Directeur', 'menu.ged'),
  ('Directeur', 'menu.ged.catalogue'),
  ('Directeur', 'menu.ged.recherche'),
  ('Directeur', 'menu.ged.dossiers'),
  ('Directeur', 'menu.ged.televerser'),
  ('Directeur', 'menu.ged.conservation'),
  ('Directeur', 'menu.ged.bordereaux'),
  ('ESA Compta', 'menu.finances.bordereaux-a-traiter'),
  ('ESA Compta', 'menu.finances.types-bordereaux'),
  ('Comité', 'menu.finances.comite-validation');

SET @rbacTablesReady := IF((SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('aut_roles', 'aut_permissions', 'aut_role_permissions')) = 3, 1, 0);
SET @sql := IF(@rbacTablesReady = 1,
  'UPDATE `aut_role_permissions` rp JOIN `aut_roles` r ON r.`id` = rp.`roleId` JOIN `aut_permissions` p ON p.`id` = rp.`permissionId` JOIN `tmp_profils_permissions_menu` requested ON requested.`roleNom` = r.`nom` AND requested.`permissionKey` = p.`key` SET rp.`deletedAt` = NULL, rp.`updatedAt` = NOW() WHERE rp.`deletedAt` IS NOT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(@rbacTablesReady = 1,
  'INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`) SELECT r.`id`, p.`id`, NOW(), NOW() FROM `tmp_profils_permissions_menu` requested JOIN `aut_roles` r ON r.`nom` = requested.`roleNom` JOIN `aut_permissions` p ON p.`key` = requested.`permissionKey` LEFT JOIN `aut_role_permissions` existing ON existing.`roleId` = r.`id` AND existing.`permissionId` = p.`id` WHERE existing.`id` IS NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

DROP TEMPORARY TABLE `tmp_profils_permissions_menu`;
DROP TEMPORARY TABLE `tmp_menu_permissions`;
