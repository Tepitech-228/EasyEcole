-- ============================================================
-- MODULE SECRÉTARIAT — EasyEcole
-- Workflow : soumise → en_attente_paiement → paye → en_preparation
--            → document_pret → remise (+ rejetee / annulee)
-- Idempotent : exécuté via src/core/scripts/migrate-secretariat.ts
--             (chaque instruction est gardée par une vérification)
-- ============================================================

-- 1. Nouveau rôle SECRETAIRE (enum gérée par le runner)

-- 2. Catalogue des documents enrichi
--    ALTER TABLE scol_types_document
--      ADD COLUMN categorie VARCHAR(80) NULL,
--      ADD COLUMN delaiTraitement INT NULL COMMENT 'délai indicatif en heures',
--      ADD COLUMN paiementObligatoire TINYINT(1) NOT NULL DEFAULT 1,
--      ADD COLUMN generationAuto TINYINT(1) NOT NULL DEFAULT 1,
--      ADD COLUMN actif TINYINT(1) NOT NULL DEFAULT 1;

-- 3. Demandes de documents : workflow secrétariat
--    ALTER TABLE scol_demandes_document
--      MODIFY COLUMN statut ENUM('soumise','en_attente_paiement','paye','en_preparation','document_pret','remise','rejetee','annulee','validee','delivree') NOT NULL DEFAULT 'soumise',
--      ADD COLUMN numeroDemande VARCHAR(40) NULL,
--      ADD UNIQUE INDEX uk_scol_dd_numero (numeroDemande),
--      ADD COLUMN datePaiement DATETIME NULL,
--      ADD COLUMN modePaiement VARCHAR(20) NULL,
--      ADD COLUMN numeroRecu VARCHAR(40) NULL,
--      ADD COLUMN datePreparation DATETIME NULL,
--      ADD COLUMN dateGeneration DATETIME NULL,
--      ADD COLUMN fichierPDF VARCHAR(255) NULL,
--      ADD COLUMN dateImpression DATETIME NULL,
--      ADD COLUMN nbImpressions INT NOT NULL DEFAULT 0,
--      ADD COLUMN dateRemise DATETIME NULL,
--      ADD COLUMN remisParId INT UNSIGNED NULL,
--      ADD COLUMN motifRejet VARCHAR(255) NULL;

-- 4. Reçus de caisse
CREATE TABLE IF NOT EXISTS scol_recus_caisse (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(40) NOT NULL,
    demandeDocumentId INT UNSIGNED NOT NULL,
    montant DOUBLE NOT NULL DEFAULT 0,
    modePaiement VARCHAR(20) NOT NULL DEFAULT 'especes',
    caissierId INT UNSIGNED NOT NULL,
    datePaiement DATETIME NOT NULL,
    fichierPDF VARCHAR(255) NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME NULL,
    UNIQUE KEY uk_recus_numero (numero),
    KEY idx_recus_caissier (caissierId),
    KEY idx_recus_date (datePaiement)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Clôtures de caisse
CREATE TABLE IF NOT EXISTS scol_clotures_caisse (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    caissierId INT UNSIGNED NOT NULL,
    periodeDebut DATETIME NOT NULL,
    periodeFin DATETIME NOT NULL,
    totalTheorique DOUBLE NOT NULL DEFAULT 0,
    totalConstate DOUBLE NOT NULL DEFAULT 0,
    ecart DOUBLE NOT NULL DEFAULT 0,
    nbRecus INT NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME NULL,
    KEY idx_clotures_caissier (caissierId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Journal de traçabilité du secrétariat
CREATE TABLE IF NOT EXISTS scol_journal_secretariat (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    utilisateurId INT UNSIGNED NULL,
    demandeDocumentId INT UNSIGNED NULL,
    details VARCHAR(500) NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt DATETIME NULL,
    KEY idx_journal_action (action),
    KEY idx_journal_demande (demandeDocumentId),
    KEY idx_journal_date (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
