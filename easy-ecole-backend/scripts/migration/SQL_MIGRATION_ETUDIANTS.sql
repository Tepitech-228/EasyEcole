-- ============================================================================
-- MIGRATION ÉTUDIENTS — Ancienne base → Nouvelle base (EasyEcole)
-- ============================================================================
-- Objectif : Permettre aux étudiants existants de continuer directement
--           par une RÉINSCRIPTION dans le nouveau système.
--
-- Prérequis :
--   1. Sauvegarder la nouvelle base avant exécution
--   2. Adapter les valeurs de la section "CONFIGURATION" ci-dessous
--   3. Exécuter ce script dans l'ordre (les contraintes FK l'imposent)
--
-- Ordre d'exécution : OBLIGATOIRE (clés étrangères)
-- ===========================================================================


-- ============================================================================
-- ÉTAPE 0 : CONFIGURATION (À ADAPTER PAR LE CLIENT)
-- ============================================================================
-- Ancienne base : ancienne_base_etudiants
-- Nouvelle base : easyecole
--
-- Si les deux bases sont sur le même serveur MySQL, utiliser des requêtes
-- multi-bases avec le préfixe : ancienne_base.table
-- Sinon, exporter/importer les données anciennes dans la nouvelle base
-- dans des tables temporaires (suffixe `_migr`).


-- ============================================================================
-- ÉTAPE 1 : ÉTABLISSEMENTS
-- ============================================================================
-- Récupérer l'ID de l'établissement cible dans la nouvelle base
SET @etablissement_id := (SELECT MIN(id) FROM easyecole.etablissements);

-- Si aucun établissement n'existe, en créer un
INSERT INTO easyecole.etablissements (nom, type, pays, ville, actif, createdAt, updatedAt)
SELECT 'Établissement Principal', 'UNIVERSITE', 'Togo', 'Lomé', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM easyecole.etablissements LIMIT 1);

SET @etablissement_id := (SELECT MIN(id) FROM easyecole.etablissements);


-- ============================================================================
-- ÉTAPE 2 : ANNÉES ACADÉMIQUES
-- ============================================================================
-- Récupérer les années académiques de l'ancienne base et les créer si absent
-- Adapter le format des libellés selon l'ancienne base

INSERT IGNORE INTO easyecole.ins_annees_academiques (libelle, description, createdAt, updatedAt)
SELECT DISTINCT
    annee_libelle AS libelle,
    CONCAT('Année academique migree') AS description,
    NOW(),
    NOW()
FROM ancienne_base_etudiants.ins_annees_academiques
WHERE annee_libelle IS NOT NULL;

-- Récupérer les IDs utiles
SET @annee_courante_id := (SELECT id FROM easyecole.ins_annees_academiques ORDER BY id DESC LIMIT 1);


-- ============================================================================
-- ÉTAPE 3 : NIVEAUX D'ÉTUDES
-- ============================================================================
INSERT IGNORE INTO easyecole.ins_niveaux_etudes (libelle, createdAt, updatedAt)
SELECT DISTINCT niveau_libelle, NOW(), NOW()
FROM ancienne_base_etudiants.ins_cursus_apprenants
WHERE niveau_libelle IS NOT NULL;


-- ============================================================================
-- ÉTAPE 4 : PARCOURS (FILIÈRES)
-- ============================================================================
INSERT IGNORE INTO easyecole.ins_parcours (titre, description, type, niveauEtudeId, createdAt, updatedAt)
SELECT DISTINCT
    p.titre,
    p.description,
    COALESCE(p.type, 'LICENCE') AS type,
    p.niveauEtudeId,
    NOW(),
    NOW()
FROM ancienne_base_etudiants.ins_parcours p
WHERE p.titre IS NOT NULL;


-- ============================================================================
-- ÉTAPE 5 : CLASSES
-- ============================================================================
INSERT IGNORE INTO easyecole.ins_classes (libelle, description, option, capaciteMax, niveauEtudeId, parcoursId, etablissementId, createdAt, updatedAt)
SELECT DISTINCT
    c.libelle,
    c.description,
    c.option,
    c.capaciteMax,
    c.niveauEtudeId,
    c.parcoursId,
    c.etablissementId,
    NOW(),
    NOW()
FROM ancienne_base_etudiants.ins_classes c
WHERE c.libelle IS NOT NULL;


-- ============================================================================
-- ÉTAPE 6 : ÉTAPES INSCRIPTION (pipeline)
-- ============================================================================
INSERT IGNORE INTO easyecole.ins_etapes_inscription (libelle, ordre, createdAt, updatedAt)
VALUES
    ('soumis', 1, NOW(), NOW()),
    ('authentifie', 2, NOW(), NOW()),
    ('saisie_validee', 3, NOW(), NOW()),
    ('transmis_comite', 4, NOW(), NOW()),
    ('valide', 5, NOW(), NOW());

SET @etape_soumis_id := (SELECT id FROM easyecole.ins_etapes_inscription WHERE libelle = 'soumis' LIMIT 1);
SET @etape_valide_id := (SELECT id FROM easyecole.ins_etapes_inscription WHERE libelle = 'valide' LIMIT 1);


-- ============================================================================
-- ÉTAPE 7 : UTILISATEURS (Étudiants)
-- ============================================================================
-- Récupérer le role_id pour les apprenants dans l'ancienne base
-- (Adapter selon la structure de l'ancienne base)

-- Sous-requête pour trouver les étudiants à migrer
-- (adapter la condition selon l'ancienne base)
CREATE TEMPORARY TABLE IF NOT EXISTS tmp_etudiants_migr AS
SELECT DISTINCT
    u.id AS ancien_user_id,
    u.nom,
    u.prenoms,
    u.identifiant,
    u.email,
    u.mot_de_passe_hash,
    u.contact,
    u.date_naissance,
    u.lieu_naissance,
    u.sexe,
    u.nationalite,
    u.numero_piece,
    u.type_piece,
    u.annee_bac,
    u.serie_bac,
    u.annee_premiere_inscription,
    a.id AS ancien_apprenant_id
FROM ancienne_base_etudiants.aut_utilisateurs u
JOIN ancienne_base_etudiants.aut_apprenants a ON a.utilisateurId = u.id
WHERE u.role = 'apprenant' OR u.role = 'APPRENANT'
   OR u.id IN (SELECT DISTINCT utilisateurId FROM ancienne_base_etudiants.ins_cursus_apprenants);

-- Insérer les utilisateurs avec un mapping temporaire d'IDs
CREATE TEMPORARY TABLE IF NOT EXISTS tmp_id_mapping (
    ancien_user_id INT,
    nouvel_user_id INT,
    ancien_apprenant_id INT,
    nouvel_apprenant_id INT,
    PRIMARY KEY (ancien_user_id)
);

-- Insérer les utilisateurs
INSERT INTO easyecole.aut_utilisateurs (nom, prenoms, identifiant, email, motDePasse, role, contact, tokenVersion, etablissementId, createdAt, updatedAt)
SELECT
    te.nom,
    te.prenoms,
    -- Éviter les doublons d'identifiant
    CASE
        WHEN EXISTS (SELECT 1 FROM easyecole.aut_utilisateurs eu WHERE eu.identifiant = te.identifiant)
        THEN CONCAT(te.identifiant, '_migr', te.ancien_user_id)
        ELSE te.identifiant
    END,
    -- Éviter les doublons d'email
    CASE
        WHEN te.email IS NULL OR EXISTS (SELECT 1 FROM easyecole.aut_utilisateurs eu WHERE eu.email = te.email)
        THEN CONCAT('migrated_', te.ancien_user_id, '@temp.local')
        ELSE te.email
    END,
    COALESCE(te.mot_de_passe_hash, '$2b$10$placeholderhashmustbechanged'),
    'APPRENANT',
    te.contact,
    0,
    @etablissement_id,
    NOW(),
    NOW()
FROM tmp_etudiants_migr te;

-- Remplir le mapping d'IDs utilisateurs
INSERT INTO tmp_id_mapping (ancien_user_id, nouvel_user_id)
SELECT te.ancien_user_id, eu.id
FROM tmp_etudiants_migr te
JOIN easyecole.aut_utilisateurs eu ON (
    eu.identifiant = te.identifiant
    OR eu.identifiant = CONCAT(te.identifiant, '_migr', te.ancien_user_id)
    OR eu.email = COALESCE(te.email, CONCAT('migrated_', te.ancien_user_id, '@temp.local'))
)
WHERE eu.role = 'APPRENANT';

-- Corriger le mapping avec une approche robuste (évite les sous-requêtes ambiguës)
UPDATE tmp_id_mapping tm
JOIN tmp_etudiants_migr te ON te.ancien_user_id = tm.ancien_user_id
SET tm.nouvel_user_id = (
    SELECT eu.id FROM easyecole.aut_utilisateurs eu
    WHERE (
        eu.identifiant = te.identifiant
        OR eu.identifiant = CONCAT(te.identifiant, '_migr', te.ancien_user_id)
        OR eu.email = COALESCE(te.email, CONCAT('migrated_', te.ancien_user_id, '@temp.local'))
    )
    AND eu.role = 'APPRENANT'
    ORDER BY eu.createdAt DESC
    LIMIT 1
)
WHERE tm.nouvel_user_id IS NULL;


-- ============================================================================
-- ÉTAPE 8 : APPRENANTS
-- ============================================================================
INSERT IGNORE INTO easyecole.aut_apprenants (utilisateurId, dateNaissance, lieuNaissance, sexe, nationalite, numeroPiece, typePieceIdentite, anneeObtentionBac, serieBac, anneePremiereInscription, statutEtudiant, nombreInscriptions, createdAt, updatedAt)
SELECT
    tm.nouvel_user_id,
    te.date_naissance,
    te.lieu_naissance,
    COALESCE(te.sexe, 'M'),
    COALESCE(te.nationalite, 'Ivoirienne'),
    te.numero_piece,
    te.type_piece,
    te.annee_bac,
    te.serie_bac,
    te.annee_premiere_inscription,
    'ancien',
    1,
    NOW(),
    NOW()
FROM tmp_etudiants_migr te
JOIN tmp_id_mapping tm ON tm.ancien_user_id = te.ancien_user_id
WHERE tm.nouvel_user_id IS NOT NULL;

-- Compléter le mapping avec les IDs apprenants
UPDATE tmp_id_mapping tm
SET nouvel_apprenant_id = (
    SELECT ea.id FROM easyecole.aut_apprenants ea
    WHERE ea.utilisateurId = tm.nouvel_user_id
    LIMIT 1
)
WHERE tm.nouvel_apprenant_id IS NULL AND tm.nouvel_user_id IS NOT NULL;


-- ============================================================================
-- ÉTAPE 9 : COURS (Unités d'enseignement)
-- ============================================================================
-- Migrer les cours de l'ancienne base (nécessaire pour les cursus et notes)
INSERT IGNORE INTO easyecole.ins_cours (code, intitule, credit, creditEcts, estObligatoire, description, semestre, classeId, parcoursId, etablissementId, volumeHoraire, coefficient, categorieUe, createdAt, updatedAt)
SELECT
    c.code,
    c.intitule,
    c.credit,
    c.creditEcts,
    COALESCE(c.estObligatoire, true),
    c.description,
    c.semestre,
    c.classeId,
    c.parcoursId,
    c.etablissementId,
    c.volumeHoraire,
    c.coefficient,
    COALESCE(c.categorieUe, 'MAJEURE'),
    NOW(),
    NOW()
FROM ancienne_base_etudiants.ins_cours c
WHERE c.code IS NOT NULL;


-- ============================================================================
-- ÉTAPE 10 : SESSIONS
-- ============================================================================
INSERT IGNORE INTO easyecole.ins_sessions (dateDebut, dateFin, description, statut, niveauEtudeId, etablissementId, anneeAcademiqueId, createdAt, updatedAt)
SELECT
    s.dateDebut,
    s.dateFin,
    s.description,
    COALESCE(s.statut, 'ouverte'),
    s.niveauEtudeId,
    s.etablissementId,
    s.anneeAcademiqueId,
    NOW(),
    NOW()
FROM ancienne_base_etudiants.ins_sessions s
WHERE s.dateDebut IS NOT NULL;


-- ============================================================================
-- ÉTAPE 11 : TYPES DE NOTES D'ÉVALUATION
-- ============================================================================
INSERT IGNORE INTO easyecole.ins_types_note_evaluation (libelle, description, poids, categorie, createdAt, updatedAt)
VALUES
    ('Devoir', 'Devoir de mi-semestre', 30, 'devoir', NOW(), NOW()),
    ('Examen', 'Examen de fin de semestre', 70, 'examen', NOW(), NOW()),
    ('Contrôle Continue', 'Contrôle continu', 20, 'controle_continu', NOW(), NOW());


-- ============================================================================
-- ÉTAPE 12 : DEMANDES D'INSCRIPTION (Cursus historical)
-- ============================================================================
-- Créer une demande d'inscription migrée pour chaque ancien cursus
INSERT IGNORE INTO easyecole.ins_demandes_inscription (matricule, typeDemande, statutPipeline, dateDemande, sessionId, etapeInscriptionId, utilisateurId, etablissementId, createdAt, updatedAt)
SELECT
    CONCAT('MIGR-', ca.id) AS matricule,
    'inscription' AS typeDemande,
    'valide' AS statutPipeline,
    ca.dateReinscription AS dateDemande,
    ca.sessionId,
    @etape_valide_id,
    tm.nouvel_user_id,
    @etablissement_id,
    NOW(),
    NOW()
FROM ancienne_base_etudiants.ins_cursus_apprenants ca
JOIN tmp_id_mapping tm ON tm.ancien_user_id = ca.utilisateurId
WHERE tm.nouvel_user_id IS NOT NULL;

-- Mapping des nouvelles demandes
CREATE TEMPORARY TABLE IF NOT EXISTS tmp_demande_mapping (
    ancien_cursus_id INT,
    nouvel_cursus_id INT,
    nouvel_demande_id INT,
    PRIMARY KEY (ancien_cursus_id)
);

INSERT INTO tmp_demande_mapping (ancien_cursus_id, nouvel_demande_id)
SELECT ca.id, di.id
FROM ancienne_base_etudiants.ins_cursus_apprenants ca
JOIN tmp_id_mapping tm ON tm.ancien_apprenant_id = ca.utilisateurId
JOIN easyecole.ins_demandes_inscription di ON di.matricule = CONCAT('MIGR-', ca.id)
WHERE tm.nouvel_user_id IS NOT NULL;


-- ============================================================================
-- ÉTAPE 13 : CURSUS APPRENANTS
-- ============================================================================
INSERT IGNORE INTO easyecole.ins_cursus_apprenants (statutReinscription, intituleParcours, parcoursId, niveauEtudeId, classeId, anneeAcademiqueId, demandeInscriptionId, utilisateurId, dateReinscription, createdAt, updatedAt)
SELECT
    'confirme' AS statutReinscription,
    ca.intituleParcours,
    ca.parcoursId,
    ca.niveauEtudeId,
    ca.classeId,
    ca.anneeAcademiqueId,
    dm.nouvel_demande_id,
    tm.nouvel_user_id,
    ca.dateReinscription,
    NOW(),
    NOW()
FROM ancienne_base_etudiants.ins_cursus_apprenants ca
JOIN tmp_id_mapping tm ON tm.ancien_user_id = ca.utilisateurId
JOIN tmp_demande_mapping dm ON dm.ancien_cursus_id = ca.id
WHERE tm.nouvel_user_id IS NOT NULL AND dm.nouvel_demande_id IS NOT NULL;

-- Compléter le mapping avec les nouveaux cursus
UPDATE tmp_demande_mapping dm
SET nouvel_cursus_id = (
    SELECT ca.id FROM easyecole.ins_cursus_apprenants ca
    WHERE ca.utilisateurId = (
        SELECT tm.nouvel_user_id FROM tmp_id_mapping tm
        JOIN tmp_demande_mapping dm2 ON dm2.ancien_cursus_id = ca.id
        WHERE dm2.ancien_cursus_id = dm.ancien_cursus_id
    )
    LIMIT 1
)
WHERE dm.nouvel_cursus_id IS NULL;


-- ============================================================================
-- ÉTAPE 14 : COURS PARTICIPANTS
-- ============================================================================
INSERT IGNORE INTO easyecole.ins_cours_participants (utilisateurId, coursId, cursusApprenantId, createdAt, updatedAt)
SELECT
    tm.nouvel_user_id,
    cp.coursId,
    dm.nouvel_cursus_id,
    NOW(),
    NOW()
FROM ancienne_base_etudiants.ins_cours_participants cp
JOIN tmp_id_mapping tm ON tm.ancien_user_id = cp.utilisateurId
JOIN tmp_demande_mapping dm ON dm.ancien_cursus_id = cp.cursusApprenantId
WHERE tm.nouvel_user_id IS NOT NULL AND dm.ancien_cursus_id IS NOT NULL;


-- ============================================================================
-- ÉTAPE 15 : NOTES D'ÉVALUATION
-- ============================================================================
-- D'abord créer les listes d'évaluation manquantes si nécessaire
INSERT IGNORE INTO easyecole.ins_listes_notes_evaluation (date, heureDebut, heureFin, poidsTypeNoteEvaluation, typeNoteEvaluationId, coursId, enseignantId, anneeAcademiqueId, createdAt, updatedAt)
SELECT DISTINCT
    CURDATE(),
    '08:00:00',
    '12:00:00',
    100,
    3,
    le.coursId,
    le.enseignantId,
    le.anneeAcademiqueId,
    NOW(),
    NOW()
FROM ancienne_base_etudiants.ins_notes_evaluation le
WHERE NOT EXISTS (
    SELECT 1 FROM easyecole.ins_listes_notes_evaluation lne
    WHERE lne.coursId = le.coursId AND lne.anneeAcademiqueId = le.anneeAcademiqueId
);

-- Insérer les notes
INSERT IGNORE INTO easyecole.ins_notes_evaluation (note, statut, listeNoteEvaluationId, coursParticipantId, createdAt, updatedAt)
SELECT
    le.note,
    'publie' AS statut,
    (
        SELECT lne.id FROM easyecole.ins_listes_notes_evaluation lne
        WHERE lne.coursId = le.coursId AND lne.anneeAcademiqueId = le.anneeAcademiqueId
        ORDER BY lne.id DESC LIMIT 1
    ) AS listeNoteEvaluationId,
    (
        SELECT cp.id FROM easyecole.ins_cours_participants cp
        WHERE cp.coursId = le.coursId
        AND cp.utilisateurId = (
            SELECT tm.nouvel_user_id FROM tmp_id_mapping tm
            WHERE tm.ancien_user_id = le.utilisateurId
        )
        LIMIT 1
    ) AS coursParticipantId,
    NOW(),
    NOW()
FROM ancienne_base_etudiants.ins_notes_evaluation le
WHERE le.note IS NOT NULL;


-- ============================================================================
-- ÉTAPE 16 : BULLETINS
-- ============================================================================
INSERT IGNORE INTO easyecole.ins_bulletins (anneeAcademiqueId, semestre, cursusApprenantId, utilisateurId, classeId, parcoursId, niveauEtudeId, moyenneGenerale, totalCredits, creditsValides, rang, effectifClasse, mention, statut, dateGeneration, createdAt, updatedAt)
SELECT
    b.anneeAcademiqueId,
    COALESCE(b.semestre, 'semestre1'),
    dm.nouvel_cursus_id,
    tm.nouvel_user_id,
    b.classeId,
    b.parcoursId,
    b.niveauEtudeId,
    b.moyenneGenerale,
    b.totalCredits,
    b.creditsValides,
    b.rang,
    b.effectifClasse,
    b.mention,
    'publie' AS statut,
    b.dateGeneration,
    NOW(),
    NOW()
FROM ancienne_base_etudiants.ins_bulletins b
JOIN tmp_id_mapping tm ON tm.ancien_user_id = b.utilisateurId
JOIN tmp_demande_mapping dm ON dm.ancien_cursus_id = b.cursusApprenantId
WHERE tm.nouvel_user_id IS NOT NULL AND dm.ancien_cursus_id IS NOT NULL;


-- ============================================================================
-- ÉTAPE 17 : SESSIONS DE RATTRAPAGE
-- ============================================================================
INSERT IGNORE INTO easyecole.ins_sessions_rattrapage (libelle, dateDebut, dateFin, anneeAcademiqueId, statut, description, createdAt, updatedAt)
SELECT
    sr.libelle,
    sr.dateDebut,
    sr.dateFin,
    sr.anneeAcademiqueId,
    COALESCE(sr.statut, 'ouverte'),
    sr.description,
    NOW(),
    NOW()
FROM ancienne_base_etudiants.ins_sessions_rattrapage sr
WHERE sr.libelle IS NOT NULL;


-- ============================================================================
-- ÉTAPE 18 : RATTRAPAGES INSCRIPTIONS
-- ============================================================================
INSERT IGNORE INTO easyecole.ins_rattrapages_inscriptions (coursParticipantId, coursId, statut, source, statutDemande, demandePar, rattrapageSessionId, createdAt, updatedAt)
SELECT
    (
        SELECT cp.id FROM easyecole.ins_cours_participants cp
        WHERE cp.coursId = ri.coursId
        AND cp.utilisateurId = tm.nouvel_user_id
        LIMIT 1
    ) AS coursParticipantId,
    ri.coursId,
    COALESCE(ri.statut, 'valide') AS statut,
    COALESCE(ri.source, 'auto') AS source,
    'valide' AS statutDemande,
    tm.nouvel_user_id,
    ri.rattrapageSessionId,
    NOW(),
    NOW()
FROM ancienne_base_etudiants.ins_rattrapages_inscriptions ri
JOIN tmp_id_mapping tm ON tm.ancien_user_id = ri.demandePar
WHERE tm.nouvel_user_id IS NOT NULL;


-- ============================================================================
-- ÉTAPE 19 : NOTES DE RATTRAPAGE
-- ============================================================================
INSERT IGNORE INTO easyecole.ins_rattrapage_notes (rattrapageInscriptionId, etudiantId, ueId, note_originale, note_rattrapage, statut, createdAt, updatedAt)
SELECT
    rin.id AS rattrapageInscriptionId,
    tm.nouvel_user_id,
    rn.ueId,
    rn.note_originale,
    rn.note_rattrapage,
    COALESCE(rn.statut, 'validee') AS statut,
    NOW(),
    NOW()
FROM ancienne_base_etudiants.ins_rattrapage_notes rn
JOIN easyecole.ins_rattrapages_inscriptions rin ON rin.coursId = rn.ueId
JOIN tmp_id_mapping tm ON tm.ancien_apprenant_id = rn.etudiantId
WHERE tm.nouvel_user_id IS NOT NULL;


-- ============================================================================
-- ÉTAPE 20 : PARCOURS CHOISIS
-- ============================================================================
INSERT IGNORE INTO easyecole.ins_parcours_choisis (etatDeValidation, choixFinal, messageDeValidation, parcoursId, demandeInscriptionId, createdAt, updatedAt)
SELECT
    'VALIDE' AS etatDeValidation,
    true AS choixFinal,
    'Migré depuis ancienne base' AS messageDeValidation,
    pc.parcoursId,
    dm.nouvel_demande_id,
    NOW(),
    NOW()
FROM ancienne_base_etudiants.ins_parcours_choisis pc
JOIN tmp_demande_mapping dm ON dm.ancien_cursus_id = pc.demandeInscriptionId
WHERE dm.nouvel_demande_id IS NOT NULL;


-- ============================================================================
-- ÉTAPE 21 : NETTOYAGE
-- ============================================================================
DROP TEMPORARY TABLE IF EXISTS tmp_etudiants_migr;
DROP TEMPORARY TABLE IF EXISTS tmp_id_mapping;
DROP TEMPORARY TABLE IF EXISTS tmp_demande_mapping;


-- ============================================================================
-- ÉTAPE 22 : VÉRIFICATIONS POST-MIGRATION
-- ============================================================================
-- À exécuter manuellement pour valider la migration

-- Nombre d'utilisateurs migrés
SELECT COUNT(*) AS utilisateurs_migres FROM easyecole.aut_utilisateurs WHERE identifiant LIKE '%_migr%' OR email LIKE 'migrated_%@temp.local';

-- Nombre d'apprenants migrés
SELECT COUNT(*) AS apprenants_migres FROM easyecole.aut_apprenants a
JOIN easyecole.aut_utilisateurs u ON u.id = a.utilisateurId
WHERE u.identifiant LIKE '%_migr%' OR u.email LIKE 'migrated_%@temp.local';

-- Nombre de cursus migrés
SELECT COUNT(*) AS cursus_migres FROM easyecole.ins_cursus_apprenants ca
JOIN easyecole.ins_demandes_inscription di ON di.id = ca.demandeInscriptionId
WHERE di.matricule LIKE 'MIGR-%';

-- Nombre de notes migrées
SELECT COUNT(*) AS notes_migrees FROM easyecole.ins_notes_evaluation ne
JOIN easyecole.ins_cours_participants cp ON cp.id = ne.coursParticipantId
JOIN easyecole.aut_utilisateurs u ON u.id = cp.utilisateurId
WHERE u.identifiant LIKE '%_migr%' OR u.email LIKE 'migrated_%@temp.local';

-- Nombre de bulletins migrés
SELECT COUNT(*) AS bulletins_migres FROM easyecole.ins_bulletins b
JOIN easyecole.aut_utilisateurs u ON u.id = b.utilisateurId
WHERE u.identifiant LIKE '%_migr%' OR u.email LIKE 'migrated_%@temp.local';


-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 1. Les mots de passe migrés ne sont PAS utilisables (hash différent).
--    Les étudiants devront utiliser "Mot de passe oublié" pour réinitialiser.
--
-- 2. Les identifiants dupliqués reçoivent le suffixe "_migr{ancien_id}".
--    Les emails dupliqués reçoivent "migrated_{ancien_id}@temp.local".
--
-- 3. Après migration, les étudiants peuvent faire une RÉINSCRIPTION
--    (typeDemande = 'reinscription') pour la nouvelle année académique.
--
-- 4. Les données académiques (notes, bulletins) sont migrées en lecture seule
--    pour consultation historique.
--
-- 5. Adapter les noms de tables/colonnes de l'ancienne base dans ce script
--    avant exécution.
-- ============================================================================
