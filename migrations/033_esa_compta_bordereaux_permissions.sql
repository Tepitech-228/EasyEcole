-- Backfill the Service Recouvrement role permissions for databases where the
-- role already existed before these menu entries and actions were introduced.
INSERT INTO `aut_permissions`
  (`key`, `libelle`, `module`, `type`, `parentKey`, `createdAt`, `updatedAt`)
SELECT 'menu.finances.bordereaux-a-traiter', 'Bordereaux à imputer', 'Finances', 'menu', 'menu.finances', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `aut_permissions` WHERE `key` = 'menu.finances.bordereaux-a-traiter'
);

INSERT INTO `aut_permissions`
  (`key`, `libelle`, `module`, `type`, `parentKey`, `createdAt`, `updatedAt`)
SELECT 'menu.finances.types-bordereaux', 'Types de bordereau', 'Finances', 'menu', 'menu.finances', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `aut_permissions` WHERE `key` = 'menu.finances.types-bordereaux'
);

INSERT INTO `aut_permissions`
  (`key`, `libelle`, `module`, `type`, `parentKey`, `createdAt`, `updatedAt`)
SELECT 'action.finance.bordereau.voir', 'Consulter les bordereaux financiers', 'Finance', 'action', NULL, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `aut_permissions` WHERE `key` = 'action.finance.bordereau.voir'
);

INSERT INTO `aut_permissions`
  (`key`, `libelle`, `module`, `type`, `parentKey`, `createdAt`, `updatedAt`)
SELECT 'action.finance.bordereau.saisir', 'Saisir un bordereau financier', 'Finance', 'action', NULL, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `aut_permissions` WHERE `key` = 'action.finance.bordereau.saisir'
);

INSERT INTO `aut_permissions`
  (`key`, `libelle`, `module`, `type`, `parentKey`, `createdAt`, `updatedAt`)
SELECT 'action.finance.bordereau.imputer', 'Prévisualiser et imputer un bordereau', 'Finance', 'action', NULL, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `aut_permissions` WHERE `key` = 'action.finance.bordereau.imputer'
);

UPDATE `aut_permissions`
SET `deletedAt` = NULL
WHERE `key` IN (
  'menu.finances.bordereaux-a-traiter',
  'menu.finances.types-bordereaux',
  'action.finance.bordereau.voir',
  'action.finance.bordereau.saisir',
  'action.finance.bordereau.imputer'
);

UPDATE `aut_role_permissions` rp
JOIN `aut_roles` r ON r.`id` = rp.`roleId`
JOIN `aut_permissions` p ON p.`id` = rp.`permissionId`
SET rp.`deletedAt` = NULL
WHERE r.`nom` = 'ESA Compta'
  AND p.`key` IN (
    'menu.finances.bordereaux-a-traiter',
    'menu.finances.types-bordereaux',
    'action.finance.bordereau.voir',
    'action.finance.bordereau.saisir',
    'action.finance.bordereau.imputer'
  );

INSERT INTO `aut_role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.`id`, p.`id`, NOW(), NOW()
FROM `aut_roles` r
JOIN `aut_permissions` p
  ON p.`key` IN (
    'menu.finances.bordereaux-a-traiter',
    'menu.finances.types-bordereaux',
    'action.finance.bordereau.voir',
    'action.finance.bordereau.saisir',
    'action.finance.bordereau.imputer'
  )
WHERE r.`nom` = 'ESA Compta'
  AND NOT EXISTS (
    SELECT 1 FROM `aut_role_permissions` rp
    WHERE rp.`roleId` = r.`id` AND rp.`permissionId` = p.`id`
  );
