-- =============================================================================
-- 034 — Incident GED : reparation et reaffectation des auteurs d'archivage
--
-- CONTEXTE
-- --------
-- L'application ecrivait `uploaderId = 1` code en dur (ArchiveGedService) et le
-- compte n'1 avait ete supprime en production. Resultat : documents GED et
-- traces d'audit pointant vers un compte inexistant (ou NULL), et echec de la
-- cle etrangere a chaque nouvel archivage — la saisie de bordereau etait
-- bloquee (incident du 06/10/2026).
--
-- CE QUE FAIT CETTE MIGRATION (idempotente, AUCUNE suppression de donnees)
-- ----------------------------------------------------------------------
--  1. Determine un compte de repli, dans cet ordre :
--       a. `identifiant = 'system-ged'` non supprime ;
--       b. le plus ancien compte `role = 'admin'` non supprime ;
--       c. le compte le plus ancien non supprime.
--  2. Reaffecte a ce repli les `ged_documents.uploaderId` NULL ou orphelins
--     (id absent de `aut_utilisateurs`).
--  3. Reaffecte aux repli les `ged_audit_logs.userId` NULL ou orphelins.
--
-- REEXECUTABLE : oui — un second passage ne modifie plus rien (les lignes
-- reaffectees ne sont plus NULL ni orphelines).
--
-- Conventions projet : un fichier = une migration ; suivi par
-- scripts/apply-migrations.cjs (table schema_migrations) ; appliquee au boot
-- par docker-entrypoint.sh (fail-fast). Ne pas editer apres application.
-- =============================================================================

-- 1) Compte de repli ----------------------------------------------------------
SET @compteRepli := (
  SELECT `id` FROM `aut_utilisateurs`
  WHERE `identifiant` = 'system-ged' AND `deletedAt` IS NULL
  ORDER BY `id` ASC
  LIMIT 1
);

SET @compteRepli := IFNULL(@compteRepli, (
  SELECT `id` FROM `aut_utilisateurs`
  WHERE `role` = 'admin' AND `deletedAt` IS NULL
  ORDER BY `id` ASC
  LIMIT 1
));

SET @compteRepli := IFNULL(@compteRepli, (
  SELECT MIN(`id`) FROM `aut_utilisateurs` WHERE `deletedAt` IS NULL
));

-- 2) Reaffectation des documents GED orphelins -------------------------------
-- Garde-fous au format 026 : n'execute que si la table existe et qu'un compte
-- de repli a ete trouve ; sinon instruction no-op explicite.
SET @tableExists := (
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = DATABASE() AND table_name = 'ged_documents'
);
SET @sql := IF(@tableExists = 1 AND @compteRepli IS NOT NULL,
  'UPDATE `ged_documents` SET `uploaderId` = @compteRepli WHERE `uploaderId` IS NULL OR `uploaderId` NOT IN (SELECT `id` FROM `aut_utilisateurs`)',
  'SELECT ''ged_documents absente ou aucun compte de repli : rien a reaffecter'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) Reaffectation des traces d'audit orphelines ------------------------------
SET @tableExists := (
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = DATABASE() AND table_name = 'ged_audit_logs'
);
SET @sql := IF(@tableExists = 1 AND @compteRepli IS NOT NULL,
  'UPDATE `ged_audit_logs` SET `userId` = @compteRepli WHERE `userId` IS NULL OR `userId` NOT IN (SELECT `id` FROM `aut_utilisateurs`)',
  'SELECT ''ged_audit_logs absente ou aucun compte de repli : rien a reaffecter'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4) Synthese lisible dans les logs du runner --------------------------------
SELECT @compteRepli AS compte_de_repli_auteur_ged;
