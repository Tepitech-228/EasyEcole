# Liaisons des tables — Base de données EasyEcole

> Document de référence des relations entre toutes les tables du schéma `easyecole` (MySQL).
> Source : définitions des modèles Sequelize et fichiers `_associations.ts` de chaque module (`easy-ecole-backend/src/modules/<module>/models/`).
> Vérifié le 10/08/2026 contre `information_schema` (MySQL local).

## Convention de nommage

Chaque module préfixe ses tables :

| Module | Préfixe | Module | Préfixe |
|---|---|---|---|
| auth | `aut_` | marche | `mar_` |
| parent | `par_` | stock | `stk_` |
| etablissement | `eta_` | immobilisation | `imm_` |
| inscription | `ins_` | docgen | `docgen_` |
| bulletins | `ins_` (hérite du préfixe inscription) | ged | `ged_` |
| scolarite | `scol_` | elearning | `elearning_` |
| rh | `rh_` | qualite | `qua_` |
| stage | `stg_` | reporting | `rpt_` |
| orientation | `ori_` | communication | `com_` |
| achats | `ach_` | comptabilite | `cpt_` |

## Légende

- `→ table` : relation **belongsTo** (la table porte la clé étrangère ; "appartient à" / dépend de la cible)
- `← table` : relation **hasMany / hasOne** (la cible porte la clé étrangère ; la table possède des enfants)
- `⇄ table` : relation **belongsToMany** (many-to-many via une table de jonction)
- `[fk]` : nom de la clé étrangère ; `(alias)` : alias Sequelize de l'association
- `(X lignes)` : nombre de lignes actuelles en base (aide au seed)
- Les colonnes `createdAt`, `updatedAt`, `deletedAt` (paranoid) et `id` ne sont pas répétées.

---

# 1. Module auth (`aut_`)

## `aut_utilisateurs` — Utilisateur (37 lignes)
- ⇄ `aut_roles` via `aut_user_roles` [roleId → roles]
- → `eta_etablissements` [etablissementId] *(déclaré côté etablissement)*
- ← `aut_apprenants` (hasOne) [utilisateurId] (alias `apprenant`)
- ← `aut_institutions` (hasOne) [utilisateurId] (alias `institution`)
- ← `aut_caissiers_banque` (hasOne) [utilisateurId] (alias `caissierBanque`)
- ← `aut_enseignants` (hasOne) [utilisateurId] (alias `enseignant`)
- ← `aut_comite_orientations` (hasOne) [utilisateurId] (alias `comiteOrientation`)
- ← `aut_user_permissions` (hasMany) [utilisateurId]
- ← `aut_user_roles` (hasMany) [utilisateurId]
- ← `par_parents_enfants` (hasMany) [parentUtilisateurId] (alias `parentEnfants`)
- ← `ins_pre_inscriptions` (hasMany) [traiteParId] (alias `preInscriptionsTraitees`)
- ← `ins_demandes_inscription` (hasMany) [utilisateurId]
- ← `ins_reponses_inscription` (hasMany) [utilisateurId]
- ← `ins_paiements_inscription` (hasMany) [utilisateurId]
- ← `ins_cursus_apprenants` (hasMany) [utilisateurId]
- ← `ins_cours_participants` (hasMany) [utilisateurId]
- ← `ins_pointages` (hasMany) [utilisateurId]
- ← `ins_dossiers_etudiants` (hasMany) [utilisateurId]
- ← `ins_bordereaux` (hasMany) [utilisateurId] + [valideParId] (alias `bordereauxValides`)
- ← `ins_equivalences` (hasMany) [validePar]
- ← `ins_dispenses` (hasMany) [validePar]
- ← `ins_rattrapages_inscriptions` (hasMany) [demandePar]
- ← `ins_publications_notes` (hasMany) [publiePar]
- ← `ins_audit_notes` (hasMany) [modifiePar]
- ← `ins_jury_membres` (hasMany) [utilisateurId]
- ← `ins_bulletins` (hasMany) [utilisateurId]
- ← `com_communications` (hasMany) [utilisateurId]
- ← `com_suggestions` (hasMany) [utilisateurId]
- ← `com_reponses_suggestion` (hasMany) [utilisateurId]
- ← `scol_demandes_document` (hasMany) [etudiantId]
- ← `scol_reclamations` (hasMany) [etudiantId]
- ← `scol_reponses_reclamation` (hasMany) [repondeurId]
- ← `scol_livres` (hasMany) [uploaderId]
- ← `scol_decisions_passage` (hasMany) [validePar]
- ← `scol_demandes_reorientation` (hasMany) [traitePar]
- ← `scol_sanctions_academiques` (hasMany) [decidePar]
- ← `scol_demandes_vae` (hasMany) [utilisateurId]
- ← `ori_demandes_orientation` (hasMany) [utilisateurId]
- ← `ori_reponses_orientation` (hasMany) [utilisateurId]
- ← `ori_panier_parcours_choisis` (hasMany) [utilisateurId]
- ← `ach_demandes` (hasMany) [soumisParId] (alias `demandesAchats`)
- ← `ach_validateurs` (hasOne) [utilisateurId]
- ← `cpt_ecritures_comptables` (hasMany) [utilisateurSaisieId] + [utilisateurValidationId]
- ← `cpt_reductions_frais` (hasMany) [validePar]
- ← `ged_documents` (hasMany) [uploaderId] + [lockedBy]
- ← `ged_folders` (hasMany) [createdBy]
- ← `ged_sessions` (hasMany) [createdBy]
- ← `ged_disposal_records` (hasMany) [requestedBy] + [confirmedBy]
- ← `ged_signatures` (hasMany) [requestedBy] + [signedBy] + [rejectedBy]
- ← `ged_registre_courrier` (hasMany) [utilisateurId]
- ← `elearning_cours` (hasMany) [enseignantId]
- ← `elearning_devoirs` (hasMany) [enseignantId]
- ← `elearning_soumissions_devoirs` (hasMany) [apprenantId]
- ← `elearning_reponses_quiz` (hasMany) [apprenantId]
- ← `elearning_certificats` (hasMany) [apprenantId]
- ← `elearning_progression_apprenant` (hasMany) [apprenantId]
- ← `elearning_salons` (hasMany) [createdById]
- ← `elearning_participants_salon` (hasMany) [utilisateurId]

## `aut_apprenants` — Apprenant (23 lignes)
- → `aut_utilisateurs` [utilisateurId] (alias `utilisateur`)
- ← `aut_adresses_apprenants` (hasOne) [apprenantId]
- ← `aut_identites_apprenants` (hasOne) [apprenantId]
- ← `aut_informations_salarie_apprenants` (hasOne) [apprenantId]
- ← `aut_informations_parents_apprenants` (hasOne) [apprenantId]
- ← `aut_personnes_prevenir_apprenants` (hasOne) [apprenantId]
- ← `par_parents_enfants` (hasMany) [apprenantId] (alias `parents`)
- ← `stg_demandes_stage` (hasMany) [apprenantId]

## `aut_institutions` — Institution (2 lignes)
- → `aut_utilisateurs` [utilisateurId] (alias `utilisateur`)
- ← `aut_adresses_institutions` (hasOne) [institutionId]
- ← `stg_offres_stage` (hasMany) [institutionId]

## `aut_banques` — Banque (1 ligne)
- ← `aut_caissiers_banque` (hasMany) [banqueId]

## `aut_caissiers_banque` — CaissierBanque (2 lignes)
- → `aut_utilisateurs` [utilisateurId]
- → `aut_banques` [banqueId]
- ← `aut_adresses_caissiers_banque` (hasOne) [caissierBanqueId]

## `aut_enseignants` — Enseignant (5 lignes)
- → `aut_utilisateurs` [utilisateurId]
- ← `aut_adresses_enseignants` (hasOne) [enseignantId]
- ← `ins_cours` (hasMany) [enseignantId]
- ← `ins_seances` (hasMany) [enseignantId]
- ← `ins_listes_presences` (hasMany) [enseignantId]
- ← `ins_cahiers_de_texte` (hasMany) [enseignantId]
- ← `ins_listes_notes_evaluation` (hasMany) [enseignantId]
- ← `stg_notes_stage` (hasMany) [enseignantId]

## `aut_comite_orientations` — ComiteOrientation (3 lignes)
- → `aut_utilisateurs` [utilisateurId]

## Tables "satellites" (1-1, portent la FK vers leur parent)
| Table | belongsTo |
|---|---|
| `aut_adresses_apprenants` (22) | → `aut_apprenants` [apprenantId] |
| `aut_identites_apprenants` (21) | → `aut_apprenants` [apprenantId] |
| `aut_informations_salarie_apprenants` (7) | → `aut_apprenants` [apprenantId] |
| `aut_informations_parents_apprenants` (21) | → `aut_apprenants` [apprenantId] |
| `aut_personnes_prevenir_apprenants` (21) | → `aut_apprenants` [apprenantId] |
| `aut_adresses_institutions` (2) | → `aut_institutions` [institutionId] |
| `aut_adresses_caissiers_banque` (2) | → `aut_caissiers_banque` [caissierBanqueId] |
| `aut_adresses_enseignants` (5) | → `aut_enseignants` [enseignantId] |

## Rôles & permissions
| Table | Relations |
|---|---|
| `aut_roles` (8) | ⇄ `aut_utilisateurs` via `aut_user_roles` [roleId] · ⇄ `aut_permissions` via `aut_role_permissions` [roleId] · ← `aut_user_roles` · ← `aut_role_permissions` |
| `aut_permissions` (259) | ⇄ `aut_roles` via `aut_role_permissions` [permissionId] · ← `aut_user_permissions` · ← `aut_role_permissions` |
| `aut_role_permissions` (232) | → `aut_permissions` [permissionId] · → `aut_roles` [roleId] |
| `aut_user_permissions` (0) | → `aut_permissions` [permissionId] · → `aut_utilisateurs` [utilisateurId] |
| `aut_user_roles` (2) | → `aut_utilisateurs` [utilisateurId] · → `aut_roles` [roleId] |

---

# 2. Module parent (`par_`)

## `par_parents_enfants` — ParentEnfant (0 ligne)
- → `aut_utilisateurs` [parentUtilisateurId] (alias `parentUtilisateur`)
- → `aut_apprenants` [apprenantId] (alias `apprenant`)

---

# 3. Module etablissement (`eta_`)

## `eta_etablissements` — Etablissement (0 ligne)
- ← `aut_utilisateurs` (hasMany) [etablissementId] (alias `utilisateurs`)
- ← `ins_cours` (hasMany) [etablissementId]
- ← `ins_classes` (hasMany) [etablissementId]
- ← `ins_parcours` (hasMany) [etablissementId]
- ← `ins_sessions` (hasMany) [etablissementId]
- ← `ins_demandes_inscription` (hasMany) [etablissementId]
- ← `ins_cursus_apprenants` (hasMany) [etablissementId]
- ← `ins_salles_de_classes` (hasMany) [etablissementId]

> Aucun belongsTo : c'est la table racine (sans parent).

---

# 4. Module inscription (`ins_`)

> Module central (scolarité). Comprend aussi les tables de bulletins (même préfixe).

## `ins_niveaux_etudes` — NiveauEtude (5 lignes)
- ← `ins_classes` (hasMany) [niveauEtudeId]
- ← `ins_parcours` (hasMany) [niveauEtudeId]
- ← `ins_sessions` (hasMany) [niveauEtudeId]
- ← `ins_prerequis_parcours` (hasMany) [niveauEtudeId]
- ← `ins_frais_parcours` (hasMany) [niveauEtudeId]
- ← `ins_cursus_apprenants` (hasMany) [niveauEtudeId]
- ← `ins_bulletins` (hasMany) [niveauEtudeId]
- ← `cpt_frais_parcours` (hasMany) [niveauEtudeId]
- ← `scol_diplomes` (hasMany) [niveauEtudeId]

## `ins_annees_academiques` — AnneeAcademique (2 lignes)
- ← `ins_sessions` (hasMany) [anneeAcademiqueId]
- ← `ins_frais_parcours` (hasMany) [anneeAcademiqueId]
- ← `ins_cursus_apprenants` (hasMany) [anneeAcademiqueId]
- ← `ins_semestres_academiques` (hasMany) [anneeAcademiqueId]
- ← `ins_listes_notes_evaluation` (hasMany) [anneeAcademiqueId]
- ← `ins_sessions_examens` (hasMany) [anneeAcademiqueId]
- ← `ins_bulletins` (hasMany) [anneeAcademiqueId]
- ← `cpt_frais_parcours` (hasMany) [anneeAcademiqueId]
- ← `scol_decisions_passage` (hasMany) [anneeAcademiqueId]
- ← `ori_demandes_orientation` (hasMany) [anneeAcademiqueId]

## `ins_parcours` — Parcours (15 lignes)
- → `ins_niveaux_etudes` [niveauEtudeId]
- → `eta_etablissements` [etablissementId]
- ← `ins_cours` (hasMany) [parcoursId]
- ← `ins_salles_de_classes` (hasMany) [parcoursId]
- ← `ins_classes` (hasMany) [parcoursId]
- ← `ins_prerequis_parcours` (hasMany) [parcoursId]
- ← `ins_parcours_choisis` (hasMany) [parcoursId]
- ← `ins_frais_parcours` (hasMany) [parcoursId]
- ← `ins_cursus_apprenants` (hasMany) [parcoursId]
- ← `ins_semestres_academiques` (hasMany) [parcoursId]
- ← `ins_regles_evaluation` (hasMany) [parcoursId]
- ← `ins_bulletins` (hasMany) [parcoursId]
- ← `cpt_frais_parcours` (hasMany) [parcoursId]
- ← `scol_demandes_reorientation` (hasMany) [parcoursActuelId] + [parcoursCibleId]
- ← `scol_diplomes` (hasMany) [parcoursId]
- ← `scol_demandes_vae` (hasMany) [parcoursCibleId]
- ← `scol_evenements_calendrier` (hasMany) [parcoursId]

## `ins_classes` — Classe (73 lignes)
- → `ins_niveaux_etudes` [niveauEtudeId]
- → `ins_parcours` [parcoursId]
- → `eta_etablissements` [etablissementId]
- ← `ins_cours` (hasMany) [classeId]
- ← `ins_salles_de_classes` (hasMany) [classeId]
- ← `ins_cursus_apprenants` (hasMany) [classeId]
- ← `ins_sessions_examens` (hasMany) [classeId]
- ← `ins_bulletins` (hasMany) [classeId]
- ← `scol_evenements_calendrier` (hasMany) [classeId]

## `ins_sessions` — Session (4 lignes)
- → `ins_niveaux_etudes` [niveauEtudeId]
- → `ins_annees_academiques` [anneeAcademiqueId]
- → `eta_etablissements` [etablissementId]
- ← `ins_demandes_inscription` (hasMany) [sessionId]
- ← `ins_frais_inscription` (hasMany) [sessionId]
- ← `ins_dossiers_inscription` (hasMany) [sessionId]

## `ins_matieres_prerequis` — MatierePrerequis (4 lignes)
- ← `ins_prerequis_parcours` (hasMany) [matierePrerequisId]

## `ins_prerequis_parcours` — PrerequisParcours (4 lignes)
- → `ins_niveaux_etudes` [niveauEtudeId]
- → `ins_matieres_prerequis` [matierePrerequisId]
- → `ins_parcours` [parcoursId]
- ← `ins_prerequis_parcours_choisis` (hasMany) [prerequisParcoursId]

## `ins_parcours_choisis` — ParcoursChoisi (22 lignes)
- → `ins_parcours` [parcoursId]
- → `ins_demandes_inscription` [demandeInscriptionId]
- ← `ins_prerequis_parcours_choisis` (hasMany) [parcoursChoisiId]

## `ins_prerequis_parcours_choisis` — PrerequisParcoursChoisi (1 ligne)
- → `ins_parcours_choisis` [parcoursChoisiId]
- → `ins_prerequis_parcours` [prerequisParcoursId]

## `ins_demandes_inscription` — DemandeInscription (23 lignes)
- → `aut_utilisateurs` [utilisateurId]
- → `ins_sessions` [sessionId]
- → `ins_etapes_inscription` [etapeInscriptionId]
- → `eta_etablissements` [etablissementId]
- ← `ins_parcours_choisis` (hasMany) [demandeInscriptionId]
- ← `ins_reponses_inscription` (hasOne) [demandeInscriptionId]
- ← `ins_pre_inscriptions` (hasOne) [demandeInscriptionId]
- ⇄ `ins_cours` via `ins_cours_choisis` [demandeInscriptionId]
- ⇄ `ins_dossiers_inscription` via `ins_dossiers_demandes` [demandeId]
- ← `ins_cours_choisis` (hasMany) [demandeInscriptionId]
- ← `ins_dossiers_demandes` (hasMany) [demandeId]
- ← `ins_paiements_inscription` (hasMany) [matriculeInscription → sourceKey matricule]
- ← `ins_cursus_apprenants` (hasOne) [demandeInscriptionId]

## `ins_cours` — Cours (559 lignes)
- → `ins_parcours` [parcoursId]
- → `ins_classes` [classeId]
- → `aut_enseignants` [enseignantId]
- → `eta_etablissements` [etablissementId]
- ⇄ `ins_demandes_inscription` via `ins_cours_choisis` [coursId]
- ← `ins_cours_choisis` (hasMany) [coursId]
- ← `ins_cours_participants` (hasMany) [coursId]
- ← `ins_chapitres_cours` (hasMany) [coursId]
- ← `ins_seances` (hasMany) [coursId]
- ← `ins_listes_presences` (hasMany) [coursId]
- ← `ins_cahiers_de_texte` (hasMany) [coursId]
- ← `ins_listes_notes_evaluation` (hasMany) [coursId]
- ← `ins_mcc` (hasMany) [coursId]
- ← `ins_ecue` (hasMany) [coursId]
- ← `ins_equivalences` (hasMany) [coursDestinationId]
- ← `ins_dispenses` (hasMany) [coursId]
- ← `ins_rattrapages_inscriptions` (hasMany) [coursId]
- ← `ins_lignes_bulletins` (hasMany) [coursId]
- ← `scol_progression_pedagogique` (hasMany) [coursId]
- ← `elearning_cours` (hasMany) [coursId] *(sans contrainte FK)*

## `ins_salles_de_classes` — SalleDeClasse (3 lignes)
- → `ins_classes` [classeId]
- → `imm_localisation` [localisationId]
- → `ins_parcours` [parcoursId]
- → `eta_etablissements` [etablissementId]
- ← `ins_seances` (hasMany) [salleDeClasseId]

## `ins_etapes_inscription` — EtapeInscription (0 ligne)
- ← `ins_demandes_inscription` (hasMany) [etapeInscriptionId]

## `ins_reponses_inscription` — ReponseInscription (22 lignes)
- → `ins_demandes_inscription` [demandeInscriptionId]
- → `aut_utilisateurs` [utilisateurId]

## `ins_pre_inscriptions` — PreInscription (22 lignes)
- → `ins_demandes_inscription` [demandeInscriptionId]
- → `aut_utilisateurs` [traiteParId]

## `ins_cours_choisis` — DemandeInscriptionCours (301 lignes, table de jonction)
- → `ins_cours` [coursId]
- → `ins_demandes_inscription` [demandeInscriptionId]

## `ins_dossiers_inscription` — DossierInscription (6 lignes)
- → `ins_sessions` [sessionId]
- ⇄ `ins_demandes_inscription` via `ins_dossiers_demandes` [dossierId]
- ← `ins_dossiers_demandes` (hasMany) [dossierId]

## `ins_dossiers_demandes` — DemandeInscriptionDossier (12 lignes, table de jonction)
- → `ins_dossiers_inscription` [dossierId]
- → `ins_demandes_inscription` [demandeId]

## `ins_frais_inscription` — FraisInscription (4 lignes)
- → `ins_sessions` [sessionId]

## `ins_paiements_inscription` — PaiementInscription (21 lignes)
- → `aut_utilisateurs` [utilisateurId]
- → `ins_demandes_inscription` [matriculeInscription → targetKey matricule]
- ← `ins_quitus` (hasOne) [paiementInscriptionId]

## `ins_quitus` — Quitus (0 ligne)
- → `ins_paiements_inscription` [paiementInscriptionId]
- → `ins_bordereaux` [bordereauId]

## `ins_dossiers_etudiants` — DossierEtudiant (20 lignes)
- → `aut_utilisateurs` [utilisateurId]
- ← `ins_echeances` (hasMany) [dossierEtudiantId]
- ← `ins_cours_participants` (hasMany) [utilisateurId]
- ← `cpt_lignes_frais_etudiant` (hasMany) [dossierEtudiantId]
- ← `cpt_reductions_frais` (hasMany) [dossierEtudiantId]

## `ins_echeances` — Echeance (60 lignes)
- → `ins_dossiers_etudiants` [dossierEtudiantId]
- ← `ins_bordereaux` (hasMany) [echeanceId]

## `ins_bordereaux` — Bordereau (11 lignes)
- → `ins_echeances` [echeanceId]
- → `aut_utilisateurs` [utilisateurId] + [valideParId] (alias `validePar`)
- → `ins_rattrapages_inscriptions` (hasOne) [paiementId]
- ← `ins_quitus` (hasOne) [bordereauId]

## `ins_cursus_apprenants` — CursusApprenant (20 lignes)
- → `aut_utilisateurs` [utilisateurId]
- → `eta_etablissements` [etablissementId]
- → `ins_parcours` [parcoursId]
- → `ins_niveaux_etudes` [niveauEtudeId]
- → `ins_classes` [classeId]
- → `ins_annees_academiques` [anneeAcademiqueId]
- → `ins_demandes_inscription` [demandeInscriptionId]
- ← `ins_cours_participants` (hasMany) [cursusApprenantId]
- ← `ins_equivalences` (hasMany) [cursusApprenantId]
- ← `ins_dispenses` (hasMany) [cursusApprenantId]
- ← `ins_bulletins` (hasMany) [cursusApprenantId]
- ← `ins_resultats_deliberation` (hasMany) [cursusApprenantId]
- ← `ins_dettes_academiques` (hasMany) [cursusApprenantId]
- ← `scol_decisions_passage` (hasMany) [cursusApprenantId]
- ← `scol_demandes_reorientation` (hasMany) [cursusApprenantId]
- ← `scol_sanctions_academiques` (hasMany) [cursusApprenantId]
- ← `scol_diplomes` (hasMany) [cursusApprenantId]
- ← `scol_registres_academiques` (hasMany) [cursusApprenantId]

## `ins_cours_participants` — CoursParticipant (296 lignes)
- → `ins_cours` [coursId]
- → `aut_utilisateurs` [utilisateurId]
- → `ins_cursus_apprenants` [cursusApprenantId]
- → `ins_dossiers_etudiants` (alias `dossierEtudiant`, via utilisateurId)
- ← `ins_presences_cours_participants` (hasMany) [coursParticipantId]
- ← `ins_notes_evaluation` (hasMany) [coursParticipantId]
- ← `ins_rattrapages_inscriptions` (hasMany) [coursParticipantId]

## `ins_chapitres_cours` — ChapitreCours (3 lignes)
- → `ins_cours` [coursId]
- ← `ins_ressources` (hasMany) [chapitreCoursId]
- ← `scol_progression_pedagogique` (hasMany) [chapitreId]

## `ins_ressources` — Ressource (3 lignes)
- → `ins_chapitres_cours` [chapitreCoursId]
- ← `ins_fichiers_ressources` (hasMany) [ressourceId]

## `ins_fichiers_ressources` — FichierRessource (3 lignes)
- → `ins_ressources` [ressourceId]

## `ins_seances` — Seance (8 lignes)
- → `ins_cours` [coursId]
- → `aut_enseignants` [enseignantId]
- → `ins_salles_de_classes` [salleDeClasseId]

## `ins_listes_presences` — ListePresence (3 lignes)
- → `ins_cours` [coursId]
- → `aut_enseignants` [enseignantId]
- ← `ins_presences` (hasMany) [listePresenceId]

## `ins_presences` — Presence (3 lignes)
- → `ins_listes_presences` [listePresenceId]
- ← `ins_presences_cours_participants` (hasMany) [presenceId]

## `ins_presences_cours_participants` — PresenceCoursParticipant (12 lignes)
- → `ins_presences` [presenceId]
- → `ins_cours_participants` [coursParticipantId]

## `ins_cahiers_de_texte` — CahierDeTexte (8 lignes)
- → `ins_cours` [coursId]
- → `aut_enseignants` [enseignantId]
- ← `ins_blocs_cahier_de_texte` (hasMany) [cahierDeTexteId]

## `ins_blocs_cahier_de_texte` — BlocCahierDeTexte (16 lignes)
- → `ins_cahiers_de_texte` [cahierDeTexteId]

## `ins_types_note_evaluation` — TypeNoteEvaluation (3 lignes)
- ← `ins_listes_notes_evaluation` (hasMany) [typeNoteEvaluationId]

## `ins_listes_notes_evaluation` — ListeNoteEvaluation (24 lignes)
- → `ins_types_note_evaluation` [typeNoteEvaluationId]
- → `ins_cours` [coursId]
- → `ins_annees_academiques` [anneeAcademiqueId]
- → `aut_enseignants` [enseignantId]
- ← `ins_notes_evaluation` (hasMany) [listeNoteEvaluationId]
- ← `ins_publications_notes` (hasMany) [listeNoteEvaluationId]

## `ins_notes_evaluation` — NoteEvaluation (112 lignes)
- → `ins_listes_notes_evaluation` [listeNoteEvaluationId]
- → `ins_cours_participants` [coursParticipantId]
- ← `ins_absences` (hasOne) [noteEvaluationId]
- ← `ins_audit_notes` (hasMany) [noteEvaluationId]

## `ins_pointages` — Pointage (0 ligne)
- → `aut_utilisateurs` [utilisateurId]

## `ins_mcc` — Mcc (8 lignes)
- → `ins_cours` [coursId]
- → `ins_ecue` [ecueId]

## `ins_ecue` — Ecue (0 ligne)
- → `ins_cours` [coursId]
- ← `ins_mcc` (hasMany) [ecueId]

## `ins_regles_evaluation` — RegleEvaluation (5 lignes)
- → `ins_parcours` [parcoursId]

## `ins_sessions_examens` — SessionExamen (2 lignes)
- → `ins_classes` [classeId]
- → `ins_annees_academiques` [anneeAcademiqueId]
- ← `ins_rattrapages_inscriptions` (hasMany) [sessionExamenId]

## `ins_absences` — Absence (0 ligne)
- → `ins_notes_evaluation` [noteEvaluationId]

## `ins_equivalences` — Equivalence (2 lignes)
- → `ins_cursus_apprenants` [cursusApprenantId]
- → `ins_cours` [coursDestinationId]
- → `aut_utilisateurs` [validePar]

## `ins_dispenses` — Dispense (2 lignes)
- → `ins_cursus_apprenants` [cursusApprenantId]
- → `ins_cours` [coursId]
- → `aut_utilisateurs` [validePar]

## `ins_rattrapages_inscriptions` — RattrapageInscription (2 lignes)
- → `ins_cours_participants` [coursParticipantId]
- → `ins_cours` [coursId]
- → `ins_sessions_examens` [sessionExamenId]
- → `aut_utilisateurs` [demandePar] (alias `demandeur`)
- → `ins_bordereaux` [paiementId]

## `ins_publications_notes` — PublicationNote (0 ligne)
- → `ins_listes_notes_evaluation` [listeNoteEvaluationId]
- → `aut_utilisateurs` [publiePar]

## `ins_frais_parcours` — FraisParcours (inscription) (0 ligne)
- → `ins_parcours` [parcoursId]
- → `ins_niveaux_etudes` [niveauEtudeId]
- → `ins_annees_academiques` [anneeAcademiqueId]
- ← `ins_reduction_frais` (hasMany) [fraisParcoursId]
- ← `ins_penalite_retard` (hasMany) [fraisParcoursId]

## `ins_reduction_frais` — ReductionFrais (inscription) (0 ligne)
- → `ins_frais_parcours` [fraisParcoursId]

## `ins_penalite_retard` — PenaliteRetard (inscription) (0 ligne)
- → `ins_frais_parcours` [fraisParcoursId]

## `ins_semestres_academiques` — SemestreAcademique (0 ligne)
- → `ins_parcours` [parcoursId]
- → `ins_annees_academiques` [anneeAcademiqueId]

---

# 5. Module bulletins (`ins_`)

> Module sans fichier `*Module.ts` : utilise le préfixe `ins_`. Associations initialisées via `initBulletinAssociations()` appelée depuis inscription.

## `ins_bulletins` — Bulletin (16 lignes)
- → `ins_annees_academiques` [anneeAcademiqueId]
- → `ins_cursus_apprenants` [cursusApprenantId]
- → `aut_utilisateurs` [utilisateurId]
- → `ins_classes` [classeId]
- → `ins_parcours` [parcoursId]
- → `ins_niveaux_etudes` [niveauEtudeId]
- ← `ins_lignes_bulletins` (hasMany) [bulletinId] *(onDelete cascade)*

## `ins_lignes_bulletins` — LigneBulletin (36 lignes)
- → `ins_bulletins` [bulletinId]
- → `ins_cours` [coursId]

## `ins_deliberations` — Deliberation (0 ligne)
- → `ins_classes` [classeId]
- → `ins_annees_academiques` [anneeAcademiqueId]
- ← `ins_resultats_deliberation` (hasMany) [deliberationId] *(cascade)*
- ← `ins_jury_membres` (hasMany) [deliberationId] *(cascade)*
- ← `ins_historique_decisions` (hasMany) [deliberationId] *(cascade)*

## `ins_resultats_deliberation` — ResultatDeliberation (16 lignes)
- → `ins_deliberations` [deliberationId]
- → `ins_cursus_apprenants` [cursusApprenantId]
- ← `ins_historique_decisions` (hasMany) [resultatId] *(cascade)*

## `ins_audit_notes` — AuditNote (9 lignes)
- → `ins_notes_evaluation` [noteEvaluationId]
- → `aut_utilisateurs` [modifiePar]

## `ins_echelles_notes` — EchelleNote (8 lignes)
- *Aucune association déclarée*

## `ins_jury_membres` — JuryMembre (3 lignes)
- → `ins_deliberations` [deliberationId]
- → `aut_utilisateurs` [utilisateurId]

## `ins_historique_decisions` — HistoriqueDecision (0 ligne)
- → `ins_deliberations` [deliberationId]
- → `ins_resultats_deliberation` [resultatId]

## `ins_dettes_academiques` — DetteAcademique (0 ligne)
- → `ins_cursus_apprenants` [cursusApprenantId] *(cascade)*

---

# 6. Module scolarite (`scol_`)

## `scol_types_document` — TypeDocument (4 lignes)
- ← `scol_demandes_document` (hasMany) [typeDocumentId]

## `scol_demandes_document` — DemandeDocument (5 lignes)
- → `scol_types_document` [typeDocumentId]
- → `aut_utilisateurs` [etudiantId] (alias `etudiant`)
- ← `scol_documents_delivres` (hasOne) [demandeId]

## `scol_documents_delivres` — DocumentDelivre (3 lignes)
- → `scol_demandes_document` [demandeId]

## `scol_reclamations` — Reclamation (3 lignes)
- → `aut_utilisateurs` [etudiantId]
- ← `scol_reponses_reclamation` (hasMany) [reclamationId]

## `scol_reponses_reclamation` — ReponseReclamation (2 lignes)
- → `scol_reclamations` [reclamationId]
- → `aut_utilisateurs` [repondeurId]

## `scol_conseils_classe` — ConseilClasse (0 ligne)
- ← `scol_decisions_conseil` (hasMany) [conseilClasseId]

## `scol_decisions_conseil` — DecisionConseil (0 ligne)
- → `scol_conseils_classe` [conseilClasseId]

## `scol_sanctions_discipline` — SanctionDiscipline (2 lignes)
- *Aucune association déclarée*

## `scol_registres_academiques` — RegistreAcademique (16 lignes)
- → `ins_cursus_apprenants` [cursusApprenantId]

## `scol_evenements_calendrier` — EvenementCalendrier (3 lignes)
- → `ins_classes` [classeId]
- → `ins_parcours` [parcoursId]

## `scol_livres` — Livre (0 ligne)
- → `aut_utilisateurs` [uploaderId]

## `scol_decisions_passage` — DecisionPassage (0 ligne)
- → `ins_cursus_apprenants` [cursusApprenantId]
- → `ins_annees_academiques` [anneeAcademiqueId]
- → `aut_utilisateurs` [validePar]

## `scol_demandes_reorientation` — DemandeReorientation (0 ligne)
- → `ins_cursus_apprenants` [cursusApprenantId]
- → `ins_parcours` [parcoursActuelId] + [parcoursCibleId]
- → `aut_utilisateurs` [traitePar]

## `scol_sanctions_academiques` — SanctionAcademique (0 ligne)
- → `ins_cursus_apprenants` [cursusApprenantId]
- → `aut_utilisateurs` [decidePar]

## `scol_diplomes` — Diplome (0 ligne)
- → `ins_cursus_apprenants` [cursusApprenantId]
- → `ins_parcours` [parcoursId]
- → `ins_niveaux_etudes` [niveauEtudeId]

## `scol_demandes_vae` — DemandeVAE (0 ligne)
- → `aut_utilisateurs` [utilisateurId]
- → `ins_parcours` [parcoursCibleId]

## `scol_progression_pedagogique` — ProgressionPedagogique (0 ligne)
- → `ins_cours` [coursId]
- → `ins_chapitres_cours` [chapitreId]

---

# 7. Module rh (`rh_`)

## `rh_departements` — RhDepartement (5 lignes)
- ← `rh_postes` (hasMany) [departementId]
- ← `rh_employes` (hasMany) [departementId]

## `rh_postes` — RhPoste (10 lignes)
- → `rh_departements` [departementId]
- ← `rh_employes` (hasMany) [posteId]
- ← `rh_offres_emploi` (hasMany) [posteId]
- ← `rh_rubriques_paie` (hasMany) [posteId]
- ← `rh_grille_salariale` (hasMany) [posteId]

## `rh_types_contrat` — RhTypeContrat (3 lignes)
- ← `rh_employes` (hasMany) [typeContratId]

## `rh_employes` — RhEmploye (5 lignes)
- → `rh_departements` [departementId]
- → `rh_postes` [posteId]
- → `rh_types_contrat` [typeContratId]
- ← `rh_participations_formation` (hasMany) [employeId]
- ← `rh_fiches_evaluation` (hasMany) [employeId]
- ← `rh_bulletins_paie` (hasMany) [employeId]
- ← `rh_prestations_enseignant` (hasMany) [enseignantId]
- ← `rh_contrats_enseignant` (hasMany) [employeId]
- ← `rh_planning_personnel` (hasMany) [employeId]
- ← `rh_heures_supplementaires` (hasMany) [employeId]
- ← `rh_prets` (hasMany) [employeId]
- ← `rh_demandes_conge` (hasMany) [employeId]
- ← `rh_soldes_conge` (hasMany) [employeId]

## `rh_offres_emploi` — RhOffreEmploi (2 lignes)
- → `rh_postes` [posteId]
- ← `rh_candidatures` (hasMany) [offreId]

## `rh_candidatures` — RhCandidature (3 lignes)
- → `rh_offres_emploi` [offreId]
- ← `rh_entretiens` (hasMany) [candidatureId]

## `rh_entretiens` — RhEntretien (2 lignes)
- → `rh_candidatures` [candidatureId]

## `rh_formations` — RhFormation (2 lignes)
- ← `rh_participations_formation` (hasMany) [formationId]

## `rh_participations_formation` — RhParticipationFormation (5 lignes)
- → `rh_formations` [formationId]
- → `rh_employes` [employeId]

## `rh_criteres_evaluation` — RhCritereEvaluation (4 lignes)
- ← `rh_evaluations_criteres` (hasMany) [critereId]

## `rh_fiches_evaluation` — RhFicheEvaluation (3 lignes)
- → `rh_employes` [employeId]
- ← `rh_evaluations_criteres` (hasMany) [ficheId]

## `rh_evaluations_criteres` — RhEvaluationCritere (12 lignes)
- → `rh_fiches_evaluation` [ficheId]
- → `rh_criteres_evaluation` [critereId]

## `rh_rubriques_paie` — RhRubriquePaie (5 lignes)
- → `rh_postes` [posteId]
- → `rh_categories_professionnelles` [categorieId]
- ← `rh_lignes_bulletin` (hasMany) [rubriqueId]

## `rh_categories_professionnelles` — RhCategorieProfessionnelle (0 ligne)
- ← `rh_grille_salariale` (hasMany) [categorieId]
- ← `rh_rubriques_paie` (hasMany) [categorieId]

## `rh_periodes_paie` — RhPeriodePaie (0 ligne)
- ← `rh_bulletins_paie` (hasMany) [periodeId]

## `rh_bulletins_paie` — RhBulletinPaie (5 lignes)
- → `rh_periodes_paie` [periodeId]
- → `rh_employes` [employeId]
- ← `rh_lignes_bulletin` (hasMany) [bulletinId]

## `rh_lignes_bulletin` — RhLigneBulletin (25 lignes)
- → `rh_bulletins_paie` [bulletinId]
- → `rh_rubriques_paie` [rubriqueId]

## `rh_prestations_enseignant` — RhPrestationEnseignant (5 lignes)
- → `rh_employes` [enseignantId]

## `rh_contrats_enseignant` — RhContratEnseignant (0 ligne)
- → `rh_employes` [employeId]

## `rh_planning_personnel` — RhPlanningPersonnel (0 ligne)
- → `rh_employes` [employeId]

## `rh_grille_salariale` — RhGrilleSalariale (0 ligne)
- → `rh_categories_professionnelles` [categorieId]
- → `rh_postes` [posteId]

## `rh_heures_supplementaires` — RhHeureSupplementaire (0 ligne)
- → `rh_employes` [employeId]

## `rh_prets` — RhPret (0 ligne)
- → `rh_employes` [employeId]
- ← `rh_remboursements_pret` (hasMany) [pretId]

## `rh_remboursements_pret` — RhRemboursementPret (0 ligne)
- → `rh_prets` [pretId]

## `rh_prestataires` — RhPrestataire (0 ligne)
- ← `rh_indemnites_prestataires` (hasMany) [prestataireId]

## `rh_indemnites_prestataires` — RhIndemnitePrestataire (0 ligne)
- → `rh_prestataires` [prestataireId]

## `rh_demandes_conge` — RhDemandeConge (0 ligne)
- → `rh_employes` [employeId]

## `rh_soldes_conge` — RhSoldeConge (0 ligne)
- → `rh_employes` [employeId]

---

# 8. Module stage (`stg_`)

## `stg_entreprises` — Entreprise (3 lignes)
- ← `stg_tuteurs` (hasMany) [entrepriseId]
- ← `stg_demandes_stage` (hasMany) [entrepriseId]

## `stg_tuteurs` — Tuteur (3 lignes)
- → `stg_entreprises` [entrepriseId]

## `stg_offres_stage` — OffreStage (3 lignes)
- → `aut_institutions` [institutionId]
- ← `stg_demandes_stage` (hasMany) [offreStageId]

## `stg_demandes_stage` — DemandeStage (3 lignes)
- → `stg_offres_stage` [offreStageId]
- → `stg_entreprises` [entrepriseId]
- → `aut_apprenants` [apprenantId]
- ← `stg_conventions_stage` (hasOne) [demandeStageId]
- ← `stg_rapports_stage` (hasOne) [demandeStageId]
- ← `stg_notes_stage` (hasOne) [demandeStageId]
- ← `stg_attestations_stage` (hasOne) [demandeStageId]

## `stg_conventions_stage` — ConventionStage (3 lignes)
- → `stg_demandes_stage` [demandeStageId]

## `stg_rapports_stage` — RapportStage (3 lignes)
- → `stg_demandes_stage` [demandeStageId]

## `stg_notes_stage` — NoteStage (3 lignes)
- → `stg_demandes_stage` [demandeStageId]
- → `aut_enseignants` [enseignantId]

## `stg_attestations_stage` — AttestationStage (0 ligne)
- → `stg_demandes_stage` [demandeStageId]

---

# 9. Module orientation (`ori_`)

> Module miroir de l'inscription : ses propres `niveaux_etudes`, `parcours`, `prerequis`, `parcours_choisis`.

## `ori_categories` — Categorie (3 lignes)
- ← `ori_parcours` (hasMany) [categorieId]

## `ori_niveaux_etudes` — NiveauEtude (3 lignes)
- ← `ori_parcours` (hasMany) [niveauEtudeId]
- ← `ori_prerequis_parcours` (hasMany) [niveauEtudeId]

## `ori_parcours` — Parcours (5 lignes)
- → `ori_categories` [categorieId]
- → `ori_niveaux_etudes` [niveauEtudeId]
- ← `ori_prerequis_parcours` (hasMany) [parcoursId]
- ← `ori_parcours_choisis` (hasMany) [parcoursId]
- ← `ori_debouches_parcours` (hasMany) [parcoursId]

## `ori_matieres_prerequis` — MatierePrerequis (5 lignes)
- ← `ori_prerequis_parcours` (hasMany) [matierePrerequisId]

## `ori_prerequis_parcours` — PrerequisParcours (5 lignes)
- → `ori_niveaux_etudes` [niveauEtudeId]
- → `ori_matieres_prerequis` [matierePrerequisId]
- → `ori_parcours` [parcoursId]
- ← `ori_prerequis_parcours_choisis` (hasMany) [prerequisParcoursId]

## `ori_debouches_parcours` — DeboucheParcours (5 lignes)
- → `ori_parcours` [parcoursId]

## `ori_parcours_choisis` — ParcoursChoisi (0 ligne)
- → `ori_parcours` [parcoursId]
- → `ori_demandes_orientation` [demandeOrientationId]
- ← `ori_prerequis_parcours_choisis` (hasMany) [parcoursChoisiId]
- ← `ori_panier_parcours_choisis` (hasMany) [parcoursChoisiId]

## `ori_prerequis_parcours_choisis` — PrerequisParcoursChoisi (0 ligne)
- → `ori_parcours_choisis` [parcoursChoisiId]
- → `ori_prerequis_parcours` [prerequisParcoursId]

## `ori_panier_parcours_choisis` — PanierParcoursChoisi (0 ligne)
- → `ori_parcours_choisis` [parcoursChoisiId]
- → `aut_utilisateurs` [utilisateurId]

## `ori_demandes_orientation` — DemandeOrientation (1 ligne)
- → `aut_utilisateurs` [utilisateurId]
- → `ins_annees_academiques` [anneeAcademiqueId] *(inter-module)*
- ← `ori_parcours_choisis` (hasMany) [demandeOrientationId]
- ← `ori_reponses_orientation` (hasOne) [demandeOrientationId]

## `ori_reponses_orientation` — ReponseOrientation (1 ligne)
- → `ori_demandes_orientation` [demandeOrientationId]
- → `aut_utilisateurs` [utilisateurId]

---

# 10. Module communication (`com_`)

## `com_communications` — Communication (3 lignes)
- → `aut_utilisateurs` [utilisateurId]

## `com_actualites` — Actualite (2 lignes)
- *Aucune association déclarée*

## `com_suggestions` — Suggestion (2 lignes)
- → `aut_utilisateurs` [utilisateurId]
- ← `com_reponses_suggestion` (hasMany) [suggestionId]

## `com_reponses_suggestion` — ReponseSuggestion (0 ligne)
- → `com_suggestions` [suggestionId]
- → `aut_utilisateurs` [utilisateurId]

---

# 11. Module comptabilite (`cpt_`)

## `cpt_comptes` — Compte (41 lignes)
- ← `cpt_ecritures_comptables` (hasMany) [compteDebitId] (alias `debitures`) + [compteCreditId] (alias `creditures`)

## `cpt_journaux_comptables` — JournalComptable (3 lignes)
- ← `cpt_ecritures_comptables` (hasMany) [journalId]

## `cpt_exercices` — ExerciceComptable (1 ligne)
- ← `cpt_ecritures_comptables` (hasMany) [exerciceId]

## `cpt_ecritures_comptables` — EcritureComptable (3 lignes)
- → `cpt_exercices` [exerciceId]
- → `cpt_journaux_comptables` [journalId]
- → `cpt_comptes` [compteDebitId] + [compteCreditId]
- → `aut_utilisateurs` [utilisateurSaisieId] + [utilisateurValidationId]
- ← `cpt_lignes_releves_bancaires` (hasMany) [ecritureComptableId]

## `cpt_frais_parcours` — FraisParcours (comptabilite) (1 ligne)
- → `ins_parcours` [parcoursId] *(inter-module)*
- → `ins_niveaux_etudes` [niveauEtudeId] *(inter-module)*
- → `ins_annees_academiques` [anneeAcademiqueId] *(inter-module)*

> ⚠️ Ne pas confondre avec `ins_frais_parcours` (module inscription) : deux modèles distincts portant le même nom `FraisParcours`.

## `cpt_lignes_frais_etudiant` — LigneFraisEtudiant (0 ligne)
- → `ins_dossiers_etudiants` [dossierEtudiantId] *(inter-module)*
- → `cpt_reductions_frais` [reductionId]

## `cpt_reductions_frais` — ReductionFrais (comptabilite) (0 ligne)
- → `ins_dossiers_etudiants` [dossierEtudiantId] *(inter-module)*
- → `aut_utilisateurs` [validePar]
- ← `cpt_lignes_frais_etudiant` (hasMany) [reductionId]

## `cpt_penalites_retard` — PenaliteRetard (comptabilite) (0 ligne)
- *Aucune association déclarée*

## `cpt_parametres_frais` — ParametreFrais (4 lignes)
- *Aucune association déclarée*

## `cpt_comptes_bancaires` — CompteBancaire (0 ligne)
- ← `cpt_releves_bancaires` (hasMany) [compteBancaireId]

## `cpt_releves_bancaires` — ReleveBancaire (0 ligne)
- → `cpt_comptes_bancaires` [compteBancaireId]
- ← `cpt_lignes_releves_bancaires` (hasMany) [releveBancaireId]

## `cpt_lignes_releves_bancaires` — LigneReleveBancaire (0 ligne)
- → `cpt_releves_bancaires` [releveBancaireId]
- → `cpt_ecritures_comptables` [ecritureComptableId]

---

# 12. Module achats (`ach_`)

## `ach_categories` — CategorieAchat (3 lignes)
- ← `ach_lignes_budget` (hasMany) [categorieAchatId]

## `ach_budgets` — Budget (0 ligne)
- → `imm_departement` [departementId] *(inter-module)*
- ← `ach_lignes_budget` (hasMany) [budgetId]
- ← `ach_engagements` (hasMany) [budgetId]

## `ach_lignes_budget` — LigneBudget (3 lignes)
- → `ach_categories` [categorieAchatId]
- → `ach_budgets` [budgetId]

## `ach_demandes` — Demande (0 ligne)
- → `aut_utilisateurs` [soumisParId] (alias `soumisPar`)
- ← `ach_lignes_demande` (hasMany) [demandeId]
- ← `ach_validations` (hasMany) [demandeId]
- ← `ach_engagements` (hasMany) [demandeId]
- ← `ach_commandes` (hasMany) [demandeId]

## `ach_lignes_demande` — LigneDemande (2 lignes)
- → `ach_demandes` [demandeId]

## `ach_validateurs` — Validateur (2 lignes)
- → `aut_utilisateurs` [utilisateurId]
- ← `ach_validations` (hasMany) [validateurId]

## `ach_validations` — Validation (0 ligne)
- → `ach_demandes` [demandeId]
- → `ach_validateurs` [validateurId]

## `ach_engagements` — Engagement (0 ligne)
- → `ach_demandes` [demandeId]
- → `ach_budgets` [budgetId]

## `ach_fournisseurs` — Fournisseur (2 lignes)
- ← `ach_commandes` (hasMany) [fournisseurId]

## `ach_commandes` — Commande (0 ligne)
- → `ach_demandes` [demandeId]
- → `ach_fournisseurs` [fournisseurId]
- ← `ach_lignes_commande` (hasMany) [commandeId]
- ← `ach_receptions` (hasMany) [commandeId]
- ← `ach_factures_proforma` (hasMany) [commandeId]

## `ach_lignes_commande` — LigneCommande (2 lignes)
- → `ach_commandes` [commandeId]
- ← `ach_lignes_reception` (hasMany) [ligneCommandeId]
- ← `ach_lignes_facture` (hasMany) [ligneCommandeId]

## `ach_receptions` — Reception (0 ligne)
- → `ach_commandes` [commandeId]
- ← `ach_lignes_reception` (hasMany) [receptionId]

## `ach_lignes_reception` — LigneReception (2 lignes)
- → `ach_receptions` [receptionId]
- → `ach_lignes_commande` [ligneCommandeId]

## `ach_factures_proforma` — FactureProforma (1 ligne)
- → `ach_commandes` [commandeId]
- ← `ach_lignes_facture` (hasMany) [factureId]
- *(colonnes signature : `signatureData`, `signataireNom`, `signataireRole`, `dateSignature`)*

## `ach_lignes_facture` — LigneFacture (2 lignes)
- → `ach_lignes_commande` [ligneCommandeId]
- → `ach_factures_proforma` [factureId]

---

# 13. Module marche (`mar_`)

## `mar_planifications` — PlanificationMarche (0 ligne)
- ← `mar_manifestations_interet` (hasMany) [planificationMarcheId]
- ← `mar_appels_offre` (hasMany) [planificationMarcheId]

## `mar_manifestations_interet` — ManifestationInteret (0 ligne)
- → `mar_planifications` [planificationMarcheId]
- ← `mar_contrats` (hasMany) [manifestationInteretId]

## `mar_appels_offre` — AppelOffre (0 ligne)
- → `mar_planifications` [planificationMarcheId]
- ← `mar_contrats` (hasMany) [appelOffreId]

## `mar_contrats` — ContratMarche (0 ligne)
- → `mar_appels_offre` [appelOffreId]
- → `mar_manifestations_interet` [manifestationInteretId]
- ← `mar_avenants` (hasMany) [contratMarcheId]

## `mar_avenants` — AvenantMarche (0 ligne)
- → `mar_contrats` [contratMarcheId]

---

# 14. Module stock (`stk_`)

## `stk_categorie_article` — CategorieArticle (2 lignes)
- ← `stk_article` (hasMany) [categorieId]

## `stk_article` — Article (5 lignes)
- → `stk_categorie_article` [categorieId]
- → `imm_site` [siteId] *(inter-module)*
- ← `stk_mouvement_stock` (hasMany) [articleId]
- ← `stk_besoin` (hasMany) [articleId]
- ← `stk_demande_prix` (hasMany) [articleId]
- ← `stk_rebut` (hasMany) [articleId]
- ← `stk_correction_stock` (hasMany) [articleId]
- ← `stk_ligne_inventaire_stock` (hasMany) [articleId]
- ← `stk_ligne_bon_commande` (hasMany) [articleId]

## `stk_fournisseur` — Fournisseur (2 lignes)
- ← `stk_mouvement_stock` (hasMany) [fournisseurId]
- ← `stk_bon_commande` (hasMany) [fournisseurId]
- ← `stk_demande_prix` (hasMany) [fournisseurId]

## `stk_bon_commande` — BonCommande (0 ligne)
- → `stk_fournisseur` [fournisseurId]
- → `imm_site` [siteId] *(inter-module)*
- ← `stk_ligne_bon_commande` (hasMany) [bonCommandeId]

## `stk_ligne_bon_commande` — LigneBonCommande (0 ligne)
- → `stk_bon_commande` [bonCommandeId]
- → `stk_article` [articleId]

## `stk_mouvement_stock` — MouvementStock (4 lignes)
- → `stk_article` [articleId]
- → `stk_fournisseur` [fournisseurId]
- → `imm_site` [siteId] *(inter-module)*

## `stk_besoin` — Besoin (0 ligne)
- → `stk_article` [articleId]

## `stk_demande_prix` — DemandePrix (0 ligne)
- → `stk_article` [articleId]
- → `stk_fournisseur` [fournisseurId]

## `stk_rebut` — Rebut (0 ligne)
- → `stk_article` [articleId]

## `stk_correction_stock` — CorrectionStock (0 ligne)
- → `stk_article` [articleId]

## `stk_inventaire_stock` — InventaireStock (0 ligne)
- ← `stk_ligne_inventaire_stock` (hasMany) [inventaireId]

## `stk_ligne_inventaire_stock` — LigneInventaireStock (0 ligne)
- → `stk_inventaire_stock` [inventaireId]
- → `stk_article` [articleId]

## `stk_transferts` — TransfertStock (0 ligne)
- *Aucune association déclarée*

---

# 15. Module immobilisation (`imm_`)

## `imm_site` — Site (2 lignes)
- ← `imm_batiment` (hasMany) [siteId]
- ← `imm_immobilisation` (hasMany) [siteId]
- ← `imm_affectation` (hasMany) [siteId]
- ← `stk_article` (hasMany) [siteId]
- ← `stk_mouvement_stock` (hasMany) [siteId]
- ← `stk_bon_commande` (hasMany) [siteId]

## `imm_batiment` — Batiment (3 lignes)
- → `imm_site` [siteId]
- ← `imm_localisation` (hasMany) [batimentId]

## `imm_localisation` — Localisation (3 lignes)
- → `imm_batiment` [batimentId]
- ← `imm_immobilisation` (hasMany) [localisationId]
- ← `imm_affectation` (hasMany) [localisationId]
- ← `ins_salles_de_classes` (hasMany) [localisationId]

## `imm_departement` — Departement (2 lignes)
- ← `imm_immobilisation` (hasMany) [departementId]
- ← `imm_affectation` (hasMany) [departementId]
- ← `ach_budgets` (hasMany) [departementId]

## `imm_categorie_immobilisation` — CategorieImmobilisation (3 lignes)
- ← `imm_immobilisation` (hasMany) [categorieId]

## `imm_immobilisation` — Immobilisation (4 lignes)
- → `imm_categorie_immobilisation` [categorieId]
- → `imm_localisation` [localisationId]
- → `imm_departement` [departementId]
- → `imm_site` [siteId]
- ← `imm_acquisition` (hasOne) [immobilisationId]
- ← `imm_amortissement` (hasMany) [immobilisationId]
- ← `imm_maintenance` (hasMany) [immobilisationId]
- ← `imm_maintenance_programmee` (hasMany) [immobilisationId]
- ← `imm_cession` (hasOne) [immobilisationId]
- ← `imm_assurance` (hasOne) [immobilisationId]
- ← `imm_affectation` (hasMany) [immobilisationId]
- ← `imm_sortie_provisoire` (hasMany) [immobilisationId]
- ← `imm_ligne_inventaire` (hasMany) [immobilisationId]
- ← `imm_rebuts_immobilisation` (hasMany) [immobilisationId]

## `imm_acquisition` — Acquisition (4 lignes)
- → `imm_immobilisation` [immobilisationId]

## `imm_amortissement` — Amortissement (0 ligne)
- → `imm_immobilisation` [immobilisationId]

## `imm_maintenance` — Maintenance (4 lignes)
- → `imm_immobilisation` [immobilisationId]

## `imm_maintenance_programmee` — MaintenanceProgrammee (0 ligne)
- → `imm_immobilisation` [immobilisationId]

## `imm_cession` — Cession (0 ligne)
- → `imm_immobilisation` [immobilisationId]

## `imm_assurance` — Assurance (0 ligne)
- → `imm_immobilisation` [immobilisationId]

## `imm_affectation` — Affectation (0 ligne)
- → `imm_immobilisation` [immobilisationId]
- → `imm_site` [siteId]
- → `imm_departement` [departementId]
- → `imm_localisation` [localisationId]

## `imm_sortie_provisoire` — SortieProvisoire (0 ligne)
- → `imm_immobilisation` [immobilisationId]

## `imm_inventaire` — Inventaire (0 ligne)
- ← `imm_ligne_inventaire` (hasMany) [inventaireId]

## `imm_ligne_inventaire` — LigneInventaire (0 ligne)
- → `imm_inventaire` [inventaireId]
- → `imm_immobilisation` [immobilisationId]

## `imm_rebuts_immobilisation` — RebutImmobilisation (0 ligne)
- → `imm_immobilisation` [immobilisationId]

---

# 16. Module docgen (`docgen_`)

## `docgen_types` — DocGenType (0 ligne)
- ← `docgen_templates` (hasMany) [typeId]
- ← `docgen_documents` (hasMany) [typeId]
- ← `docgen_workflows` (hasMany) [typeId]
- ← `docgen_references` (hasMany) [typeId]

## `docgen_templates` — DocGenTemplate (0 ligne)
- → `docgen_types` [typeId]
- ← `docgen_documents` (hasMany) [templateId]

## `docgen_documents` — DocGenDocument (0 ligne)
- → `docgen_types` [typeId]
- → `docgen_templates` [templateId]
- ← `docgen_signatures` (hasMany) [documentId]

## `docgen_signatures` — DocGenSignature (0 ligne)
- → `docgen_documents` [documentId]

## `docgen_workflows` — DocGenWorkflow (0 ligne)
- → `docgen_types` [typeId]

## `docgen_references` — DocGenReference (0 ligne)
- → `docgen_types` [typeId]

## `docgen_cachets` — DocGenCachet (0 ligne)
- *Aucune association déclarée*

---

# 17. Module ged (`ged_`)

## `ged_domains` — Domain (0 ligne)
- ← `ged_folders` (hasMany) [domainId]
- ← `ged_documents` (hasMany) [domainId]
- ← `ged_role_permissions` (hasMany) [domainId]

## `ged_folders` — Folder (0 ligne)
- → `ged_domains` [domainId]
- → `aut_utilisateurs` [createdBy] (alias `creator`)
- → `ged_folders` [parentId] *(auto-référence : arborescence)*
- ← `ged_documents` (hasMany) [folderId]
- ← `ged_folders` (hasMany) [parentId] (alias `children`)

## `ged_sessions` — SessionGed (0 ligne)
- → `aut_utilisateurs` [createdBy]
- ← `ged_documents` (hasMany) [sessionId]

## `ged_document_types` — DocumentType (0 ligne)
- ← `ged_documents` (hasMany) [documentTypeId]

## `ged_documents` — DocumentGed (0 ligne)
- → `aut_utilisateurs` [uploaderId] + [lockedBy] (alias `locker`)
- → `ged_folders` [folderId]
- → `ged_sessions` [sessionId]
- → `ged_domains` [domainId]
- → `ged_document_types` [documentTypeId]
- → `ged_documents` [parentDocumentId] *(auto-référence : versioning)*
- → `ged_processus` [processusGenerateurId]
- ⇄ `ged_tags` via `ged_document_tags` [documentId]
- ← `ged_documents` (hasMany) [parentDocumentId] (alias `versions`)
- ← `ged_audit_logs` (hasMany) [documentId]
- ← `ged_disposal_records` (hasMany) [documentId]
- ← `ged_document_access_grants` (hasMany) [documentId]
- ← `ged_signatures` (hasMany) [documentId]
- ← `ged_registre_courrier` (hasMany) [documentId]
- ← `ged_document_tags` (hasMany) [documentId]

## `ged_processus` — ProcessusGenerateur (0 ligne)
- ← `ged_documents` (hasMany) [processusGenerateurId]
- ← `ged_role_permissions` (hasMany) [processusGenerateurId]

## `ged_role_permissions` — RolePermission (0 ligne)
- → `ged_domains` [domainId]
- → `ged_processus` [processusGenerateurId]

## `ged_signatures` — GedSignature (0 ligne)
- → `ged_documents` [documentId]
- → `aut_utilisateurs` [requestedBy] + [signedBy] + [rejectedBy]

## `ged_registre_courrier` — RegistreCourrier (0 ligne)
- → `ged_documents` [documentId]
- → `aut_utilisateurs` [utilisateurId]

## `ged_tags` — Tag (0 ligne)
- ⇄ `ged_documents` via `ged_document_tags` [tagId]
- ← `ged_document_tags` (hasMany) [tagId]

## `ged_document_tags` — DocumentTag (0 ligne, table de jonction)
- → `ged_documents` [documentId]
- → `ged_tags` [tagId]

## Tables sans association
| Table | Remarque |
|---|---|
| `ged_audit_logs` (0) | → `ged_documents` [documentId] déclaré |
| `ged_disposal_records` (0) | → `ged_documents` + `aut_utilisateurs` (requester/confirmer) |
| `ged_document_access_grants` (0) | → `ged_documents` [documentId] |
| `ged_notifications` (0) | aucune relation |
| `ged_backups` (0) | aucune relation |
| `ged_reference_counters` (0) | aucune relation |

---

# 18. Module elearning (`elearning_`)

## `elearning_cours` — CoursEnLigne (3 lignes)
- → `ins_cours` [coursId] *(alias `coursPedagogique`, sans contrainte FK)*
- → `aut_utilisateurs` [enseignantId]
- ← `elearning_modules` (hasMany) [coursId]
- ← `elearning_salons` (hasMany) [coursId]
- ← `elearning_devoirs` (hasMany) [coursId]
- ← `elearning_quiz` (hasMany) [coursId]
- ← `elearning_certificats` (hasMany) [coursId]

## `elearning_modules` — ModuleElearning (3 lignes)
- → `elearning_cours` [coursId]
- ← `elearning_supports` (hasMany) [moduleId]

## `elearning_supports` — Support (3 lignes)
- → `elearning_modules` [moduleId]
- ← `elearning_commentaires` (hasMany) [supportId]
- ← `elearning_couplages_mail` (hasMany) [supportId]
- ← `elearning_progression_apprenant` (hasMany) [supportId]

## `elearning_commentaires` — Commentaire (3 lignes)
- → `elearning_supports` [supportId]

## `elearning_couplages_mail` — CouplageMail (2 lignes)
- → `elearning_supports` [supportId]

## `elearning_salons` — Salon (5 lignes)
- → `elearning_cours` [coursId]
- → `aut_utilisateurs` [createdById] *(sans contrainte FK)*
- ← `elearning_messages` (hasMany) [salonId]
- ← `elearning_participants_salon` (hasMany) [salonId]

## `elearning_messages` — Message (5 lignes)
- → `elearning_salons` [salonId]

## `elearning_participants_salon` — ParticipantSalon (13 lignes)
- → `elearning_salons` [salonId]
- → `aut_utilisateurs` [utilisateurId] *(sans contrainte FK)*

## `elearning_devoirs` — Devoir (0 ligne)
- → `elearning_cours` [coursId]
- → `aut_utilisateurs` [enseignantId]
- ← `elearning_soumissions_devoirs` (hasMany) [devoirId]

## `elearning_soumissions_devoirs` — SoumissionDevoir (0 ligne)
- → `elearning_devoirs` [devoirId]
- → `aut_utilisateurs` [apprenantId]

## `elearning_quiz` — Quiz (0 ligne)
- → `elearning_cours` [coursId]
- ← `elearning_reponses_quiz` (hasMany) [quizId]

## `elearning_reponses_quiz` — ReponseQuiz (0 ligne)
- → `elearning_quiz` [quizId]
- → `aut_utilisateurs` [apprenantId]

## `elearning_certificats` — Certificat (0 ligne)
- → `elearning_cours` [coursId]
- → `aut_utilisateurs` [apprenantId]

## `elearning_progression_apprenant` — ProgressionApprenant (3 lignes)
- → `elearning_supports` [supportId]
- → `aut_utilisateurs` [apprenantId]

## `elearning_notifications` — Notification (11 lignes)
- *Aucune association déclarée*

---

# 19. Module qualite (`qua_`)

## `qua_non_conformites` — QuaNonConformite (0 ligne)
- ← `qua_actions_correctives` (hasMany) [nonConformiteId]

## `qua_actions_correctives` — QuaActionCorrective (0 ligne)
- → `qua_non_conformites` [nonConformiteId]

## `qua_audits` — QuaAudit (0 ligne)
- ← `qua_audit_pistes` (hasMany) [auditId]

## `qua_audit_pistes` — QuaAuditPiste (0 ligne)
- → `qua_audits` [auditId]

## `qua_revues_direction` — QuaRevueDirection (0 ligne)
- ← `qua_decisions_revue` (hasMany) [revueDirectionId]

## `qua_decisions_revue` — QuaDecisionRevue (0 ligne)
- → `qua_revues_direction` [revueDirectionId]

## `qua_enquetes_satisfaction` — QuaEnqueteSatisfaction (0 ligne)
- ← `qua_reponses_satisfaction` (hasMany) [enqueteSatisfactionId]

## `qua_reponses_satisfaction` — QuaReponseSatisfaction (0 ligne)
- → `qua_enquetes_satisfaction` [enqueteSatisfactionId]

---

# 20. Module reporting (`rpt_`)

> Tables de restitution (vues matérialisées / agrégats). **Aucune association déclarée**, aucune FK.

| Table | Table |
|---|---|
| `rpt_effectifs` | `rpt_paiements` |
| `rpt_inscriptions` | `rpt_budget_vs_reel` |
| `rpt_notes_moyennes` | `rpt_factures` |
| `rpt_presence` | `rpt_effectifs_rh` |
| `rpt_reussite` | `rpt_paie` |
| `rpt_document_academique` | `rpt_formations_rh` |
| `rpt_evaluations` | `rpt_achats` |
| `rpt_stocks` | `rpt_immobilisations` |

---

# 21. Tables sans aucune relation (récapitulatif)

| Table | Module |
|---|---|
| `ins_echelles_notes` | bulletins |
| `ins_etapes_inscription` (sauf relation déclarée côté DemandeInscription) | inscription |
| `scol_sanctions_discipline` | scolarite |
| `com_actualites` | communication |
| `cpt_penalites_retard` (comptabilite) | comptabilite |
| `cpt_parametres_frais` | comptabilite |
| `stk_transferts` | stock |
| `docgen_cachets` | docgen |
| `ged_notifications`, `ged_backups`, `ged_reference_counters` | ged |
| `elearning_notifications` | elearning |
| Toutes les tables `rpt_*` | reporting |

---

# 22. Dépendances inter-modules (qui référence qui)

| Table | Référence (module → table) |
|---|---|
| `aut_utilisateurs` | → etablissement (`eta_etablissements`) |
| `par_parents_enfants` | → auth (`aut_utilisateurs`, `aut_apprenants`) |
| `ins_cours` | → auth (`aut_enseignants`) · etablissement (`eta_etablissements`) |
| `ins_salles_de_classes` | → immobilisation (`imm_localisation`) |
| `ins_cursus_apprenants` | → etablissement (`eta_etablissements`) |
| `ins_dossiers_etudiants` | → auth (`aut_utilisateurs`) |
| `ins_bulletins` / lignes | → auth (`aut_utilisateurs`) |
| `scol_*` | → auth (`aut_utilisateurs`) · inscription (`ins_*`) |
| `ori_demandes_orientation` | → inscription (`ins_annees_academiques`) |
| `stg_offres_stage` | → auth (`aut_institutions`) |
| `stg_demandes_stage` | → auth (`aut_apprenants`) |
| `stg_notes_stage` | → auth (`aut_enseignants`) |
| `cpt_frais_parcours` | → inscription (`ins_parcours`, `ins_niveaux_etudes`, `ins_annees_academiques`) |
| `cpt_lignes_frais_etudiant` / `cpt_reductions_frais` | → inscription (`ins_dossiers_etudiants`) |
| `cpt_ecritures_comptables` | → auth (`aut_utilisateurs`) |
| `ach_budgets` | → immobilisation (`imm_departement`) |
| `stk_article`, `stk_bon_commande`, `stk_mouvement_stock` | → immobilisation (`imm_site`) |
| `ged_*` | → auth (`aut_utilisateurs`) |
| `elearning_*` | → inscription (`ins_cours`) · auth (`aut_utilisateurs`) |

---

# 23. Ordre de peuplement conseillé (pour le seed complet)

1. **etablissement** : `eta_etablissements` (racine)
2. **immobilisation (partiel)** : `imm_site` → `imm_batiment` → `imm_localisation` → `imm_departement` → `imm_categorie_immobilisation`
3. **auth** : `aut_utilisateurs` → `aut_roles` → `aut_permissions` → `aut_role_permissions` → `aut_user_roles`/`aut_user_permissions` → profils (`aut_apprenants`/`aut_institutions`/`aut_enseignants`/`aut_caissiers_banque`/`aut_comite_orientations`) → adresses/identités/infos (1-1)
4. **parent** : `par_parents_enfants`
5. **inscription (référentiels)** : `ins_niveaux_etudes` → `ins_annees_academiques` → `ins_parcours` → `ins_classes` → `ins_sessions` → `ins_matieres_prerequis` → `ins_prerequis_parcours` → `ins_etapes_inscription`
6. **inscription (parcours candidat)** : `ins_demandes_inscription` → `ins_parcours_choisis` → `ins_prerequis_parcours_choisis` → `ins_reponses_inscription` → `ins_pre_inscriptions` → `ins_dossiers_inscription` + `ins_dossiers_demandes` → `ins_cours_choisis` → `ins_frais_inscription` → `ins_paiements_inscription` → `ins_quitus` → `ins_dossiers_etudiants` → `ins_echeances` → `ins_bordereaux`
7. **inscription (pédagogique)** : `ins_cours` → `ins_salles_de_classes` → `ins_chapitres_cours` → `ins_ressources` → `ins_fichiers_ressources` → `ins_cursus_apprenants` → `ins_cours_participants` → `ins_seances` → `ins_listes_presences` → `ins_presences` → `ins_presences_cours_participants` → `ins_cahiers_de_texte` → `ins_blocs_cahier_de_texte` → `ins_types_note_evaluation` → `ins_listes_notes_evaluation` → `ins_notes_evaluation` → `ins_absences` → `ins_pointages` → `ins_ecue` → `ins_mcc` → `ins_regles_evaluation` → `ins_sessions_examens` → `ins_equivalences` → `ins_dispenses` → `ins_rattrapages_inscriptions` → `ins_publications_notes` → `ins_semestres_academiques` → `ins_frais_parcours` → `ins_reduction_frais` → `ins_penalite_retard`
8. **bulletins** : `ins_bulletins` → `ins_lignes_bulletins` → `ins_deliberations` → `ins_jury_membres` → `ins_resultats_deliberation` → `ins_historique_decisions` → `ins_dettes_academiques` → `ins_audit_notes` → `ins_echelles_notes`
9. **scolarite** : `scol_types_document` → `scol_demandes_document` → `scol_documents_delivres` · `scol_conseils_classe` → `scol_decisions_conseil` · `scol_reclamations` → `scol_reponses_reclamation` · `scol_evenements_calendrier` · `scol_registres_academiques` · `scol_livres` · `scol_decisions_passage` · `scol_demandes_reorientation` · `scol_sanctions_academiques` · `scol_diplomes` · `scol_demandes_vae` · `scol_progression_pedagogique`
10. **orientation** : `ori_categories` → `ori_niveaux_etudes` → `ori_parcours` → `ori_matieres_prerequis` → `ori_prerequis_parcours` → `ori_debouches_parcours` → `ori_demandes_orientation` → `ori_parcours_choisis` → `ori_prerequis_parcours_choisis` → `ori_reponses_orientation` → `ori_panier_parcours_choisis`
11. **rh** : `rh_departements` → `rh_postes` → `rh_types_contrat` → `rh_categories_professionnelles` → `rh_employes` → `rh_rubriques_paie` → `rh_grille_salariale` → `rh_offres_emploi` → `rh_candidatures` → `rh_entretiens` → `rh_formations` → `rh_participations_formation` → `rh_criteres_evaluation` → `rh_fiches_evaluation` → `rh_evaluations_criteres` → `rh_periodes_paie` → `rh_bulletins_paie` → `rh_lignes_bulletin` → `rh_prestations_enseignant` → `rh_contrats_enseignant` → `rh_planning_personnel` → `rh_heures_supplementaires` → `rh_prets` → `rh_remboursements_pret` → `rh_prestataires` → `rh_indemnites_prestataires` → `rh_demandes_conge` → `rh_soldes_conge`
12. **stage** : `stg_entreprises` → `stg_tuteurs` → `stg_offres_stage` → `stg_demandes_stage` → `stg_conventions_stage` → `stg_rapports_stage` → `stg_notes_stage` → `stg_attestations_stage`
13. **communication** : `com_communications` · `com_actualites` · `com_suggestions` → `com_reponses_suggestion`
14. **comptabilite** : `cpt_comptes` → `cpt_journaux_comptables` → `cpt_exercices` → `cpt_ecritures_comptables` → `cpt_comptes_bancaires` → `cpt_releves_bancaires` → `cpt_lignes_releves_bancaires` → `cpt_parametres_frais` → `cpt_frais_parcours` → `cpt_reductions_frais` → `cpt_lignes_frais_etudiant`
15. **achats** : `ach_categories` → `ach_budgets` → `ach_lignes_budget` → `ach_validateurs` → `ach_demandes` → `ach_lignes_demande` → `ach_validations` → `ach_engagements` → `ach_fournisseurs` → `ach_commandes` → `ach_lignes_commande` → `ach_receptions` → `ach_lignes_reception` → `ach_factures_proforma` → `ach_lignes_facture`
16. **marche** : `mar_planifications` → `mar_manifestations_interet` → `mar_appels_offre` → `mar_contrats` → `mar_avenants`
17. **stock** : `stk_categorie_article` → `stk_article` → `stk_fournisseur` → `stk_bon_commande` → `stk_ligne_bon_commande` → `stk_mouvement_stock` → `stk_besoin` → `stk_demande_prix` → `stk_rebut` → `stk_correction_stock` → `stk_inventaire_stock` → `stk_ligne_inventaire_stock` → `stk_transferts`
18. **immobilisation (suite)** : `imm_immobilisation` → `imm_acquisition` → `imm_amortissement` → `imm_maintenance` → `imm_maintenance_programmee` → `imm_cession` → `imm_assurance` → `imm_affectation` → `imm_sortie_provisoire` → `imm_inventaire` → `imm_ligne_inventaire` → `imm_rebuts_immobilisation`
19. **docgen** : `docgen_types` → `docgen_templates` → `docgen_documents` → `docgen_signatures` · `docgen_workflows` → `docgen_references` → `docgen_cachets`
20. **ged** : `ged_domains` → `ged_document_types` → `ged_folders` (arborescence) → `ged_sessions` → `ged_processus` → `ged_role_permissions` → `ged_documents` → `ged_audit_logs` → `ged_disposal_records` → `ged_document_access_grants` → `ged_signatures` → `ged_registre_courrier` → `ged_tags` → `ged_document_tags` → `ged_notifications`/`ged_backups`/`ged_reference_counters`
21. **elearning** : `elearning_cours` → `elearning_modules` → `elearning_supports` → `elearning_commentaires` → `elearning_couplages_mail` → `elearning_progression_apprenant` → `elearning_salons` → `elearning_messages` → `elearning_participants_salon` → `elearning_devoirs` → `elearning_soumissions_devoirs` → `elearning_quiz` → `elearning_reponses_quiz` → `elearning_certificats` → `elearning_notifications`
22. **qualite** : `qua_non_conformites` → `qua_actions_correctives` · `qua_audits` → `qua_audit_pistes` · `qua_revues_direction` → `qua_decisions_revue` · `qua_enquetes_satisfaction` → `qua_reponses_satisfaction`
23. **reporting** : tables `rpt_*` (indépendantes, alimentées par agrégats)

---

## Notes

- **`ins_bulletins` et associés** appartiennent au module bulletins mais portent le préfixe `ins_` (pas de `*Module.ts`, héritage du préfixe inscription).
- **Doublons de noms de modèles** : `FraisParcours`, `ReductionFrais`, `PenaliteRetard` existent à la fois dans inscription (`ins_*`) et comptabilite (`cpt_*`) ; le seed devra traiter les deux explicitement.
- **FK sans contrainte** (`constraints: false`) : `elearning_cours.coursId`, `elearning_salons.createdById`, `elearning_participants_salon.utilisateurId` — pas de contrainte en base, mais relation logique pour l'API.
- **Tables de jonction** : `aut_role_permissions`, `aut_user_roles`, `aut_user_permissions`, `ins_cours_choisis`, `ins_dossiers_demandes`, `ged_document_tags`.
- **Auto-références** : `ged_folders.parentId` (arborescence), `ged_documents.parentDocumentId` (versioning).
- Nombre total de tables en base : **~280** (dont 5 tables `docgen_*` sans seed précédent, 14 tables `rpt_*`, et la plupart des modules financiers/logistiques vides).
