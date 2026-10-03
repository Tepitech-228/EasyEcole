-- =============================================================================
-- EasyEcole — Migration SQL 015 : Insertion des 105 filières dans ins_parcours
-- =============================================================================
-- Insère les 37+37+2+29 = 105 filières (LICENCE + MASTER + MBA + BTS)
-- dans la table ins_parcours, avec le champ grade et niveauEtudeId.
--
-- Hiérarchie wizard : type (cycle) → grade → filière (titre)
--   type  = LICENCE / MASTER / MBA / BTS / DOCTORAT
--   grade = nom du grade (ex : "Licence 1", "Licence 2", ...)
--   titre = nom de la filière
--
-- Idempotent : supprime les anciennes filières de démo avant réinsertion.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Suppression de la contrainte UNIQUE sur titre (permet la même filière
--    sur plusieurs grades : L1/L2/L3 portent le même nom de filière).
-- ─────────────────────────────────────────────────────────────────────────────
SET @idxExists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_parcours'
    AND COLUMN_NAME = 'titre' AND NON_UNIQUE = 0 AND INDEX_NAME != 'PRIMARY'
);
SET @sql := IF(@idxExists > 0,
  CONCAT('ALTER TABLE `ins_parcours` DROP INDEX `',
    (SELECT INDEX_NAME FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ins_parcours'
       AND COLUMN_NAME = 'titre' AND NON_UNIQUE = 0 AND INDEX_NAME != 'PRIMARY' LIMIT 1),
    '`'),
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Grades manquants dans ins_niveaux_etudes
-- ─────────────────────────────────────────────────────────────────────────────
INSERT IGNORE INTO `ins_niveaux_etudes` (`libelle`, `createdAt`, `updatedAt`) VALUES
  ('MBA 1', NOW(), NOW()),
  ('MBA 2', NOW(), NOW()),
  ('BTS 1', NOW(), NOW()),
  ('BTS 2', NOW(), NOW()),
  ('Doctorat 1', NOW(), NOW()),
  ('Doctorat 2', NOW(), NOW()),
  ('Doctorat 3', NOW(), NOW());

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Nettoyage : suppression des anciennes filières de démo
--    (conserve les parcours liés à des demandes existantes)
-- ─────────────────────────────────────────────────────────────────────────────
DELETE FROM `ins_parcours`
WHERE `id` NOT IN (
  SELECT DISTINCT `parcoursId` FROM `ins_parcours_choisis` WHERE `parcoursId` IS NOT NULL
);

ALTER TABLE `ins_parcours` AUTO_INCREMENT = 1;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Récupération des IDs des grades
-- ─────────────────────────────────────────────────────────────────────────────
SET @id_lic1  = (SELECT id FROM ins_niveaux_etudes WHERE libelle = 'Licence 1' LIMIT 1);
SET @id_lic2  = (SELECT id FROM ins_niveaux_etudes WHERE libelle = 'Licence 2' LIMIT 1);
SET @id_lic3  = (SELECT id FROM ins_niveaux_etudes WHERE libelle = 'Licence 3' LIMIT 1);
SET @id_mas1  = (SELECT id FROM ins_niveaux_etudes WHERE libelle = 'Master 1' LIMIT 1);
SET @id_mas2  = (SELECT id FROM ins_niveaux_etudes WHERE libelle = 'Master 2' LIMIT 1);
SET @id_mba1  = (SELECT id FROM ins_niveaux_etudes WHERE libelle = 'MBA 1' LIMIT 1);
SET @id_mba2  = (SELECT id FROM ins_niveaux_etudes WHERE libelle = 'MBA 2' LIMIT 1);
SET @id_bts1  = (SELECT id FROM ins_niveaux_etudes WHERE libelle = 'BTS 1' LIMIT 1);
SET @id_bts2  = (SELECT id FROM ins_niveaux_etudes WHERE libelle = 'BTS 2' LIMIT 1);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. LICENCE — 37 filières × 3 grades = 111 lignes
--    Grade = "Licence 1" / "Licence 2" / "Licence 3"
--    Chaque filière existe aux 3 niveaux (L1 → L2 → L3)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO `ins_parcours` (`titre`, `type`, `grade`, `niveauEtudeId`, `createdAt`, `updatedAt`) VALUES
-- === Licence 1 ===
('Administration générale',                          'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Administration des collectivités territoriales',   'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Administration des collectivités locales',         'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Marketing digital et E-business',                  'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Protocole et relations publiques',                 'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Gestion commerciale',                              'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Gestion des ressources humaines',                  'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Science et techniques comptables et financières',  'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Audit et contrôle de gestion',                     'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Commerce international',                           'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Transport logistique',                             'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Marketing-communication',                          'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Gestion des projets et passation des marchés',     'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Réseaux et télécommunication',                     'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Génie logiciel',                                   'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Génie civil',                                      'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Énergies renouvelables et efficacité énergétique', 'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Sécurité informatique — cybercriminalité',         'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Marketing',                                        'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Génie électrique',                                 'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Administration et gestion des affaires',           'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Gestion fiscale des entreprises',                  'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Économie des transports et développement social',  'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Management du tourisme et de l''hôtellerie',       'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Management et gestion des organisations sportives','LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Journalisme',                                      'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Banque et finance',                                'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Monnaie et finance',                               'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Banque-assurance',                                 'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Technologies alimentaires et biologiques',         'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Aquaculture',                                      'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Informatique industrielle',                        'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Génie mécanique',                                  'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Génie industriel',                                 'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Agro-business',                                    'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Modélisation économétrique et analyse des données','LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),
('Diplomatie, protocole et relations publiques',     'LICENCE', 'Licence 1', @id_lic1, NOW(), NOW()),

-- === Licence 2 ===
('Administration générale',                          'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Administration des collectivités territoriales',   'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Administration des collectivités locales',         'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Marketing digital et E-business',                  'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Protocole et relations publiques',                 'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Gestion commerciale',                              'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Gestion des ressources humaines',                  'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Science et techniques comptables et financières',  'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Audit et contrôle de gestion',                     'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Commerce international',                           'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Transport logistique',                             'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Marketing-communication',                          'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Gestion des projets et passation des marchés',     'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Réseaux et télécommunication',                     'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Génie logiciel',                                   'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Génie civil',                                      'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Énergies renouvelables et efficacité énergétique', 'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Sécurité informatique — cybercriminalité',         'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Marketing',                                        'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Génie électrique',                                 'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Administration et gestion des affaires',           'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Gestion fiscale des entreprises',                  'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Économie des transports et développement social',  'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Management du tourisme et de l''hôtellerie',       'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Management et gestion des organisations sportives','LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Journalisme',                                      'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Banque et finance',                                'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Monnaie et finance',                               'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Banque-assurance',                                 'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Technologies alimentaires et biologiques',         'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Aquaculture',                                      'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Informatique industrielle',                        'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Génie mécanique',                                  'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Génie industriel',                                 'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Agro-business',                                    'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Modélisation économétrique et analyse des données','LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),
('Diplomatie, protocole et relations publiques',     'LICENCE', 'Licence 2', @id_lic2, NOW(), NOW()),

-- === Licence 3 ===
('Administration générale',                          'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Administration des collectivités territoriales',   'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Administration des collectivités locales',         'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Marketing digital et E-business',                  'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Protocole et relations publiques',                 'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Gestion commerciale',                              'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Gestion des ressources humaines',                  'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Science et techniques comptables et financières',  'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Audit et contrôle de gestion',                     'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Commerce international',                           'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Transport logistique',                             'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Marketing-communication',                          'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Gestion des projets et passation des marchés',     'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Réseaux et télécommunication',                     'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Génie logiciel',                                   'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Génie civil',                                      'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Énergies renouvelables et efficacité énergétique', 'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Sécurité informatique — cybercriminalité',         'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Marketing',                                        'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Génie électrique',                                 'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Administration et gestion des affaires',           'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Gestion fiscale des entreprises',                  'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Économie des transports et développement social',  'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Management du tourisme et de l''hôtellerie',       'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Management et gestion des organisations sportives','LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Journalisme',                                      'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Banque et finance',                                'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Monnaie et finance',                               'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Banque-assurance',                                 'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Technologies alimentaires et biologiques',         'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Aquaculture',                                      'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Informatique industrielle',                        'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Génie mécanique',                                  'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Génie industriel',                                 'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Agro-business',                                    'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Modélisation econométrique et analyse des données','LICENCE', 'Licence 3', @id_lic3, NOW(), NOW()),
('Diplomatie, protocole et relations publiques',     'LICENCE', 'Licence 3', @id_lic3, NOW(), NOW());

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. MASTER — 37 filières × 2 grades = 74 lignes
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO `ins_parcours` (`titre`, `type`, `grade`, `niveauEtudeId`, `createdAt`, `updatedAt`) VALUES
-- === Master 1 ===
('Administration générale',                          'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Administration des collectivités territoriales',   'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Administration des collectivités locales',         'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Marketing digital et E-business',                  'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Protocole et relations publiques',                 'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Gestion commerciale',                              'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Gestion des ressources humaines',                  'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Science et techniques comptables et financières',  'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Audit et contrôle de gestion',                     'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Commerce international',                           'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Transport logistique',                             'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Marketing-communication',                          'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Gestion des projets et passation des marchés',     'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Réseaux et télécommunication',                     'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Génie logiciel',                                   'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Génie civil',                                      'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Énergies renouvelables et efficacité énergétique', 'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Sécurité informatique — cybercriminalité',         'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Marketing',                                        'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Génie électrique',                                 'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Administration et gestion des affaires',           'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Gestion fiscale des entreprises',                  'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Économie des transports et développement social',  'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Management du tourisme et de l''hôtellerie',       'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Management et gestion des organisations sportives','MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Journalisme',                                      'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Banque et finance',                                'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Monnaie et finance',                               'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Banque-assurance',                                 'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Technologies alimentaires et biologiques',         'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Aquaculture',                                      'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Informatique industrielle',                        'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Génie mécanique',                                  'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Génie industriel',                                 'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Agro-business',                                    'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Modélisation économétrique et analyse des données','MASTER', 'Master 1', @id_mas1, NOW(), NOW()),
('Diplomatie, protocole et relations publiques',     'MASTER', 'Master 1', @id_mas1, NOW(), NOW()),

-- === Master 2 ===
('Administration générale',                          'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Administration des collectivités territoriales',   'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Administration des collectivités locales',         'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Marketing digital et E-business',                  'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Protocole et relations publiques',                 'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Gestion commerciale',                              'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Gestion des ressources humaines',                  'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Science et techniques comptables et financières',  'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Audit et contrôle de gestion',                     'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Commerce international',                           'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Transport logistique',                             'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Marketing-communication',                          'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Gestion des projets et passation des marchés',     'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Réseaux et télécommunication',                     'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Génie logiciel',                                   'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Génie civil',                                      'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Énergies renouvelables et efficacité énergétique', 'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Sécurité informatique — cybercriminalité',         'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Marketing',                                        'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Génie électrique',                                 'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Administration et gestion des affaires',           'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Gestion fiscale des entreprises',                  'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Économie des transports et développement social',  'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Management du tourisme et de l''hôtellerie',       'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Management et gestion des organisations sportives','MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Journalisme',                                      'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Banque et finance',                                'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Monnaie et finance',                               'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Banque-assurance',                                 'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Technologies alimentaires et biologiques',         'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Aquaculture',                                      'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Informatique industrielle',                        'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Génie mécanique',                                  'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Génie industriel',                                 'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Agro-business',                                    'MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Modélisation économétrique et analyse des données','MASTER', 'Master 2', @id_mas2, NOW(), NOW()),
('Diplomatie, protocole et relations publiques',     'MASTER', 'Master 2', @id_mas2, NOW(), NOW());

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. MBA — 2 filières × 2 grades = 4 lignes
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO `ins_parcours` (`titre`, `type`, `grade`, `niveauEtudeId`, `createdAt`, `updatedAt`) VALUES
('Gestion des entreprises',                              'MBA', 'MBA 1', @id_mba1, NOW(), NOW()),
('Leadership, gouvernance et performance des équipes',   'MBA', 'MBA 1', @id_mba1, NOW(), NOW()),
('Gestion des entreprises',                              'MBA', 'MBA 2', @id_mba2, NOW(), NOW()),
('Leadership, gouvernance et performance des équipes',   'MBA', 'MBA 2', @id_mba2, NOW(), NOW());

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. BTS — 29 filières × 2 grades = 58 lignes
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO `ins_parcours` (`titre`, `type`, `grade`, `niveauEtudeId`, `createdAt`, `updatedAt`) VALUES
-- === BTS 1 ===
('Comptabilité et gestion des entreprises',                          'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Communication des entreprises',                                    'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Assistant de gestion PME/PMI',                                     'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Génie civil',                                                      'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Secrétariat de direction',                                         'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Commerce international',                                           'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Transport logistique',                                             'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Action commerciale et force de vente',                             'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Gestion des ressources humaines',                                  'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Gestion des collectivités locales',                                'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Informatique de gestion — développeur d''application',             'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Informatique de gestion — administrateur de réseaux',              'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Télécommunications',                                               'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Maintenance informatique et réseaux',                              'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Journalisme',                                                      'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Informatique industrielle',                                        'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Géomètre topographe',                                              'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Assurance',                                                        'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Finance banque',                                                   'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Génie électrique',                                                 'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Restauration',                                                     'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Hôtellerie',                                                       'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Génie thermique',                                                  'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Électromécanique',                                                 'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Électronique',                                                     'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Électrotechnique',                                                 'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Tourisme et loisirs',                                              'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Aquaculture',                                                      'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),
('Technologies alimentaires et biologiques',                         'BTS', 'BTS 1', @id_bts1, NOW(), NOW()),

-- === BTS 2 ===
('Comptabilité et gestion des entreprises',                          'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Communication des entreprises',                                    'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Assistant de gestion PME/PMI',                                     'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Génie civil',                                                      'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Secrétariat de direction',                                         'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Commerce international',                                           'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Transport logistique',                                             'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Action commerciale et force de vente',                             'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Gestion des ressources humaines',                                  'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Gestion des collectivités locales',                                'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Informatique de gestion — développeur d''application',             'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Informatique de gestion — administrateur de réseaux',              'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Télécommunications',                                               'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Maintenance informatique et réseaux',                              'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Journalisme',                                                      'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Informatique industrielle',                                        'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Géomètre topographe',                                              'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Assurance',                                                        'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Finance banque',                                                   'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Génie électrique',                                                 'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Restauration',                                                     'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Hôtellerie',                                                       'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Génie thermique',                                                  'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Électromécanique',                                                 'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Électronique',                                                     'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Électrotechnique',                                                 'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Tourisme et loisirs',                                              'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Aquaculture',                                                      'BTS', 'BTS 2', @id_bts2, NOW(), NOW()),
('Technologies alimentaires et biologiques',                         'BTS', 'BTS 2', @id_bts2, NOW(), NOW());

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. DÉDUPLICATION FINALE — rend la migration IDEMPOTENTE
--    Garde le plus petit id par (titre, type, grade) ; toute re-exécution de ce
--    fichier aboutit au même état final (pas de doublons de filières).
-- ─────────────────────────────────────────────────────────────────────────────
DELETE d
FROM `ins_parcours` d
JOIN `ins_parcours` k
  ON d.`titre` = k.`titre`
 AND d.`type` = k.`type`
 AND d.`grade` = k.`grade`
 AND d.`id` > k.`id`;

-- ─────────────────────────────────────────────────────────────────────────────
-- Résumé : 111 (LICENCE) + 74 (MASTER) + 4 (MBA) + 58 (BTS) = 247 lignes
-- Chaque filière existe en double/triple selon le nombre de grades du cycle.
-- ─────────────────────────────────────────────────────────────────────────────
