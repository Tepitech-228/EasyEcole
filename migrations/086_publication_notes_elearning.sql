-- 086_publication_notes_elearning.sql
-- Les notes saisies restent privées jusqu'à leur publication par l'administration.

ALTER TABLE `elearning_soumissions_devoirs`
  ADD COLUMN `notePubliee` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `notePublieeLe` DATETIME NULL,
  ADD COLUMN `notePublieePar` INT UNSIGNED NULL;

ALTER TABLE `elearning_notes_examens`
  ADD COLUMN `notePubliee` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `notePublieeLe` DATETIME NULL,
  ADD COLUMN `notePublieePar` INT UNSIGNED NULL;
