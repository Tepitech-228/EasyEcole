ALTER TABLE `ged_folders` ADD COLUMN `folder_type` VARCHAR(30) NULL AFTER `is_auto_generated`,
ADD COLUMN `annee_academique_id` INT UNSIGNED NULL AFTER `folder_type`;
