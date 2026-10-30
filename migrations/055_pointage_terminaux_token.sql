-- Pointage distant sans VPN : authentification par jeton de terminal.
-- L'IP source n'est plus fiable derrière le tunnel Cloudflare (cloudflared)
-- ni pour une pointeuse en IP dynamique : le jeton devient le secret partagé.
ALTER TABLE `ins_pointage_terminaux`
  MODIFY COLUMN `sourceIp` VARCHAR(45) NULL,
  ADD COLUMN `deviceTokenHash` CHAR(64) NULL AFTER `sourceIp`;

CREATE INDEX `idx_pointage_terminal_token` ON `ins_pointage_terminaux` (`deviceTokenHash`);
