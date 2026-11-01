-- Terminal Hikvision distant : l'adresse ISAPI peut etre un hostname de tunnel
-- inverse (Cloudflare, VPN + DNS interne), pas seulement une IP locale.
ALTER TABLE `ins_pointage_terminaux`
  MODIFY COLUMN `sourceIp` VARCHAR(255) NULL;
