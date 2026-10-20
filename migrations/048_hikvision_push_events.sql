ALTER TABLE `ins_pointage_terminal_events`
  MODIFY COLUMN `statut` ENUM('enregistre', 'refuse', 'en_attente') NOT NULL;
