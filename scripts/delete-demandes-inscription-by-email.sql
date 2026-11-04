-- ============================================================================
-- EasyEcole — Suppression des demandes d'inscription liées à un email
-- Cible : base `easyecole` (MariaDB locale : 127.0.0.1:3307)
--
-- UTILISATION :
--   1. Remplacer l'email à la ligne "SET @email" ci-dessous (seule modif).
--   2. Exécuter :
--        mysql -h 127.0.0.1 -P 3307 -u root easyecole < delete-demandes-inscription-by-email.sql
--      ou copier/coller dans phpMyAdmin (serveur MariaDB) / HeidiSQL.
--
-- SAUVEGARDE CONSEILLÉE AVANT (adapter le chemin) :
--   mysqldump -h 127.0.0.1 -P 3307 -u root easyecole ^
--     ins_demandes_inscription ins_parcours_choisis ins_pre_inscriptions ^
--     ins_reponses_inscription ins_cursus_apprenants ins_cours_choisis ^
--     ins_comite_votes ins_dossiers_demandes ins_paiements_inscription ^
--     > backup_avant_suppression.sql
--
-- PORTÉE :
--   - Supprime les demandes d'inscription de l'utilisateur et leurs
--     dépendances directes (parcours choisis, réponses, cursus, cours,
--     votes comité, dossiers, paiements liés au matricule).
--   - NE supprime PAS : le compte (aut_utilisateurs), le profil apprenant
--     (aut_apprenants), les bordereaux, les enrolments Hikvision.
--
-- ESSAI À BLANC : remplacer "COMMIT;" par "ROLLBACK;" en fin de script.
-- ============================================================================

SET @email = 'CHANGE_ME@gmail.com';

-- 0) APERÇU AVANT SUPPRESSION ------------------------------------------------
-- Si ce résultat est vide : email inconnu OU compte sans demande.
-- Les DELETE ci-dessous ne feront alors rien (script sans effet).
SELECT u.id AS utilisateur_id, u.nom, u.prenoms, u.email,
       d.id AS demande_id, d.matricule, d.statutPipeline,
       d.dateDemande, d.sessionId
FROM aut_utilisateurs u
JOIN ins_demandes_inscription d ON d.utilisateurId = u.id
WHERE u.email = @email;

START TRANSACTION;

-- 1) DÉPENDANCES DIRECTES DES DEMANDES ---------------------------------------
-- Suppression explicite (certaines FK sont en ON DELETE SET NULL : sans cela,
-- les lignes resteraient orphelines avec un lien NULL).
DELETE pc FROM ins_parcours_choisis pc
JOIN ins_demandes_inscription d ON d.id = pc.demandeInscriptionId
JOIN aut_utilisateurs u ON u.id = d.utilisateurId
WHERE u.email = @email;

DELETE pi FROM ins_pre_inscriptions pi
JOIN ins_demandes_inscription d ON d.id = pi.demandeInscriptionId
JOIN aut_utilisateurs u ON u.id = d.utilisateurId
WHERE u.email = @email;

DELETE ri FROM ins_reponses_inscription ri
JOIN ins_demandes_inscription d ON d.id = ri.demandeInscriptionId
JOIN aut_utilisateurs u ON u.id = d.utilisateurId
WHERE u.email = @email;

DELETE ca FROM ins_cursus_apprenants ca
JOIN ins_demandes_inscription d ON d.id = ca.demandeInscriptionId
JOIN aut_utilisateurs u ON u.id = d.utilisateurId
WHERE u.email = @email;

DELETE cc FROM ins_cours_choisis cc
JOIN ins_demandes_inscription d ON d.id = cc.demandeInscriptionId
JOIN aut_utilisateurs u ON u.id = d.utilisateurId
WHERE u.email = @email;

DELETE cv FROM ins_comite_votes cv
JOIN ins_demandes_inscription d ON d.id = cv.demandeInscriptionId
JOIN aut_utilisateurs u ON u.id = d.utilisateurId
WHERE u.email = @email;

DELETE dd FROM ins_dossiers_demandes dd
JOIN ins_demandes_inscription d ON d.id = dd.demandeId
JOIN aut_utilisateurs u ON u.id = d.utilisateurId
WHERE u.email = @email;

-- Paiements liés au matricule de la demande (FK sur ins_demandes_inscription.matricule)
DELETE pai FROM ins_paiements_inscription pai
JOIN ins_demandes_inscription d ON d.matricule = pai.matriculeInscription
JOIN aut_utilisateurs u ON u.id = d.utilisateurId
WHERE u.email = @email;

-- 2) DEMANDES D'INSCRIPTION ---------------------------------------------------
DELETE d FROM ins_demandes_inscription d
JOIN aut_utilisateurs u ON u.id = d.utilisateurId
WHERE u.email = @email;

COMMIT;

-- 3) VÉRIFICATION APRÈS SUPPRESSION ------------------------------------------
SELECT COUNT(*) AS demandes_restantes
FROM ins_demandes_inscription d
JOIN aut_utilisateurs u ON u.id = d.utilisateurId
WHERE u.email = @email;
