ALTER TABLE `ins_pointage_terminaux`
  ADD COLUMN `population` ENUM('personnel', 'etudiant') NOT NULL DEFAULT 'personnel';
