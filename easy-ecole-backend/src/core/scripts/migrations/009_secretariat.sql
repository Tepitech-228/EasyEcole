-- Migration 009 — MODULE SECRÉTARIAT
-- Tables: scol_recus_caisse, scol_clotures_caisse, scol_journal_caisse, scol_journal_secretariat
-- Colonnes complémentaires sur scol_demandes_document pour le workflow secrétariat

-- 1. Reçus de caisse
CREATE TABLE IF NOT EXISTS scol_recus_caisse (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  numero VARCHAR(40) NOT NULL,
  demande_document_id INT UNSIGNED NOT NULL,
  montant FLOAT NOT NULL DEFAULT 0,
  mode_paiement ENUM('especes','mobile_money','autre') NOT NULL DEFAULT 'especes',
  caissier_id INT UNSIGNED NOT NULL,
  date_paiement DATETIME NOT NULL,
  fichier_pdf VARCHAR(255) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_scol_recus_numero (numero),
  CONSTRAINT fk_scol_recus_demande FOREIGN KEY (demande_document_id) REFERENCES scol_demandes_document(id) ON DELETE CASCADE,
  CONSTRAINT fk_scol_recus_caissier FOREIGN KEY (caissier_id) REFERENCES aut_utilisateurs(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Clôtures de caisse
CREATE TABLE IF NOT EXISTS scol_clotures_caisse (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  date_cloture DATE NOT NULL,
  caissier_id INT UNSIGNED NOT NULL,
  montant_theorique FLOAT NOT NULL DEFAULT 0,
  montant_reel FLOAT NOT NULL DEFAULT 0,
  ecart FLOAT NOT NULL DEFAULT 0,
  statut ENUM('ouverte','cloturee') NOT NULL DEFAULT 'ouverte',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_scol_clotures_caissier FOREIGN KEY (caissier_id) REFERENCES aut_utilisateurs(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Journal de caisse (détail transactions)
CREATE TABLE IF NOT EXISTS scol_journal_caisse (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cloture_id INT UNSIGNED NULL,
  demande_document_id INT UNSIGNED NULL,
  recu_id INT UNSIGNED NULL,
  mode_paiement ENUM('especes','mobile_money','autre') NOT NULL DEFAULT 'especes',
  montant FLOAT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_scol_journal_cloture FOREIGN KEY (cloture_id) REFERENCES scol_clotures_caisse(id) ON DELETE SET NULL,
  CONSTRAINT fk_scol_journal_demande FOREIGN KEY (demande_document_id) REFERENCES scol_demandes_document(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Journal de traçabilité secrétariat
CREATE TABLE IF NOT EXISTS scol_journal_secretariat (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  action VARCHAR(50) NOT NULL,
  utilisateur_id INT UNSIGNED NULL,
  demande_document_id INT UNSIGNED NULL,
  details VARCHAR(500) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_scol_journal_secretariat_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES aut_utilisateurs(id) ON DELETE SET NULL,
  CONSTRAINT fk_scol_journal_secretariat_demande FOREIGN KEY (demande_document_id) REFERENCES scol_demandes_document(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Extension du statut des demandes de documents
ALTER TABLE scol_demandes_document MODIFY COLUMN statut ENUM('soumise','en_attente_paiement','paye','en_preparation','document_pret','remise','rejetee','annulee','validee','delivree') NOT NULL DEFAULT 'soumise';

-- 6. Colonnes workflow secrétariat sur scol_demandes_document
ALTER TABLE scol_demandes_document
  ADD COLUMN numero_demande VARCHAR(40) NULL AFTER annee_academique_id,
  ADD COLUMN date_paiement DATETIME NULL AFTER frais_payes,
  ADD COLUMN mode_paiement ENUM('especes','mobile_money','autre') NULL AFTER date_paiement,
  ADD COLUMN numero_recu VARCHAR(40) NULL AFTER mode_paiement,
  ADD COLUMN date_preparation DATETIME NULL AFTER numero_recu,
  ADD COLUMN date_generation DATETIME NULL AFTER date_preparation,
  ADD COLUMN fichier_pdf VARCHAR(255) NULL AFTER date_generation,
  ADD COLUMN date_impression DATETIME NULL AFTER fichier_pdf,
  ADD COLUMN nb_impressions INT NOT NULL DEFAULT 0 AFTER date_impression,
  ADD COLUMN date_remise DATETIME NULL AFTER nb_impressions,
  ADD COLUMN remis_par_id INT UNSIGNED NULL AFTER date_remise,
  ADD COLUMN motif_rejet VARCHAR(255) NULL AFTER remis_par_id;

-- 7. Index sur numero_demande
ALTER TABLE scol_demandes_document ADD UNIQUE INDEX uk_scol_dd_numero (numero_demande);

-- 8. Index performances
CREATE INDEX IF NOT EXISTS idx_scol_recus_demande ON scol_recus_caisse(demande_document_id);
CREATE INDEX IF NOT EXISTS idx_scol_recus_caissier ON scol_recus_caisse(caissier_id);
CREATE INDEX IF NOT EXISTS idx_scol_journal_cloture ON scol_journal_caisse(cloture_id);
CREATE INDEX IF NOT EXISTS idx_scol_journal_demande ON scol_journal_caisse(demande_document_id);
CREATE INDEX IF NOT EXISTS idx_scol_journal_secretariat_demande ON scol_journal_secretariat(demande_document_id);
CREATE INDEX IF NOT EXISTS idx_scol_journal_secretariat_utilisateur ON scol_journal_secretariat(utilisateur_id);
