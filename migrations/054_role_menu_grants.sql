-- Table des ajouts additifs de pôles/menus accordés à un profil d'accès.
-- Un grant ne modifie jamais aut_role_permissions : le retrait d'un pôle
-- supprime uniquement la ligne de grant correspondante, pas les droits acquis
-- par ailleurs. Les clés stockées sont les permissionKey des entrées de menu.

CREATE TABLE IF NOT EXISTS `aut_role_menu_grants` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `roleId` INT(10) UNSIGNED NOT NULL,
  `permissionKey` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME DEFAULT NULL,
  `updatedAt` DATETIME DEFAULT NULL,
  `deletedAt` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_role_menu_grant` (`roleId`, `permissionKey`),
  KEY `idx_role_menu_grant_role` (`roleId`),
  CONSTRAINT `fk_role_menu_grant_role` FOREIGN KEY (`roleId`)
    REFERENCES `aut_roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- Nouvelle entrée de menu « Pôles & menus » dans le catalogue de permissions.
INSERT INTO `aut_permissions` (`key`, `libelle`, `module`, `type`, `parentKey`, `createdAt`, `updatedAt`)
VALUES ('menu.administration.poles-menus', 'Pôles & menus', 'Administration', 'menu', 'menu.administration', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `libelle` = VALUES(`libelle`),
  `module` = VALUES(`module`),
  `type` = VALUES(`type`),
  `parentKey` = VALUES(`parentKey`),
  `deletedAt` = NULL;

-- Le profil Directeur (INSTITUTION) doit voir l'écran sans passer par un grant.
UPDATE `aut_role_permissions` rp
JOIN `aut_roles` r ON r.`id` = rp.`roleId`
JOIN `aut_permissions` p ON p.`id` = rp.`permissionId`
SET rp.`deletedAt` = NULL, rp.`updatedAt` = NOW()
WHERE r.`nom` = 'Directeur'
  AND p.`key` = 'menu.administration.poles-menus'
  AND rp.`deletedAt` IS NOT NULL;

INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.`id`, p.`id`, NOW(), NOW()
FROM `aut_roles` r
JOIN `aut_permissions` p ON p.`key` = 'menu.administration.poles-menus'
LEFT JOIN `aut_role_permissions` existing ON existing.`roleId` = r.`id` AND existing.`permissionId` = p.`id`
WHERE r.`nom` = 'Directeur'
  AND existing.`id` IS NULL;
