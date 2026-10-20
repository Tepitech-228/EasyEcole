-- Keep ZKTeco ADMS terminals backward-compatible while adding Hikvision ISAPI settings.
ALTER TABLE `ins_pointage_terminaux`
  ADD COLUMN `protocol` ENUM('zkteco_adms', 'hikvision_isapi') NOT NULL DEFAULT 'zkteco_adms',
  ADD COLUMN `hikvisionPort` SMALLINT UNSIGNED NULL,
  ADD COLUMN `hikvisionHttps` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `hikvisionUsername` VARCHAR(120) NULL,
  ADD COLUMN `hikvisionPasswordEncrypted` TEXT NULL;
