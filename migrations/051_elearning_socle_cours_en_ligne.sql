-- =============================================================================
-- 051_elearning_socle_cours_en_ligne.sql
-- -----------------------------------------------------------------------------
-- Lot L0 — Socle donnees du pole « cours en ligne » (e-learning).
--
-- Contenu :
--   1a) elearning_cours     : colonnes du socle + normalisation du `statut`
--   1b) elearning_modules   : anneeAcademiqueId
--   1c) elearning_supports  : anneeAcademiqueId, accessibilite, titre, cheminFichier
--   1d) elearning_annees          (D13 — annee courante du module e-learning)
--   1e) elearning_tarifs_credit   (tarif unitaire du credit cours en ligne)
--   1f) elearning_enveloppes      (D14 — enveloppe de credit par utilisateur)
--   1g) elearning_mouvements      (D12 — journal des mouvements, table dediee)
--   1h) elearning_encaissements
--   1i) elearning_selections_cours
--   1j) elearning_audit
--   1k) seeds idempotents
--
-- Garanties :
--   - NON DESTRUCTIVE : aucun DROP, aucun TRUNCATE, aucune donnee supprimee.
--   - IDEMPOTENTE    : ADD COLUMN IF NOT EXISTS / ADD KEY IF NOT EXISTS /
--                      ADD CONSTRAINT IF NOT EXISTS / CREATE TABLE IF NOT EXISTS /
--                      INSERT ... WHERE NOT EXISTS / INSERT ... ON DUPLICATE KEY.
--   - REJOUABLE      : le fichier peut etre reexecute sans effet de bord.
--   - CHARSET        : utf8mb3_general_ci (identique aux tables deja en base).
--   - FK             : toutes les references pointees existent et sont en
--                      INT UNSIGNED : aut_utilisateurs, ins_cours,
--                      ins_annees_academiques, ins_niveaux_etudes.
--
-- ORDRE IMPERATIF pour `elearning_cours`.`statut` :
--   les deux UPDATE doivent preceder le MODIFY. Sans cela, la conversion
--   VARCHAR -> ENUM echoue en mode strict (Data truncated) ou tronque les
--   valeurs legacy a '' (mode non strict) : l'information « publie » serait
--   perdue pour les 2 lignes existantes (`statut` = 'actif').
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1a) elearning_cours — colonnes du socle
-- -----------------------------------------------------------------------------
-- D1 : `coursId` reste un VARCHAR heritage (valeurs '1' / '7') et n'est PAS
-- converti en cle etrangere vers `ins_cours`.`id` (type incompatible).
-- La reference vers l UE est portee par la nouvelle colonne `ueId`.
-- Pas de colonne `filiereId` : aucun referentiel filiere n'existe en base.
-- D10 : les montants monetaires sont en DECIMAL(15,2) (FCFA) ; les « credits »
-- sont un entier separe (`nbCredits`).
ALTER TABLE `elearning_cours`
  ADD COLUMN IF NOT EXISTS `code` VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS `ueId` INT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS `niveauEtudeId` INT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS `anneeAcademiqueId` INT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS `nbCredits` INT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `coutUnitaire` DECIMAL(15,2) NULL,
  ADD COLUMN IF NOT EXISTS `coutTotal` DECIMAL(15,2) NULL,
  ADD COLUMN IF NOT EXISTS `chargeSupportId` INT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS `professeurId` INT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS `datePublication` DATETIME NULL;

ALTER TABLE `elearning_cours`
  ADD KEY IF NOT EXISTS `idx_elearning_cours_code` (`code`);

-- `chargeSupportId` et `professeurId` pointent tous deux vers
-- `aut_utilisateurs`.`id` : aucun role « charge_support » n'existe (lot L7).
-- NOTE MariaDB : la forme `ADD CONSTRAINT IF NOT EXISTS <nom> FOREIGN KEY ...`
-- est une ERREUR DE SYNTAXE. La forme acceptee par MariaDB 11.4 est
-- `ADD CONSTRAINT <nom> FOREIGN KEY IF NOT EXISTS (<col>) REFERENCES ...` :
-- le `IF NOT EXISTS` se place APRES `FOREIGN KEY`. L'idempotence est la meme.
ALTER TABLE `elearning_cours`
  ADD CONSTRAINT `fk_elearning_cours_ue` FOREIGN KEY IF NOT EXISTS (`ueId`)
    REFERENCES `ins_cours` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_elearning_cours_niveau` FOREIGN KEY IF NOT EXISTS (`niveauEtudeId`)
    REFERENCES `ins_niveaux_etudes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_elearning_cours_annee` FOREIGN KEY IF NOT EXISTS (`anneeAcademiqueId`)
    REFERENCES `ins_annees_academiques` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_elearning_cours_charge_support` FOREIGN KEY IF NOT EXISTS (`chargeSupportId`)
    REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_elearning_cours_professeur` FOREIGN KEY IF NOT EXISTS (`professeurId`)
    REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL;

-- 1) Legacy 'actif' -> 'publie' (avant toute conversion de type).
UPDATE `elearning_cours` SET `statut` = 'publie' WHERE `statut` = 'actif';

-- 2) Toute valeur hors enum (NULL, vide, inconnue) -> 'brouillon'.
UPDATE `elearning_cours`
SET `statut` = 'brouillon'
WHERE `statut` IS NULL
   OR `statut` = ''
   OR `statut` NOT IN ('publie', 'brouillon', 'desactive');

-- 3) Conversion effective en ENUM (uniquement apres les 2 UPDATE ci-dessus).
ALTER TABLE `elearning_cours`
  MODIFY COLUMN `statut` ENUM('brouillon', 'publie', 'desactive') NOT NULL DEFAULT 'brouillon';

-- -----------------------------------------------------------------------------
-- 1b) elearning_modules — annee academique de rattachement
-- -----------------------------------------------------------------------------
ALTER TABLE `elearning_modules`
  ADD COLUMN IF NOT EXISTS `anneeAcademiqueId` INT UNSIGNED NULL;

ALTER TABLE `elearning_modules`
  ADD CONSTRAINT `fk_elearning_modules_annee` FOREIGN KEY IF NOT EXISTS (`anneeAcademiqueId`)
    REFERENCES `ins_annees_academiques` (`id`) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 1c) elearning_supports — annee, accessibilite, titre et chemin reel du fichier
-- -----------------------------------------------------------------------------
-- D15 : le chemin reel du fichier n'etait stocké nulle part : la colonne
-- `cheminFichier` est indispensable au correctif de diffusion du lot L4.
ALTER TABLE `elearning_supports`
  ADD COLUMN IF NOT EXISTS `anneeAcademiqueId` INT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS `accessibilite` ENUM('libre', 'paye') NOT NULL DEFAULT 'libre',
  ADD COLUMN IF NOT EXISTS `titre` VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS `cheminFichier` VARCHAR(500) NULL;

ALTER TABLE `elearning_supports`
  ADD CONSTRAINT `fk_elearning_supports_annee`
    FOREIGN KEY IF NOT EXISTS (`anneeAcademiqueId`) REFERENCES `ins_annees_academiques` (`id`) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 1d) elearning_annees — « annee courante » du module e-learning (D13)
-- -----------------------------------------------------------------------------
-- `ins_annees_academiques` n'est PAS modifiee : ses libelles sont incoherents
-- (« 2028-2027 », « 2030-2029 »…) et aucune ligne ne porte l'annee courante.
CREATE TABLE IF NOT EXISTS `elearning_annees` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `libelle` VARCHAR(100) NOT NULL,
  `dateDebut` DATE NOT NULL,
  `dateFin` DATE NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 0,
  `anneeAcademiqueId` INT UNSIGNED NULL,
  `createdAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_elearning_annees_libelle` (`libelle`),
  KEY `idx_elearning_annees_active` (`active`),
  CONSTRAINT `fk_elearning_annees_annee_academique`
    FOREIGN KEY (`anneeAcademiqueId`) REFERENCES `ins_annees_academiques` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- -----------------------------------------------------------------------------
-- 1e) elearning_tarifs_credit — tarif unitaire du credit cours en ligne
-- -----------------------------------------------------------------------------
-- Les montants sont monetaires (FCFA) : DECIMAL(15,2). Les « credits » sont
-- un entier separe (`credits` de `elearning_selections_cours`).
CREATE TABLE IF NOT EXISTS `elearning_tarifs_credit` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `cle` VARCHAR(100) NOT NULL,
  `libelle` VARCHAR(255) NOT NULL,
  `valeur` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `unite` VARCHAR(20) NOT NULL DEFAULT 'FCFA',
  `dateEffet` DATE NOT NULL,
  `anneeAcademiqueId` INT UNSIGNED NULL,
  `actif` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_elearning_tarifs_credit_cle` (`cle`),
  KEY `idx_elearning_tarifs_credit_date_effet` (`dateEffet`),
  CONSTRAINT `fk_elearning_tarifs_credit_annee`
    FOREIGN KEY (`anneeAcademiqueId`) REFERENCES `ins_annees_academiques` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- -----------------------------------------------------------------------------
-- 1f) elearning_enveloppes — enveloppe de credit (D14)
-- -----------------------------------------------------------------------------
-- L'enveloppe est ancree sur `utilisateurId` (NOT NULL) + `anneeAcademiqueId`
-- (NOT NULL). `dossierEtudiantId` reste NULLABLE (tracabilite facultative) et
-- SANS cle etrangere : `ins_dossiers_etudiants` appartient au module
-- inscription et on ne veut pas y poser de dependance applicative.
CREATE TABLE IF NOT EXISTS `elearning_enveloppes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `utilisateurId` INT UNSIGNED NOT NULL,
  `dossierEtudiantId` INT UNSIGNED NULL,
  `anneeAcademiqueId` INT UNSIGNED NOT NULL,
  `montantAlloue` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `montantReserve` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `montantConsomme` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `statut` ENUM('ouverte', 'suspendue', 'cloturee') NOT NULL DEFAULT 'ouverte',
  `dateCloture` DATE NULL,
  `createdAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_elearning_enveloppes_utilisateur_annee` (`utilisateurId`, `anneeAcademiqueId`),
  KEY `idx_elearning_enveloppes_annee` (`anneeAcademiqueId`),
  CONSTRAINT `fk_elearning_enveloppes_utilisateur`
    FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_elearning_enveloppes_annee`
    FOREIGN KEY (`anneeAcademiqueId`) REFERENCES `ins_annees_academiques` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- -----------------------------------------------------------------------------
-- 1g) elearning_mouvements — journal des mouvements (D12)
-- -----------------------------------------------------------------------------
-- Table DEDIEE au module e-learning : `cpt_portefeuille_credit` n'est ni
-- modifie ni alimente (decision D12 : 66 lignes dont 1 seul dossier rattache
-- sur 136 apprenants, le journal n'y est pas exploitable).
-- Aucune colonne `mouvementPortefeuilleId` n'est creee.
CREATE TABLE IF NOT EXISTS `elearning_mouvements` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `enveloppeId` INT UNSIGNED NOT NULL,
  `type` ENUM('credit', 'consommation', 'ajustement') NOT NULL,
  `montant` DECIMAL(15,2) NOT NULL,
  `soldeCourant` DECIMAL(15,2) NOT NULL,
  `commentaire` VARCHAR(255) NULL,
  `referenceType` VARCHAR(50) NULL,
  `referenceId` INT UNSIGNED NULL,
  `dateMouvement` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_elearning_mouvements_enveloppe` (`enveloppeId`, `id`),
  KEY `idx_elearning_mouvements_date` (`dateMouvement`),
  CONSTRAINT `fk_elearning_mouvements_enveloppe`
    FOREIGN KEY (`enveloppeId`) REFERENCES `elearning_enveloppes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- -----------------------------------------------------------------------------
-- 1h) elearning_encaissements — encaissements rattaches a une enveloppe
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `elearning_encaissements` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `enveloppeId` INT UNSIGNED NOT NULL,
  `utilisateurId` INT UNSIGNED NOT NULL,
  `agentId` INT UNSIGNED NULL,
  `anneeAcademiqueId` INT UNSIGNED NOT NULL,
  `montant` DECIMAL(15,2) NOT NULL,
  `reference` VARCHAR(191) NULL,
  `dateEncaissement` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `statut` ENUM('saisi', 'valide', 'annule') NOT NULL DEFAULT 'saisi',
  `mouvementId` INT UNSIGNED NULL,
  `commentaire` TEXT NULL,
  `createdAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_elearning_encaissements_annee_statut` (`anneeAcademiqueId`, `statut`),
  CONSTRAINT `fk_elearning_encaissements_enveloppe`
    FOREIGN KEY (`enveloppeId`) REFERENCES `elearning_enveloppes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_elearning_encaissements_utilisateur`
    FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_elearning_encaissements_agent`
    FOREIGN KEY (`agentId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_elearning_encaissements_annee`
    FOREIGN KEY (`anneeAcademiqueId`) REFERENCES `ins_annees_academiques` (`id`),
  CONSTRAINT `fk_elearning_encaissements_mouvement`
    FOREIGN KEY (`mouvementId`) REFERENCES `elearning_mouvements` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- -----------------------------------------------------------------------------
-- 1i) elearning_selections_cours — selections de cours par un apprenant
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `elearning_selections_cours` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `enveloppeId` INT UNSIGNED NOT NULL,
  `utilisateurId` INT UNSIGNED NOT NULL,
  `dossierEtudiantId` INT UNSIGNED NULL,
  `coursId` INT UNSIGNED NOT NULL,
  `ueId` INT UNSIGNED NULL,
  `anneeAcademiqueId` INT UNSIGNED NOT NULL,
  `credits` INT UNSIGNED NOT NULL DEFAULT 0,
  `coutFige` DECIMAL(15,2) NOT NULL,
  `statut` ENUM('propose', 'en_attente_comite', 'valide_payee', 'acces_ouvert', 'rejete', 'retiree', 'remboursee') NOT NULL DEFAULT 'propose',
  `dateProposition` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateValidation` DATETIME NULL,
  `validePar` INT UNSIGNED NULL,
  `mouvementId` INT UNSIGNED NULL,
  `createdAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_elearning_selections_cours` (`utilisateurId`, `coursId`, `anneeAcademiqueId`),
  KEY `idx_elearning_selections_cours_statut` (`statut`),
  CONSTRAINT `fk_elearning_selections_cours_enveloppe`
    FOREIGN KEY (`enveloppeId`) REFERENCES `elearning_enveloppes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_elearning_selections_cours_utilisateur`
    FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_elearning_selections_cours_cours`
    FOREIGN KEY (`coursId`) REFERENCES `elearning_cours` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_elearning_selections_cours_ue`
    FOREIGN KEY (`ueId`) REFERENCES `ins_cours` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_elearning_selections_cours_annee`
    FOREIGN KEY (`anneeAcademiqueId`) REFERENCES `ins_annees_academiques` (`id`),
  CONSTRAINT `fk_elearning_selections_cours_valide_par`
    FOREIGN KEY (`validePar`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_elearning_selections_cours_mouvement`
    FOREIGN KEY (`mouvementId`) REFERENCES `elearning_mouvements` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- -----------------------------------------------------------------------------
-- 1j) elearning_audit — piste d'audit du module e-learning
-- -----------------------------------------------------------------------------
-- La table existe des le lot L0 (F3/F4) ; l'ecriture applicative et le
-- controle d'acces relèvent des lots L4/L7.
CREATE TABLE IF NOT EXISTS `elearning_audit` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `acteurId` INT UNSIGNED NULL,
  `acteurRole` VARCHAR(50) NULL,
  `action` VARCHAR(100) NOT NULL,
  `entite` VARCHAR(50) NOT NULL,
  `entiteId` VARCHAR(50) NULL,
  `payload` JSON NULL,
  `dateEvenement` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_elearning_audit_entite` (`entite`, `entiteId`),
  KEY `idx_elearning_audit_date` (`dateEvenement`),
  KEY `idx_elearning_audit_acteur` (`acteurId`),
  CONSTRAINT `fk_elearning_audit_acteur`
    FOREIGN KEY (`acteurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- -----------------------------------------------------------------------------
-- 1k) Seeds idempotents
-- -----------------------------------------------------------------------------
-- Annee par defaut : `anneeAcademiqueId` est resolu par sous-requête sur le
-- libelle '2025-2026' (aucun id en dur). Si l'annee academique n'existe pas,
-- la colonne reste NULL (elle est nullable) — aucune erreur, aucun blocage.
INSERT INTO `elearning_annees`
  (`libelle`, `dateDebut`, `dateFin`, `active`, `anneeAcademiqueId`, `createdAt`, `updatedAt`)
SELECT '2025-2026', '2025-09-01', '2026-08-31', 1,
  (SELECT `id` FROM `ins_annees_academiques` WHERE `libelle` = '2025-2026' LIMIT 1),
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `elearning_annees` WHERE `libelle` = '2025-2026'
);

-- Tarif du credit cours en ligne.
-- ATTENTION : `valeur` = 0 signifie « NON PARAMETRE ». Tant que le tarif
-- reste a 0, le code serveur doit REFUSER de calculer un cout (aucun cout
-- ne peut etre derive d'un tarif nul). Un administrateur doit renseigner
-- une valeur > 0 pour rendre la facturation effective.
INSERT INTO `elearning_tarifs_credit`
  (`cle`, `libelle`, `valeur`, `unite`, `dateEffet`, `anneeAcademiqueId`, `actif`, `createdAt`, `updatedAt`)
SELECT 'credit_cours_en_ligne', 'Tarif du crédit cours en ligne', 0, 'FCFA', '2025-09-01',
  (SELECT `id` FROM `ins_annees_academiques` WHERE `libelle` = '2025-2026' LIMIT 1),
  1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `elearning_tarifs_credit` WHERE `cle` = 'credit_cours_en_ligne'
);

-- Parametre de comptabilite : `ON DUPLICATE KEY UPDATE` ne touche QUE la cle
-- (no-op), afin de NE PAS ecraser une valeur deja parametrée par
-- l'administration. `cle` est UNIQUE (`uq_parametre_frais_cle`).
INSERT INTO `cpt_parametres_frais`
  (`cle`, `libelle`, `valeur`, `description`, `type`, `module`, `createdAt`, `updatedAt`)
VALUES (
  'elearning_prix_credit',
  'Prix du crédit cours en ligne',
  0,
  'Tarif unitaire du crédit cours en ligne (FCFA). 0 = non paramétré.',
  'montant',
  'elearning',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE `cle` = VALUES(`cle`);
