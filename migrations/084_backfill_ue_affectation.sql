-- 084_backfill_ue_affectation.sql
-- Répare l'affectation des UE pour les dossiers déjà validés.
--
-- Cause du bug : lors de la finalisation, les UE obligatoires du parcours final
-- sont insérées dans `ins_cours_choisis` DANS la transaction de validation, mais
-- la relecture qui crée les `ins_cours_participants` se faisait HORS transaction
-- et ne voyait donc pas ces lignes fraîchement insérées -> 0 UE affectée.
--
-- Cette migration (idempotente) :
--   1. ajoute les UE obligatoires manquantes du parcours final des dossiers validés ;
--   2. crée les `ins_cours_participants` manquants pour ces UE ;
--   3. rattache les participants existants au cursus le plus récent du même parcours
--      (cas des réinscriptions : même UE/cours, cursus plus récent).

-- 1) UE obligatoires manquantes dans ins_cours_choisis
INSERT IGNORE INTO `ins_cours_choisis` (`demandeInscriptionId`, `coursId`, `etat`, `createdAt`, `updatedAt`)
SELECT d.`id`, c.`id`, 'valide', NOW(), NOW()
FROM `ins_demandes_inscription` d
JOIN `ins_parcours_choisis` pc
  ON pc.`demandeInscriptionId` = d.`id` AND pc.`choixFinal` = 1
JOIN `ins_cours` c
  ON c.`parcoursId` = pc.`parcoursId` AND c.`estObligatoire` = 1 AND c.`deletedAt` IS NULL
JOIN `ins_cursus_apprenants` ca
  ON ca.`demandeInscriptionId` = d.`id`
WHERE d.`statutPipeline` = 'valide';

-- 2) Participants manquants pour les UE validées de dossiers validés
INSERT IGNORE INTO `ins_cours_participants` (`utilisateurId`, `coursId`, `cursusApprenantId`, `createdAt`, `updatedAt`)
SELECT d.`utilisateurId`, cc.`coursId`, ca.`id`, NOW(), NOW()
FROM `ins_cours_choisis` cc
JOIN `ins_demandes_inscription` d ON d.`id` = cc.`demandeInscriptionId`
JOIN `ins_cursus_apprenants` ca ON ca.`demandeInscriptionId` = d.`id`
JOIN `ins_cours` c ON c.`id` = cc.`coursId` AND c.`deletedAt` IS NULL
WHERE d.`statutPipeline` = 'valide'
  AND cc.`etat` = 'valide'
  AND cc.`deletedAt` IS NULL;

-- 3) Rattacher chaque participant au cursus le plus récent de son parcours
UPDATE `ins_cours_participants` p
JOIN `ins_cours` c ON c.`id` = p.`coursId`
JOIN (
  SELECT `utilisateurId`, `parcoursId`, MAX(`id`) AS `cursusId`
  FROM `ins_cursus_apprenants`
  GROUP BY `utilisateurId`, `parcoursId`
) latest
  ON latest.`utilisateurId` = p.`utilisateurId`
  AND latest.`parcoursId` = c.`parcoursId`
SET p.`cursusApprenantId` = latest.`cursusId`,
    p.`updatedAt` = NOW()
WHERE p.`deletedAt` IS NULL
  AND p.`cursusApprenantId` <> latest.`cursusId`;
