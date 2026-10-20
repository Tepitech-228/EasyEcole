-- Une session peut concerner plusieurs classes/sites ; classeId reste renseigné
-- pour assurer la compatibilité avec les anciennes API et les formulaires existants.
CREATE TABLE IF NOT EXISTS `ins_session_examen_classes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sessionExamenId` INT UNSIGNED NOT NULL,
  `classeId` INT UNSIGNED NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_session_examen_classe` (`sessionExamenId`, `classeId`),
  KEY `idx_session_examen_classes_classe` (`classeId`, `sessionExamenId`),
  CONSTRAINT `fk_session_examen_classes_session`
    FOREIGN KEY (`sessionExamenId`) REFERENCES `ins_sessions_examens` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_session_examen_classes_classe`
    FOREIGN KEY (`classeId`) REFERENCES `ins_classes` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `ins_session_examen_classes` (`sessionExamenId`, `classeId`, `createdAt`, `updatedAt`)
SELECT `id`, `classeId`, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM `ins_sessions_examens`
WHERE `classeId` IS NOT NULL;
