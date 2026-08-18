-- =============================================================================
-- EasyEcole — Migration SQL : indexes manquants pour performances
-- =============================================================================
-- Colonnes déjà présentes en local, indexes à ajouter sur recette/prod.
-- =============================================================================

-- Bulletins : filtrage par cursus + année + semestre (requête fréquente mon-suivi)
ALTER TABLE `ins_bulletins`
    ADD INDEX `idx_bulletins_cursus_annee_semestre` (`cursusApprenantId`, `anneeAcademiqueId`, `semestre`);

-- Bulletins : filtrage par classe + année (génération bulletins)
ALTER TABLE `ins_bulletins`
    ADD INDEX `idx_bulletins_classe_annee` (`classeId`, `anneeAcademiqueId`);

-- Bulletins : filtrage par utilisateur (mes bulletins)
ALTER TABLE `ins_bulletins`
    ADD INDEX `idx_bulletins_utilisateur` (`utilisateurId`);

-- Lignes de bulletin : filtrage par cours (export PV)
ALTER TABLE `ins_lignes_bulletins`
    ADD INDEX `idx_lignes_bulletins_cours` (`coursId`);

-- Notes : filtrage par participant + année (mes notes)
ALTER TABLE `ins_notes_evaluations`
    ADD INDEX `idx_notes_participant_annee` (`coursParticipantId`, `anneeAcademiqueId`);

-- Cursus apprenant : filtrage par classe + année + statut (inscription)
ALTER TABLE `ins_cursus_apprenants`
    ADD INDEX `idx_cursus_classe_annee_statut` (`classeId`, `anneeAcademiqueId`, `statutReinscription`);

-- Cursus apprenant : filtrage par utilisateur (mon cursus)
ALTER TABLE `ins_cursus_apprenants`
    ADD INDEX `idx_cursus_utilisateur` (`utilisateurId`);

-- Paiements : filtrage par inscription + date (historique paiements)
ALTER TABLE `ins_paiements`
    ADD INDEX `idx_paiements_inscription_date` (`inscriptionId`, `datePaiement`);

-- Présences : filtrage par séance (appel)
ALTER TABLE `ins_presences`
    ADD INDEX `idx_presences_seance` (`seanceId`);

-- Cours : filtrage par classe + enseignant (planning)
ALTER TABLE `ins_cours`
    ADD INDEX `idx_cours_classe_enseignant` (`classeId`, `enseignantId`);

-- =============================================================================
-- Vérification
-- =============================================================================
-- SHOW INDEX FROM `ins_bulletins`;
-- SHOW INDEX FROM `ins_cursus_apprenants`;
-- SHOW INDEX FROM `ins_notes_evaluations`;
