-- =============================================================================
-- 057_inscription_mode_formation.sql
-- -----------------------------------------------------------------------------
-- Lot E0 — Parcours « cours en ligne » : le mode de formation devient une
-- propriete de la DEMANDE d'inscription (et non plus seulement de l'apprenant).
--
-- Pourquoi une colonne dediee ?
--   `aut_apprenants.periode` est un reglage global du profil (matin / soir /
--   en_ligne). Il ne permet pas de savoir qu'une demande donnee a ete deposee
--   en mode presentiel ou en ligne, ni de figer le choix au moment du dossier.
--   La demande d'inscription est le support de la validation collegiale : c'est
--   donc elle qui doit porter `modeFormation`.
--
-- Regles :
--   - NULL impossible : `presentiel` est le defaut des dossiers historiques.
--   - `en_ligne` declenche le parcours e-learning (selection d'UE apres
--     recouvrement) ; `presentiel` conserve le parcours classique.
--   - Au moment de la finalisation par le comite, `en_ligne` est repercute sur
--     `aut_apprenants.periode` afin que la contrainte existante (periode
--     obligatoire pour generer le matricule) reste satisfaite.
--
-- Garanties :
--   - NON DESTRUCTIVE : aucune donnee supprimee.
--   - IDEMPOTENTE    : verification information_schema avant ALTER.
--   - BACKFILL       : les demandes actives dont l'apprenant est deja marque
--                      `periode = 'en_ligne'` sont basculees en `en_ligne`.
--                      (Aucune donnee locale concernee au 2026-11-01.)
--
-- ROLLBACK MANUEL (a executer uniquement en cas de retour arriere) :
--   ALTER TABLE `ins_demandes_inscription`
--     DROP INDEX `idx_ins_demandes_mode_formation`,
--     DROP COLUMN `modeFormation`;
-- =============================================================================

SET @colExists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ins_demandes_inscription'
    AND COLUMN_NAME = 'modeFormation'
);
SET @sql := IF(@colExists = 0,
  'ALTER TABLE `ins_demandes_inscription` ADD COLUMN `modeFormation` ENUM(''presentiel'', ''en_ligne'') NOT NULL DEFAULT ''presentiel'' AFTER `typeDemande`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idxExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ins_demandes_inscription'
    AND INDEX_NAME = 'idx_ins_demandes_mode_formation'
);
SET @sql := IF(@idxExists = 0,
  'ALTER TABLE `ins_demandes_inscription` ADD KEY `idx_ins_demandes_mode_formation` (`modeFormation`)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill : une demande non supprimee dont l'apprenant est deja en ligne
-- herite du mode `en_ligne`. `EXISTS` evite toute duplication si plusieurs
-- lignes `aut_apprenants` partagent le meme `utilisateurId`.
UPDATE `ins_demandes_inscription` d
SET d.`modeFormation` = 'en_ligne'
WHERE d.`deletedAt` IS NULL
  AND d.`modeFormation` = 'presentiel'
  AND EXISTS (
    SELECT 1 FROM `aut_apprenants` a
    WHERE a.`utilisateurId` = d.`utilisateurId`
      AND a.`deletedAt` IS NULL
      AND a.`periode` = 'en_ligne'
  );
