# Tables et relations de la base EasyEcole

> Inventaire extrait des modeles Sequelize presents dans `easy-ecole-backend/src/modules/`.
> Il decrit le schema declare dans le code, pas necessairement la base deployee en production. Les migrations peuvent ajouter des tables ou modifier des colonnes et contraintes. Ce document ne liste pas les enregistrements ni le nombre de lignes de la base.

## Perimetre

- **328 modeles Sequelize** inventories dans **328 noms de tables distincts**.
- **472 relations par cle etrangere** et **6 relations plusieurs-a-plusieurs** dedupliquees depuis les associations declarees.
- Les associations Sequelize indiquent les liens utilises par l'application; elles ne prouvent pas a elles seules la presence d'une contrainte `FOREIGN KEY` physique dans MySQL/MariaDB.
- Les tables creees uniquement par migrations, bibliotheques ou composants externes sans modele Sequelize ne figurent pas dans cet inventaire.

## Inventaire des tables

### Module achats - prefixe `ach_` (15)

| Table | Modele Sequelize | Fichier source |
|---|---|---|
| `ach_budgets` | `Budget` | [Budget.ts](../easy-ecole-backend/src/modules/achats/models/Budget.ts) |
| `ach_categories` | `CategorieAchat` | [CategorieAchat.ts](../easy-ecole-backend/src/modules/achats/models/CategorieAchat.ts) |
| `ach_commandes` | `Commande` | [Commande.ts](../easy-ecole-backend/src/modules/achats/models/Commande.ts) |
| `ach_demandes` | `Demande` | [Demande.ts](../easy-ecole-backend/src/modules/achats/models/Demande.ts) |
| `ach_engagements` | `Engagement` | [Engagement.ts](../easy-ecole-backend/src/modules/achats/models/Engagement.ts) |
| `ach_factures_proforma` | `FactureProforma` | [FactureProforma.ts](../easy-ecole-backend/src/modules/achats/models/FactureProforma.ts) |
| `ach_fournisseurs` | `Fournisseur` | [Fournisseur.ts](../easy-ecole-backend/src/modules/achats/models/Fournisseur.ts) |
| `ach_lignes_budget` | `LigneBudget` | [LigneBudget.ts](../easy-ecole-backend/src/modules/achats/models/LigneBudget.ts) |
| `ach_lignes_commande` | `LigneCommande` | [LigneCommande.ts](../easy-ecole-backend/src/modules/achats/models/LigneCommande.ts) |
| `ach_lignes_demande` | `LigneDemande` | [LigneDemande.ts](../easy-ecole-backend/src/modules/achats/models/LigneDemande.ts) |
| `ach_lignes_facture` | `LigneFacture` | [LigneFacture.ts](../easy-ecole-backend/src/modules/achats/models/LigneFacture.ts) |
| `ach_lignes_reception` | `LigneReception` | [LigneReception.ts](../easy-ecole-backend/src/modules/achats/models/LigneReception.ts) |
| `ach_receptions` | `Reception` | [Reception.ts](../easy-ecole-backend/src/modules/achats/models/Reception.ts) |
| `ach_validateurs` | `Validateur` | [Validateur.ts](../easy-ecole-backend/src/modules/achats/models/Validateur.ts) |
| `ach_validations` | `Validation` | [Validation.ts](../easy-ecole-backend/src/modules/achats/models/Validation.ts) |

### Module auth - prefixe `aut_` (23)

| Table | Modele Sequelize | Fichier source |
|---|---|---|
| `aut_adresses_apprenants` | `AdresseApprenant` | [AdresseApprenant.ts](../easy-ecole-backend/src/modules/auth/models/AdresseApprenant.ts) |
| `aut_adresses_caissiers_banque` | `AdresseCaissierBanque` | [AdresseCaissierBanque.ts](../easy-ecole-backend/src/modules/auth/models/AdresseCaissierBanque.ts) |
| `aut_adresses_enseignants` | `AdresseEnseignant` | [AdresseEnseignant.ts](../easy-ecole-backend/src/modules/auth/models/AdresseEnseignant.ts) |
| `aut_adresses_institutions` | `AdresseInstitution` | [AdresseInstitution.ts](../easy-ecole-backend/src/modules/auth/models/AdresseInstitution.ts) |
| `aut_apprenants` | `Apprenant` | [Apprenant.ts](../easy-ecole-backend/src/modules/auth/models/Apprenant.ts) |
| `aut_banques` | `Banque` | [Banque.ts](../easy-ecole-backend/src/modules/auth/models/Banque.ts) |
| `aut_caissiers_banque` | `CaissierBanque` | [CaissierBanque.ts](../easy-ecole-backend/src/modules/auth/models/CaissierBanque.ts) |
| `aut_comite_orientations` | `ComiteOrientation` | [ComiteOrientation.ts](../easy-ecole-backend/src/modules/auth/models/ComiteOrientation.ts) |
| `aut_enseignants` | `Enseignant` | [Enseignant.ts](../easy-ecole-backend/src/modules/auth/models/Enseignant.ts) |
| `aut_identites_apprenants` | `IdentiteApprenant` | [IdentiteApprenant.ts](../easy-ecole-backend/src/modules/auth/models/IdentiteApprenant.ts) |
| `aut_informations_parents_apprenants` | `InformationsParentsApprenant` | [InformationsParentsApprenant.ts](../easy-ecole-backend/src/modules/auth/models/InformationsParentsApprenant.ts) |
| `aut_informations_salarie_apprenants` | `InformationsSalarieApprenant` | [InformationsSalarieApprenant.ts](../easy-ecole-backend/src/modules/auth/models/InformationsSalarieApprenant.ts) |
| `aut_institutions` | `Institution` | [Institution.ts](../easy-ecole-backend/src/modules/auth/models/Institution.ts) |
| `aut_permissions` | `Permission` | [Permission.ts](../easy-ecole-backend/src/modules/auth/models/Permission.ts) |
| `aut_personnel_administratif` | `PersonnelAdministratif` | [PersonnelAdministratif.ts](../easy-ecole-backend/src/modules/auth/models/PersonnelAdministratif.ts) |
| `aut_personnes_prevenir_apprenants` | `PersonnePrevenirApprenant` | [PersonnePrevenirApprenant.ts](../easy-ecole-backend/src/modules/auth/models/PersonnePrevenirApprenant.ts) |
| `aut_role_menu_grants` | `RoleMenuGrant` | [RoleMenuGrant.ts](../easy-ecole-backend/src/modules/auth/models/RoleMenuGrant.ts) |
| `aut_role_permissions` | `RolePermission` | [RolePermission.ts](../easy-ecole-backend/src/modules/auth/models/RolePermission.ts) |
| `aut_roles` | `Role` | [Role.ts](../easy-ecole-backend/src/modules/auth/models/Role.ts) |
| `aut_user_permissions` | `UserPermission` | [UserPermission.ts](../easy-ecole-backend/src/modules/auth/models/UserPermission.ts) |
| `aut_user_roles` | `UserRole` | [UserRole.ts](../easy-ecole-backend/src/modules/auth/models/UserRole.ts) |
| `aut_utilisateur_etablissements` | `SiteUtilisateur` | [SiteUtilisateur.ts](../easy-ecole-backend/src/modules/auth/models/SiteUtilisateur.ts) |
| `aut_utilisateurs` | `Utilisateur` | [Utilisateur.ts](../easy-ecole-backend/src/modules/auth/models/Utilisateur.ts) |

### Module bourse - prefixe `brs_` (2)

| Table | Modele Sequelize | Fichier source |
|---|---|---|
| `brs_attributions` | `BourseAttribution` | [BourseAttribution.ts](../easy-ecole-backend/src/modules/bourse/models/BourseAttribution.ts) |
| `brs_configurations` | `BourseConfiguration` | [BourseConfiguration.ts](../easy-ecole-backend/src/modules/bourse/models/BourseConfiguration.ts) |

### Module bulletins - prefixe `ins_` (10)

| Table | Modele Sequelize | Fichier source |
|---|---|---|
| `ins_audit_evaluations` | `AuditEvaluation` | [AuditEvaluation.ts](../easy-ecole-backend/src/modules/bulletins/models/AuditEvaluation.ts) |
| `ins_audit_notes` | `AuditNote` | [AuditNote.ts](../easy-ecole-backend/src/modules/bulletins/models/AuditNote.ts) |
| `ins_bulletins` | `Bulletin` | [Bulletin.ts](../easy-ecole-backend/src/modules/bulletins/models/Bulletin.ts) |
| `ins_deliberations` | `Deliberation` | [Deliberation.ts](../easy-ecole-backend/src/modules/bulletins/models/Deliberation.ts) |
| `ins_dettes_academiques` | `DetteAcademique` | [DetteAcademique.ts](../easy-ecole-backend/src/modules/bulletins/models/DetteAcademique.ts) |
| `ins_echelles_notes` | `EchelleNote` | [EchelleNote.ts](../easy-ecole-backend/src/modules/bulletins/models/EchelleNote.ts) |
| `ins_historique_decisions` | `HistoriqueDecision` | [HistoriqueDecision.ts](../easy-ecole-backend/src/modules/bulletins/models/HistoriqueDecision.ts) |
| `ins_jury_membres` | `JuryMembre` | [JuryMembre.ts](../easy-ecole-backend/src/modules/bulletins/models/JuryMembre.ts) |
| `ins_lignes_bulletins` | `LigneBulletin` | [LigneBulletin.ts](../easy-ecole-backend/src/modules/bulletins/models/LigneBulletin.ts) |
| `ins_resultats_deliberation` | `ResultatDeliberation` | [ResultatDeliberation.ts](../easy-ecole-backend/src/modules/bulletins/models/ResultatDeliberation.ts) |

### Module communication - prefixe `com_` (4)

| Table | Modele Sequelize | Fichier source |
|---|---|---|
| `com_actualites` | `Actualite` | [Actualite.ts](../easy-ecole-backend/src/modules/communication/models/Actualite.ts) |
| `com_communications` | `Communication` | [Communication.ts](../easy-ecole-backend/src/modules/communication/models/Communication.ts) |
| `com_reponses_suggestion` | `ReponseSuggestion` | [ReponseSuggestion.ts](../easy-ecole-backend/src/modules/communication/models/ReponseSuggestion.ts) |
| `com_suggestions` | `Suggestion` | [Suggestion.ts](../easy-ecole-backend/src/modules/communication/models/Suggestion.ts) |

### Module comptabilite - prefixe `cpt_` (14)

| Table | Modele Sequelize | Fichier source |
|---|---|---|
| `cpt_bordereau_echeance` | `BordereauEcheance` | [BordereauEcheance.ts](../easy-ecole-backend/src/modules/comptabilite/models/BordereauEcheance.ts) |
| `cpt_comptes` | `Compte` | [Compte.ts](../easy-ecole-backend/src/modules/comptabilite/models/Compte.ts) |
| `cpt_comptes_bancaires` | `CompteBancaire` | [CompteBancaire.ts](../easy-ecole-backend/src/modules/comptabilite/models/CompteBancaire.ts) |
| `cpt_ecritures_comptables` | `EcritureComptable` | [EcritureComptable.ts](../easy-ecole-backend/src/modules/comptabilite/models/EcritureComptable.ts) |
| `cpt_exercices` | `ExerciceComptable` | [ExerciceComptable.ts](../easy-ecole-backend/src/modules/comptabilite/models/ExerciceComptable.ts) |
| `cpt_frais_parcours` | `FraisParcours` | [FraisParcours.ts](../easy-ecole-backend/src/modules/comptabilite/models/FraisParcours.ts) |
| `cpt_journaux_comptables` | `JournalComptable` | [JournalComptable.ts](../easy-ecole-backend/src/modules/comptabilite/models/JournalComptable.ts) |
| `cpt_lignes_frais_etudiant` | `LigneFraisEtudiant` | [LigneFraisEtudiant.ts](../easy-ecole-backend/src/modules/comptabilite/models/LigneFraisEtudiant.ts) |
| `cpt_lignes_releves_bancaires` | `LigneReleveBancaire` | [LigneReleveBancaire.ts](../easy-ecole-backend/src/modules/comptabilite/models/LigneReleveBancaire.ts) |
| `cpt_parametres_frais` | `ParametreFrais` | [ParametreFrais.ts](../easy-ecole-backend/src/modules/comptabilite/models/ParametreFrais.ts) |
| `cpt_penalites_retard` | `PenaliteRetard` | [PenaliteRetard.ts](../easy-ecole-backend/src/modules/comptabilite/models/PenaliteRetard.ts) |
| `cpt_portefeuille_credit` | `PortefeuilleCredit` | [PortefeuilleCredit.ts](../easy-ecole-backend/src/modules/comptabilite/models/PortefeuilleCredit.ts) |
| `cpt_reductions_frais` | `ReductionFrais` | [ReductionFrais.ts](../easy-ecole-backend/src/modules/comptabilite/models/ReductionFrais.ts) |
| `cpt_releves_bancaires` | `ReleveBancaire` | [ReleveBancaire.ts](../easy-ecole-backend/src/modules/comptabilite/models/ReleveBancaire.ts) |

### Module core - prefixe non specifie (1)

| Table | Modele Sequelize | Fichier source |
|---|---|---|
| `documents` | `Document` | [Document.ts](../easy-ecole-backend/src/modules/core/models/Document.ts) |

### Module docgen - prefixe `docgen_` (7)

| Table | Modele Sequelize | Fichier source |
|---|---|---|
| `docgen_cachets` | `DocGenCachet` | [DocGenCachet.ts](../easy-ecole-backend/src/modules/docgen/models/DocGenCachet.ts) |
| `docgen_documents` | `DocGenDocument` | [DocGenDocument.ts](../easy-ecole-backend/src/modules/docgen/models/DocGenDocument.ts) |
| `docgen_references` | `DocGenReference` | [DocGenReference.ts](../easy-ecole-backend/src/modules/docgen/models/DocGenReference.ts) |
| `docgen_signatures` | `DocGenSignature` | [DocGenSignature.ts](../easy-ecole-backend/src/modules/docgen/models/DocGenSignature.ts) |
| `docgen_templates` | `DocGenTemplate` | [DocGenTemplate.ts](../easy-ecole-backend/src/modules/docgen/models/DocGenTemplate.ts) |
| `docgen_types` | `DocGenType` | [DocGenType.ts](../easy-ecole-backend/src/modules/docgen/models/DocGenType.ts) |
| `docgen_workflows` | `DocGenWorkflow` | [DocGenWorkflow.ts](../easy-ecole-backend/src/modules/docgen/models/DocGenWorkflow.ts) |

### Module elearning - prefixe `elearning_` (27)

| Table | Modele Sequelize | Fichier source |
|---|---|---|
| `elearning_annees` | `AnneeElearning` | [AnneeElearning.ts](../easy-ecole-backend/src/modules/elearning/models/AnneeElearning.ts) |
| `elearning_audit` | `Audit` | [Audit.ts](../easy-ecole-backend/src/modules/elearning/models/Audit.ts) |
| `elearning_centres_examens` | `CentreExamen` | [CentreExamen.ts](../easy-ecole-backend/src/modules/elearning/models/CentreExamen.ts) |
| `elearning_certificats` | `Certificat` | [Certificat.ts](../easy-ecole-backend/src/modules/elearning/models/Certificat.ts) |
| `elearning_commentaires` | `Commentaire` | [Commentaire.ts](../easy-ecole-backend/src/modules/elearning/models/Commentaire.ts) |
| `elearning_couplages_mail` | `CouplageMail` | [CouplageMail.ts](../easy-ecole-backend/src/modules/elearning/models/CouplageMail.ts) |
| `elearning_cours` | `CoursEnLigne` | [CoursEnLigne.ts](../easy-ecole-backend/src/modules/elearning/models/CoursEnLigne.ts) |
| `elearning_devoirs` | `Devoir` | [Devoir.ts](../easy-ecole-backend/src/modules/elearning/models/Devoir.ts) |
| `elearning_encaissements` | `Encaissement` | [Encaissement.ts](../easy-ecole-backend/src/modules/elearning/models/Encaissement.ts) |
| `elearning_enveloppes` | `Enveloppe` | [Enveloppe.ts](../easy-ecole-backend/src/modules/elearning/models/Enveloppe.ts) |
| `elearning_examens` | `Examen` | [Examen.ts](../easy-ecole-backend/src/modules/elearning/models/Examen.ts) |
| `elearning_messages` | `Message` | [Message.ts](../easy-ecole-backend/src/modules/elearning/models/Message.ts) |
| `elearning_modules` | `ModuleElearning` | [ModuleElearning.ts](../easy-ecole-backend/src/modules/elearning/models/ModuleElearning.ts) |
| `elearning_mouvements` | `Mouvement` | [Mouvement.ts](../easy-ecole-backend/src/modules/elearning/models/Mouvement.ts) |
| `elearning_notes_examens` | `NoteExamen` | [NoteExamen.ts](../easy-ecole-backend/src/modules/elearning/models/NoteExamen.ts) |
| `elearning_notifications` | `Notification` | [Notification.ts](../easy-ecole-backend/src/modules/elearning/models/Notification.ts) |
| `elearning_participants_salon` | `ParticipantSalon` | [ParticipantSalon.ts](../easy-ecole-backend/src/modules/elearning/models/ParticipantSalon.ts) |
| `elearning_progression_apprenant` | `ProgressionApprenant` | [ProgressionApprenant.ts](../easy-ecole-backend/src/modules/elearning/models/ProgressionApprenant.ts) |
| `elearning_quiz` | `Quiz` | [Quiz.ts](../easy-ecole-backend/src/modules/elearning/models/Quiz.ts) |
| `elearning_reponses_quiz` | `ReponseQuiz` | [ReponseQuiz.ts](../easy-ecole-backend/src/modules/elearning/models/ReponseQuiz.ts) |
| `elearning_reservations_examens` | `ReservationExamen` | [ReservationExamen.ts](../easy-ecole-backend/src/modules/elearning/models/ReservationExamen.ts) |
| `elearning_salons` | `Salon` | [Salon.ts](../easy-ecole-backend/src/modules/elearning/models/Salon.ts) |
| `elearning_selections_cours` | `SelectionCours` | [SelectionCours.ts](../easy-ecole-backend/src/modules/elearning/models/SelectionCours.ts) |
| `elearning_sessions_examens` | `SessionExamen` | [SessionExamen.ts](../easy-ecole-backend/src/modules/elearning/models/SessionExamen.ts) |
| `elearning_soumissions_devoirs` | `SoumissionDevoir` | [SoumissionDevoir.ts](../easy-ecole-backend/src/modules/elearning/models/SoumissionDevoir.ts) |
| `elearning_supports` | `Support` | [Support.ts](../easy-ecole-backend/src/modules/elearning/models/Support.ts) |
| `elearning_tarifs_credit` | `TarifCredit` | [TarifCredit.ts](../easy-ecole-backend/src/modules/elearning/models/TarifCredit.ts) |

### Module etablissement - prefixe `eta_` (1)

| Table | Modele Sequelize | Fichier source |
|---|---|---|
| `eta_etablissements` | `Etablissement` | [Etablissement.ts](../easy-ecole-backend/src/modules/etablissement/models/Etablissement.ts) |

### Module ged - prefixe `ged_` (18)

| Table | Modele Sequelize | Fichier source |
|---|---|---|
| `ged_audit_logs` | `DocumentAuditLog` | [DocumentAuditLog.ts](../easy-ecole-backend/src/modules/ged/models/DocumentAuditLog.ts) |
| `ged_backups` | `BackupRecord` | [BackupRecord.ts](../easy-ecole-backend/src/modules/ged/models/BackupRecord.ts) |
| `ged_disposal_records` | `DisposalRecord` | [DisposalRecord.ts](../easy-ecole-backend/src/modules/ged/models/DisposalRecord.ts) |
| `ged_document_access_grants` | `DocumentAccessGrant` | [DocumentAccessGrant.ts](../easy-ecole-backend/src/modules/ged/models/DocumentAccessGrant.ts) |
| `ged_document_tags` | `DocumentTag` | [DocumentTag.ts](../easy-ecole-backend/src/modules/ged/models/DocumentTag.ts) |
| `ged_document_types` | `DocumentType` | [DocumentType.ts](../easy-ecole-backend/src/modules/ged/models/DocumentType.ts) |
| `ged_documents` | `DocumentGed` | [DocumentGed.ts](../easy-ecole-backend/src/modules/ged/models/DocumentGed.ts) |
| `ged_domains` | `Domain` | [Domain.ts](../easy-ecole-backend/src/modules/ged/models/Domain.ts) |
| `ged_fichiers_stockes` | `StoredFile` | [StoredFile.ts](../easy-ecole-backend/src/modules/ged/models/StoredFile.ts) |
| `ged_folders` | `Folder` | [Folder.ts](../easy-ecole-backend/src/modules/ged/models/Folder.ts) |
| `ged_notifications` | `GedNotification` | [GedNotification.ts](../easy-ecole-backend/src/modules/ged/models/GedNotification.ts) |
| `ged_processus` | `ProcessusGenerateur` | [ProcessusGenerateur.ts](../easy-ecole-backend/src/modules/ged/models/ProcessusGenerateur.ts) |
| `ged_reference_counters` | `ReferenceCounter` | [ReferenceCounter.ts](../easy-ecole-backend/src/modules/ged/models/ReferenceCounter.ts) |
| `ged_registre_courrier` | `RegistreCourrier` | [RegistreCourrier.ts](../easy-ecole-backend/src/modules/ged/models/RegistreCourrier.ts) |
| `ged_role_permissions` | `RolePermission` | [RolePermission.ts](../easy-ecole-backend/src/modules/ged/models/RolePermission.ts) |
| `ged_sessions` | `SessionGed` | [SessionGed.ts](../easy-ecole-backend/src/modules/ged/models/SessionGed.ts) |
| `ged_signatures` | `GedSignature` | [GedSignature.ts](../easy-ecole-backend/src/modules/ged/models/GedSignature.ts) |
| `ged_tags` | `Tag` | [Tag.ts](../easy-ecole-backend/src/modules/ged/models/Tag.ts) |

### Module immobilisation - prefixe `imm_` (17)

| Table | Modele Sequelize | Fichier source |
|---|---|---|
| `imm_acquisition` | `Acquisition` | [Acquisition.ts](../easy-ecole-backend/src/modules/immobilisation/models/Acquisition.ts) |
| `imm_affectation` | `Affectation` | [Affectation.ts](../easy-ecole-backend/src/modules/immobilisation/models/Affectation.ts) |
| `imm_amortissement` | `Amortissement` | [Amortissement.ts](../easy-ecole-backend/src/modules/immobilisation/models/Amortissement.ts) |
| `imm_assurance` | `Assurance` | [Assurance.ts](../easy-ecole-backend/src/modules/immobilisation/models/Assurance.ts) |
| `imm_batiment` | `Batiment` | [Batiment.ts](../easy-ecole-backend/src/modules/immobilisation/models/Batiment.ts) |
| `imm_categorie_immobilisation` | `CategorieImmobilisation` | [CategorieImmobilisation.ts](../easy-ecole-backend/src/modules/immobilisation/models/CategorieImmobilisation.ts) |
| `imm_cession` | `Cession` | [Cession.ts](../easy-ecole-backend/src/modules/immobilisation/models/Cession.ts) |
| `imm_departement` | `Departement` | [Departement.ts](../easy-ecole-backend/src/modules/immobilisation/models/Departement.ts) |
| `imm_immobilisation` | `Immobilisation` | [Immobilisation.ts](../easy-ecole-backend/src/modules/immobilisation/models/Immobilisation.ts) |
| `imm_inventaire` | `Inventaire` | [Inventaire.ts](../easy-ecole-backend/src/modules/immobilisation/models/Inventaire.ts) |
| `imm_ligne_inventaire` | `LigneInventaire` | [LigneInventaire.ts](../easy-ecole-backend/src/modules/immobilisation/models/LigneInventaire.ts) |
| `imm_localisation` | `Localisation` | [Localisation.ts](../easy-ecole-backend/src/modules/immobilisation/models/Localisation.ts) |
| `imm_maintenance` | `Maintenance` | [Maintenance.ts](../easy-ecole-backend/src/modules/immobilisation/models/Maintenance.ts) |
| `imm_maintenance_programmee` | `MaintenanceProgrammee` | [MaintenanceProgrammee.ts](../easy-ecole-backend/src/modules/immobilisation/models/MaintenanceProgrammee.ts) |
| `imm_rebuts_immobilisation` | `RebutImmobilisation` | [RebutImmobilisation.ts](../easy-ecole-backend/src/modules/immobilisation/models/RebutImmobilisation.ts) |
| `imm_site` | `Site` | [Site.ts](../easy-ecole-backend/src/modules/immobilisation/models/Site.ts) |
| `imm_sortie_provisoire` | `SortieProvisoire` | [SortieProvisoire.ts](../easy-ecole-backend/src/modules/immobilisation/models/SortieProvisoire.ts) |

### Module inscription - prefixe `ins_` (75)

| Table | Modele Sequelize | Fichier source |
|---|---|---|
| `ins_absences` | `Absence` | [Absence.ts](../easy-ecole-backend/src/modules/inscription/models/Absence.ts) |
| `ins_affectations_salles_classes` | `AffectationSalleClasse` | [AffectationSalleClasse.ts](../easy-ecole-backend/src/modules/inscription/models/AffectationSalleClasse.ts) |
| `ins_annees_academiques` | `AnneeAcademique` | [AnneeAcademique.ts](../easy-ecole-backend/src/modules/inscription/models/AnneeAcademique.ts) |
| `ins_blocs_cahier_de_texte` | `BlocCahierDeTexte` | [BlocCahierDeTexte.ts](../easy-ecole-backend/src/modules/inscription/models/BlocCahierDeTexte.ts) |
| `ins_bordereaux` | `Bordereau` | [Bordereau.ts](../easy-ecole-backend/src/modules/inscription/models/Bordereau.ts) |
| `ins_cahiers_de_texte` | `CahierDeTexte` | [CahierDeTexte.ts](../easy-ecole-backend/src/modules/inscription/models/CahierDeTexte.ts) |
| `ins_chapitres_cours` | `ChapitreCours` | [ChapitreCours.ts](../easy-ecole-backend/src/modules/inscription/models/ChapitreCours.ts) |
| `ins_classes` | `Classe` | [Classe.ts](../easy-ecole-backend/src/modules/inscription/models/Classe.ts) |
| `ins_comite_votes` | `ComiteVote` | [ComiteVote.ts](../easy-ecole-backend/src/modules/inscription/models/ComiteVote.ts) |
| `ins_cours` | `Cours` | [Cours.ts](../easy-ecole-backend/src/modules/inscription/models/Cours.ts) |
| `ins_cours_choisis` | `DemandeInscriptionCours` | [DemandeInscriptionCours.ts](../easy-ecole-backend/src/modules/inscription/models/DemandeInscriptionCours.ts) |
| `ins_cours_participants` | `CoursParticipant` | [CoursParticipant.ts](../easy-ecole-backend/src/modules/inscription/models/CoursParticipant.ts) |
| `ins_creneaux` | `Creneau` | [Creneau.ts](../easy-ecole-backend/src/modules/inscription/models/Creneau.ts) |
| `ins_cursus_apprenants` | `CursusApprenant` | [CursusApprenant.ts](../easy-ecole-backend/src/modules/inscription/models/CursusApprenant.ts) |
| `ins_demandes_inscription` | `DemandeInscription` | [DemandeInscription.ts](../easy-ecole-backend/src/modules/inscription/models/DemandeInscription.ts) |
| `ins_designation_memoires` | `DesignationMemoire` | [DesignationMemoire.ts](../easy-ecole-backend/src/modules/inscription/models/DesignationMemoire.ts) |
| `ins_dispenses` | `Dispense` | [Dispense.ts](../easy-ecole-backend/src/modules/inscription/models/Dispense.ts) |
| `ins_document_requis_niveau` | `DocumentRequisNiveau` | [DocumentRequisNiveau.ts](../easy-ecole-backend/src/modules/inscription/models/DocumentRequisNiveau.ts) |
| `ins_dossiers_demandes` | `DemandeInscriptionDossier` | [DemandeInscriptionDossier.ts](../easy-ecole-backend/src/modules/inscription/models/DemandeInscriptionDossier.ts) |
| `ins_dossiers_etudiants` | `DossierEtudiant` | [DossierEtudiant.ts](../easy-ecole-backend/src/modules/inscription/models/DossierEtudiant.ts) |
| `ins_dossiers_inscription` | `DossierInscription` | [DossierInscription.ts](../easy-ecole-backend/src/modules/inscription/models/DossierInscription.ts) |
| `ins_echeances` | `Echeance` | [Echeance.ts](../easy-ecole-backend/src/modules/inscription/models/Echeance.ts) |
| `ins_ecue` | `Ecue` | [Ecue.ts](../easy-ecole-backend/src/modules/inscription/models/Ecue.ts) |
| `ins_equivalences` | `Equivalence` | [Equivalence.ts](../easy-ecole-backend/src/modules/inscription/models/Equivalence.ts) |
| `ins_etapes_inscription` | `EtapeInscription` | [EtapeInscription.ts](../easy-ecole-backend/src/modules/inscription/models/EtapeInscription.ts) |
| `ins_fichiers_ressources` | `FichierRessource` | [FichierRessource.ts](../easy-ecole-backend/src/modules/inscription/models/FichierRessource.ts) |
| `ins_frais_inscription` | `FraisInscription` | [FraisInscription.ts](../easy-ecole-backend/src/modules/inscription/models/FraisInscription.ts) |
| `ins_frais_parcours` | `FraisParcours` | [FraisParcours.ts](../easy-ecole-backend/src/modules/inscription/models/FraisParcours.ts) |
| `ins_frais_scolarites` | `FraisScolarite` | [FraisScolarite.ts](../easy-ecole-backend/src/modules/inscription/models/FraisScolarite.ts) |
| `ins_hikvision_enrollments` | `HikvisionEnrollment` | [HikvisionEnrollment.ts](../easy-ecole-backend/src/modules/inscription/models/HikvisionEnrollment.ts) |
| `ins_listes_notes_evaluation` | `ListeNoteEvaluation` | [ListeNoteEvaluation.ts](../easy-ecole-backend/src/modules/inscription/models/ListeNoteEvaluation.ts) |
| `ins_listes_presences` | `ListePresence` | [ListePresence.ts](../easy-ecole-backend/src/modules/inscription/models/ListePresence.ts) |
| `ins_matieres_prerequis` | `MatierePrerequis` | [MatierePrerequis.ts](../easy-ecole-backend/src/modules/inscription/models/MatierePrerequis.ts) |
| `ins_mcc` | `Mcc` | [Mcc.ts](../easy-ecole-backend/src/modules/inscription/models/Mcc.ts) |
| `ins_niveaux_etudes` | `NiveauEtude` | [NiveauEtude.ts](../easy-ecole-backend/src/modules/inscription/models/NiveauEtude.ts) |
| `ins_notes_evaluation` | `NoteEvaluation` | [NoteEvaluation.ts](../easy-ecole-backend/src/modules/inscription/models/NoteEvaluation.ts) |
| `ins_paiements_inscription` | `PaiementInscription` | [PaiementInscription.ts](../easy-ecole-backend/src/modules/inscription/models/PaiementInscription.ts) |
| `ins_parcours` | `Parcours` | [Parcours.ts](../easy-ecole-backend/src/modules/inscription/models/Parcours.ts) |
| `ins_parcours_choisis` | `ParcoursChoisi` | [ParcoursChoisi.ts](../easy-ecole-backend/src/modules/inscription/models/ParcoursChoisi.ts) |
| `ins_penalite_retard` | `PenaliteRetard` | [PenaliteRetard.ts](../easy-ecole-backend/src/modules/inscription/models/PenaliteRetard.ts) |
| `ins_pointage_scans` | `PointageScan` | [PointageScan.ts](../easy-ecole-backend/src/modules/inscription/models/PointageScan.ts) |
| `ins_pointage_terminal_events` | `PointageTerminalEvent` | [PointageTerminalEvent.ts](../easy-ecole-backend/src/modules/inscription/models/PointageTerminalEvent.ts) |
| `ins_pointage_terminaux` | `PointageTerminal` | [PointageTerminal.ts](../easy-ecole-backend/src/modules/inscription/models/PointageTerminal.ts) |
| `ins_pointages` | `Pointage` | [Pointage.ts](../easy-ecole-backend/src/modules/inscription/models/Pointage.ts) |
| `ins_pre_inscriptions` | `PreInscription` | [PreInscription.ts](../easy-ecole-backend/src/modules/inscription/models/PreInscription.ts) |
| `ins_prerequis_parcours` | `PrerequisParcours` | [PrerequisParcours.ts](../easy-ecole-backend/src/modules/inscription/models/PrerequisParcours.ts) |
| `ins_prerequis_parcours_choisis` | `PrerequisParcoursChoisi` | [PrerequisParcoursChoisi.ts](../easy-ecole-backend/src/modules/inscription/models/PrerequisParcoursChoisi.ts) |
| `ins_presences` | `Presence` | [Presence.ts](../easy-ecole-backend/src/modules/inscription/models/Presence.ts) |
| `ins_presences_cours_participants` | `PresenceCoursParticipant` | [PresenceCoursParticipant.ts](../easy-ecole-backend/src/modules/inscription/models/PresenceCoursParticipant.ts) |
| `ins_publications_notes` | `PublicationNote` | [PublicationNote.ts](../easy-ecole-backend/src/modules/inscription/models/PublicationNote.ts) |
| `ins_quitus` | `Quitus` | [Quitus.ts](../easy-ecole-backend/src/modules/inscription/models/Quitus.ts) |
| `ins_rattrapage_comite_votes` | `RattrapageComiteVote` | [RattrapageComiteVote.ts](../easy-ecole-backend/src/modules/inscription/models/RattrapageComiteVote.ts) |
| `ins_rattrapage_documents_deposes` | `RattrapageDocumentDepose` | [RattrapageDocumentDepose.ts](../easy-ecole-backend/src/modules/inscription/models/RattrapageDocumentDepose.ts) |
| `ins_rattrapage_documents_requis` | `RattrapageDocumentRequis` | [RattrapageDocumentRequis.ts](../easy-ecole-backend/src/modules/inscription/models/RattrapageDocumentRequis.ts) |
| `ins_rattrapage_enseignants` | `RattrapageEnseignant` | [RattrapageEnseignant.ts](../easy-ecole-backend/src/modules/inscription/models/RattrapageEnseignant.ts) |
| `ins_rattrapage_notes` | `RattrapageNote` | [RattrapageNote.ts](../easy-ecole-backend/src/modules/inscription/models/RattrapageNote.ts) |
| `ins_rattrapage_planning` | `RattrapagePlanning` | [RattrapagePlanning.ts](../easy-ecole-backend/src/modules/inscription/models/RattrapagePlanning.ts) |
| `ins_rattrapages_inscriptions` | `RattrapageInscription` | [RattrapageInscription.ts](../easy-ecole-backend/src/modules/inscription/models/RattrapageInscription.ts) |
| `ins_reduction_frais` | `ReductionFrais` | [ReductionFrais.ts](../easy-ecole-backend/src/modules/inscription/models/ReductionFrais.ts) |
| `ins_regles_evaluation` | `RegleEvaluation` | [RegleEvaluation.ts](../easy-ecole-backend/src/modules/inscription/models/RegleEvaluation.ts) |
| `ins_reponses_inscription` | `ReponseInscription` | [ReponseInscription.ts](../easy-ecole-backend/src/modules/inscription/models/ReponseInscription.ts) |
| `ins_ressources` | `Ressource` | [Ressource.ts](../easy-ecole-backend/src/modules/inscription/models/Ressource.ts) |
| `ins_salles_de_classes` | `SalleDeClasse` | [SalleDeClasse.ts](../easy-ecole-backend/src/modules/inscription/models/SalleDeClasse.ts) |
| `ins_seance_pointages` | `SeancePointage` | [SeancePointage.ts](../easy-ecole-backend/src/modules/inscription/models/SeancePointage.ts) |
| `ins_seances` | `Seance` | [Seance.ts](../easy-ecole-backend/src/modules/inscription/models/Seance.ts) |
| `ins_semestres_academiques` | `SemestreAcademique` | [SemestreAcademique.ts](../easy-ecole-backend/src/modules/inscription/models/SemestreAcademique.ts) |
| `ins_session_correcteurs` | `SessionCorrecteur` | [SessionCorrecteur.ts](../easy-ecole-backend/src/modules/inscription/models/SessionCorrecteur.ts) |
| `ins_session_examen_classes` | `SessionExamenClasse` | [SessionExamenClasse.ts](../easy-ecole-backend/src/modules/inscription/models/SessionExamenClasse.ts) |
| `ins_sessions` | `Session` | [Session.ts](../easy-ecole-backend/src/modules/inscription/models/Session.ts) |
| `ins_sessions_examens` | `SessionExamen` | [SessionExamen.ts](../easy-ecole-backend/src/modules/inscription/models/SessionExamen.ts) |
| `ins_sessions_rattrapage` | `RattrapageSession` | [RattrapageSession.ts](../easy-ecole-backend/src/modules/inscription/models/RattrapageSession.ts) |
| `ins_sessions_rattrapage_classes` | `RattrapageSessionClasse` | [RattrapageSessionClasse.ts](../easy-ecole-backend/src/modules/inscription/models/RattrapageSessionClasse.ts) |
| `ins_shifts` | `Shift` | [Shift.ts](../easy-ecole-backend/src/modules/inscription/models/Shift.ts) |
| `ins_types_note_evaluation` | `TypeNoteEvaluation` | [TypeNoteEvaluation.ts](../easy-ecole-backend/src/modules/inscription/models/TypeNoteEvaluation.ts) |
| `ins_types_operations_bordereau` | `TypeOperationBordereau` | [TypeOperationBordereau.ts](../easy-ecole-backend/src/modules/inscription/models/TypeOperationBordereau.ts) |

### Module marche - prefixe `mar_` (5)

| Table | Modele Sequelize | Fichier source |
|---|---|---|
| `mar_appels_offre` | `AppelOffre` | [AppelOffre.ts](../easy-ecole-backend/src/modules/marche/models/AppelOffre.ts) |
| `mar_avenants` | `AvenantMarche` | [AvenantMarche.ts](../easy-ecole-backend/src/modules/marche/models/AvenantMarche.ts) |
| `mar_contrats` | `ContratMarche` | [ContratMarche.ts](../easy-ecole-backend/src/modules/marche/models/ContratMarche.ts) |
| `mar_manifestations_interet` | `ManifestationInteret` | [ManifestationInteret.ts](../easy-ecole-backend/src/modules/marche/models/ManifestationInteret.ts) |
| `mar_planifications` | `PlanificationMarche` | [PlanificationMarche.ts](../easy-ecole-backend/src/modules/marche/models/PlanificationMarche.ts) |

### Module orientation - prefixe `ori_` (11)

| Table | Modele Sequelize | Fichier source |
|---|---|---|
| `ori_categories` | `Categorie` | [Categorie.ts](../easy-ecole-backend/src/modules/orientation/models/Categorie.ts) |
| `ori_debouches_parcours` | `DeboucheParcours` | [DeboucheParcours.ts](../easy-ecole-backend/src/modules/orientation/models/DeboucheParcours.ts) |
| `ori_demandes_orientation` | `DemandeOrientation` | [DemandeOrientation.ts](../easy-ecole-backend/src/modules/orientation/models/DemandeOrientation.ts) |
| `ori_matieres_prerequis` | `MatierePrerequis` | [MatierePrerequis.ts](../easy-ecole-backend/src/modules/orientation/models/MatierePrerequis.ts) |
| `ori_niveaux_etudes` | `NiveauEtude` | [NiveauEtude.ts](../easy-ecole-backend/src/modules/orientation/models/NiveauEtude.ts) |
| `ori_panier_parcours_choisis` | `PanierParcoursChoisi` | [PanierParcoursChoisi.ts](../easy-ecole-backend/src/modules/orientation/models/PanierParcoursChoisi.ts) |
| `ori_parcours` | `Parcours` | [Parcours.ts](../easy-ecole-backend/src/modules/orientation/models/Parcours.ts) |
| `ori_parcours_choisis` | `ParcoursChoisi` | [ParcoursChoisi.ts](../easy-ecole-backend/src/modules/orientation/models/ParcoursChoisi.ts) |
| `ori_prerequis_parcours` | `PrerequisParcours` | [PrerequisParcours.ts](../easy-ecole-backend/src/modules/orientation/models/PrerequisParcours.ts) |
| `ori_prerequis_parcours_choisis` | `PrerequisParcoursChoisi` | [PrerequisParcoursChoisi.ts](../easy-ecole-backend/src/modules/orientation/models/PrerequisParcoursChoisi.ts) |
| `ori_reponses_orientation` | `ReponseOrientation` | [ReponseOrientation.ts](../easy-ecole-backend/src/modules/orientation/models/ReponseOrientation.ts) |

### Module parent - prefixe `par_` (1)

| Table | Modele Sequelize | Fichier source |
|---|---|---|
| `par_parents_enfants` | `ParentEnfant` | [ParentEnfant.ts](../easy-ecole-backend/src/modules/parent/models/ParentEnfant.ts) |

### Module qualite - prefixe `qua_` (8)

| Table | Modele Sequelize | Fichier source |
|---|---|---|
| `qua_actions_correctives` | `QuaActionCorrective` | [QuaActionCorrective.ts](../easy-ecole-backend/src/modules/qualite/models/QuaActionCorrective.ts) |
| `qua_audit_pistes` | `QuaAuditPiste` | [QuaAuditPiste.ts](../easy-ecole-backend/src/modules/qualite/models/QuaAuditPiste.ts) |
| `qua_audits` | `QuaAudit` | [QuaAudit.ts](../easy-ecole-backend/src/modules/qualite/models/QuaAudit.ts) |
| `qua_decisions_revue` | `QuaDecisionRevue` | [QuaDecisionRevue.ts](../easy-ecole-backend/src/modules/qualite/models/QuaDecisionRevue.ts) |
| `qua_enquetes_satisfaction` | `QuaEnqueteSatisfaction` | [QuaEnqueteSatisfaction.ts](../easy-ecole-backend/src/modules/qualite/models/QuaEnqueteSatisfaction.ts) |
| `qua_non_conformites` | `QuaNonConformite` | [QuaNonConformite.ts](../easy-ecole-backend/src/modules/qualite/models/QuaNonConformite.ts) |
| `qua_reponses_satisfaction` | `QuaReponseSatisfaction` | [QuaReponseSatisfaction.ts](../easy-ecole-backend/src/modules/qualite/models/QuaReponseSatisfaction.ts) |
| `qua_revues_direction` | `QuaRevueDirection` | [QuaRevueDirection.ts](../easy-ecole-backend/src/modules/qualite/models/QuaRevueDirection.ts) |

### Module reporting - prefixe `rpt_` (16)

| Table | Modele Sequelize | Fichier source |
|---|---|---|
| `rpt_achats` | `RptAchat` | [RptAchat.ts](../easy-ecole-backend/src/modules/reporting/models/RptAchat.ts) |
| `rpt_budget_vs_reel` | `RptBudgetVsReel` | [RptBudgetVsReel.ts](../easy-ecole-backend/src/modules/reporting/models/RptBudgetVsReel.ts) |
| `rpt_documents_academiques` | `RptDocumentAcademique` | [RptDocumentAcademique.ts](../easy-ecole-backend/src/modules/reporting/models/RptDocumentAcademique.ts) |
| `rpt_effectifs` | `RptEffectif` | [RptEffectif.ts](../easy-ecole-backend/src/modules/reporting/models/RptEffectif.ts) |
| `rpt_effectifs_rh` | `RptEffectifRh` | [RptEffectifRh.ts](../easy-ecole-backend/src/modules/reporting/models/RptEffectifRh.ts) |
| `rpt_evaluations` | `RptEvaluation` | [RptEvaluation.ts](../easy-ecole-backend/src/modules/reporting/models/RptEvaluation.ts) |
| `rpt_factures` | `RptFacture` | [RptFacture.ts](../easy-ecole-backend/src/modules/reporting/models/RptFacture.ts) |
| `rpt_formations_rh` | `RptFormationRh` | [RptFormationRh.ts](../easy-ecole-backend/src/modules/reporting/models/RptFormationRh.ts) |
| `rpt_immobilisations` | `RptImmobilisation` | [RptImmobilisation.ts](../easy-ecole-backend/src/modules/reporting/models/RptImmobilisation.ts) |
| `rpt_inscriptions` | `RptInscription` | [RptInscription.ts](../easy-ecole-backend/src/modules/reporting/models/RptInscription.ts) |
| `rpt_notes_moyennes` | `RptNoteMoyenne` | [RptNoteMoyenne.ts](../easy-ecole-backend/src/modules/reporting/models/RptNoteMoyenne.ts) |
| `rpt_paie` | `RptPaie` | [RptPaie.ts](../easy-ecole-backend/src/modules/reporting/models/RptPaie.ts) |
| `rpt_paiements` | `RptPaiement` | [RptPaiement.ts](../easy-ecole-backend/src/modules/reporting/models/RptPaiement.ts) |
| `rpt_presences` | `RptPresence` | [RptPresence.ts](../easy-ecole-backend/src/modules/reporting/models/RptPresence.ts) |
| `rpt_reussite` | `RptReussite` | [RptReussite.ts](../easy-ecole-backend/src/modules/reporting/models/RptReussite.ts) |
| `rpt_stocks` | `RptStock` | [RptStock.ts](../easy-ecole-backend/src/modules/reporting/models/RptStock.ts) |

### Module rh - prefixe `rh_` (29)

| Table | Modele Sequelize | Fichier source |
|---|---|---|
| `rh_bulletins_paie` | `RhBulletinPaie` | [RhBulletinPaie.ts](../easy-ecole-backend/src/modules/rh/models/RhBulletinPaie.ts) |
| `rh_candidatures` | `RhCandidature` | [RhCandidature.ts](../easy-ecole-backend/src/modules/rh/models/RhCandidature.ts) |
| `rh_categories_professionnelles` | `RhCategorieProfessionnelle` | [RhCategorieProfessionnelle.ts](../easy-ecole-backend/src/modules/rh/models/RhCategorieProfessionnelle.ts) |
| `rh_contrats_enseignant` | `RhContratEnseignant` | [RhContratEnseignant.ts](../easy-ecole-backend/src/modules/rh/models/RhContratEnseignant.ts) |
| `rh_criteres_evaluation` | `RhCritereEvaluation` | [RhCritereEvaluation.ts](../easy-ecole-backend/src/modules/rh/models/RhCritereEvaluation.ts) |
| `rh_demandes_conge` | `RhDemandeConge` | [RhDemandeConge.ts](../easy-ecole-backend/src/modules/rh/models/RhDemandeConge.ts) |
| `rh_departements` | `RhDepartement` | [RhDepartement.ts](../easy-ecole-backend/src/modules/rh/models/RhDepartement.ts) |
| `rh_employes` | `RhEmploye` | [RhEmploye.ts](../easy-ecole-backend/src/modules/rh/models/RhEmploye.ts) |
| `rh_entretiens` | `RhEntretien` | [RhEntretien.ts](../easy-ecole-backend/src/modules/rh/models/RhEntretien.ts) |
| `rh_evaluations_criteres` | `RhEvaluationCritere` | [RhEvaluationCritere.ts](../easy-ecole-backend/src/modules/rh/models/RhEvaluationCritere.ts) |
| `rh_fiches_evaluation` | `RhFicheEvaluation` | [RhFicheEvaluation.ts](../easy-ecole-backend/src/modules/rh/models/RhFicheEvaluation.ts) |
| `rh_formations` | `RhFormation` | [RhFormation.ts](../easy-ecole-backend/src/modules/rh/models/RhFormation.ts) |
| `rh_grille_salariale` | `RhGrilleSalariale` | [RhGrilleSalariale.ts](../easy-ecole-backend/src/modules/rh/models/RhGrilleSalariale.ts) |
| `rh_heures_supplementaires` | `RhHeureSupplementaire` | [RhHeureSupplementaire.ts](../easy-ecole-backend/src/modules/rh/models/RhHeureSupplementaire.ts) |
| `rh_indemnites_prestataires` | `RhIndemnitePrestataire` | [RhIndemnitePrestataire.ts](../easy-ecole-backend/src/modules/rh/models/RhIndemnitePrestataire.ts) |
| `rh_lignes_bulletin` | `RhLigneBulletin` | [RhLigneBulletin.ts](../easy-ecole-backend/src/modules/rh/models/RhLigneBulletin.ts) |
| `rh_offres_emploi` | `RhOffreEmploi` | [RhOffreEmploi.ts](../easy-ecole-backend/src/modules/rh/models/RhOffreEmploi.ts) |
| `rh_participations_formation` | `RhParticipationFormation` | [RhParticipationFormation.ts](../easy-ecole-backend/src/modules/rh/models/RhParticipationFormation.ts) |
| `rh_periodes_paie` | `RhPeriodePaie` | [RhPeriodePaie.ts](../easy-ecole-backend/src/modules/rh/models/RhPeriodePaie.ts) |
| `rh_planning_personnel` | `RhPlanningPersonnel` | [RhPlanningPersonnel.ts](../easy-ecole-backend/src/modules/rh/models/RhPlanningPersonnel.ts) |
| `rh_postes` | `RhPoste` | [RhPoste.ts](../easy-ecole-backend/src/modules/rh/models/RhPoste.ts) |
| `rh_prestataires` | `RhPrestataire` | [RhPrestataire.ts](../easy-ecole-backend/src/modules/rh/models/RhPrestataire.ts) |
| `rh_prestations_enseignant` | `RhPrestationEnseignant` | [RhPrestationEnseignant.ts](../easy-ecole-backend/src/modules/rh/models/RhPrestationEnseignant.ts) |
| `rh_prets` | `RhPret` | [RhPret.ts](../easy-ecole-backend/src/modules/rh/models/RhPret.ts) |
| `rh_remboursements_pret` | `RhRemboursementPret` | [RhRemboursementPret.ts](../easy-ecole-backend/src/modules/rh/models/RhRemboursementPret.ts) |
| `rh_rubriques_paie` | `RhRubriquePaie` | [RhRubriquePaie.ts](../easy-ecole-backend/src/modules/rh/models/RhRubriquePaie.ts) |
| `rh_soldes_conge` | `RhSoldeConge` | [RhSoldeConge.ts](../easy-ecole-backend/src/modules/rh/models/RhSoldeConge.ts) |
| `rh_taux_horaires_enseignants` | `RhTauxHoraireEnseignant` | [RhTauxHoraireEnseignant.ts](../easy-ecole-backend/src/modules/rh/models/RhTauxHoraireEnseignant.ts) |
| `rh_types_contrat` | `RhTypeContrat` | [RhTypeContrat.ts](../easy-ecole-backend/src/modules/rh/models/RhTypeContrat.ts) |

### Module scolarite - prefixe `scol_` (23)

| Table | Modele Sequelize | Fichier source |
|---|---|---|
| `scol_clotures_caisse` | `ClotureCaisse` | [ClotureCaisse.ts](../easy-ecole-backend/src/modules/scolarite/models/ClotureCaisse.ts) |
| `scol_conseils_classe` | `ConseilClasse` | [ConseilClasse.ts](../easy-ecole-backend/src/modules/scolarite/models/ConseilClasse.ts) |
| `scol_decisions_conseil` | `DecisionConseil` | [DecisionConseil.ts](../easy-ecole-backend/src/modules/scolarite/models/DecisionConseil.ts) |
| `scol_decisions_passage` | `DecisionPassage` | [DecisionPassage.ts](../easy-ecole-backend/src/modules/scolarite/models/DecisionPassage.ts) |
| `scol_demandes_document` | `DemandeDocument` | [DemandeDocument.ts](../easy-ecole-backend/src/modules/scolarite/models/DemandeDocument.ts) |
| `scol_demandes_document_pieces` | `DemandeDocumentPiece` | [DemandeDocumentPiece.ts](../easy-ecole-backend/src/modules/scolarite/models/DemandeDocumentPiece.ts) |
| `scol_demandes_document_votes` | `DemandeDocumentVote` | [DemandeDocumentVote.ts](../easy-ecole-backend/src/modules/scolarite/models/DemandeDocumentVote.ts) |
| `scol_demandes_reorientation` | `DemandeReorientation` | [DemandeReorientation.ts](../easy-ecole-backend/src/modules/scolarite/models/DemandeReorientation.ts) |
| `scol_demandes_vae` | `DemandeVAE` | [DemandeVAE.ts](../easy-ecole-backend/src/modules/scolarite/models/DemandeVAE.ts) |
| `scol_diplomes` | `Diplome` | [Diplome.ts](../easy-ecole-backend/src/modules/scolarite/models/Diplome.ts) |
| `scol_documents_delivres` | `DocumentDelivre` | [DocumentDelivre.ts](../easy-ecole-backend/src/modules/scolarite/models/DocumentDelivre.ts) |
| `scol_evenements_calendrier` | `EvenementCalendrier` | [EvenementCalendrier.ts](../easy-ecole-backend/src/modules/scolarite/models/EvenementCalendrier.ts) |
| `scol_journal_caisse` | `JournalCaisse` | [JournalCaisse.ts](../easy-ecole-backend/src/modules/scolarite/models/JournalCaisse.ts) |
| `scol_journal_secretariat` | `JournalSecretariat` | [JournalSecretariat.ts](../easy-ecole-backend/src/modules/scolarite/models/JournalSecretariat.ts) |
| `scol_livres` | `Livre` | [Livre.ts](../easy-ecole-backend/src/modules/scolarite/models/Livre.ts) |
| `scol_progression_pedagogique` | `ProgressionPedagogique` | [ProgressionPedagogique.ts](../easy-ecole-backend/src/modules/scolarite/models/ProgressionPedagogique.ts) |
| `scol_reclamations` | `Reclamation` | [Reclamation.ts](../easy-ecole-backend/src/modules/scolarite/models/Reclamation.ts) |
| `scol_recus_caisse` | `RecuCaisse` | [RecuCaisse.ts](../easy-ecole-backend/src/modules/scolarite/models/RecuCaisse.ts) |
| `scol_registres_academiques` | `RegistreAcademique` | [RegistreAcademique.ts](../easy-ecole-backend/src/modules/scolarite/models/RegistreAcademique.ts) |
| `scol_reponses_reclamation` | `ReponseReclamation` | [ReponseReclamation.ts](../easy-ecole-backend/src/modules/scolarite/models/ReponseReclamation.ts) |
| `scol_sanctions_academiques` | `SanctionAcademique` | [SanctionAcademique.ts](../easy-ecole-backend/src/modules/scolarite/models/SanctionAcademique.ts) |
| `scol_sanctions_discipline` | `SanctionDiscipline` | [SanctionDiscipline.ts](../easy-ecole-backend/src/modules/scolarite/models/SanctionDiscipline.ts) |
| `scol_types_document` | `TypeDocument` | [TypeDocument.ts](../easy-ecole-backend/src/modules/scolarite/models/TypeDocument.ts) |

### Module stage - prefixe `stg_` (8)

| Table | Modele Sequelize | Fichier source |
|---|---|---|
| `stg_attestations_stage` | `AttestationStage` | [AttestationStage.ts](../easy-ecole-backend/src/modules/stage/models/AttestationStage.ts) |
| `stg_conventions_stage` | `ConventionStage` | [ConventionStage.ts](../easy-ecole-backend/src/modules/stage/models/ConventionStage.ts) |
| `stg_demandes_stage` | `DemandeStage` | [DemandeStage.ts](../easy-ecole-backend/src/modules/stage/models/DemandeStage.ts) |
| `stg_entreprises` | `Entreprise` | [Entreprise.ts](../easy-ecole-backend/src/modules/stage/models/Entreprise.ts) |
| `stg_notes_stage` | `NoteStage` | [NoteStage.ts](../easy-ecole-backend/src/modules/stage/models/NoteStage.ts) |
| `stg_offres_stage` | `OffreStage` | [OffreStage.ts](../easy-ecole-backend/src/modules/stage/models/OffreStage.ts) |
| `stg_rapports_stage` | `RapportStage` | [RapportStage.ts](../easy-ecole-backend/src/modules/stage/models/RapportStage.ts) |
| `stg_tuteurs` | `Tuteur` | [Tuteur.ts](../easy-ecole-backend/src/modules/stage/models/Tuteur.ts) |

### Module stock - prefixe `stk_` (13)

| Table | Modele Sequelize | Fichier source |
|---|---|---|
| `stk_article` | `Article` | [Article.ts](../easy-ecole-backend/src/modules/stock/models/Article.ts) |
| `stk_besoin` | `Besoin` | [Besoin.ts](../easy-ecole-backend/src/modules/stock/models/Besoin.ts) |
| `stk_bon_commande` | `BonCommande` | [BonCommande.ts](../easy-ecole-backend/src/modules/stock/models/BonCommande.ts) |
| `stk_categorie_article` | `CategorieArticle` | [CategorieArticle.ts](../easy-ecole-backend/src/modules/stock/models/CategorieArticle.ts) |
| `stk_correction_stock` | `CorrectionStock` | [CorrectionStock.ts](../easy-ecole-backend/src/modules/stock/models/CorrectionStock.ts) |
| `stk_demande_prix` | `DemandePrix` | [DemandePrix.ts](../easy-ecole-backend/src/modules/stock/models/DemandePrix.ts) |
| `stk_fournisseur` | `Fournisseur` | [Fournisseur.ts](../easy-ecole-backend/src/modules/stock/models/Fournisseur.ts) |
| `stk_inventaire_stock` | `InventaireStock` | [InventaireStock.ts](../easy-ecole-backend/src/modules/stock/models/InventaireStock.ts) |
| `stk_ligne_bon_commande` | `LigneBonCommande` | [LigneBonCommande.ts](../easy-ecole-backend/src/modules/stock/models/LigneBonCommande.ts) |
| `stk_ligne_inventaire_stock` | `LigneInventaireStock` | [LigneInventaireStock.ts](../easy-ecole-backend/src/modules/stock/models/LigneInventaireStock.ts) |
| `stk_mouvement_stock` | `MouvementStock` | [MouvementStock.ts](../easy-ecole-backend/src/modules/stock/models/MouvementStock.ts) |
| `stk_rebut` | `Rebut` | [Rebut.ts](../easy-ecole-backend/src/modules/stock/models/Rebut.ts) |
| `stk_transferts` | `TransfertStock` | [TransfertStock.ts](../easy-ecole-backend/src/modules/stock/models/TransfertStock.ts) |

## Relations entre tables

La colonne e Table portant la cle e identifie le cote qui contient le champ `foreignKey` declare. Les noms de cles et alias sont ceux des associations Sequelize.

### achats

| Table portant la cle | Cle declaree | Table liee | Association(s) / alias |
|---|---|---|---|
| `ach_budgets` | `departementId` | `imm_departement` | belongsTo / hasMany<br>Budget.departement (belongsTo)<br>Departement.budgets (hasMany) |
| `ach_commandes` | `demandeId` | `ach_demandes` | belongsTo / hasMany<br>Commande.demande (belongsTo)<br>Demande.commandes (hasMany) |
| `ach_commandes` | `fournisseurId` | `ach_fournisseurs` | belongsTo / hasMany<br>Commande.fournisseur (belongsTo)<br>Fournisseur.commandes (hasMany) |
| `ach_demandes` | `soumisParId` | `aut_utilisateurs` | belongsTo / hasMany<br>Demande.soumisPar (belongsTo)<br>Utilisateur.demandesAchats (hasMany) |
| `ach_engagements` | `budgetId` | `ach_budgets` | belongsTo / hasMany<br>Budget.engagements (hasMany)<br>Engagement.budget (belongsTo) |
| `ach_engagements` | `demandeId` | `ach_demandes` | belongsTo / hasMany<br>Demande.engagements (hasMany)<br>Engagement.demande (belongsTo) |
| `ach_factures_proforma` | `commandeId` | `ach_commandes` | belongsTo / hasMany<br>Commande.facturesProforma (hasMany)<br>FactureProforma.commande (belongsTo) |
| `ach_lignes_budget` | `budgetId` | `ach_budgets` | belongsTo / hasMany<br>Budget.lignesBudget (hasMany)<br>LigneBudget.budget (belongsTo) |
| `ach_lignes_budget` | `categorieAchatId` | `ach_categories` | belongsTo / hasMany<br>CategorieAchat.lignesBudget (hasMany)<br>LigneBudget.categorieAchat (belongsTo) |
| `ach_lignes_commande` | `commandeId` | `ach_commandes` | belongsTo / hasMany<br>Commande.lignesCommande (hasMany)<br>LigneCommande.commande (belongsTo) |
| `ach_lignes_demande` | `demandeId` | `ach_demandes` | belongsTo / hasMany<br>Demande.lignesDemande (hasMany)<br>LigneDemande.demande (belongsTo) |
| `ach_lignes_facture` | `factureId` | `ach_factures_proforma` | belongsTo / hasMany<br>FactureProforma.lignesFacture (hasMany)<br>LigneFacture.facture (belongsTo) |
| `ach_lignes_facture` | `ligneCommandeId` | `ach_lignes_commande` | belongsTo / hasMany<br>LigneCommande.lignesFacture (hasMany)<br>LigneFacture.ligneCommande (belongsTo) |
| `ach_lignes_reception` | `ligneCommandeId` | `ach_lignes_commande` | belongsTo / hasMany<br>LigneCommande.lignesReception (hasMany)<br>LigneReception.ligneCommande (belongsTo) |
| `ach_lignes_reception` | `receptionId` | `ach_receptions` | belongsTo / hasMany<br>LigneReception.reception (belongsTo)<br>Reception.lignesReception (hasMany) |
| `ach_receptions` | `commandeId` | `ach_commandes` | belongsTo / hasMany<br>Commande.receptions (hasMany)<br>Reception.commande (belongsTo) |
| `ach_validateurs` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasOne<br>Utilisateur.validateur (hasOne)<br>Validateur.utilisateur (belongsTo) |
| `ach_validations` | `demandeId` | `ach_demandes` | belongsTo / hasMany<br>Demande.validations (hasMany)<br>Validation.demande (belongsTo) |
| `ach_validations` | `validateurId` | `ach_validateurs` | belongsTo / hasMany<br>Validateur.validations (hasMany)<br>Validation.validateur (belongsTo) |

### auth

| Table portant la cle | Cle declaree | Table liee | Association(s) / alias |
|---|---|---|---|
| `aut_adresses_apprenants` | `apprenantId` | `aut_apprenants` | belongsTo / hasOne<br>AdresseApprenant.apprenant (belongsTo)<br>Apprenant.adresse (hasOne) |
| `aut_adresses_caissiers_banque` | `caissierBanqueId` | `aut_caissiers_banque` | belongsTo / hasOne<br>AdresseCaissierBanque.caissierBanque (belongsTo)<br>CaissierBanque.adresse (hasOne) |
| `aut_adresses_enseignants` | `enseignantId` | `aut_enseignants` | belongsTo / hasOne<br>AdresseEnseignant.enseignant (belongsTo)<br>Enseignant.adresse (hasOne) |
| `aut_adresses_institutions` | `institutionId` | `aut_institutions` | belongsTo / hasOne<br>AdresseInstitution.institution (belongsTo)<br>Institution.adresse (hasOne) |
| `aut_apprenants` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasOne<br>Apprenant.utilisateur (belongsTo)<br>Utilisateur.apprenant (hasOne) |
| `aut_caissiers_banque` | `banqueId` | `aut_banques` | belongsTo / hasMany<br>Banque.caissiers (hasMany)<br>CaissierBanque.banque (belongsTo) |
| `aut_caissiers_banque` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasOne<br>CaissierBanque.utilisateur (belongsTo)<br>Utilisateur.caissierBanque (hasOne) |
| `aut_comite_orientations` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasOne<br>ComiteOrientation.utilisateur (belongsTo)<br>Utilisateur.comiteOrientation (hasOne) |
| `aut_enseignants` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasOne<br>Enseignant.utilisateur (belongsTo)<br>Utilisateur.enseignant (hasOne) |
| `aut_identites_apprenants` | `apprenantId` | `aut_apprenants` | belongsTo / hasOne<br>Apprenant.identite (hasOne)<br>IdentiteApprenant.apprenant (belongsTo) |
| `aut_informations_parents_apprenants` | `apprenantId` | `aut_apprenants` | belongsTo / hasOne<br>Apprenant.informationsParents (hasOne)<br>InformationsParentsApprenant.apprenant (belongsTo) |
| `aut_informations_salarie_apprenants` | `apprenantId` | `aut_apprenants` | belongsTo / hasOne<br>Apprenant.informationsSalarie (hasOne)<br>InformationsSalarieApprenant.apprenant (belongsTo) |
| `aut_institutions` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasOne<br>Institution.utilisateur (belongsTo)<br>Utilisateur.institution (hasOne) |
| `aut_personnel_administratif` | `etablissementId` | `eta_etablissements` | belongsTo / hasMany<br>Etablissement.personnel (hasMany)<br>PersonnelAdministratif.etablissement (belongsTo) |
| `aut_personnel_administratif` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasOne<br>PersonnelAdministratif.utilisateur (belongsTo)<br>Utilisateur.personnelAdministratif (hasOne) |
| `aut_personnes_prevenir_apprenants` | `apprenantId` | `aut_apprenants` | belongsTo / hasOne<br>Apprenant.personnePrevenir (hasOne)<br>PersonnePrevenirApprenant.apprenant (belongsTo) |
| `aut_role_menu_grants` | `roleId` | `aut_roles` | belongsTo / hasMany<br>Role.menuGrants (hasMany)<br>RoleMenuGrant.role (belongsTo) |
| `aut_role_permissions` | `permissionId` | `aut_permissions` | belongsTo / hasMany<br>Permission.rolePermissions (hasMany)<br>RolePermission.permission (belongsTo) |
| `aut_role_permissions` | `roleId` | `aut_roles` | belongsTo / hasMany<br>Role.rolePermissions (hasMany)<br>RolePermission.role (belongsTo) |
| `aut_user_permissions` | `permissionId` | `aut_permissions` | belongsTo / hasMany<br>Permission.userPermissions (hasMany)<br>UserPermission.permission (belongsTo) |
| `aut_user_permissions` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>UserPermission.utilisateur (belongsTo)<br>Utilisateur.userPermissions (hasMany) |
| `aut_user_roles` | `roleId` | `aut_roles` | belongsTo / hasMany<br>Role.userRoles (hasMany)<br>UserRole.role (belongsTo) |
| `aut_user_roles` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>UserRole.utilisateur (belongsTo)<br>Utilisateur.userRoles (hasMany) |
| `aut_utilisateur_etablissements` | `etablissementId` | `eta_etablissements` | belongsTo / hasMany<br>Etablissement.affectationsUtilisateurs (hasMany)<br>SiteUtilisateur.etablissement (belongsTo) |
| `aut_utilisateur_etablissements` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>SiteUtilisateur.utilisateur (belongsTo)<br>Utilisateur.affectationsSites (hasMany) |
| `aut_utilisateurs` | `etablissementId` | `eta_etablissements` | hasMany<br>Etablissement.utilisateurs (hasMany) |

### bourse

| Table portant la cle | Cle declaree | Table liee | Association(s) / alias |
|---|---|---|---|
| `brs_attributions` | `configurationId` | `brs_configurations` | belongsTo / hasMany<br>BourseAttribution.configuration (belongsTo)<br>BourseConfiguration.attributions (hasMany) |
| `brs_attributions` | `dossierEtudiantId` | `ins_dossiers_etudiants` | belongsTo / hasMany<br>BourseAttribution.dossierEtudiant (belongsTo)<br>DossierEtudiant.bourses (hasMany) |
| `brs_attributions` | `niveauEtudeId` | `ins_niveaux_etudes` | belongsTo<br>BourseAttribution.niveauEtude (belongsTo) |
| `brs_attributions` | `valideParId` | `aut_utilisateurs` | belongsTo<br>BourseAttribution.validePar (belongsTo) |

### bulletins

| Table portant la cle | Cle declaree | Table liee | Association(s) / alias |
|---|---|---|---|
| `ins_audit_notes` | `modifiePar` | `aut_utilisateurs` | belongsTo / hasMany<br>AuditNote.modifieParUtilisateur (belongsTo)<br>Utilisateur.auditsNotes (hasMany) |
| `ins_audit_notes` | `noteEvaluationId` | `ins_notes_evaluation` | belongsTo / hasMany<br>AuditNote.noteEvaluation (belongsTo)<br>NoteEvaluation.audits (hasMany) |
| `ins_bulletins` | `anneeAcademiqueId` | `ins_annees_academiques` | belongsTo<br>Bulletin.anneeAcademique (belongsTo) |
| `ins_bulletins` | `classeId` | `ins_classes` | belongsTo<br>Bulletin.classe (belongsTo) |
| `ins_bulletins` | `cursusApprenantId` | `ins_cursus_apprenants` | belongsTo<br>Bulletin.cursusApprenant (belongsTo) |
| `ins_bulletins` | `niveauEtudeId` | `ins_niveaux_etudes` | belongsTo<br>Bulletin.niveauEtude (belongsTo) |
| `ins_bulletins` | `parcoursId` | `ins_parcours` | belongsTo<br>Bulletin.parcours (belongsTo) |
| `ins_bulletins` | `utilisateurId` | `aut_utilisateurs` | belongsTo<br>Bulletin.utilisateur (belongsTo) |
| `ins_deliberations` | `anneeAcademiqueId` | `ins_annees_academiques` | belongsTo<br>Deliberation.anneeAcademique (belongsTo) |
| `ins_deliberations` | `classeId` | `ins_classes` | belongsTo<br>Deliberation.classe (belongsTo) |
| `ins_dettes_academiques` | `cursusApprenantId` | `ins_cursus_apprenants` | belongsTo / hasMany<br>CursusApprenant.dettesAcademiques (hasMany)<br>DetteAcademique.cursusApprenant (belongsTo) |
| `ins_historique_decisions` | `deliberationId` | `ins_deliberations` | belongsTo / hasMany<br>Deliberation.historiqueDecisions (hasMany)<br>HistoriqueDecision.deliberation (belongsTo) |
| `ins_historique_decisions` | `resultatId` | `ins_resultats_deliberation` | belongsTo / hasMany<br>HistoriqueDecision.resultat (belongsTo)<br>ResultatDeliberation.historiqueDecisions (hasMany) |
| `ins_jury_membres` | `deliberationId` | `ins_deliberations` | belongsTo / hasMany<br>Deliberation.juryMembres (hasMany)<br>JuryMembre.deliberation (belongsTo) |
| `ins_jury_membres` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>JuryMembre.utilisateur (belongsTo)<br>Utilisateur.juryMembres (hasMany) |
| `ins_lignes_bulletins` | `bulletinId` | `ins_bulletins` | belongsTo / hasMany<br>Bulletin.lignesBulletins (hasMany)<br>LigneBulletin.bulletin (belongsTo) |
| `ins_lignes_bulletins` | `coursId` | `ins_cours` | belongsTo<br>LigneBulletin.cours (belongsTo) |
| `ins_resultats_deliberation` | `cursusApprenantId` | `ins_cursus_apprenants` | belongsTo<br>ResultatDeliberation.cursusApprenant (belongsTo) |
| `ins_resultats_deliberation` | `deliberationId` | `ins_deliberations` | belongsTo / hasMany<br>Deliberation.resultats (hasMany)<br>ResultatDeliberation.deliberation (belongsTo) |

### communication

| Table portant la cle | Cle declaree | Table liee | Association(s) / alias |
|---|---|---|---|
| `com_communications` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>Communication.utilisateur (belongsTo)<br>Utilisateur.communications (hasMany) |
| `com_reponses_suggestion` | `suggestionId` | `com_suggestions` | belongsTo / hasMany<br>ReponseSuggestion.suggestion (belongsTo)<br>Suggestion.reponsesSuggestion (hasMany) |
| `com_reponses_suggestion` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>ReponseSuggestion.utilisateur (belongsTo)<br>Utilisateur.reponsesSuggestion (hasMany) |
| `com_suggestions` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>Suggestion.utilisateur (belongsTo)<br>Utilisateur.suggestions (hasMany) |

### comptabilite

| Table portant la cle | Cle declaree | Table liee | Association(s) / alias |
|---|---|---|---|
| `cpt_bordereau_echeance` | `bordereauId` | `ins_bordereaux` | belongsTo / hasMany<br>Bordereau.imputations (hasMany)<br>BordereauEcheance.bordereau (belongsTo) |
| `cpt_bordereau_echeance` | `echeanceId` | `ins_echeances` | belongsTo / hasMany<br>BordereauEcheance.echeance (belongsTo)<br>Echeance.imputations (hasMany) |
| `cpt_ecritures_comptables` | `compteCreditId` | `cpt_comptes` | belongsTo / hasMany<br>Compte.creditures (hasMany)<br>EcritureComptable.compteCredit (belongsTo) |
| `cpt_ecritures_comptables` | `compteDebitId` | `cpt_comptes` | belongsTo / hasMany<br>Compte.debitures (hasMany)<br>EcritureComptable.compteDebit (belongsTo) |
| `cpt_ecritures_comptables` | `exerciceId` | `cpt_exercices` | belongsTo / hasMany<br>EcritureComptable.exercice (belongsTo)<br>ExerciceComptable.ecritures (hasMany) |
| `cpt_ecritures_comptables` | `journalId` | `cpt_journaux_comptables` | belongsTo / hasMany<br>EcritureComptable.journal (belongsTo)<br>JournalComptable.ecritures (hasMany) |
| `cpt_ecritures_comptables` | `utilisateurSaisieId` | `aut_utilisateurs` | belongsTo / hasMany<br>EcritureComptable.utilisateurSaisie (belongsTo)<br>Utilisateur.ecrituresSaisies (hasMany) |
| `cpt_ecritures_comptables` | `utilisateurValidationId` | `aut_utilisateurs` | belongsTo / hasMany<br>EcritureComptable.utilisateurValidation (belongsTo)<br>Utilisateur.ecrituresValidees (hasMany) |
| `cpt_frais_parcours` | `anneeAcademiqueId` | `ins_annees_academiques` | belongsTo / hasMany<br>AnneeAcademique.fraisParcoursAnnee (hasMany)<br>FraisParcours.anneeAcademique (belongsTo) |
| `cpt_frais_parcours` | `niveauEtudeId` | `ins_niveaux_etudes` | belongsTo / hasMany<br>FraisParcours.niveauEtude (belongsTo)<br>NiveauEtude.fraisParcoursNiveau (hasMany) |
| `cpt_frais_parcours` | `parcoursId` | `ins_parcours` | belongsTo / hasMany<br>FraisParcours.parcours (belongsTo)<br>Parcours.fraisParcoursParcours (hasMany) |
| `cpt_lignes_frais_etudiant` | `dossierEtudiantId` | `ins_dossiers_etudiants` | belongsTo / hasMany<br>DossierEtudiant.lignesFrais (hasMany)<br>LigneFraisEtudiant.dossierEtudiant (belongsTo) |
| `cpt_lignes_frais_etudiant` | `reductionId` | `cpt_reductions_frais` | belongsTo / hasMany<br>LigneFraisEtudiant.reduction (belongsTo)<br>ReductionFrais.lignesFraisReduction (hasMany) |
| `cpt_lignes_releves_bancaires` | `ecritureComptableId` | `cpt_ecritures_comptables` | belongsTo / hasMany<br>EcritureComptable.lignesReleve (hasMany)<br>LigneReleveBancaire.ecritureComptable (belongsTo) |
| `cpt_lignes_releves_bancaires` | `releveBancaireId` | `cpt_releves_bancaires` | belongsTo / hasMany<br>LigneReleveBancaire.releveBancaire (belongsTo)<br>ReleveBancaire.lignes (hasMany) |
| `cpt_portefeuille_credit` | `bordereauId` | `ins_bordereaux` | belongsTo / hasMany<br>Bordereau.portefeuilleCredits (hasMany)<br>PortefeuilleCredit.bordereau (belongsTo) |
| `cpt_portefeuille_credit` | `dossierEtudiantId` | `ins_dossiers_etudiants` | belongsTo / hasMany<br>DossierEtudiant.portefeuilleCredits (hasMany)<br>PortefeuilleCredit.dossierEtudiant (belongsTo) |
| `cpt_portefeuille_credit` | `echeanceId` | `ins_echeances` | belongsTo / hasMany<br>Echeance.portefeuilleCredits (hasMany)<br>PortefeuilleCredit.echeance (belongsTo) |
| `cpt_reductions_frais` | `dossierEtudiantId` | `ins_dossiers_etudiants` | belongsTo / hasMany<br>DossierEtudiant.reductions (hasMany)<br>ReductionFrais.dossierEtudiant (belongsTo) |
| `cpt_reductions_frais` | `validePar` | `aut_utilisateurs` | belongsTo / hasMany<br>ReductionFrais.validateur (belongsTo)<br>Utilisateur.reductionsValidees (hasMany) |
| `cpt_releves_bancaires` | `compteBancaireId` | `cpt_comptes_bancaires` | belongsTo / hasMany<br>CompteBancaire.releves (hasMany)<br>ReleveBancaire.compteBancaire (belongsTo) |

### docgen

| Table portant la cle | Cle declaree | Table liee | Association(s) / alias |
|---|---|---|---|
| `docgen_documents` | `templateId` | `docgen_templates` | belongsTo / hasMany<br>DocGenDocument.template (belongsTo)<br>DocGenTemplate.documents (hasMany) |
| `docgen_documents` | `typeId` | `docgen_types` | belongsTo / hasMany<br>DocGenDocument.type (belongsTo)<br>DocGenType.documents (hasMany) |
| `docgen_references` | `typeId` | `docgen_types` | belongsTo / hasMany<br>DocGenReference.type (belongsTo)<br>DocGenType.references (hasMany) |
| `docgen_signatures` | `documentId` | `docgen_documents` | belongsTo / hasMany<br>DocGenDocument.signatures (hasMany)<br>DocGenSignature.document (belongsTo) |
| `docgen_templates` | `typeId` | `docgen_types` | belongsTo / hasMany<br>DocGenTemplate.type (belongsTo)<br>DocGenType.templates (hasMany) |
| `docgen_workflows` | `typeId` | `docgen_types` | belongsTo / hasMany<br>DocGenType.workflowSteps (hasMany)<br>DocGenWorkflow.type (belongsTo) |

### elearning

| Table portant la cle | Cle declaree | Table liee | Association(s) / alias |
|---|---|---|---|
| `elearning_audit` | `acteurId` | `aut_utilisateurs` | belongsTo / hasMany<br>Audit.acteur (belongsTo)<br>Utilisateur.auditsElearning (hasMany) |
| `elearning_centres_examens` | `responsableId` | `aut_utilisateurs` | belongsTo / hasMany<br>CentreExamen.responsable (belongsTo)<br>Utilisateur.centresExamensGeres (hasMany) |
| `elearning_certificats` | `apprenantId` | `aut_utilisateurs` | belongsTo / hasMany<br>Certificat.apprenant (belongsTo)<br>Utilisateur.certificats (hasMany) |
| `elearning_certificats` | `coursId` | `elearning_cours` | belongsTo / hasMany<br>Certificat.cours (belongsTo)<br>CoursEnLigne.certificats (hasMany) |
| `elearning_commentaires` | `supportId` | `elearning_supports` | belongsTo / hasMany<br>Commentaire.support (belongsTo)<br>Support.commentaires (hasMany) |
| `elearning_couplages_mail` | `supportId` | `elearning_supports` | belongsTo / hasMany<br>CouplageMail.support (belongsTo)<br>Support.couplagesMail (hasMany) |
| `elearning_cours` | `chargeSupportId` | `aut_utilisateurs` | belongsTo<br>CoursEnLigne.chargeSupport (belongsTo) |
| `elearning_cours` | `coursId` | `ins_cours` | belongsTo / hasMany<br>Cours.coursEnLigne (hasMany)<br>CoursEnLigne.coursPedagogique (belongsTo) |
| `elearning_cours` | `enseignantId` | `aut_utilisateurs` | belongsTo / hasMany<br>CoursEnLigne.enseignant (belongsTo)<br>Utilisateur.coursEnLigne (hasMany) |
| `elearning_cours` | `professeurId` | `aut_utilisateurs` | belongsTo<br>CoursEnLigne.professeurResponsable (belongsTo) |
| `elearning_cours` | `ueId` | `ins_cours` | belongsTo<br>CoursEnLigne.ue (belongsTo) |
| `elearning_devoirs` | `coursId` | `elearning_cours` | belongsTo / hasMany<br>CoursEnLigne.devoirs (hasMany)<br>Devoir.cours (belongsTo) |
| `elearning_devoirs` | `enseignantId` | `aut_utilisateurs` | belongsTo / hasMany<br>Devoir.enseignant (belongsTo)<br>Utilisateur.devoirs (hasMany) |
| `elearning_encaissements` | `enveloppeId` | `elearning_enveloppes` | belongsTo / hasMany<br>Encaissement.enveloppe (belongsTo)<br>Enveloppe.encaissements (hasMany) |
| `elearning_encaissements` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>Encaissement.utilisateur (belongsTo)<br>Utilisateur.encaissementsElearning (hasMany) |
| `elearning_enveloppes` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>Enveloppe.utilisateur (belongsTo)<br>Utilisateur.enveloppesElearning (hasMany) |
| `elearning_examens` | `coursId` | `elearning_cours` | belongsTo / hasMany<br>CoursEnLigne.examens (hasMany)<br>Examen.cours (belongsTo) |
| `elearning_messages` | `salonId` | `elearning_salons` | belongsTo / hasMany<br>Message.salon (belongsTo)<br>Salon.messages (hasMany) |
| `elearning_modules` | `coursId` | `elearning_cours` | belongsTo / hasMany<br>CoursEnLigne.modules (hasMany)<br>ModuleElearning.cours (belongsTo) |
| `elearning_mouvements` | `enveloppeId` | `elearning_enveloppes` | belongsTo / hasMany<br>Enveloppe.mouvements (hasMany)<br>Mouvement.enveloppe (belongsTo) |
| `elearning_notes_examens` | `examenId` | `elearning_examens` | belongsTo / hasMany<br>Examen.notes (hasMany)<br>NoteExamen.examen (belongsTo) |
| `elearning_notes_examens` | `utilisateurId` | `aut_utilisateurs` | belongsTo<br>NoteExamen.apprenant (belongsTo) |
| `elearning_participants_salon` | `salonId` | `elearning_salons` | belongsTo / hasMany<br>ParticipantSalon.salon (belongsTo)<br>Salon.participants (hasMany) |
| `elearning_participants_salon` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>ParticipantSalon.utilisateur (belongsTo)<br>Utilisateur.participationsSalons (hasMany) |
| `elearning_progression_apprenant` | `apprenantId` | `aut_utilisateurs` | belongsTo / hasMany<br>ProgressionApprenant.apprenant (belongsTo)<br>Utilisateur.progressionsElearning (hasMany) |
| `elearning_progression_apprenant` | `supportId` | `elearning_supports` | belongsTo / hasMany<br>ProgressionApprenant.support (belongsTo)<br>Support.progressions (hasMany) |
| `elearning_quiz` | `coursId` | `elearning_cours` | belongsTo / hasMany<br>CoursEnLigne.quiz (hasMany)<br>Quiz.cours (belongsTo) |
| `elearning_reponses_quiz` | `apprenantId` | `aut_utilisateurs` | belongsTo / hasMany<br>ReponseQuiz.apprenant (belongsTo)<br>Utilisateur.reponsesQuiz (hasMany) |
| `elearning_reponses_quiz` | `quizId` | `elearning_quiz` | belongsTo / hasMany<br>Quiz.reponses (hasMany)<br>ReponseQuiz.quiz (belongsTo) |
| `elearning_reservations_examens` | `examenId` | `elearning_examens` | belongsTo / hasMany<br>Examen.reservations (hasMany)<br>ReservationExamen.examen (belongsTo) |
| `elearning_reservations_examens` | `sessionId` | `elearning_sessions_examens` | belongsTo / hasMany<br>ReservationExamen.session (belongsTo)<br>SessionExamen.reservations (hasMany) |
| `elearning_reservations_examens` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>ReservationExamen.utilisateur (belongsTo)<br>Utilisateur.reservationsExamens (hasMany) |
| `elearning_salons` | `coursId` | `elearning_cours` | belongsTo / hasMany<br>CoursEnLigne.salons (hasMany)<br>Salon.cours (belongsTo) |
| `elearning_salons` | `createdById` | `aut_utilisateurs` | belongsTo / hasMany<br>Salon.createdBy (belongsTo)<br>Utilisateur.salonsCrees (hasMany) |
| `elearning_selections_cours` | `coursId` | `elearning_cours` | belongsTo / hasMany<br>CoursEnLigne.selections (hasMany)<br>SelectionCours.cours (belongsTo) |
| `elearning_selections_cours` | `enveloppeId` | `elearning_enveloppes` | belongsTo / hasMany<br>Enveloppe.selections (hasMany)<br>SelectionCours.enveloppe (belongsTo) |
| `elearning_sessions_examens` | `centreId` | `elearning_centres_examens` | belongsTo / hasMany<br>CentreExamen.sessions (hasMany)<br>SessionExamen.centre (belongsTo) |
| `elearning_sessions_examens` | `examenId` | `elearning_examens` | belongsTo / hasMany<br>Examen.sessions (hasMany)<br>SessionExamen.examen (belongsTo) |
| `elearning_soumissions_devoirs` | `apprenantId` | `aut_utilisateurs` | belongsTo / hasMany<br>SoumissionDevoir.apprenant (belongsTo)<br>Utilisateur.soumissionsDevoirs (hasMany) |
| `elearning_soumissions_devoirs` | `devoirId` | `elearning_devoirs` | belongsTo / hasMany<br>Devoir.soumissions (hasMany)<br>SoumissionDevoir.devoir (belongsTo) |
| `elearning_supports` | `moduleId` | `elearning_modules` | belongsTo / hasMany<br>ModuleElearning.supports (hasMany)<br>Support.module (belongsTo) |

### ged

| Table portant la cle | Cle declaree | Table liee | Association(s) / alias |
|---|---|---|---|
| `ged_audit_logs` | `documentId` | `ged_documents` | belongsTo / hasMany<br>DocumentAuditLog.document (belongsTo)<br>DocumentGed.auditLogs (hasMany) |
| `ged_disposal_records` | `confirmedBy` | `aut_utilisateurs` | belongsTo / hasMany<br>DisposalRecord.confirmer (belongsTo)<br>Utilisateur.disposalConfirmations (hasMany) |
| `ged_disposal_records` | `documentId` | `ged_documents` | belongsTo / hasMany<br>DisposalRecord.document (belongsTo)<br>DocumentGed.disposalRecords (hasMany) |
| `ged_disposal_records` | `requestedBy` | `aut_utilisateurs` | belongsTo / hasMany<br>DisposalRecord.requester (belongsTo)<br>Utilisateur.disposalRequests (hasMany) |
| `ged_document_access_grants` | `documentId` | `ged_documents` | belongsTo / hasMany<br>DocumentAccessGrant.document (belongsTo)<br>DocumentGed.accessGrants (hasMany) |
| `ged_document_tags` | `documentId` | `ged_documents` | belongsTo / hasMany<br>DocumentGed.documentTags (hasMany)<br>DocumentTag.document (belongsTo) |
| `ged_document_tags` | `tagId` | `ged_tags` | belongsTo / hasMany<br>DocumentTag.tag (belongsTo)<br>Tag.documentTags (hasMany) |
| `ged_document_types` | `domainId` | `ged_domains` | belongsTo<br>DocumentType.domain (belongsTo) |
| `ged_documents` | `documentTypeId` | `ged_document_types` | belongsTo / hasMany<br>DocumentGed.documentType (belongsTo)<br>DocumentType.documents (hasMany) |
| `ged_documents` | `domainId` | `ged_domains` | belongsTo / hasMany<br>DocumentGed.domain (belongsTo)<br>Domain.documents (hasMany) |
| `ged_documents` | `folderId` | `ged_folders` | belongsTo / hasMany<br>DocumentGed.folder (belongsTo)<br>Folder.documents (hasMany) |
| `ged_documents` | `lockedBy` | `aut_utilisateurs` | belongsTo / hasMany<br>DocumentGed.locker (belongsTo)<br>Utilisateur.lockedDocuments (hasMany) |
| `ged_documents` | `parentDocumentId` | `ged_documents` | belongsTo / hasMany<br>DocumentGed.parent (belongsTo)<br>DocumentGed.versions (hasMany) |
| `ged_documents` | `processusGenerateurId` | `ged_processus` | belongsTo / hasMany<br>DocumentGed.processusGenerateur (belongsTo)<br>ProcessusGenerateur.documents (hasMany) |
| `ged_documents` | `sessionId` | `ged_sessions` | belongsTo / hasMany<br>DocumentGed.session (belongsTo)<br>SessionGed.documents (hasMany) |
| `ged_documents` | `uploaderId` | `aut_utilisateurs` | belongsTo / hasMany<br>DocumentGed.uploader (belongsTo)<br>Utilisateur.gedDocuments (hasMany) |
| `ged_folders` | `createdBy` | `aut_utilisateurs` | belongsTo / hasMany<br>Folder.creator (belongsTo)<br>Utilisateur.gedFolders (hasMany) |
| `ged_folders` | `domainId` | `ged_domains` | belongsTo / hasMany<br>Domain.folders (hasMany)<br>Folder.domain (belongsTo) |
| `ged_folders` | `parentId` | `ged_folders` | belongsTo / hasMany<br>Folder.children (hasMany)<br>Folder.parent (belongsTo) |
| `ged_registre_courrier` | `documentId` | `ged_documents` | belongsTo / hasMany<br>DocumentGed.registreCourriers (hasMany)<br>RegistreCourrier.document (belongsTo) |
| `ged_registre_courrier` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>RegistreCourrier.utilisateur (belongsTo)<br>Utilisateur.registreCourriers (hasMany) |
| `ged_role_permissions` | `domainId` | `ged_domains` | belongsTo / hasMany<br>Domain.rolePermissions (hasMany)<br>RolePermission.domain (belongsTo) |
| `ged_role_permissions` | `processusGenerateurId` | `ged_processus` | belongsTo / hasMany<br>ProcessusGenerateur.rolePermissions (hasMany)<br>RolePermission.processusGenerateur (belongsTo) |
| `ged_sessions` | `createdBy` | `aut_utilisateurs` | belongsTo / hasMany<br>SessionGed.creator (belongsTo)<br>Utilisateur.gedSessions (hasMany) |
| `ged_signatures` | `documentId` | `ged_documents` | belongsTo / hasMany<br>DocumentGed.signatures (hasMany)<br>GedSignature.document (belongsTo) |
| `ged_signatures` | `rejectedBy` | `aut_utilisateurs` | belongsTo / hasMany<br>GedSignature.rejector (belongsTo)<br>Utilisateur.signatureRejects (hasMany) |
| `ged_signatures` | `requestedBy` | `aut_utilisateurs` | belongsTo / hasMany<br>GedSignature.requester (belongsTo)<br>Utilisateur.signatureRequests (hasMany) |
| `ged_signatures` | `signedBy` | `aut_utilisateurs` | belongsTo / hasMany<br>GedSignature.signer (belongsTo)<br>Utilisateur.signatureSigns (hasMany) |

### immobilisation

| Table portant la cle | Cle declaree | Table liee | Association(s) / alias |
|---|---|---|---|
| `imm_acquisition` | `immobilisationId` | `imm_immobilisation` | belongsTo / hasOne<br>Acquisition.immobilisation (belongsTo)<br>Immobilisation.acquisition (hasOne) |
| `imm_affectation` | `departementId` | `imm_departement` | belongsTo<br>Affectation.departement (belongsTo) |
| `imm_affectation` | `immobilisationId` | `imm_immobilisation` | belongsTo / hasMany<br>Affectation.immobilisation (belongsTo)<br>Immobilisation.affectations (hasMany) |
| `imm_affectation` | `localisationId` | `imm_localisation` | belongsTo<br>Affectation.localisation (belongsTo) |
| `imm_affectation` | `siteId` | `imm_site` | belongsTo<br>Affectation.site (belongsTo) |
| `imm_amortissement` | `immobilisationId` | `imm_immobilisation` | belongsTo / hasMany<br>Amortissement.immobilisation (belongsTo)<br>Immobilisation.amortissements (hasMany) |
| `imm_assurance` | `immobilisationId` | `imm_immobilisation` | belongsTo / hasOne<br>Assurance.immobilisation (belongsTo)<br>Immobilisation.assurance (hasOne) |
| `imm_batiment` | `siteId` | `imm_site` | belongsTo / hasMany<br>Batiment.site (belongsTo)<br>Site.batiments (hasMany) |
| `imm_cession` | `immobilisationId` | `imm_immobilisation` | belongsTo / hasOne<br>Cession.immobilisation (belongsTo)<br>Immobilisation.cession (hasOne) |
| `imm_immobilisation` | `categorieId` | `imm_categorie_immobilisation` | belongsTo / hasMany<br>CategorieImmobilisation.immobilisations (hasMany)<br>Immobilisation.categorie (belongsTo) |
| `imm_immobilisation` | `departementId` | `imm_departement` | belongsTo / hasMany<br>Departement.immobilisations (hasMany)<br>Immobilisation.departement (belongsTo) |
| `imm_immobilisation` | `localisationId` | `imm_localisation` | belongsTo<br>Immobilisation.localisation (belongsTo) |
| `imm_immobilisation` | `siteId` | `imm_site` | belongsTo / hasMany<br>Immobilisation.site (belongsTo)<br>Site.immobilisations (hasMany) |
| `imm_ligne_inventaire` | `immobilisationId` | `imm_immobilisation` | belongsTo / hasMany<br>Immobilisation.lignesInventaire (hasMany)<br>LigneInventaire.immobilisation (belongsTo) |
| `imm_ligne_inventaire` | `inventaireId` | `imm_inventaire` | belongsTo / hasMany<br>Inventaire.lignes (hasMany)<br>LigneInventaire.inventaire (belongsTo) |
| `imm_localisation` | `batimentId` | `imm_batiment` | belongsTo / hasMany<br>Batiment.localisations (hasMany)<br>Localisation.batiment (belongsTo) |
| `imm_maintenance` | `immobilisationId` | `imm_immobilisation` | belongsTo / hasMany<br>Immobilisation.maintenances (hasMany)<br>Maintenance.immobilisation (belongsTo) |
| `imm_maintenance_programmee` | `immobilisationId` | `imm_immobilisation` | belongsTo / hasMany<br>Immobilisation.maintenancesProgrammees (hasMany)<br>MaintenanceProgrammee.immobilisation (belongsTo) |
| `imm_rebuts_immobilisation` | `immobilisationId` | `imm_immobilisation` | belongsTo / hasMany<br>Immobilisation.rebutsImmobilisation (hasMany)<br>RebutImmobilisation.immobilisation (belongsTo) |
| `imm_sortie_provisoire` | `immobilisationId` | `imm_immobilisation` | belongsTo / hasMany<br>Immobilisation.sortiesProvisoires (hasMany)<br>SortieProvisoire.immobilisation (belongsTo) |

### inscription

| Table portant la cle | Cle declaree | Table liee | Association(s) / alias |
|---|---|---|---|
| `ins_absences` | `noteEvaluationId` | `ins_notes_evaluation` | belongsTo / hasOne<br>Absence.noteEvaluation (belongsTo)<br>NoteEvaluation.absence (hasOne) |
| `ins_affectations_salles_classes` | `anneeAcademiqueId` | `ins_annees_academiques` | belongsTo / hasMany<br>AffectationSalleClasse.anneeAcademique (belongsTo)<br>AnneeAcademique.affectationsSallesClasses (hasMany) |
| `ins_affectations_salles_classes` | `classeId` | `ins_classes` | belongsTo / hasMany<br>AffectationSalleClasse.classe (belongsTo)<br>Classe.affectationsSallesClasses (hasMany) |
| `ins_affectations_salles_classes` | `etablissementId` | `eta_etablissements` | belongsTo / hasMany<br>AffectationSalleClasse.etablissement (belongsTo)<br>Etablissement.affectationsSallesClasses (hasMany) |
| `ins_affectations_salles_classes` | `salleId` | `ins_salles_de_classes` | belongsTo / hasMany<br>AffectationSalleClasse.salle (belongsTo)<br>SalleDeClasse.affectationsSallesClasses (hasMany) |
| `ins_blocs_cahier_de_texte` | `cahierDeTexteId` | `ins_cahiers_de_texte` | belongsTo / hasMany<br>BlocCahierDeTexte.cahierDeTexte (belongsTo)<br>CahierDeTexte.blocsCahierDeTexte (hasMany) |
| `ins_bordereaux` | `echeanceId` | `ins_echeances` | belongsTo / hasMany<br>Bordereau.echeance (belongsTo)<br>Echeance.bordereaux (hasMany) |
| `ins_bordereaux` | `saisiParId` | `aut_utilisateurs` | belongsTo / hasMany<br>Bordereau.saisiPar (belongsTo)<br>Utilisateur.bordereauxSaisis (hasMany) |
| `ins_bordereaux` | `typeOperationId` | `ins_types_operations_bordereau` | belongsTo / hasMany<br>Bordereau.typeOperation (belongsTo)<br>TypeOperationBordereau.bordereaux (hasMany) |
| `ins_bordereaux` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>Bordereau.utilisateur (belongsTo)<br>Utilisateur.bordereaux (hasMany) |
| `ins_bordereaux` | `valideParId` | `aut_utilisateurs` | belongsTo / hasMany<br>Bordereau.validePar (belongsTo)<br>Utilisateur.bordereauxValides (hasMany) |
| `ins_cahiers_de_texte` | `coursId` | `ins_cours` | belongsTo / hasMany<br>CahierDeTexte.cours (belongsTo)<br>Cours.cahiersDeTexte (hasMany) |
| `ins_cahiers_de_texte` | `enseignantId` | `aut_enseignants` | belongsTo / hasMany<br>CahierDeTexte.enseignant (belongsTo)<br>Enseignant.cahiersDeTexte (hasMany) |
| `ins_cahiers_de_texte` | `etablissementId` | `eta_etablissements` | belongsTo / hasMany<br>CahierDeTexte.etablissement (belongsTo)<br>Etablissement.cahiersDeTexte (hasMany) |
| `ins_cahiers_de_texte` | `niveauEtudeId` | `ins_niveaux_etudes` | belongsTo / hasMany<br>CahierDeTexte.niveauEtude (belongsTo)<br>NiveauEtude.cahiersDeTexte (hasMany) |
| `ins_cahiers_de_texte` | `parcoursId` | `ins_parcours` | belongsTo / hasMany<br>CahierDeTexte.parcours (belongsTo)<br>Parcours.cahiersDeTexte (hasMany) |
| `ins_chapitres_cours` | `coursId` | `ins_cours` | belongsTo / hasMany<br>ChapitreCours.cours (belongsTo)<br>Cours.chapitresCours (hasMany) |
| `ins_classes` | `etablissementId` | `eta_etablissements` | belongsTo / hasMany<br>Classe.etablissement (belongsTo)<br>Etablissement.classes (hasMany) |
| `ins_classes` | `niveauEtudeId` | `ins_niveaux_etudes` | belongsTo / hasMany<br>Classe.niveauEtude (belongsTo)<br>NiveauEtude.classes (hasMany) |
| `ins_classes` | `parcoursId` | `ins_parcours` | belongsTo / hasMany<br>Classe.parcours (belongsTo)<br>Parcours.classes (hasMany) |
| `ins_comite_votes` | `demandeInscriptionId` | `ins_demandes_inscription` | belongsTo / hasMany<br>ComiteVote.demandeInscription (belongsTo)<br>DemandeInscription.comiteVotes (hasMany) |
| `ins_comite_votes` | `membreId` | `aut_utilisateurs` | belongsTo / hasMany<br>ComiteVote.membre (belongsTo)<br>Utilisateur.comiteVotes (hasMany) |
| `ins_cours` | `classeId` | `ins_classes` | belongsTo / hasMany<br>Classe.cours (hasMany)<br>Cours.classe (belongsTo) |
| `ins_cours` | `enseignantId` | `aut_enseignants` | belongsTo / hasMany<br>Cours.enseignant (belongsTo)<br>Enseignant.cours (hasMany) |
| `ins_cours` | `etablissementId` | `eta_etablissements` | belongsTo / hasMany<br>Cours.etablissement (belongsTo)<br>Etablissement.cours (hasMany) |
| `ins_cours` | `parcoursId` | `ins_parcours` | belongsTo / hasMany<br>Cours.parcours (belongsTo)<br>Parcours.cours (hasMany) |
| `ins_cours_choisis` | `coursId` | `ins_cours` | belongsTo / hasMany<br>Cours.coursChoisis (hasMany)<br>DemandeInscriptionCours.cours (belongsTo) |
| `ins_cours_choisis` | `demandeInscriptionId` | `ins_demandes_inscription` | belongsTo / hasMany<br>DemandeInscription.coursChoisis (hasMany)<br>DemandeInscriptionCours.demandeInscription (belongsTo) |
| `ins_cours_participants` | `coursId` | `ins_cours` | belongsTo / hasMany<br>Cours.coursParticipants (hasMany)<br>CoursParticipant.cours (belongsTo) |
| `ins_cours_participants` | `cursusApprenantId` | `ins_cursus_apprenants` | belongsTo / hasMany<br>CoursParticipant.cursusApprenant (belongsTo)<br>CursusApprenant.coursParticipants (hasMany) |
| `ins_cours_participants` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>CoursParticipant.utilisateur (belongsTo)<br>Utilisateur.coursParticipants (hasMany) |
| `ins_cours_participants` | `utilisateurId` | `ins_dossiers_etudiants` | hasMany<br>DossierEtudiant.coursParticipants (hasMany) |
| `ins_creneaux` | `etablissementId` | `eta_etablissements` | belongsTo / hasMany<br>Creneau.etablissement (belongsTo)<br>Etablissement.creneaux (hasMany) |
| `ins_cursus_apprenants` | `anneeAcademiqueId` | `ins_annees_academiques` | belongsTo / hasMany<br>AnneeAcademique.cursusApprenant (hasMany)<br>CursusApprenant.anneeAcademique (belongsTo) |
| `ins_cursus_apprenants` | `classeId` | `ins_classes` | belongsTo / hasMany<br>Classe.cursusApprenant (hasMany)<br>CursusApprenant.classe (belongsTo) |
| `ins_cursus_apprenants` | `demandeInscriptionId` | `ins_demandes_inscription` | belongsTo / hasOne<br>CursusApprenant.demandeInscription (belongsTo)<br>DemandeInscription.cursusApprenant (hasOne) |
| `ins_cursus_apprenants` | `etablissementId` | `eta_etablissements` | belongsTo / hasMany<br>CursusApprenant.etablissement (belongsTo)<br>Etablissement.cursusApprenants (hasMany) |
| `ins_cursus_apprenants` | `niveauEtudeId` | `ins_niveaux_etudes` | belongsTo / hasMany<br>CursusApprenant.niveauEtude (belongsTo)<br>NiveauEtude.cursusApprenant (hasMany) |
| `ins_cursus_apprenants` | `parcoursId` | `ins_parcours` | belongsTo / hasMany<br>CursusApprenant.parcours (belongsTo)<br>Parcours.cursusApprenant (hasMany) |
| `ins_cursus_apprenants` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>CursusApprenant.utilisateur (belongsTo)<br>Utilisateur.cursusApprenant (hasMany) |
| `ins_demandes_inscription` | `etablissementId` | `eta_etablissements` | hasMany<br>Etablissement.demandesInscription (hasMany) |
| `ins_demandes_inscription` | `etapeInscriptionId` | `ins_etapes_inscription` | belongsTo / hasMany<br>DemandeInscription.etapeInscription (belongsTo)<br>EtapeInscription.demandesInscriptionEtape (hasMany) |
| `ins_demandes_inscription` | `sessionId` | `ins_sessions` | belongsTo / hasMany<br>DemandeInscription.session (belongsTo)<br>Session.demandesInscription (hasMany) |
| `ins_demandes_inscription` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>DemandeInscription.utilisateur (belongsTo)<br>Utilisateur.demandesInscription (hasMany) |
| `ins_designation_memoires` | `cursusApprenantId` | `ins_cursus_apprenants` | belongsTo / hasMany<br>CursusApprenant.designationMemoire (hasMany)<br>DesignationMemoire.cursusApprenant (belongsTo) |
| `ins_designation_memoires` | `superviseurId` | `aut_utilisateurs` | belongsTo / hasMany<br>DesignationMemoire.superviseur (belongsTo)<br>Utilisateur.designationsMemoire (hasMany) |
| `ins_dispenses` | `coursId` | `ins_cours` | belongsTo / hasMany<br>Cours.dispenses (hasMany)<br>Dispense.cours (belongsTo) |
| `ins_dispenses` | `cursusApprenantId` | `ins_cursus_apprenants` | belongsTo / hasMany<br>CursusApprenant.dispenses (hasMany)<br>Dispense.cursusApprenant (belongsTo) |
| `ins_dispenses` | `validePar` | `aut_utilisateurs` | belongsTo / hasMany<br>Dispense.valideParUtilisateur (belongsTo)<br>Utilisateur.dispensesValidees (hasMany) |
| `ins_dossiers_demandes` | `demandeId` | `ins_demandes_inscription` | belongsTo / hasMany<br>DemandeInscription.dossiersDemande (hasMany)<br>DemandeInscriptionDossier.demandeInscription (belongsTo) |
| `ins_dossiers_demandes` | `dossierId` | `ins_dossiers_inscription` | belongsTo / hasMany<br>DemandeInscriptionDossier.dossierInscription (belongsTo)<br>DossierInscription.dossiersDemande (hasMany) |
| `ins_dossiers_etudiants` | `etablissementId` | `eta_etablissements` | belongsTo<br>DossierEtudiant.etablissement (belongsTo) |
| `ins_dossiers_etudiants` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>DossierEtudiant.utilisateur (belongsTo)<br>Utilisateur.dossiersEtudiants (hasMany) |
| `ins_dossiers_inscription` | `sessionId` | `ins_sessions` | belongsTo / hasMany<br>DossierInscription.session (belongsTo)<br>Session.dossiersInscription (hasMany) |
| `ins_echeances` | `dossierEtudiantId` | `ins_dossiers_etudiants` | belongsTo / hasMany<br>DossierEtudiant.echeances (hasMany)<br>Echeance.dossierEtudiant (belongsTo) |
| `ins_ecue` | `coursId` | `ins_cours` | belongsTo / hasMany<br>Cours.ecues (hasMany)<br>Ecue.cours (belongsTo) |
| `ins_ecue` | `enseignantId` | `aut_enseignants` | belongsTo / hasMany<br>Ecue.enseignant (belongsTo)<br>Enseignant.ecues (hasMany) |
| `ins_equivalences` | `coursDestinationId` | `ins_cours` | belongsTo / hasMany<br>Cours.equivalences (hasMany)<br>Equivalence.coursDestination (belongsTo) |
| `ins_equivalences` | `cursusApprenantId` | `ins_cursus_apprenants` | belongsTo / hasMany<br>CursusApprenant.equivalences (hasMany)<br>Equivalence.cursusApprenant (belongsTo) |
| `ins_equivalences` | `validePar` | `aut_utilisateurs` | belongsTo / hasMany<br>Equivalence.valideParUtilisateur (belongsTo)<br>Utilisateur.equivalencesValidees (hasMany) |
| `ins_fichiers_ressources` | `ressourceId` | `ins_ressources` | belongsTo / hasMany<br>FichierRessource.ressource (belongsTo)<br>Ressource.fichiersRessource (hasMany) |
| `ins_frais_inscription` | `sessionId` | `ins_sessions` | belongsTo / hasMany<br>FraisInscription.session (belongsTo)<br>Session.fraisInscription (hasMany) |
| `ins_frais_parcours` | `anneeAcademiqueId` | `ins_annees_academiques` | belongsTo / hasMany<br>AnneeAcademique.fraisParcours (hasMany)<br>FraisParcours.anneeAcademique (belongsTo) |
| `ins_frais_parcours` | `niveauEtudeId` | `ins_niveaux_etudes` | belongsTo / hasMany<br>FraisParcours.niveauEtude (belongsTo)<br>NiveauEtude.fraisParcours (hasMany) |
| `ins_frais_parcours` | `parcoursId` | `ins_parcours` | belongsTo / hasMany<br>FraisParcours.parcours (belongsTo)<br>Parcours.fraisParcours (hasMany) |
| `ins_frais_scolarites` | `sessionId` | `ins_sessions` | belongsTo / hasMany<br>FraisScolarite.session (belongsTo)<br>Session.fraisScolarite (hasMany) |
| `ins_listes_notes_evaluation` | `anneeAcademiqueId` | `ins_annees_academiques` | belongsTo / hasMany<br>AnneeAcademique.listesNotesEvaluation (hasMany)<br>ListeNoteEvaluation.anneeAcademique (belongsTo) |
| `ins_listes_notes_evaluation` | `coursId` | `ins_cours` | belongsTo / hasMany<br>Cours.listesNotesEvaluation (hasMany)<br>ListeNoteEvaluation.cours (belongsTo) |
| `ins_listes_notes_evaluation` | `enseignantId` | `aut_enseignants` | belongsTo / hasMany<br>Enseignant.listesNotesEvaluation (hasMany)<br>ListeNoteEvaluation.enseignant (belongsTo) |
| `ins_listes_notes_evaluation` | `typeNoteEvaluationId` | `ins_types_note_evaluation` | belongsTo / hasMany<br>ListeNoteEvaluation.typeNoteEvaluation (belongsTo)<br>TypeNoteEvaluation.listesNotesEvaluation (hasMany) |
| `ins_listes_presences` | `coursId` | `ins_cours` | belongsTo / hasMany<br>Cours.listesPresences (hasMany)<br>ListePresence.cours (belongsTo) |
| `ins_listes_presences` | `enseignantId` | `aut_enseignants` | belongsTo / hasMany<br>Enseignant.listesPresences (hasMany)<br>ListePresence.enseignant (belongsTo) |
| `ins_listes_presences` | `etablissementId` | `eta_etablissements` | belongsTo / hasMany<br>Etablissement.listesPresences (hasMany)<br>ListePresence.etablissement (belongsTo) |
| `ins_listes_presences` | `niveauEtudeId` | `ins_niveaux_etudes` | belongsTo / hasMany<br>ListePresence.niveauEtude (belongsTo)<br>NiveauEtude.listesPresences (hasMany) |
| `ins_listes_presences` | `parcoursId` | `ins_parcours` | belongsTo / hasMany<br>ListePresence.parcours (belongsTo)<br>Parcours.listesPresences (hasMany) |
| `ins_mcc` | `coursId` | `ins_cours` | belongsTo / hasMany<br>Cours.mccs (hasMany)<br>Mcc.cours (belongsTo) |
| `ins_mcc` | `ecueId` | `ins_ecue` | belongsTo / hasMany<br>Ecue.mccs (hasMany)<br>Mcc.ecue (belongsTo) |
| `ins_notes_evaluation` | `coursParticipantId` | `ins_cours_participants` | belongsTo / hasMany<br>CoursParticipant.notesEvaluation (hasMany)<br>NoteEvaluation.coursParticipant (belongsTo) |
| `ins_notes_evaluation` | `listeNoteEvaluationId` | `ins_listes_notes_evaluation` | belongsTo / hasMany<br>ListeNoteEvaluation.notesEvaluation (hasMany)<br>NoteEvaluation.listeNoteEvaluation (belongsTo) |
| `ins_paiements_inscription` | `matriculeInscription` | `ins_demandes_inscription` | belongsTo / hasMany<br>DemandeInscription.paiementsInscription (hasMany)<br>PaiementInscription.demandeInscription (belongsTo) |
| `ins_paiements_inscription` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>PaiementInscription.utilisateur (belongsTo)<br>Utilisateur.paiementsInscription (hasMany) |
| `ins_parcours` | `etablissementId` | `eta_etablissements` | hasMany<br>Etablissement.parcours (hasMany) |
| `ins_parcours` | `niveauEtudeId` | `ins_niveaux_etudes` | belongsTo / hasMany<br>NiveauEtude.parcours (hasMany)<br>Parcours.niveauEtude (belongsTo) |
| `ins_parcours_choisis` | `demandeInscriptionId` | `ins_demandes_inscription` | belongsTo / hasMany<br>DemandeInscription.parcoursChoisis (hasMany)<br>ParcoursChoisi.parcoursChoisi (belongsTo) |
| `ins_parcours_choisis` | `parcoursId` | `ins_parcours` | belongsTo / hasMany<br>Parcours.parcoursChoisis (hasMany)<br>ParcoursChoisi.parcours (belongsTo) |
| `ins_penalite_retard` | `fraisParcoursId` | `ins_frais_parcours` | belongsTo / hasMany<br>FraisParcours.penalites (hasMany)<br>PenaliteRetard.fraisParcours (belongsTo) |
| `ins_pointage_scans` | `pointageId` | `ins_pointages` | belongsTo / hasMany<br>Pointage.scans (hasMany)<br>PointageScan.pointage (belongsTo) |
| `ins_pointages` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>Pointage.utilisateur (belongsTo)<br>Utilisateur.pointages (hasMany) |
| `ins_pre_inscriptions` | `demandeInscriptionId` | `ins_demandes_inscription` | belongsTo / hasOne<br>DemandeInscription.preInscription (hasOne)<br>PreInscription.demandeInscription (belongsTo) |
| `ins_pre_inscriptions` | `traiteParId` | `aut_utilisateurs` | belongsTo / hasMany<br>PreInscription.traitePar (belongsTo)<br>Utilisateur.preInscriptionsTraitees (hasMany) |
| `ins_prerequis_parcours` | `matierePrerequisId` | `ins_matieres_prerequis` | belongsTo / hasMany<br>MatierePrerequis.prerequisParcours (hasMany)<br>PrerequisParcours.matierePrerequis (belongsTo) |
| `ins_prerequis_parcours` | `niveauEtudeId` | `ins_niveaux_etudes` | belongsTo / hasMany<br>NiveauEtude.prerequisParcours (hasMany)<br>PrerequisParcours.niveauEtude (belongsTo) |
| `ins_prerequis_parcours` | `parcoursId` | `ins_parcours` | belongsTo / hasMany<br>Parcours.prerequisParcours (hasMany)<br>PrerequisParcours.parcours (belongsTo) |
| `ins_prerequis_parcours_choisis` | `parcoursChoisiId` | `ins_parcours_choisis` | belongsTo / hasMany<br>ParcoursChoisi.prerequisParcoursChoisis (hasMany)<br>PrerequisParcoursChoisi.parcoursChoisi (belongsTo) |
| `ins_prerequis_parcours_choisis` | `prerequisParcoursId` | `ins_prerequis_parcours` | belongsTo<br>PrerequisParcoursChoisi.prerequisParcours (belongsTo) |
| `ins_presences` | `listePresenceId` | `ins_listes_presences` | belongsTo / hasMany<br>ListePresence.presences (hasMany)<br>Presence.listePresence (belongsTo) |
| `ins_presences_cours_participants` | `coursParticipantId` | `ins_cours_participants` | belongsTo / hasMany<br>CoursParticipant.presencesCoursParticipants (hasMany)<br>PresenceCoursParticipant.coursParticipant (belongsTo) |
| `ins_presences_cours_participants` | `presenceId` | `ins_presences` | belongsTo / hasMany<br>Presence.presencesCoursParticipants (hasMany)<br>PresenceCoursParticipant.presence (belongsTo) |
| `ins_publications_notes` | `listeNoteEvaluationId` | `ins_listes_notes_evaluation` | belongsTo / hasMany<br>ListeNoteEvaluation.publicationsNotes (hasMany)<br>PublicationNote.listeNoteEvaluation (belongsTo) |
| `ins_publications_notes` | `publiePar` | `aut_utilisateurs` | belongsTo / hasMany<br>PublicationNote.publieParUtilisateur (belongsTo)<br>Utilisateur.publicationsNotes (hasMany) |
| `ins_quitus` | `bordereauId` | `ins_bordereaux` | belongsTo / hasOne<br>Bordereau.quitus (hasOne)<br>Quitus.bordereau (belongsTo) |
| `ins_quitus` | `paiementInscriptionId` | `ins_paiements_inscription` | belongsTo / hasOne<br>PaiementInscription.quitus (hasOne)<br>Quitus.paiementInscription (belongsTo) |
| `ins_rattrapage_comite_votes` | `membreId` | `aut_utilisateurs` | belongsTo / hasMany<br>RattrapageComiteVote.membre (belongsTo)<br>Utilisateur.comiteVotesRattrapage (hasMany) |
| `ins_rattrapage_comite_votes` | `rattrapageInscriptionId` | `ins_rattrapages_inscriptions` | belongsTo / hasMany<br>RattrapageComiteVote.rattrapageInscription (belongsTo)<br>RattrapageInscription.comiteVotes (hasMany) |
| `ins_rattrapage_documents_deposes` | `documentRequisId` | `ins_rattrapage_documents_requis` | belongsTo / hasMany<br>RattrapageDocumentDepose.documentRequis (belongsTo)<br>RattrapageDocumentRequis.documentsDeposes (hasMany) |
| `ins_rattrapage_documents_deposes` | `rattrapageInscriptionId` | `ins_rattrapages_inscriptions` | belongsTo / hasMany<br>RattrapageDocumentDepose.rattrapageInscription (belongsTo)<br>RattrapageInscription.documentsDeposes (hasMany) |
| `ins_rattrapage_documents_requis` | `rattrapageSessionId` | `ins_sessions_rattrapage` | belongsTo / hasMany<br>RattrapageDocumentRequis.rattrapageSession (belongsTo)<br>RattrapageSession.documentsRequis (hasMany) |
| `ins_rattrapage_enseignants` | `ecueId` | `ins_cours` | belongsTo / hasMany<br>Cours.rattrapagesEnseignantEcue (hasMany)<br>RattrapageEnseignant.ecue (belongsTo) |
| `ins_rattrapage_enseignants` | `enseignantId` | `aut_enseignants` | belongsTo / hasMany<br>Enseignant.rattrapagesEnseignant (hasMany)<br>RattrapageEnseignant.enseignant (belongsTo) |
| `ins_rattrapage_enseignants` | `rattrapagePlanningId` | `ins_rattrapage_planning` | belongsTo / hasMany<br>RattrapageEnseignant.rattrapagePlanning (belongsTo)<br>RattrapagePlanning.enseignants (hasMany) |
| `ins_rattrapage_enseignants` | `ueId` | `ins_cours` | belongsTo / hasMany<br>Cours.rattrapagesEnseignantUe (hasMany)<br>RattrapageEnseignant.ue (belongsTo) |
| `ins_rattrapage_notes` | `etudiantId` | `aut_utilisateurs` | belongsTo / hasMany<br>RattrapageNote.etudiant (belongsTo)<br>Utilisateur.rattrapageNotes (hasMany) |
| `ins_rattrapage_notes` | `rattrapageInscriptionId` | `ins_rattrapages_inscriptions` | belongsTo / hasMany<br>RattrapageInscription.notes (hasMany)<br>RattrapageNote.rattrapageInscription (belongsTo) |
| `ins_rattrapage_notes` | `saisiPar` | `aut_utilisateurs` | belongsTo / hasMany<br>RattrapageNote.saisiParUser (belongsTo)<br>Utilisateur.notesSaisiesRattrapage (hasMany) |
| `ins_rattrapage_notes` | `ueId` | `ins_cours` | belongsTo / hasMany<br>Cours.rattrapageNotes (hasMany)<br>RattrapageNote.ue (belongsTo) |
| `ins_rattrapage_planning` | `classeId` | `ins_classes` | belongsTo / hasMany<br>Classe.planningRattrapage (hasMany)<br>RattrapagePlanning.classe (belongsTo) |
| `ins_rattrapage_planning` | `rattrapageSessionId` | `ins_sessions_rattrapage` | belongsTo / hasMany<br>RattrapagePlanning.rattrapageSession (belongsTo)<br>RattrapageSession.planning (hasMany) |
| `ins_rattrapage_planning` | `salleId` | `ins_salles_de_classes` | belongsTo / hasMany<br>RattrapagePlanning.salle (belongsTo)<br>SalleDeClasse.planningRattrapage (hasMany) |
| `ins_rattrapages_inscriptions` | `bordereauId` | `ins_bordereaux` | belongsTo / hasMany<br>Bordereau.rattrapagesInscriptions (hasMany)<br>RattrapageInscription.bordereauDepose (belongsTo) |
| `ins_rattrapages_inscriptions` | `coursId` | `ins_cours` | belongsTo / hasMany<br>Cours.rattrapagesInscription (hasMany)<br>RattrapageInscription.cours (belongsTo) |
| `ins_rattrapages_inscriptions` | `coursParticipantId` | `ins_cours_participants` | belongsTo / hasMany<br>CoursParticipant.rattrapagesInscription (hasMany)<br>RattrapageInscription.coursParticipant (belongsTo) |
| `ins_rattrapages_inscriptions` | `demandePar` | `aut_utilisateurs` | belongsTo / hasMany<br>RattrapageInscription.demandeur (belongsTo)<br>Utilisateur.rattrapagesDemandes (hasMany) |
| `ins_rattrapages_inscriptions` | `enseignantGradientId` | `aut_enseignants` | belongsTo / hasMany<br>Enseignant.rattrapagesInscriptionEnseignant (hasMany)<br>RattrapageInscription.enseignantGradient (belongsTo) |
| `ins_rattrapages_inscriptions` | `paiementId` | `ins_bordereaux` | belongsTo / hasOne<br>Bordereau.rattrapage (hasOne)<br>RattrapageInscription.bordereau (belongsTo) |
| `ins_rattrapages_inscriptions` | `planningId` | `ins_rattrapage_planning` | belongsTo<br>RattrapageInscription.planning (belongsTo) |
| `ins_rattrapages_inscriptions` | `rattrapageSessionId` | `ins_sessions_rattrapage` | belongsTo / hasMany<br>RattrapageInscription.rattrapageSession (belongsTo)<br>RattrapageSession.inscriptions (hasMany) |
| `ins_rattrapages_inscriptions` | `sessionExamenId` | `ins_sessions_examens` | belongsTo / hasMany<br>RattrapageInscription.sessionExamen (belongsTo)<br>SessionExamen.rattrapagesInscription (hasMany) |
| `ins_reduction_frais` | `fraisParcoursId` | `ins_frais_parcours` | belongsTo / hasMany<br>FraisParcours.reductions (hasMany)<br>ReductionFrais.fraisParcours (belongsTo) |
| `ins_regles_evaluation` | `parcoursId` | `ins_parcours` | belongsTo / hasMany<br>Parcours.reglesEvaluation (hasMany)<br>RegleEvaluation.parcours (belongsTo) |
| `ins_reponses_inscription` | `demandeInscriptionId` | `ins_demandes_inscription` | belongsTo / hasOne<br>DemandeInscription.reponseInscription (hasOne)<br>ReponseInscription.demandeInscription (belongsTo) |
| `ins_reponses_inscription` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>ReponseInscription.utilisateur (belongsTo)<br>Utilisateur.reponsesInscription (hasMany) |
| `ins_ressources` | `chapitreCoursId` | `ins_chapitres_cours` | belongsTo / hasMany<br>ChapitreCours.ressources (hasMany)<br>Ressource.chapitreCours (belongsTo) |
| `ins_salles_de_classes` | `classeId` | `ins_classes` | belongsTo / hasMany<br>Classe.sallesDeClasse (hasMany)<br>SalleDeClasse.classe (belongsTo) |
| `ins_salles_de_classes` | `etablissementId` | `eta_etablissements` | belongsTo / hasMany<br>Etablissement.sallesDeClasse (hasMany)<br>SalleDeClasse.etablissement (belongsTo) |
| `ins_salles_de_classes` | `localisationId` | `imm_localisation` | belongsTo / hasMany<br>Localisation.sallesDeClasse (hasMany)<br>SalleDeClasse.localisation (belongsTo) |
| `ins_salles_de_classes` | `parcoursId` | `ins_parcours` | belongsTo / hasMany<br>Parcours.sallesDeClasse (hasMany)<br>SalleDeClasse.parcours (belongsTo) |
| `ins_seance_pointages` | `etablissementId` | `eta_etablissements` | belongsTo<br>SeancePointage.etablissement (belongsTo) |
| `ins_seance_pointages` | `seanceId` | `ins_seances` | belongsTo<br>SeancePointage.seance (belongsTo) |
| `ins_seance_pointages` | `utilisateurId` | `aut_utilisateurs` | belongsTo<br>SeancePointage.utilisateur (belongsTo) |
| `ins_seances` | `anneeAcademiqueId` | `ins_annees_academiques` | belongsTo / hasMany<br>AnneeAcademique.seances (hasMany)<br>Seance.anneeAcademique (belongsTo) |
| `ins_seances` | `classeGroupeId` | `ins_classes` | belongsTo / hasMany<br>Classe.seancesClasseGroupe (hasMany)<br>Seance.classeGroupe (belongsTo) |
| `ins_seances` | `coursId` | `ins_cours` | belongsTo / hasMany<br>Cours.seances (hasMany)<br>Seance.cours (belongsTo) |
| `ins_seances` | `creneauId` | `ins_creneaux` | belongsTo / hasMany<br>Creneau.seances (hasMany)<br>Seance.creneau (belongsTo) |
| `ins_seances` | `enseignantId` | `aut_enseignants` | belongsTo / hasMany<br>Enseignant.seances (hasMany)<br>Seance.enseignant (belongsTo) |
| `ins_seances` | `etablissementId` | `eta_etablissements` | belongsTo / hasMany<br>Etablissement.seances (hasMany)<br>Seance.etablissement (belongsTo) |
| `ins_seances` | `niveauEtudeId` | `ins_niveaux_etudes` | belongsTo / hasMany<br>NiveauEtude.seances (hasMany)<br>Seance.niveauEtude (belongsTo) |
| `ins_seances` | `parcoursId` | `ins_parcours` | belongsTo / hasMany<br>Parcours.seances (hasMany)<br>Seance.parcours (belongsTo) |
| `ins_seances` | `salleDeClasseId` | `ins_salles_de_classes` | belongsTo / hasMany<br>SalleDeClasse.seances (hasMany)<br>Seance.salleDeClasse (belongsTo) |
| `ins_seances` | `semestreAcademiqueId` | `ins_semestres_academiques` | belongsTo / hasMany<br>Seance.semestreAcademique (belongsTo)<br>SemestreAcademique.seances (hasMany) |
| `ins_semestres_academiques` | `anneeAcademiqueId` | `ins_annees_academiques` | belongsTo / hasMany<br>AnneeAcademique.semestresAcademiques (hasMany)<br>SemestreAcademique.anneeAcademique (belongsTo) |
| `ins_semestres_academiques` | `parcoursId` | `ins_parcours` | belongsTo / hasMany<br>Parcours.semestresAcademiques (hasMany)<br>SemestreAcademique.parcours (belongsTo) |
| `ins_session_correcteurs` | `coursId` | `ins_cours` | belongsTo / hasMany<br>Cours.correcteursSession (hasMany)<br>SessionCorrecteur.cours (belongsTo) |
| `ins_session_correcteurs` | `enseignantId` | `aut_enseignants` | belongsTo / hasMany<br>Enseignant.correcteursSession (hasMany)<br>SessionCorrecteur.enseignant (belongsTo) |
| `ins_session_correcteurs` | `sessionExamenId` | `ins_sessions_examens` | belongsTo / hasMany<br>SessionCorrecteur.sessionExamen (belongsTo)<br>SessionExamen.correcteurs (hasMany) |
| `ins_sessions` | `anneeAcademiqueId` | `ins_annees_academiques` | belongsTo / hasMany<br>AnneeAcademique.sessions (hasMany)<br>Session.anneeAcademique (belongsTo) |
| `ins_sessions` | `etablissementId` | `eta_etablissements` | hasMany<br>Etablissement.sessions (hasMany) |
| `ins_sessions` | `niveauEtudeId` | `ins_niveaux_etudes` | belongsTo / hasMany<br>NiveauEtude.sessions (hasMany)<br>Session.niveauEtude (belongsTo) |
| `ins_sessions_examens` | `anneeAcademiqueId` | `ins_annees_academiques` | belongsTo / hasMany<br>AnneeAcademique.sessionsExamen (hasMany)<br>SessionExamen.anneeAcademique (belongsTo) |
| `ins_sessions_examens` | `classeId` | `ins_classes` | belongsTo / hasMany<br>Classe.sessionsExamen (hasMany)<br>SessionExamen.classe (belongsTo) |
| `ins_sessions_rattrapage` | `anneeAcademiqueId` | `ins_annees_academiques` | belongsTo / hasMany<br>AnneeAcademique.rattrapagesSessions (hasMany)<br>RattrapageSession.anneeAcademique (belongsTo) |
| `ins_sessions_rattrapage_classes` | `classeId` | `ins_classes` | belongsTo / hasMany<br>Classe.sessionsRattrapageClasses (hasMany)<br>RattrapageSessionClasse.classe (belongsTo) |
| `ins_sessions_rattrapage_classes` | `rattrapageSessionId` | `ins_sessions_rattrapage` | belongsTo / hasMany<br>RattrapageSession.classes (hasMany)<br>RattrapageSessionClasse.rattrapageSession (belongsTo) |

### marche

| Table portant la cle | Cle declaree | Table liee | Association(s) / alias |
|---|---|---|---|
| `mar_appels_offre` | `planificationMarcheId` | `mar_planifications` | belongsTo / hasMany<br>AppelOffre.planification (belongsTo)<br>PlanificationMarche.appelsOffre (hasMany) |
| `mar_avenants` | `contratMarcheId` | `mar_contrats` | belongsTo / hasMany<br>AvenantMarche.contrat (belongsTo)<br>ContratMarche.avenants (hasMany) |
| `mar_contrats` | `appelOffreId` | `mar_appels_offre` | belongsTo / hasMany<br>AppelOffre.contrats (hasMany)<br>ContratMarche.appelOffre (belongsTo) |
| `mar_contrats` | `manifestationInteretId` | `mar_manifestations_interet` | belongsTo / hasMany<br>ContratMarche.manifestationInteret (belongsTo)<br>ManifestationInteret.contrats (hasMany) |
| `mar_manifestations_interet` | `planificationMarcheId` | `mar_planifications` | belongsTo / hasMany<br>ManifestationInteret.planification (belongsTo)<br>PlanificationMarche.manifestations (hasMany) |

### orientation

| Table portant la cle | Cle declaree | Table liee | Association(s) / alias |
|---|---|---|---|
| `ori_debouches_parcours` | `parcoursId` | `ori_parcours` | belongsTo / hasMany<br>DeboucheParcours.parcours (belongsTo)<br>Parcours.debouchesParcours (hasMany) |
| `ori_demandes_orientation` | `anneeAcademiqueId` | `ins_annees_academiques` | belongsTo / hasMany<br>AnneeAcademique.demandesOrientation (hasMany)<br>DemandeOrientation.anneeAcademique (belongsTo) |
| `ori_demandes_orientation` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>DemandeOrientation.utilisateur (belongsTo)<br>Utilisateur.demandesOrientation (hasMany) |
| `ori_panier_parcours_choisis` | `parcoursChoisiId` | `ori_parcours_choisis` | belongsTo / hasMany<br>PanierParcoursChoisi.parcoursChoisi (belongsTo)<br>ParcoursChoisi.panierParcoursChoisis (hasMany) |
| `ori_panier_parcours_choisis` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>PanierParcoursChoisi.utilisateur (belongsTo)<br>Utilisateur.panierParcoursChoisis (hasMany) |
| `ori_parcours` | `categorieId` | `ori_categories` | belongsTo / hasMany<br>Categorie.parcours (hasMany)<br>Parcours.categorie (belongsTo) |
| `ori_parcours` | `niveauEtudeId` | `ori_niveaux_etudes` | belongsTo / hasMany<br>NiveauEtude.parcours (hasMany)<br>Parcours.niveauEtude (belongsTo) |
| `ori_parcours_choisis` | `demandeOrientationId` | `ori_demandes_orientation` | belongsTo / hasMany<br>DemandeOrientation.parcoursChoisis (hasMany)<br>ParcoursChoisi.parcoursChoisi (belongsTo) |
| `ori_parcours_choisis` | `parcoursId` | `ori_parcours` | belongsTo / hasMany<br>Parcours.parcoursChoisis (hasMany)<br>ParcoursChoisi.parcours (belongsTo) |
| `ori_prerequis_parcours` | `matierePrerequisId` | `ori_matieres_prerequis` | belongsTo / hasMany<br>MatierePrerequis.prerequisParcours (hasMany)<br>PrerequisParcours.matierePrerequis (belongsTo) |
| `ori_prerequis_parcours` | `niveauEtudeId` | `ori_niveaux_etudes` | belongsTo / hasMany<br>NiveauEtude.prerequisParcours (hasMany)<br>PrerequisParcours.niveauEtude (belongsTo) |
| `ori_prerequis_parcours` | `parcoursId` | `ori_parcours` | belongsTo / hasMany<br>Parcours.prerequisParcours (hasMany)<br>PrerequisParcours.parcours (belongsTo) |
| `ori_prerequis_parcours_choisis` | `parcoursChoisiId` | `ori_parcours_choisis` | belongsTo / hasMany<br>ParcoursChoisi.prerequisParcoursChoisis (hasMany)<br>PrerequisParcoursChoisi.parcoursChoisi (belongsTo) |
| `ori_prerequis_parcours_choisis` | `prerequisParcoursId` | `ori_prerequis_parcours` | belongsTo<br>PrerequisParcoursChoisi.prerequisParcours (belongsTo) |
| `ori_reponses_orientation` | `demandeOrientationId` | `ori_demandes_orientation` | belongsTo / hasOne<br>DemandeOrientation.reponseOrientation (hasOne)<br>ReponseOrientation.demandeOrientation (belongsTo) |
| `ori_reponses_orientation` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>ReponseOrientation.utilisateur (belongsTo)<br>Utilisateur.reponsesOrientation (hasMany) |

### parent

| Table portant la cle | Cle declaree | Table liee | Association(s) / alias |
|---|---|---|---|
| `par_parents_enfants` | `apprenantId` | `aut_apprenants` | belongsTo / hasMany<br>Apprenant.parents (hasMany)<br>ParentEnfant.apprenant (belongsTo) |
| `par_parents_enfants` | `parentUtilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>ParentEnfant.parentUtilisateur (belongsTo)<br>Utilisateur.parentEnfants (hasMany) |

### qualite

| Table portant la cle | Cle declaree | Table liee | Association(s) / alias |
|---|---|---|---|
| `qua_actions_correctives` | `nonConformiteId` | `qua_non_conformites` | belongsTo / hasMany<br>QuaActionCorrective.nonConformite (belongsTo)<br>QuaNonConformite.actionsCorrectives (hasMany) |
| `qua_audit_pistes` | `auditId` | `qua_audits` | belongsTo / hasMany<br>QuaAudit.pistes (hasMany)<br>QuaAuditPiste.audit (belongsTo) |
| `qua_decisions_revue` | `revueDirectionId` | `qua_revues_direction` | belongsTo / hasMany<br>QuaDecisionRevue.revueDirection (belongsTo)<br>QuaRevueDirection.decisions (hasMany) |
| `qua_reponses_satisfaction` | `enqueteSatisfactionId` | `qua_enquetes_satisfaction` | belongsTo / hasMany<br>QuaEnqueteSatisfaction.reponses (hasMany)<br>QuaReponseSatisfaction.enquete (belongsTo) |

### rh

| Table portant la cle | Cle declaree | Table liee | Association(s) / alias |
|---|---|---|---|
| `rh_bulletins_paie` | `employeId` | `rh_employes` | belongsTo / hasMany<br>RhBulletinPaie.employe (belongsTo)<br>RhEmploye.bulletinsPaie (hasMany) |
| `rh_bulletins_paie` | `periodeId` | `rh_periodes_paie` | belongsTo / hasMany<br>RhBulletinPaie.periode (belongsTo)<br>RhPeriodePaie.bulletinsPaie (hasMany) |
| `rh_candidatures` | `offreId` | `rh_offres_emploi` | belongsTo / hasMany<br>RhCandidature.offre (belongsTo)<br>RhOffreEmploi.candidatures (hasMany) |
| `rh_contrats_enseignant` | `employeId` | `rh_employes` | belongsTo / hasMany<br>RhContratEnseignant.employe (belongsTo)<br>RhEmploye.contratsEnseignant (hasMany) |
| `rh_demandes_conge` | `employeId` | `rh_employes` | belongsTo / hasMany<br>RhDemandeConge.employe (belongsTo)<br>RhEmploye.demandesConge (hasMany) |
| `rh_employes` | `departementId` | `rh_departements` | belongsTo / hasMany<br>RhDepartement.employes (hasMany)<br>RhEmploye.departement (belongsTo) |
| `rh_employes` | `posteId` | `rh_postes` | belongsTo / hasMany<br>RhEmploye.poste (belongsTo)<br>RhPoste.employes (hasMany) |
| `rh_employes` | `typeContratId` | `rh_types_contrat` | belongsTo / hasMany<br>RhEmploye.typeContrat (belongsTo)<br>RhTypeContrat.employes (hasMany) |
| `rh_entretiens` | `candidatureId` | `rh_candidatures` | belongsTo / hasMany<br>RhCandidature.entretiens (hasMany)<br>RhEntretien.candidature (belongsTo) |
| `rh_evaluations_criteres` | `critereId` | `rh_criteres_evaluation` | belongsTo / hasMany<br>RhCritereEvaluation.evaluationsCriteres (hasMany)<br>RhEvaluationCritere.critere (belongsTo) |
| `rh_evaluations_criteres` | `ficheId` | `rh_fiches_evaluation` | belongsTo / hasMany<br>RhEvaluationCritere.fiche (belongsTo)<br>RhFicheEvaluation.evaluationsCriteres (hasMany) |
| `rh_fiches_evaluation` | `employeId` | `rh_employes` | belongsTo / hasMany<br>RhEmploye.fichesEvaluation (hasMany)<br>RhFicheEvaluation.employe (belongsTo) |
| `rh_grille_salariale` | `categorieId` | `rh_categories_professionnelles` | belongsTo / hasMany<br>RhCategorieProfessionnelle.grillesSalariales (hasMany)<br>RhGrilleSalariale.categorie (belongsTo) |
| `rh_grille_salariale` | `posteId` | `rh_postes` | belongsTo / hasMany<br>RhGrilleSalariale.poste (belongsTo)<br>RhPoste.grillesSalariales (hasMany) |
| `rh_heures_supplementaires` | `employeId` | `rh_employes` | belongsTo / hasMany<br>RhEmploye.heuresSupplementaires (hasMany)<br>RhHeureSupplementaire.employe (belongsTo) |
| `rh_indemnites_prestataires` | `prestataireId` | `rh_prestataires` | belongsTo / hasMany<br>RhIndemnitePrestataire.prestataire (belongsTo)<br>RhPrestataire.indemnites (hasMany) |
| `rh_lignes_bulletin` | `bulletinId` | `rh_bulletins_paie` | belongsTo / hasMany<br>RhBulletinPaie.lignesBulletin (hasMany)<br>RhLigneBulletin.bulletin (belongsTo) |
| `rh_lignes_bulletin` | `rubriqueId` | `rh_rubriques_paie` | belongsTo / hasMany<br>RhLigneBulletin.rubrique (belongsTo)<br>RhRubriquePaie.lignesBulletin (hasMany) |
| `rh_offres_emploi` | `posteId` | `rh_postes` | belongsTo / hasMany<br>RhOffreEmploi.poste (belongsTo)<br>RhPoste.offresEmploi (hasMany) |
| `rh_participations_formation` | `employeId` | `rh_employes` | belongsTo / hasMany<br>RhEmploye.participationsFormation (hasMany)<br>RhParticipationFormation.employe (belongsTo) |
| `rh_participations_formation` | `formationId` | `rh_formations` | belongsTo / hasMany<br>RhFormation.participations (hasMany)<br>RhParticipationFormation.formation (belongsTo) |
| `rh_planning_personnel` | `employeId` | `rh_employes` | belongsTo / hasMany<br>RhEmploye.planningsPersonnel (hasMany)<br>RhPlanningPersonnel.employe (belongsTo) |
| `rh_postes` | `departementId` | `rh_departements` | belongsTo / hasMany<br>RhDepartement.postes (hasMany)<br>RhPoste.departement (belongsTo) |
| `rh_prestations_enseignant` | `enseignantId` | `rh_employes` | belongsTo / hasMany<br>RhEmploye.prestationsEnseignant (hasMany)<br>RhPrestationEnseignant.enseignant (belongsTo) |
| `rh_prets` | `employeId` | `rh_employes` | belongsTo / hasMany<br>RhEmploye.prets (hasMany)<br>RhPret.employe (belongsTo) |
| `rh_remboursements_pret` | `pretId` | `rh_prets` | belongsTo / hasMany<br>RhPret.remboursements (hasMany)<br>RhRemboursementPret.pret (belongsTo) |
| `rh_rubriques_paie` | `categorieId` | `rh_categories_professionnelles` | belongsTo / hasMany<br>RhCategorieProfessionnelle.rubriquesPaie (hasMany)<br>RhRubriquePaie.categoriePro (belongsTo) |
| `rh_rubriques_paie` | `posteId` | `rh_postes` | belongsTo / hasMany<br>RhPoste.rubriquesPaie (hasMany)<br>RhRubriquePaie.poste (belongsTo) |
| `rh_soldes_conge` | `employeId` | `rh_employes` | belongsTo / hasMany<br>RhEmploye.soldesConge (hasMany)<br>RhSoldeConge.employe (belongsTo) |

### scolarite

| Table portant la cle | Cle declaree | Table liee | Association(s) / alias |
|---|---|---|---|
| `scol_clotures_caisse` | `caissierId` | `aut_utilisateurs` | belongsTo / hasMany<br>ClotureCaisse.caissier (belongsTo)<br>Utilisateur.cloturesCaisse (hasMany) |
| `scol_decisions_conseil` | `conseilClasseId` | `scol_conseils_classe` | belongsTo / hasMany<br>ConseilClasse.decisions (hasMany)<br>DecisionConseil.conseilClasse (belongsTo) |
| `scol_decisions_passage` | `anneeAcademiqueId` | `ins_annees_academiques` | belongsTo / hasMany<br>AnneeAcademique.decisionsPassage (hasMany)<br>DecisionPassage.anneeAcademique (belongsTo) |
| `scol_decisions_passage` | `cursusApprenantId` | `ins_cursus_apprenants` | belongsTo / hasMany<br>CursusApprenant.decisionsPassage (hasMany)<br>DecisionPassage.cursusApprenant (belongsTo) |
| `scol_decisions_passage` | `validePar` | `aut_utilisateurs` | belongsTo / hasMany<br>DecisionPassage.valideParUtilisateur (belongsTo)<br>Utilisateur.decisionsPassage (hasMany) |
| `scol_demandes_document` | `caissierId` | `aut_utilisateurs` | belongsTo<br>DemandeDocument.caissier (belongsTo) |
| `scol_demandes_document` | `etudiantId` | `aut_utilisateurs` | belongsTo / hasMany<br>DemandeDocument.etudiant (belongsTo)<br>Utilisateur.demandesDocument (hasMany) |
| `scol_demandes_document` | `recuCaisseId` | `scol_recus_caisse` | belongsTo<br>DemandeDocument.recuCaisse (belongsTo) |
| `scol_demandes_document` | `typeDocumentId` | `scol_types_document` | belongsTo / hasMany<br>DemandeDocument.typeDocument (belongsTo)<br>TypeDocument.demandesDocument (hasMany) |
| `scol_demandes_document_pieces` | `demandeId` | `scol_demandes_document` | belongsTo / hasMany<br>DemandeDocument.pieces (hasMany)<br>DemandeDocumentPiece.demande (belongsTo) |
| `scol_demandes_document_votes` | `demandeId` | `scol_demandes_document` | belongsTo / hasMany<br>DemandeDocument.votesComite (hasMany)<br>DemandeDocumentVote.demande (belongsTo) |
| `scol_demandes_document_votes` | `membreId` | `aut_utilisateurs` | belongsTo<br>DemandeDocumentVote.membre (belongsTo) |
| `scol_demandes_reorientation` | `cursusApprenantId` | `ins_cursus_apprenants` | belongsTo / hasMany<br>CursusApprenant.demandesReorientation (hasMany)<br>DemandeReorientation.cursusApprenant (belongsTo) |
| `scol_demandes_reorientation` | `parcoursActuelId` | `ins_parcours` | belongsTo / hasMany<br>DemandeReorientation.parcoursActuel (belongsTo)<br>Parcours.demandesReorientationActuel (hasMany) |
| `scol_demandes_reorientation` | `parcoursCibleId` | `ins_parcours` | belongsTo / hasMany<br>DemandeReorientation.parcoursCible (belongsTo)<br>Parcours.demandesReorientationCible (hasMany) |
| `scol_demandes_reorientation` | `traitePar` | `aut_utilisateurs` | belongsTo / hasMany<br>DemandeReorientation.traiteParUtilisateur (belongsTo)<br>Utilisateur.demandesReorientationTraite (hasMany) |
| `scol_demandes_vae` | `parcoursCibleId` | `ins_parcours` | belongsTo / hasMany<br>DemandeVAE.parcoursCible (belongsTo)<br>Parcours.demandesVAE (hasMany) |
| `scol_demandes_vae` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>DemandeVAE.utilisateur (belongsTo)<br>Utilisateur.demandesVAE (hasMany) |
| `scol_diplomes` | `cursusApprenantId` | `ins_cursus_apprenants` | belongsTo / hasMany<br>CursusApprenant.diplomes (hasMany)<br>Diplome.cursusApprenant (belongsTo) |
| `scol_diplomes` | `niveauEtudeId` | `ins_niveaux_etudes` | belongsTo / hasMany<br>Diplome.niveauEtude (belongsTo)<br>NiveauEtude.diplomes (hasMany) |
| `scol_diplomes` | `parcoursId` | `ins_parcours` | belongsTo / hasMany<br>Diplome.parcours (belongsTo)<br>Parcours.diplomes (hasMany) |
| `scol_documents_delivres` | `demandeId` | `scol_demandes_document` | belongsTo / hasOne<br>DemandeDocument.documentDelivre (hasOne)<br>DocumentDelivre.demande (belongsTo) |
| `scol_evenements_calendrier` | `classeId` | `ins_classes` | belongsTo / hasMany<br>Classe.evenementsCalendrier (hasMany)<br>EvenementCalendrier.classe (belongsTo) |
| `scol_evenements_calendrier` | `parcoursId` | `ins_parcours` | belongsTo / hasMany<br>EvenementCalendrier.parcours (belongsTo)<br>Parcours.evenementsCalendrier (hasMany) |
| `scol_journal_caisse` | `clotureId` | `scol_clotures_caisse` | belongsTo / hasMany<br>ClotureCaisse.lignes (hasMany)<br>JournalCaisse.cloture (belongsTo) |
| `scol_journal_caisse` | `demandeDocumentId` | `scol_demandes_document` | belongsTo / hasMany<br>DemandeDocument.lignesCaisse (hasMany)<br>JournalCaisse.demandeDocument (belongsTo) |
| `scol_journal_secretariat` | `utilisateurId` | `aut_utilisateurs` | belongsTo / hasMany<br>JournalSecretariat.utilisateur (belongsTo)<br>Utilisateur.actionsSecretariat (hasMany) |
| `scol_livres` | `uploaderId` | `aut_utilisateurs` | belongsTo / hasMany<br>Livre.uploader (belongsTo)<br>Utilisateur.livres (hasMany) |
| `scol_progression_pedagogique` | `chapitreId` | `ins_chapitres_cours` | belongsTo / hasMany<br>ChapitreCours.progressionsPedagogiques (hasMany)<br>ProgressionPedagogique.chapitre (belongsTo) |
| `scol_progression_pedagogique` | `coursId` | `ins_cours` | belongsTo / hasMany<br>Cours.progressionsPedagogiques (hasMany)<br>ProgressionPedagogique.cours (belongsTo) |
| `scol_reclamations` | `etudiantId` | `aut_utilisateurs` | belongsTo / hasMany<br>Reclamation.etudiant (belongsTo)<br>Utilisateur.reclamations (hasMany) |
| `scol_recus_caisse` | `caissierId` | `aut_utilisateurs` | belongsTo / hasMany<br>RecuCaisse.caissier (belongsTo)<br>Utilisateur.recusEncaisses (hasMany) |
| `scol_recus_caisse` | `demandeDocumentId` | `scol_demandes_document` | belongsTo / hasMany<br>DemandeDocument.recus (hasMany)<br>RecuCaisse.demandeDocument (belongsTo) |
| `scol_recus_caisse` | `etudiantId` | `aut_utilisateurs` | belongsTo<br>RecuCaisse.etudiant (belongsTo) |
| `scol_recus_caisse` | `typeDocumentId` | `scol_types_document` | belongsTo<br>RecuCaisse.typeDocument (belongsTo) |
| `scol_registres_academiques` | `cursusApprenantId` | `ins_cursus_apprenants` | belongsTo / hasMany<br>CursusApprenant.registresAcademiques (hasMany)<br>RegistreAcademique.cursusApprenant (belongsTo) |
| `scol_reponses_reclamation` | `reclamationId` | `scol_reclamations` | belongsTo / hasMany<br>Reclamation.reponsesReclamation (hasMany)<br>ReponseReclamation.reclamation (belongsTo) |
| `scol_reponses_reclamation` | `repondeurId` | `aut_utilisateurs` | belongsTo / hasMany<br>ReponseReclamation.repondeur (belongsTo)<br>Utilisateur.reponsesReclamation (hasMany) |
| `scol_sanctions_academiques` | `cursusApprenantId` | `ins_cursus_apprenants` | belongsTo / hasMany<br>CursusApprenant.sanctionsAcademiques (hasMany)<br>SanctionAcademique.cursusApprenant (belongsTo) |
| `scol_sanctions_academiques` | `decidePar` | `aut_utilisateurs` | belongsTo / hasMany<br>SanctionAcademique.decideParUtilisateur (belongsTo)<br>Utilisateur.sanctionsAcademiques (hasMany) |

### stage

| Table portant la cle | Cle declaree | Table liee | Association(s) / alias |
|---|---|---|---|
| `stg_attestations_stage` | `demandeStageId` | `stg_demandes_stage` | belongsTo / hasOne<br>AttestationStage.demandeStage (belongsTo)<br>DemandeStage.attestationStage (hasOne) |
| `stg_conventions_stage` | `demandeStageId` | `stg_demandes_stage` | belongsTo / hasOne<br>ConventionStage.demandeStage (belongsTo)<br>DemandeStage.conventionStage (hasOne) |
| `stg_demandes_stage` | `apprenantId` | `aut_apprenants` | belongsTo / hasMany<br>Apprenant.demandesStage (hasMany)<br>DemandeStage.apprenant (belongsTo) |
| `stg_demandes_stage` | `entrepriseId` | `stg_entreprises` | belongsTo<br>DemandeStage.entreprise (belongsTo) |
| `stg_demandes_stage` | `offreStageId` | `stg_offres_stage` | belongsTo<br>DemandeStage.offreStage (belongsTo) |
| `stg_notes_stage` | `demandeStageId` | `stg_demandes_stage` | belongsTo / hasOne<br>DemandeStage.noteStage (hasOne)<br>NoteStage.demandeStage (belongsTo) |
| `stg_notes_stage` | `enseignantId` | `aut_enseignants` | belongsTo / hasMany<br>Enseignant.notesStage (hasMany)<br>NoteStage.enseignant (belongsTo) |
| `stg_offres_stage` | `institutionId` | `aut_institutions` | belongsTo / hasMany<br>Institution.offresStage (hasMany)<br>OffreStage.institution (belongsTo) |
| `stg_rapports_stage` | `demandeStageId` | `stg_demandes_stage` | belongsTo / hasOne<br>DemandeStage.rapportStage (hasOne)<br>RapportStage.demandeStage (belongsTo) |
| `stg_tuteurs` | `entrepriseId` | `stg_entreprises` | belongsTo / hasMany<br>Entreprise.tuteurs (hasMany)<br>Tuteur.entreprise (belongsTo) |

### stock

| Table portant la cle | Cle declaree | Table liee | Association(s) / alias |
|---|---|---|---|
| `stk_article` | `categorieId` | `stk_categorie_article` | belongsTo / hasMany<br>Article.categorie (belongsTo)<br>CategorieArticle.articles (hasMany) |
| `stk_article` | `siteId` | `imm_site` | belongsTo / hasMany<br>Article.site (belongsTo)<br>Site.articles (hasMany) |
| `stk_besoin` | `articleId` | `stk_article` | belongsTo / hasMany<br>Article.besoins (hasMany)<br>Besoin.article (belongsTo) |
| `stk_bon_commande` | `fournisseurId` | `stk_fournisseur` | belongsTo / hasMany<br>BonCommande.fournisseur (belongsTo)<br>Fournisseur.bonsCommande (hasMany) |
| `stk_bon_commande` | `siteId` | `imm_site` | belongsTo / hasMany<br>BonCommande.site (belongsTo)<br>Site.bonsCommande (hasMany) |
| `stk_correction_stock` | `articleId` | `stk_article` | belongsTo / hasMany<br>Article.correctionsStock (hasMany)<br>CorrectionStock.article (belongsTo) |
| `stk_demande_prix` | `articleId` | `stk_article` | belongsTo / hasMany<br>Article.demandesPrix (hasMany)<br>DemandePrix.article (belongsTo) |
| `stk_demande_prix` | `fournisseurId` | `stk_fournisseur` | belongsTo / hasMany<br>DemandePrix.fournisseur (belongsTo)<br>Fournisseur.demandesPrix (hasMany) |
| `stk_ligne_bon_commande` | `articleId` | `stk_article` | belongsTo<br>LigneBonCommande.article (belongsTo) |
| `stk_ligne_bon_commande` | `bonCommandeId` | `stk_bon_commande` | belongsTo / hasMany<br>BonCommande.lignesBonCommande (hasMany)<br>LigneBonCommande.bonCommande (belongsTo) |
| `stk_ligne_inventaire_stock` | `articleId` | `stk_article` | belongsTo / hasMany<br>Article.lignesInventaireStock (hasMany)<br>LigneInventaireStock.article (belongsTo) |
| `stk_ligne_inventaire_stock` | `inventaireId` | `stk_inventaire_stock` | belongsTo / hasMany<br>InventaireStock.lignes (hasMany)<br>LigneInventaireStock.inventaire (belongsTo) |
| `stk_mouvement_stock` | `articleId` | `stk_article` | belongsTo / hasMany<br>Article.mouvementsStock (hasMany)<br>MouvementStock.article (belongsTo) |
| `stk_mouvement_stock` | `fournisseurId` | `stk_fournisseur` | belongsTo / hasMany<br>Fournisseur.mouvementsStock (hasMany)<br>MouvementStock.fournisseur (belongsTo) |
| `stk_mouvement_stock` | `siteId` | `imm_site` | belongsTo / hasMany<br>MouvementStock.site (belongsTo)<br>Site.mouvementsStock (hasMany) |
| `stk_rebut` | `articleId` | `stk_article` | belongsTo / hasMany<br>Article.rebuts (hasMany)<br>Rebut.article (belongsTo) |

### Relations plusieurs-a-plusieurs

| Tables liees | Table / modele de jonction declare | Alias |
|---|---|---|
| `aut_permissions` <-> `aut_roles` | `RolePermission` | Permission.roles<br>Role.permissions |
| `aut_roles` <-> `aut_utilisateurs` | `UserRole` | Role.utilisateurs<br>Utilisateur.roles |
| `ged_documents` <-> `ged_tags` | `DocumentTag` | DocumentGed.tagList<br>Tag.documents |
| `ins_classes` <-> `ins_sessions_examens` | `SessionExamenClasse` | Classe.sessionsExamensCibles<br>SessionExamen.classesCibles |
| `ins_cours` <-> `ins_demandes_inscription` | `DemandeInscriptionCours` | Cours.demandesInscription<br>DemandeInscription.cours |
| `ins_demandes_inscription` <-> `ins_dossiers_inscription` | `DemandeInscriptionDossier` | DemandeInscription.dossiersInscription<br>DossierInscription.demandesInscription |

---

Source de generation : modeles et fichiers `models/_associations.ts` du backend. Pour confirmer l'etat reellement deploye, comparer avec les migrations et `information_schema` de la base cible.
