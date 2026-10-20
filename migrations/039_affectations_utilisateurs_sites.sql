-- Affectations multi-sites : le champ historique aut_utilisateurs.etablissementId
-- reste la valeur par défaut afin de préserver les anciens clients.
CREATE TABLE IF NOT EXISTS `aut_utilisateur_etablissements` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `utilisateurId` INT UNSIGNED NOT NULL,
  `etablissementId` INT UNSIGNED NOT NULL,
  `affectePar` INT UNSIGNED NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_utilisateur_etablissement` (`utilisateurId`, `etablissementId`),
  KEY `idx_affectation_etablissement` (`etablissementId`, `utilisateurId`),
  CONSTRAINT `fk_affectation_utilisateur`
    FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_affectation_etablissement`
    FOREIGN KEY (`etablissementId`) REFERENCES `eta_etablissements` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_affectation_auteur`
    FOREIGN KEY (`affectePar`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `aut_utilisateur_etablissements` (`utilisateurId`, `etablissementId`, `createdAt`, `updatedAt`)
SELECT `id`, `etablissementId`, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM `aut_utilisateurs`
WHERE `etablissementId` IS NOT NULL;

INSERT IGNORE INTO `aut_utilisateur_etablissements` (`utilisateurId`, `etablissementId`, `createdAt`, `updatedAt`)
SELECT DISTINCT u.`id`, c.`etablissementId`, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM `aut_utilisateurs` u
JOIN `aut_enseignants` e ON e.`utilisateurId` = u.`id`
JOIN `ins_cours` c ON c.`enseignantId` = e.`id`
WHERE c.`etablissementId` IS NOT NULL;

INSERT IGNORE INTO `aut_utilisateur_etablissements` (`utilisateurId`, `etablissementId`, `createdAt`, `updatedAt`)
SELECT DISTINCT u.`id`, p.`etablissementId`, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM `aut_utilisateurs` u
JOIN `aut_personnel_administratif` p ON p.`utilisateurId` = u.`id`
WHERE p.`etablissementId` IS NOT NULL;

INSERT IGNORE INTO `aut_utilisateur_etablissements` (`utilisateurId`, `etablissementId`, `createdAt`, `updatedAt`)
SELECT DISTINCT u.`id`, ca.`etablissementId`, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM `aut_utilisateurs` u
JOIN `ins_cursus_apprenants` ca ON ca.`utilisateurId` = u.`id`
WHERE ca.`etablissementId` IS NOT NULL;
