-- Migration v5 : Multi-établissement (sites)
-- Ajoute etablissementId aux tables clés pour supporter plusieurs écoles/sites

-- 1. Ajouter des colonnes à eta_etablissements (logo, code, devise)
ALTER TABLE eta_etablissements
  ADD COLUMN IF NOT EXISTS code VARCHAR(10) NULL UNIQUE AFTER nom,
  ADD COLUMN IF NOT EXISTS logo VARCHAR(255) NULL AFTER siteWeb,
  ADD COLUMN IF NOT EXISTS devise VARCHAR(10) DEFAULT 'FCFA' AFTER logo,
  ADD COLUMN IF NOT EXISTS anneeScolaireCourante VARCHAR(20) NULL AFTER devise;

-- 2. Ajouter etablissementId à aut_utilisateurs
ALTER TABLE aut_utilisateurs
  ADD COLUMN IF NOT EXISTS etablissementId INT UNSIGNED NULL AFTER photoDeProfil,
  ADD INDEX IF NOT EXISTS idx_utilisateurs_etablissement (etablissementId),
  ADD CONSTRAINT IF NOT EXISTS fk_utilisateurs_etablissement
    FOREIGN KEY (etablissementId) REFERENCES eta_etablissements(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Ajouter etablissementId à ins_cours
ALTER TABLE ins_cours
  ADD COLUMN IF NOT EXISTS etablissementId INT UNSIGNED NULL AFTER enseignantId,
  ADD INDEX IF NOT EXISTS idx_cours_etablissement (etablissementId),
  ADD CONSTRAINT IF NOT EXISTS fk_cours_etablissement
    FOREIGN KEY (etablissementId) REFERENCES eta_etablissements(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Ajouter etablissementId à ins_classes
ALTER TABLE ins_classes
  ADD COLUMN IF NOT EXISTS etablissementId INT UNSIGNED NULL AFTER parcoursId,
  ADD INDEX IF NOT EXISTS idx_classes_etablissement (etablissementId),
  ADD CONSTRAINT IF NOT EXISTS fk_classes_etablissement
    FOREIGN KEY (etablissementId) REFERENCES eta_etablissements(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Ajouter etablissementId à ins_parcours
ALTER TABLE ins_parcours
  ADD COLUMN IF NOT EXISTS etablissementId INT UNSIGNED NULL AFTER niveauEtudeId,
  ADD INDEX IF NOT EXISTS idx_parcours_etablissement (etablissementId),
  ADD CONSTRAINT IF NOT EXISTS fk_parcours_etablissement
    FOREIGN KEY (etablissementId) REFERENCES eta_etablissements(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- 6. Ajouter etablissementId à ins_sessions
ALTER TABLE ins_sessions
  ADD COLUMN IF NOT EXISTS etablissementId INT UNSIGNED NULL AFTER niveauEtudeId,
  ADD INDEX IF NOT EXISTS idx_sessions_etablissement (etablissementId),
  ADD CONSTRAINT IF NOT EXISTS fk_sessions_etablissement
    FOREIGN KEY (etablissementId) REFERENCES eta_etablissements(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. Ajouter etablissementId à ins_demandes_inscription
ALTER TABLE ins_demandes_inscription
  ADD COLUMN IF NOT EXISTS etablissementId INT UNSIGNED NULL AFTER utilisateurId,
  ADD INDEX IF NOT EXISTS idx_demandes_inscription_etablissement (etablissementId),
  ADD CONSTRAINT IF NOT EXISTS fk_demandes_inscription_etablissement
    FOREIGN KEY (etablissementId) REFERENCES eta_etablissements(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- 8. Ajouter statutReinscription à ins_cursus_apprenants
ALTER TABLE ins_cursus_apprenants
  ADD COLUMN IF NOT EXISTS statutReinscription ENUM('en_attente','confirme','abandon','desactive') NULL DEFAULT NULL AFTER etablissementId,
  ADD COLUMN IF NOT EXISTS dateReinscription DATETIME NULL AFTER statutReinscription,
  ADD COLUMN IF NOT EXISTS emailReinscriptionEnvoyeLe DATETIME NULL AFTER dateReinscription;

-- 9. Créer une table pour journaliser les réinscriptions
CREATE TABLE IF NOT EXISTS ins_reinscriptions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cursusApprenantId INT UNSIGNED NOT NULL,
  anneeAcademiqueId INT UNSIGNED NOT NULL,
  statut ENUM('en_attente','confirme','abandon','desactive') DEFAULT 'en_attente',
  dateDecision DATETIME NULL,
  token VARCHAR(255) NULL,
  tokenExpireLe DATETIME NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME NULL,
  INDEX idx_reinscriptions_cursus (cursusApprenantId),
  INDEX idx_reinscriptions_token (token),
  CONSTRAINT fk_reinscriptions_cursus FOREIGN KEY (cursusApprenantId) REFERENCES ins_cursus_apprenants(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reinscriptions_annee FOREIGN KEY (anneeAcademiqueId) REFERENCES ins_annees_academiques(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Table pour les préférences d'établissement
CREATE TABLE IF NOT EXISTS eta_preferences (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  etablissementId INT UNSIGNED NOT NULL,
  cle VARCHAR(100) NOT NULL,
  valeur TEXT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_preference_etab_cle (etablissementId, cle),
  CONSTRAINT fk_preferences_etablissement FOREIGN KEY (etablissementId) REFERENCES eta_etablissements(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
