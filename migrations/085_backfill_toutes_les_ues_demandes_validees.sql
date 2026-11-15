-- 085_backfill_toutes_les_ues_demandes_validees.sql
-- Rattache toutes les UE actives du parcours final aux demandes déjà validées.
--
-- Les dossiers du nouveau pipeline sont identifiés par statutPipeline = 'valide'.
-- Les dossiers historiques sans statutPipeline sont retenus uniquement s'ils ont
-- une date de validation et une réponse d'inscription enregistrée.
-- Les associations de demande et de participant sont insérées de manière
-- idempotente ; un participant existant est rattaché au cursus le plus récent
-- de l'apprenant dans le parcours concerné.

-- Valider les associations existantes pour les UE actives du parcours final.
UPDATE `ins_cours_choisis` cc
JOIN `ins_demandes_inscription` d
  ON d.`id` = cc.`demandeInscriptionId`
JOIN `ins_parcours_choisis` pc
  ON pc.`demandeInscriptionId` = d.`id`
  AND pc.`deletedAt` IS NULL
  AND (
    pc.`choixFinal` = 1
    OR (
      SELECT COUNT(*)
      FROM `ins_parcours_choisis` pc_unique
      WHERE pc_unique.`demandeInscriptionId` = d.`id`
        AND pc_unique.`deletedAt` IS NULL
    ) = 1
  )
JOIN `ins_cours` c
  ON c.`parcoursId` = pc.`parcoursId`
  AND c.`id` = cc.`coursId`
  AND c.`deletedAt` IS NULL
LEFT JOIN `ins_reponses_inscription` ri
  ON ri.`demandeInscriptionId` = d.`id`
  AND ri.`deletedAt` IS NULL
SET cc.`etat` = 'valide',
    cc.`deletedAt` = NULL,
    cc.`updatedAt` = NOW()
WHERE d.`deletedAt` IS NULL
  AND (cc.`deletedAt` IS NOT NULL OR cc.`etat` <> 'valide')
  AND (
    d.`statutPipeline` = 'valide'
    OR (
      d.`statutPipeline` IS NULL
      AND d.`dateValidation` IS NOT NULL
      AND ri.`id` IS NOT NULL
    )
  );

-- Ajouter aux demandes validées toutes les UE actives de leur parcours final.
INSERT IGNORE INTO `ins_cours_choisis`
  (`demandeInscriptionId`, `coursId`, `etat`, `createdAt`, `updatedAt`)
SELECT DISTINCT d.`id`, c.`id`, 'valide', NOW(), NOW()
FROM `ins_demandes_inscription` d
JOIN `ins_parcours_choisis` pc
  ON pc.`demandeInscriptionId` = d.`id`
  AND pc.`deletedAt` IS NULL
  AND (
    pc.`choixFinal` = 1
    OR (
      SELECT COUNT(*)
      FROM `ins_parcours_choisis` pc_unique
      WHERE pc_unique.`demandeInscriptionId` = d.`id`
        AND pc_unique.`deletedAt` IS NULL
    ) = 1
  )
JOIN `ins_cours` c
  ON c.`parcoursId` = pc.`parcoursId`
  AND c.`deletedAt` IS NULL
LEFT JOIN `ins_reponses_inscription` ri
  ON ri.`demandeInscriptionId` = d.`id`
  AND ri.`deletedAt` IS NULL
WHERE d.`deletedAt` IS NULL
  AND (
    d.`statutPipeline` = 'valide'
    OR (
      d.`statutPipeline` IS NULL
      AND d.`dateValidation` IS NOT NULL
      AND ri.`id` IS NOT NULL
    )
  );

-- Réactiver les participants existants et les rattacher au cursus le plus récent.
UPDATE `ins_cours_participants` p
JOIN `ins_cours` c
  ON c.`id` = p.`coursId`
  AND c.`deletedAt` IS NULL
JOIN (
  SELECT `utilisateurId`, `parcoursId`, MAX(`id`) AS `cursusId`
  FROM `ins_cursus_apprenants`
  WHERE `deletedAt` IS NULL
  GROUP BY `utilisateurId`, `parcoursId`
) latest
  ON latest.`parcoursId` = c.`parcoursId`
JOIN `ins_demandes_inscription` d
  ON d.`utilisateurId` = latest.`utilisateurId`
JOIN `ins_parcours_choisis` pc
  ON pc.`demandeInscriptionId` = d.`id`
  AND pc.`parcoursId` = c.`parcoursId`
  AND pc.`deletedAt` IS NULL
  AND (
    pc.`choixFinal` = 1
    OR (
      SELECT COUNT(*)
      FROM `ins_parcours_choisis` pc_unique
      WHERE pc_unique.`demandeInscriptionId` = d.`id`
        AND pc_unique.`deletedAt` IS NULL
    ) = 1
  )
LEFT JOIN `ins_reponses_inscription` ri
  ON ri.`demandeInscriptionId` = d.`id`
  AND ri.`deletedAt` IS NULL
SET p.`cursusApprenantId` = latest.`cursusId`,
    p.`deletedAt` = NULL,
    p.`updatedAt` = NOW()
WHERE p.`utilisateurId` = latest.`utilisateurId`
  AND d.`deletedAt` IS NULL
  AND (
    d.`statutPipeline` = 'valide'
    OR (
      d.`statutPipeline` IS NULL
      AND d.`dateValidation` IS NOT NULL
      AND ri.`id` IS NOT NULL
    )
  )
  AND (
    p.`deletedAt` IS NOT NULL
    OR p.`cursusApprenantId` <> latest.`cursusId`
  );

-- Créer l'accès manquant aux UE via le cursus le plus récent du parcours.
INSERT IGNORE INTO `ins_cours_participants`
  (`utilisateurId`, `coursId`, `cursusApprenantId`, `createdAt`, `updatedAt`)
SELECT DISTINCT d.`utilisateurId`, c.`id`, latest.`cursusId`, NOW(), NOW()
FROM `ins_demandes_inscription` d
JOIN `ins_parcours_choisis` pc
  ON pc.`demandeInscriptionId` = d.`id`
  AND pc.`deletedAt` IS NULL
  AND (
    pc.`choixFinal` = 1
    OR (
      SELECT COUNT(*)
      FROM `ins_parcours_choisis` pc_unique
      WHERE pc_unique.`demandeInscriptionId` = d.`id`
        AND pc_unique.`deletedAt` IS NULL
    ) = 1
  )
JOIN `ins_cours` c
  ON c.`parcoursId` = pc.`parcoursId`
  AND c.`deletedAt` IS NULL
JOIN (
  SELECT `utilisateurId`, `parcoursId`, MAX(`id`) AS `cursusId`
  FROM `ins_cursus_apprenants`
  WHERE `deletedAt` IS NULL
  GROUP BY `utilisateurId`, `parcoursId`
) latest
  ON latest.`utilisateurId` = d.`utilisateurId`
  AND latest.`parcoursId` = pc.`parcoursId`
LEFT JOIN `ins_reponses_inscription` ri
  ON ri.`demandeInscriptionId` = d.`id`
  AND ri.`deletedAt` IS NULL
WHERE d.`deletedAt` IS NULL
  AND (
    d.`statutPipeline` = 'valide'
    OR (
      d.`statutPipeline` IS NULL
      AND d.`dateValidation` IS NOT NULL
      AND ri.`id` IS NOT NULL
    )
  );
