-- Rattache les anciens cours au site connu, sans deviner en contexte multisite.
UPDATE `ins_cours` AS c
LEFT JOIN `ins_classes` AS cl ON cl.`id` = c.`classeId`
LEFT JOIN `ins_parcours` AS p ON p.`id` = c.`parcoursId`
SET c.`etablissementId` = COALESCE(
  cl.`etablissementId`,
  p.`etablissementId`,
  CASE
    WHEN (SELECT COUNT(*) FROM `eta_etablissements` WHERE `actif` = 1) = 1
      THEN (SELECT `id` FROM `eta_etablissements` WHERE `actif` = 1 LIMIT 1)
    ELSE NULL
  END
)
WHERE c.`etablissementId` IS NULL
  AND (
    cl.`etablissementId` IS NOT NULL
    OR p.`etablissementId` IS NOT NULL
    OR (SELECT COUNT(*) FROM `eta_etablissements` WHERE `actif` = 1) = 1
  );
