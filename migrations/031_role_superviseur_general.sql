-- Add the distinct pedagogical supervision role to user accounts.
ALTER TABLE `aut_utilisateurs`
  MODIFY COLUMN `role` ENUM(
    'apprenant',
    'institution',
    'caissier_banque',
    'enseignant',
    'personnel_administratif',
    'ressources_humaines',
    'cabinet_comptable',
    'esa_compta',
    'comite_orientation',
    'admin',
    'parent',
    'secretaire',
    'surveillant',
    'superviseur_general'
  ) NOT NULL DEFAULT 'apprenant';
