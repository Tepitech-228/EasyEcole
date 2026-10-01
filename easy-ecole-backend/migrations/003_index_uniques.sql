-- ============================================================================
-- 003 — Index UNIQUE (contraintes d'unicité)
-- ============================================================================
--
-- GENERE par scripts/generate-migrations-from-sources.cjs
-- Source  : UNIQUE_INDEX_DEFS (src/core/helpers/ensureUniqueIndexes.ts)
-- Contenu : 66 contraintes.
--
-- Règle : ne créer l'index que si AUCUN index UNIQUE mono-colonne n'existe
-- déjà sur (table, colonne). Un index UNIQUE composite n'enferme pas
-- l'unicité d'une colonne seule : il ne suffit donc pas.
--
-- ⚠️ NON REPRIS VOLONTAIREMENT : la fonction
--    ensureUserPermissionCompositeIndex() (ensureUniqueIndexes.ts l. 142-158)
-- qui déduplique aut_user_permissions par DELETE. Un DELETE est INTERDIT
-- dans une migration. Ce point reste à traiter dans une migration dédiée
-- après validation métier (données identiques ou non).
--
-- MySQL n'a pas de CREATE INDEX IF NOT EXISTS : l'idempotence est obtenue
-- en interrogeant information_schema puis en construisant le DDL dynamiquement.
-- ============================================================================

-- aut_utilisateurs.email
SET @ddl_1 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_utilisateurs') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'aut_utilisateurs'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'email'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_aut_utilisateurs_email` ON `aut_utilisateurs` (`email`)',
  'DO 0'
);
PREPARE stmt_1 FROM @ddl_1;
EXECUTE stmt_1;
DEALLOCATE PREPARE stmt_1;

-- aut_utilisateurs.identifiant
SET @ddl_2 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_utilisateurs') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'aut_utilisateurs'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'identifiant'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_aut_utilisateurs_identifiant` ON `aut_utilisateurs` (`identifiant`)',
  'DO 0'
);
PREPARE stmt_2 FROM @ddl_2;
EXECUTE stmt_2;
DEALLOCATE PREPARE stmt_2;

-- aut_apprenants.photo
SET @ddl_3 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_apprenants') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'aut_apprenants'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'photo'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_aut_apprenants_photo` ON `aut_apprenants` (`photo`)',
  'DO 0'
);
PREPARE stmt_3 FROM @ddl_3;
EXECUTE stmt_3;
DEALLOCATE PREPARE stmt_3;

-- aut_apprenants.qrCode
SET @ddl_4 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_apprenants') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'aut_apprenants'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'qrCode'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_aut_apprenants_qrCode` ON `aut_apprenants` (`qrCode`)',
  'DO 0'
);
PREPARE stmt_4 FROM @ddl_4;
EXECUTE stmt_4;
DEALLOCATE PREPARE stmt_4;

-- aut_apprenants.cni
SET @ddl_5 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_apprenants') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'aut_apprenants'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'cni'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_aut_apprenants_cni` ON `aut_apprenants` (`cni`)',
  'DO 0'
);
PREPARE stmt_5 FROM @ddl_5;
EXECUTE stmt_5;
DEALLOCATE PREPARE stmt_5;

-- aut_enseignants.photo
SET @ddl_6 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_enseignants') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'aut_enseignants'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'photo'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_aut_enseignants_photo` ON `aut_enseignants` (`photo`)',
  'DO 0'
);
PREPARE stmt_6 FROM @ddl_6;
EXECUTE stmt_6;
DEALLOCATE PREPARE stmt_6;

-- aut_enseignants.qrCode
SET @ddl_7 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_enseignants') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'aut_enseignants'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'qrCode'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_aut_enseignants_qrCode` ON `aut_enseignants` (`qrCode`)',
  'DO 0'
);
PREPARE stmt_7 FROM @ddl_7;
EXECUTE stmt_7;
DEALLOCATE PREPARE stmt_7;

-- aut_enseignants.matricule
SET @ddl_8 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_enseignants') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'aut_enseignants'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'matricule'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_aut_enseignants_matricule` ON `aut_enseignants` (`matricule`)',
  'DO 0'
);
PREPARE stmt_8 FROM @ddl_8;
EXECUTE stmt_8;
DEALLOCATE PREPARE stmt_8;

-- aut_enseignants.cni
SET @ddl_9 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_enseignants') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'aut_enseignants'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'cni'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_aut_enseignants_cni` ON `aut_enseignants` (`cni`)',
  'DO 0'
);
PREPARE stmt_9 FROM @ddl_9;
EXECUTE stmt_9;
DEALLOCATE PREPARE stmt_9;

-- aut_roles.nom
SET @ddl_10 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_roles') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'aut_roles'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'nom'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_aut_roles_nom` ON `aut_roles` (`nom`)',
  'DO 0'
);
PREPARE stmt_10 FROM @ddl_10;
EXECUTE stmt_10;
DEALLOCATE PREPARE stmt_10;

-- aut_permissions.key
SET @ddl_11 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_permissions') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'aut_permissions'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'key'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_aut_permissions_key` ON `aut_permissions` (`key`)',
  'DO 0'
);
PREPARE stmt_11 FROM @ddl_11;
EXECUTE stmt_11;
DEALLOCATE PREPARE stmt_11;

-- aut_personnel_administratif.utilisateurId
SET @ddl_12 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_personnel_administratif') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'aut_personnel_administratif'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'utilisateurId'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_aut_personnel_administratif_utilisateurId` ON `aut_personnel_administratif` (`utilisateurId`)',
  'DO 0'
);
PREPARE stmt_12 FROM @ddl_12;
EXECUTE stmt_12;
DEALLOCATE PREPARE stmt_12;

-- aut_personnel_administratif.matricule
SET @ddl_13 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_personnel_administratif') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'aut_personnel_administratif'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'matricule'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_aut_personnel_administratif_matricule` ON `aut_personnel_administratif` (`matricule`)',
  'DO 0'
);
PREPARE stmt_13 FROM @ddl_13;
EXECUTE stmt_13;
DEALLOCATE PREPARE stmt_13;

-- aut_personnel_administratif.cni
SET @ddl_14 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_personnel_administratif') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'aut_personnel_administratif'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'cni'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_aut_personnel_administratif_cni` ON `aut_personnel_administratif` (`cni`)',
  'DO 0'
);
PREPARE stmt_14 FROM @ddl_14;
EXECUTE stmt_14;
DEALLOCATE PREPARE stmt_14;

-- aut_banques.nom
SET @ddl_15 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_banques') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'aut_banques'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'nom'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_aut_banques_nom` ON `aut_banques` (`nom`)',
  'DO 0'
);
PREPARE stmt_15 FROM @ddl_15;
EXECUTE stmt_15;
DEALLOCATE PREPARE stmt_15;

-- aut_banques.logo
SET @ddl_16 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aut_banques') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'aut_banques'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'logo'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_aut_banques_logo` ON `aut_banques` (`logo`)',
  'DO 0'
);
PREPARE stmt_16 FROM @ddl_16;
EXECUTE stmt_16;
DEALLOCATE PREPARE stmt_16;

-- eta_etablissements.code
SET @ddl_17 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eta_etablissements') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'eta_etablissements'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'code'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_eta_etablissements_code` ON `eta_etablissements` (`code`)',
  'DO 0'
);
PREPARE stmt_17 FROM @ddl_17;
EXECUTE stmt_17;
DEALLOCATE PREPARE stmt_17;

-- cpt_exercices.code
SET @ddl_18 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cpt_exercices') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'cpt_exercices'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'code'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_cpt_exercices_code` ON `cpt_exercices` (`code`)',
  'DO 0'
);
PREPARE stmt_18 FROM @ddl_18;
EXECUTE stmt_18;
DEALLOCATE PREPARE stmt_18;

-- cpt_parametres_frais.cle
SET @ddl_19 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cpt_parametres_frais') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'cpt_parametres_frais'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'cle'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_cpt_parametres_frais_cle` ON `cpt_parametres_frais` (`cle`)',
  'DO 0'
);
PREPARE stmt_19 FROM @ddl_19;
EXECUTE stmt_19;
DEALLOCATE PREPARE stmt_19;

-- cpt_journaux_comptables.code
SET @ddl_20 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cpt_journaux_comptables') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'cpt_journaux_comptables'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'code'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_cpt_journaux_comptables_code` ON `cpt_journaux_comptables` (`code`)',
  'DO 0'
);
PREPARE stmt_20 FROM @ddl_20;
EXECUTE stmt_20;
DEALLOCATE PREPARE stmt_20;

-- cpt_ecritures_comptables.numeroEcriture
SET @ddl_21 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cpt_ecritures_comptables') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'cpt_ecritures_comptables'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'numeroEcriture'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_cpt_ecritures_comptables_numeroEcriture` ON `cpt_ecritures_comptables` (`numeroEcriture`)',
  'DO 0'
);
PREPARE stmt_21 FROM @ddl_21;
EXECUTE stmt_21;
DEALLOCATE PREPARE stmt_21;

-- cpt_comptes.numero
SET @ddl_22 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cpt_comptes') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'cpt_comptes'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'numero'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_cpt_comptes_numero` ON `cpt_comptes` (`numero`)',
  'DO 0'
);
PREPARE stmt_22 FROM @ddl_22;
EXECUTE stmt_22;
DEALLOCATE PREPARE stmt_22;

-- ins_types_note_evaluation.libelle
SET @ddl_23 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_types_note_evaluation') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ins_types_note_evaluation'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'libelle'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ins_types_note_evaluation_libelle` ON `ins_types_note_evaluation` (`libelle`)',
  'DO 0'
);
PREPARE stmt_23 FROM @ddl_23;
EXECUTE stmt_23;
DEALLOCATE PREPARE stmt_23;

-- ins_salles_de_classes.libelle
SET @ddl_24 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_salles_de_classes') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ins_salles_de_classes'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'libelle'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ins_salles_de_classes_libelle` ON `ins_salles_de_classes` (`libelle`)',
  'DO 0'
);
PREPARE stmt_24 FROM @ddl_24;
EXECUTE stmt_24;
DEALLOCATE PREPARE stmt_24;

-- ins_quitus.code
SET @ddl_25 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_quitus') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ins_quitus'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'code'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ins_quitus_code` ON `ins_quitus` (`code`)',
  'DO 0'
);
PREPARE stmt_25 FROM @ddl_25;
EXECUTE stmt_25;
DEALLOCATE PREPARE stmt_25;

-- ins_parcours.titre
SET @ddl_26 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_parcours') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ins_parcours'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'titre'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ins_parcours_titre` ON `ins_parcours` (`titre`)',
  'DO 0'
);
PREPARE stmt_26 FROM @ddl_26;
EXECUTE stmt_26;
DEALLOCATE PREPARE stmt_26;

-- ins_paiements_inscription.numero
SET @ddl_27 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_paiements_inscription') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ins_paiements_inscription'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'numero'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ins_paiements_inscription_numero` ON `ins_paiements_inscription` (`numero`)',
  'DO 0'
);
PREPARE stmt_27 FROM @ddl_27;
EXECUTE stmt_27;
DEALLOCATE PREPARE stmt_27;

-- ins_niveaux_etudes.libelle
SET @ddl_28 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_niveaux_etudes') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ins_niveaux_etudes'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'libelle'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ins_niveaux_etudes_libelle` ON `ins_niveaux_etudes` (`libelle`)',
  'DO 0'
);
PREPARE stmt_28 FROM @ddl_28;
EXECUTE stmt_28;
DEALLOCATE PREPARE stmt_28;

-- ins_matieres_prerequis.libelle
SET @ddl_29 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_matieres_prerequis') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ins_matieres_prerequis'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'libelle'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ins_matieres_prerequis_libelle` ON `ins_matieres_prerequis` (`libelle`)',
  'DO 0'
);
PREPARE stmt_29 FROM @ddl_29;
EXECUTE stmt_29;
DEALLOCATE PREPARE stmt_29;

-- ins_frais_scolarites.sessionId
SET @ddl_30 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_frais_scolarites') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ins_frais_scolarites'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'sessionId'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ins_frais_scolarites_sessionId` ON `ins_frais_scolarites` (`sessionId`)',
  'DO 0'
);
PREPARE stmt_30 FROM @ddl_30;
EXECUTE stmt_30;
DEALLOCATE PREPARE stmt_30;

-- ins_etapes_inscription.libelle
SET @ddl_31 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_etapes_inscription') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ins_etapes_inscription'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'libelle'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ins_etapes_inscription_libelle` ON `ins_etapes_inscription` (`libelle`)',
  'DO 0'
);
PREPARE stmt_31 FROM @ddl_31;
EXECUTE stmt_31;
DEALLOCATE PREPARE stmt_31;

-- ins_etapes_inscription.ordre
SET @ddl_32 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_etapes_inscription') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ins_etapes_inscription'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'ordre'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ins_etapes_inscription_ordre` ON `ins_etapes_inscription` (`ordre`)',
  'DO 0'
);
PREPARE stmt_32 FROM @ddl_32;
EXECUTE stmt_32;
DEALLOCATE PREPARE stmt_32;

-- ins_dossiers_etudiants.matricule
SET @ddl_33 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_dossiers_etudiants') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ins_dossiers_etudiants'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'matricule'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ins_dossiers_etudiants_matricule` ON `ins_dossiers_etudiants` (`matricule`)',
  'DO 0'
);
PREPARE stmt_33 FROM @ddl_33;
EXECUTE stmt_33;
DEALLOCATE PREPARE stmt_33;

-- ins_demandes_inscription.matricule
SET @ddl_34 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_demandes_inscription') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ins_demandes_inscription'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'matricule'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ins_demandes_inscription_matricule` ON `ins_demandes_inscription` (`matricule`)',
  'DO 0'
);
PREPARE stmt_34 FROM @ddl_34;
EXECUTE stmt_34;
DEALLOCATE PREPARE stmt_34;

-- ins_classes.libelle
SET @ddl_35 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_classes') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ins_classes'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'libelle'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ins_classes_libelle` ON `ins_classes` (`libelle`)',
  'DO 0'
);
PREPARE stmt_35 FROM @ddl_35;
EXECUTE stmt_35;
DEALLOCATE PREPARE stmt_35;

-- ins_annees_academiques.libelle
SET @ddl_36 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_annees_academiques') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ins_annees_academiques'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'libelle'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ins_annees_academiques_libelle` ON `ins_annees_academiques` (`libelle`)',
  'DO 0'
);
PREPARE stmt_36 FROM @ddl_36;
EXECUTE stmt_36;
DEALLOCATE PREPARE stmt_36;

-- ins_absences.noteEvaluationId
SET @ddl_37 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_absences') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ins_absences'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'noteEvaluationId'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ins_absences_noteEvaluationId` ON `ins_absences` (`noteEvaluationId`)',
  'DO 0'
);
PREPARE stmt_37 FROM @ddl_37;
EXECUTE stmt_37;
DEALLOCATE PREPARE stmt_37;

-- ins_types_operations_bordereau.code
SET @ddl_38 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_types_operations_bordereau') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ins_types_operations_bordereau'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'code'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ins_types_operations_bordereau_code` ON `ins_types_operations_bordereau` (`code`)',
  'DO 0'
);
PREPARE stmt_38 FROM @ddl_38;
EXECUTE stmt_38;
DEALLOCATE PREPARE stmt_38;

-- elearning_salons.codeInvitation
SET @ddl_39 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'elearning_salons') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'elearning_salons'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'codeInvitation'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_elearning_salons_codeInvitation` ON `elearning_salons` (`codeInvitation`)',
  'DO 0'
);
PREPARE stmt_39 FROM @ddl_39;
EXECUTE stmt_39;
DEALLOCATE PREPARE stmt_39;

-- docgen_types.code
SET @ddl_40 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'docgen_types') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'docgen_types'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'code'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_docgen_types_code` ON `docgen_types` (`code`)',
  'DO 0'
);
PREPARE stmt_40 FROM @ddl_40;
EXECUTE stmt_40;
DEALLOCATE PREPARE stmt_40;

-- docgen_documents.reference
SET @ddl_41 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'docgen_documents') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'docgen_documents'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'reference'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_docgen_documents_reference` ON `docgen_documents` (`reference`)',
  'DO 0'
);
PREPARE stmt_41 FROM @ddl_41;
EXECUTE stmt_41;
DEALLOCATE PREPARE stmt_41;

-- ged_tags.nom
SET @ddl_42 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_tags') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ged_tags'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'nom'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ged_tags_nom` ON `ged_tags` (`nom`)',
  'DO 0'
);
PREPARE stmt_42 FROM @ddl_42;
EXECUTE stmt_42;
DEALLOCATE PREPARE stmt_42;

-- ged_document_types.code
SET @ddl_43 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_document_types') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ged_document_types'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'code'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ged_document_types_code` ON `ged_document_types` (`code`)',
  'DO 0'
);
PREPARE stmt_43 FROM @ddl_43;
EXECUTE stmt_43;
DEALLOCATE PREPARE stmt_43;

-- ged_processus.code
SET @ddl_44 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_processus') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ged_processus'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'code'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ged_processus_code` ON `ged_processus` (`code`)',
  'DO 0'
);
PREPARE stmt_44 FROM @ddl_44;
EXECUTE stmt_44;
DEALLOCATE PREPARE stmt_44;

-- ged_domains.code
SET @ddl_45 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ged_domains') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ged_domains'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'code'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ged_domains_code` ON `ged_domains` (`code`)',
  'DO 0'
);
PREPARE stmt_45 FROM @ddl_45;
EXECUTE stmt_45;
DEALLOCATE PREPARE stmt_45;

-- brs_configurations.nom
SET @ddl_46 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'brs_configurations') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'brs_configurations'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'nom'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_brs_configurations_nom` ON `brs_configurations` (`nom`)',
  'DO 0'
);
PREPARE stmt_46 FROM @ddl_46;
EXECUTE stmt_46;
DEALLOCATE PREPARE stmt_46;

-- imm_departement.nom
SET @ddl_47 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'imm_departement') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'imm_departement'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'nom'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_imm_departement_nom` ON `imm_departement` (`nom`)',
  'DO 0'
);
PREPARE stmt_47 FROM @ddl_47;
EXECUTE stmt_47;
DEALLOCATE PREPARE stmt_47;

-- imm_localisation.code
SET @ddl_48 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'imm_localisation') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'imm_localisation'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'code'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_imm_localisation_code` ON `imm_localisation` (`code`)',
  'DO 0'
);
PREPARE stmt_48 FROM @ddl_48;
EXECUTE stmt_48;
DEALLOCATE PREPARE stmt_48;

-- imm_assurance.policeNumber
SET @ddl_49 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'imm_assurance') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'imm_assurance'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'policeNumber'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_imm_assurance_policeNumber` ON `imm_assurance` (`policeNumber`)',
  'DO 0'
);
PREPARE stmt_49 FROM @ddl_49;
EXECUTE stmt_49;
DEALLOCATE PREPARE stmt_49;

-- imm_immobilisation.reference
SET @ddl_50 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'imm_immobilisation') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'imm_immobilisation'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'reference'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_imm_immobilisation_reference` ON `imm_immobilisation` (`reference`)',
  'DO 0'
);
PREPARE stmt_50 FROM @ddl_50;
EXECUTE stmt_50;
DEALLOCATE PREPARE stmt_50;

-- scol_types_document.libelle
SET @ddl_51 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'scol_types_document') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'scol_types_document'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'libelle'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_scol_types_document_libelle` ON `scol_types_document` (`libelle`)',
  'DO 0'
);
PREPARE stmt_51 FROM @ddl_51;
EXECUTE stmt_51;
DEALLOCATE PREPARE stmt_51;

-- scol_diplomes.numeroDiplome
SET @ddl_52 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'scol_diplomes') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'scol_diplomes'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'numeroDiplome'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_scol_diplomes_numeroDiplome` ON `scol_diplomes` (`numeroDiplome`)',
  'DO 0'
);
PREPARE stmt_52 FROM @ddl_52;
EXECUTE stmt_52;
DEALLOCATE PREPARE stmt_52;

-- scol_demandes_document.numeroDemande
SET @ddl_53 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'scol_demandes_document') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'scol_demandes_document'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'numeroDemande'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_scol_demandes_document_numeroDemande` ON `scol_demandes_document` (`numeroDemande`)',
  'DO 0'
);
PREPARE stmt_53 FROM @ddl_53;
EXECUTE stmt_53;
DEALLOCATE PREPARE stmt_53;

-- scol_recus_caisse.numero
SET @ddl_54 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'scol_recus_caisse') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'scol_recus_caisse'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'numero'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_scol_recus_caisse_numero` ON `scol_recus_caisse` (`numero`)',
  'DO 0'
);
PREPARE stmt_54 FROM @ddl_54;
EXECUTE stmt_54;
DEALLOCATE PREPARE stmt_54;

-- ori_parcours.titre
SET @ddl_55 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ori_parcours') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ori_parcours'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'titre'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ori_parcours_titre` ON `ori_parcours` (`titre`)',
  'DO 0'
);
PREPARE stmt_55 FROM @ddl_55;
EXECUTE stmt_55;
DEALLOCATE PREPARE stmt_55;

-- ori_niveaux_etudes.libelle
SET @ddl_56 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ori_niveaux_etudes') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ori_niveaux_etudes'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'libelle'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ori_niveaux_etudes_libelle` ON `ori_niveaux_etudes` (`libelle`)',
  'DO 0'
);
PREPARE stmt_56 FROM @ddl_56;
EXECUTE stmt_56;
DEALLOCATE PREPARE stmt_56;

-- ori_categories.libelle
SET @ddl_57 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ori_categories') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ori_categories'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'libelle'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ori_categories_libelle` ON `ori_categories` (`libelle`)',
  'DO 0'
);
PREPARE stmt_57 FROM @ddl_57;
EXECUTE stmt_57;
DEALLOCATE PREPARE stmt_57;

-- ori_matieres_prerequis.libelle
SET @ddl_58 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ori_matieres_prerequis') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ori_matieres_prerequis'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'libelle'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ori_matieres_prerequis_libelle` ON `ori_matieres_prerequis` (`libelle`)',
  'DO 0'
);
PREPARE stmt_58 FROM @ddl_58;
EXECUTE stmt_58;
DEALLOCATE PREPARE stmt_58;

-- rh_types_contrat.code
SET @ddl_59 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rh_types_contrat') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'rh_types_contrat'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'code'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_rh_types_contrat_code` ON `rh_types_contrat` (`code`)',
  'DO 0'
);
PREPARE stmt_59 FROM @ddl_59;
EXECUTE stmt_59;
DEALLOCATE PREPARE stmt_59;

-- rh_rubriques_paie.code
SET @ddl_60 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rh_rubriques_paie') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'rh_rubriques_paie'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'code'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_rh_rubriques_paie_code` ON `rh_rubriques_paie` (`code`)',
  'DO 0'
);
PREPARE stmt_60 FROM @ddl_60;
EXECUTE stmt_60;
DEALLOCATE PREPARE stmt_60;

-- rh_departements.nom
SET @ddl_61 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rh_departements') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'rh_departements'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'nom'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_rh_departements_nom` ON `rh_departements` (`nom`)',
  'DO 0'
);
PREPARE stmt_61 FROM @ddl_61;
EXECUTE stmt_61;
DEALLOCATE PREPARE stmt_61;

-- rh_categories_professionnelles.code
SET @ddl_62 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rh_categories_professionnelles') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'rh_categories_professionnelles'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'code'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_rh_categories_professionnelles_code` ON `rh_categories_professionnelles` (`code`)',
  'DO 0'
);
PREPARE stmt_62 FROM @ddl_62;
EXECUTE stmt_62;
DEALLOCATE PREPARE stmt_62;

-- stk_article.reference
SET @ddl_63 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'stk_article') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'stk_article'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'reference'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_stk_article_reference` ON `stk_article` (`reference`)',
  'DO 0'
);
PREPARE stmt_63 FROM @ddl_63;
EXECUTE stmt_63;
DEALLOCATE PREPARE stmt_63;

-- stk_categorie_article.nom
SET @ddl_64 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'stk_categorie_article') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'stk_categorie_article'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'nom'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_stk_categorie_article_nom` ON `stk_categorie_article` (`nom`)',
  'DO 0'
);
PREPARE stmt_64 FROM @ddl_64;
EXECUTE stmt_64;
DEALLOCATE PREPARE stmt_64;

-- stk_inventaire_stock.reference
SET @ddl_65 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'stk_inventaire_stock') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'stk_inventaire_stock'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'reference'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_stk_inventaire_stock_reference` ON `stk_inventaire_stock` (`reference`)',
  'DO 0'
);
PREPARE stmt_65 FROM @ddl_65;
EXECUTE stmt_65;
DEALLOCATE PREPARE stmt_65;

-- ach_categories.nom
SET @ddl_66 := IF(
  (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ach_categories') = 1
  AND NOT ((
    SELECT COUNT(*) FROM information_schema.statistics
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ach_categories'
       AND NON_UNIQUE = 0
       AND COLUMN_NAME = 'nom'
     GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
    LIMIT 1
  )),
  'CREATE UNIQUE INDEX `idx_ach_categories_nom` ON `ach_categories` (`nom`)',
  'DO 0'
);
PREPARE stmt_66 FROM @ddl_66;
EXECUTE stmt_66;
DEALLOCATE PREPARE stmt_66;

