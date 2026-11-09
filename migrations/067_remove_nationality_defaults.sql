ALTER TABLE `aut_apprenants`
  MODIFY COLUMN `nationalite` VARCHAR(255) NULL DEFAULT NULL;

ALTER TABLE `aut_enseignants`
  MODIFY COLUMN `nationalite` VARCHAR(255) NULL DEFAULT NULL;

ALTER TABLE `aut_personnel_administratif`
  MODIFY COLUMN `nationalite` VARCHAR(255) NULL DEFAULT NULL;
