-- Migration : stockage unifié des PDF
-- Ajout table documents pour le nouveau service de stockage

CREATE TABLE IF NOT EXISTS documents (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cheminRelatif VARCHAR(1000) NOT NULL COMMENT 'Chemin relatif depuis racine stockage {annee}/{mois}/{type}/nomfichier',
  
omFichier VARCHAR(255) NOT NULL COMMENT 'Nom de fichier assaini',
  	aille BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Taille en octets',
  sha256 CHAR(64) NULL COMMENT 'Hash SHA-256 du fichier',
  hash CHAR(64) NULL COMMENT 'Alias pour compatibilité',
  direction ENUM('cree', 'recu') NOT NULL DEFAULT 'cree' COMMENT 'cree = généré par l''application, recu = upload externe',
  	ypeDocument VARCHAR(100) NULL COMMENT 'Type/catégorie du document',
  mimeType VARCHAR(120) NULL DEFAULT 'application/pdf',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_documents_chemin_relatif (cheminRelatif(255)),
  KEY idx_documents_sha256 (sha256),
  KEY idx_documents_hash (hash),
  KEY idx_documents_direction (direction),
  KEY idx_documents_created_at (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Synchroniser hash depuis sha256 si existant
UPDATE documents SET hash = sha256 WHERE hash IS NULL AND sha256 IS NOT NULL;
