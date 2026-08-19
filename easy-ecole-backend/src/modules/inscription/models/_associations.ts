import { Etablissement } from "../../etablissement/models/Etablissement";
import { Cours } from "./Cours";
import { PrerequisParcours } from "./PrerequisParcours";
import { NiveauEtude } from "./NiveauEtude";
import { Parcours } from "./Parcours";
import { ParcoursChoisi } from "./ParcoursChoisi";
import { PrerequisParcoursChoisi } from "./PrerequisParcoursChoisi";
import { DemandeInscription } from "./DemandeInscription";
import { ReponseInscription } from "./ReponseInscription";
import { MatierePrerequis } from "./MatierePrerequis";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Session } from "./Session";
import { Classe } from "./Classe";
import { DemandeInscriptionCours } from "./DemandeInscriptionCours";
import { FraisInscription } from "./FraisInscription";
import { FraisScolarite } from "./FraisScolarite";
import { PaiementInscription } from "./PaiementInscription";
import { DossierInscription } from "./DossierInscription";
import { DemandeInscriptionDossier } from "./DemandeInscriptionDossier";
import { CursusApprenant } from "./CursusApprenant";
import { AnneeAcademique } from "./AnneeAcademique";
import { SalleDeClasse } from "./SalleDeClasse";
import { Localisation } from "../../immobilisation/models/Localisation";
import { Enseignant } from "../../auth/models/Enseignant";
import { ChapitreCours } from "./ChapitreCours";
import { Ressource } from "./Ressource";
import { FichierRessource } from "./FichierRessource";
import { Seance } from "./Seance";
import { CoursParticipant } from "./CoursParticipant";
import { Presence } from "./Presence";
import { PresenceCoursParticipant } from "./PresenceCoursParticipant";
import { ListePresence } from "./ListePresence";
import { CahierDeTexte } from "./CahierDeTexte";
import { BlocCahierDeTexte } from "./BlocCahierDeTexte";
import { TypeNoteEvaluation } from "./TypeNoteEvaluation";
import { Pointage } from "./Pointage";
import { ListeNoteEvaluation } from "./ListeNoteEvaluation";
import { NoteEvaluation } from "./NoteEvaluation";
import { FraisParcours } from "./FraisParcours";
import { ReductionFrais } from "./ReductionFrais";
import { PenaliteRetard } from "./PenaliteRetard";
import { PreInscription } from "./PreInscription";
import { EtapeInscription } from "./EtapeInscription";
import { Quitus } from "./Quitus";
import { DossierEtudiant } from "./DossierEtudiant";
import { Echeance } from "./Echeance";
import { Bordereau } from "./Bordereau";
import { SemestreAcademique } from "./SemestreAcademique";
import { initBulletinAssociations } from "../../bulletins/models/_associations";

// Cours - Parcours
Parcours.hasMany(Cours, { foreignKey: 'parcoursId', as: 'cours' })
Cours.belongsTo(Parcours, { as: 'parcours', foreignKey: 'parcoursId' })

// Cours - Classe
Classe.hasMany(Cours, { foreignKey: 'classeId', as: 'cours' })
Cours.belongsTo(Classe, { as: 'classe', foreignKey: 'classeId' })

// SalleDeClasse - Classe
Classe.hasMany(SalleDeClasse, { foreignKey: 'classeId', as: 'sallesDeClasse' })
SalleDeClasse.belongsTo(Classe, { as: 'classe', foreignKey: 'classeId' })
SalleDeClasse.belongsTo(Localisation, { foreignKey: 'localisationId', as: 'localisation' })
Localisation.hasMany(SalleDeClasse, { foreignKey: 'localisationId', as: 'sallesDeClasse' })

// SalleDeClasse - Parcours
Parcours.hasMany(SalleDeClasse, { foreignKey: 'parcoursId', as: 'sallesDeClasse' })
SalleDeClasse.belongsTo(Parcours, { as: 'parcours', foreignKey: 'parcoursId' })

// SalleDeClasse - Etablissement
Etablissement.hasMany(SalleDeClasse, { foreignKey: 'etablissementId', as: 'sallesDeClasse' })
SalleDeClasse.belongsTo(Etablissement, { as: 'etablissement', foreignKey: 'etablissementId' })

// NiveauEtude - Classe
NiveauEtude.hasMany(Classe, { foreignKey: 'niveauEtudeId', as: 'classes' })
Classe.belongsTo(NiveauEtude, { as: 'niveauEtude', foreignKey: 'niveauEtudeId' })

// Parcours - Classe
Parcours.hasMany(Classe, { foreignKey: 'parcoursId', as: 'classes' })
Classe.belongsTo(Parcours, { as: 'parcours', foreignKey: 'parcoursId' })

// NiveauEtude - Parcours
NiveauEtude.hasMany(Parcours, { foreignKey: 'niveauEtudeId', as: 'parcours' })
Parcours.belongsTo(NiveauEtude, { as: 'niveauEtude', foreignKey: 'niveauEtudeId' })

// NiveauEtude - Session
NiveauEtude.hasMany(Session, { foreignKey: 'niveauEtudeId', as: 'sessions' })
Session.belongsTo(NiveauEtude, { as: 'niveauEtude', foreignKey: 'niveauEtudeId' })

// AnneeAcademique - Session
AnneeAcademique.hasMany(Session, { foreignKey: 'anneeAcademiqueId', as: 'sessions' })
Session.belongsTo(AnneeAcademique, { as: 'anneeAcademique', foreignKey: 'anneeAcademiqueId' })

// NiveauEtude - PrerequisParcours
NiveauEtude.hasMany(PrerequisParcours, { foreignKey: 'niveauEtudeId', as: 'prerequisParcours' })
PrerequisParcours.belongsTo(NiveauEtude, { as: 'niveauEtude', foreignKey: 'niveauEtudeId' })

// MatierePrerequis - PrerequisParcours
MatierePrerequis.hasMany(PrerequisParcours, { foreignKey: 'matierePrerequisId', as: 'prerequisParcours' })
PrerequisParcours.belongsTo(MatierePrerequis, { as: 'matierePrerequis', foreignKey: 'matierePrerequisId' })

// Parcours - PrerequisParcours
Parcours.hasMany(PrerequisParcours, { foreignKey: 'parcoursId', as: 'prerequisParcours' })
PrerequisParcours.belongsTo(Parcours, { as: 'parcours', foreignKey: 'parcoursId' })

// Parcours - ParcoursChoisi
Parcours.hasMany(ParcoursChoisi, { foreignKey: 'parcoursId', as: 'parcoursChoisis' })
ParcoursChoisi.belongsTo(Parcours, { as: 'parcours', foreignKey: 'parcoursId' })

// ParcoursChoisi - PrerequisParcoursChoisi
ParcoursChoisi.hasMany(PrerequisParcoursChoisi, { foreignKey: 'parcoursChoisiId', as: 'prerequisParcoursChoisis' })
PrerequisParcoursChoisi.belongsTo(ParcoursChoisi, { as: 'parcoursChoisi', foreignKey: 'parcoursChoisiId' })

// PrerequisParcours - PrerequisParcoursChoisi
// PrerequisParcours.hasMany(PrerequisParcoursChoisi, { foreignKey: 'parcoursChoisiId', as: 'prerequisParcoursChoisis' })
PrerequisParcoursChoisi.belongsTo(PrerequisParcours, { as: 'prerequisParcours', foreignKey: 'prerequisParcoursId' })

// ParcoursChoisi - DemandeInscription
DemandeInscription.hasMany(ParcoursChoisi, { foreignKey: 'demandeInscriptionId', as: 'parcoursChoisis'})
ParcoursChoisi.belongsTo(DemandeInscription, { foreignKey: 'demandeInscriptionId', as: 'parcoursChoisi' })

// DemandeInscription - ReponseInscription
ReponseInscription.belongsTo(DemandeInscription, { foreignKey: 'demandeInscriptionId', as: 'demandeInscription' })
DemandeInscription.hasOne(ReponseInscription, { foreignKey: 'demandeInscriptionId', as: 'reponseInscription' })

// DemandeInscription - PreInscription
PreInscription.belongsTo(DemandeInscription, { foreignKey: 'demandeInscriptionId', as: 'demandeInscription' })
DemandeInscription.hasOne(PreInscription, { foreignKey: 'demandeInscriptionId', as: 'preInscription' })

// PreInscription - Utilisateur (traitePar)
Utilisateur.hasMany(PreInscription, { foreignKey: 'traiteParId', as: 'preInscriptionsTraitees' })
PreInscription.belongsTo(Utilisateur, { foreignKey: 'traiteParId', as: 'traitePar' })

// DemandeInscription - Utilisateur
Utilisateur.hasMany(DemandeInscription, { foreignKey: 'utilisateurId', as: 'demandesInscription' })
DemandeInscription.belongsTo(Utilisateur, { foreignKey: 'utilisateurId', as: 'utilisateur' })

// DemandeInscription - Cours
Cours.belongsToMany(DemandeInscription, { through: DemandeInscriptionCours, as: 'demandesInscription', foreignKey: 'coursId' })
DemandeInscription.belongsToMany(Cours, { through: DemandeInscriptionCours, as: 'cours', foreignKey: 'demandeInscriptionId' })
Cours.hasMany(DemandeInscriptionCours, { foreignKey: 'coursId', as: 'coursChoisis' });
DemandeInscriptionCours.belongsTo(Cours, { foreignKey: 'coursId', as: 'cours' });
DemandeInscription.hasMany(DemandeInscriptionCours, { foreignKey: 'demandeInscriptionId', as: 'coursChoisis' });
DemandeInscriptionCours.belongsTo(DemandeInscription, { foreignKey: 'demandeInscriptionId', as: 'demandeInscription' });

// DemandeInscription - Session
Session.hasMany(DemandeInscription, { foreignKey: 'sessionId', as: 'demandesInscription' })
DemandeInscription.belongsTo(Session, { foreignKey: 'sessionId', as: 'session' })

// DemandeInscription - EtapeInscription
EtapeInscription.hasMany(DemandeInscription, { foreignKey: 'etapeInscriptionId', as: 'demandesInscriptionEtape' })
DemandeInscription.belongsTo(EtapeInscription, { foreignKey: 'etapeInscriptionId', as: 'etapeInscription' })

// ReponseInscription - Utilisateur
Utilisateur.hasMany(ReponseInscription, { foreignKey: 'utilisateurId', as: 'reponsesInscription' })
ReponseInscription.belongsTo(Utilisateur, { foreignKey: 'utilisateurId', as: 'utilisateur' })

// FraisInscription - Session
Session.hasMany(FraisInscription, { foreignKey: 'sessionId', as: 'fraisInscription' })
FraisInscription.belongsTo(Session, { foreignKey: 'sessionId', as: 'session' })

// FraisScolarite - Session (paramétrage des frais de scolarité par session, A2)
Session.hasMany(FraisScolarite, { foreignKey: 'sessionId', as: 'fraisScolarite' })
FraisScolarite.belongsTo(Session, { foreignKey: 'sessionId', as: 'session' })

// FraisParcours - Parcours
Parcours.hasMany(FraisParcours, { foreignKey: 'parcoursId', as: 'fraisParcours' })
FraisParcours.belongsTo(Parcours, { as: 'parcours', foreignKey: 'parcoursId' })

// FraisParcours - NiveauEtude
NiveauEtude.hasMany(FraisParcours, { foreignKey: 'niveauEtudeId', as: 'fraisParcours' })
FraisParcours.belongsTo(NiveauEtude, { as: 'niveauEtude', foreignKey: 'niveauEtudeId' })

// FraisParcours - AnneeAcademique
AnneeAcademique.hasMany(FraisParcours, { foreignKey: 'anneeAcademiqueId', as: 'fraisParcours' })
FraisParcours.belongsTo(AnneeAcademique, { as: 'anneeAcademique', foreignKey: 'anneeAcademiqueId' })

// ReductionFrais - FraisParcours
FraisParcours.hasMany(ReductionFrais, { foreignKey: 'fraisParcoursId', as: 'reductions' })
ReductionFrais.belongsTo(FraisParcours, { as: 'fraisParcours', foreignKey: 'fraisParcoursId' })

// PenaliteRetard - FraisParcours
FraisParcours.hasMany(PenaliteRetard, { foreignKey: 'fraisParcoursId', as: 'penalites' })
PenaliteRetard.belongsTo(FraisParcours, { as: 'fraisParcours', foreignKey: 'fraisParcoursId' })

// DossierInscription - Session
Session.hasMany(DossierInscription, { foreignKey: 'sessionId', as: 'dossiersInscription' })
DossierInscription.belongsTo(Session, { foreignKey: 'sessionId', as: 'session' })

// PaiementInscription - Utilisateur
Utilisateur.hasMany(PaiementInscription, { foreignKey: 'utilisateurId', as: 'paiementsInscription' })
PaiementInscription.belongsTo(Utilisateur, { foreignKey: 'utilisateurId', as: 'utilisateur' })

// PaiementInscription - DemandeInscription
DemandeInscription.hasMany(PaiementInscription, { sourceKey: 'matricule', foreignKey: 'matriculeInscription', as: 'paiementsInscription' })
PaiementInscription.belongsTo(DemandeInscription, { targetKey: 'matricule', foreignKey: 'matriculeInscription', as: 'demandeInscription' })

// DemandeInscription - DossierInscription
DossierInscription.belongsToMany(DemandeInscription, { through: DemandeInscriptionDossier, as: 'demandesInscription', foreignKey: 'dossierId' })
DemandeInscription.belongsToMany(DossierInscription, { through: DemandeInscriptionDossier, as: 'dossiersInscription', foreignKey: 'demandeId' })
DossierInscription.hasMany(DemandeInscriptionDossier, { foreignKey: 'dossierId', as: 'dossiersDemande' });
DemandeInscriptionDossier.belongsTo(DossierInscription, { foreignKey: 'dossierId', as: 'dossierInscription' });
DemandeInscription.hasMany(DemandeInscriptionDossier, { foreignKey: 'demandeId', as: 'dossiersDemande' });
DemandeInscriptionDossier.belongsTo(DemandeInscription, { foreignKey: 'demandeId', as: 'demandeInscription' });

// CursusApprenant - Utilisateur
Utilisateur.hasMany(CursusApprenant, { foreignKey: 'utilisateurId', as: 'cursusApprenant' })
CursusApprenant.belongsTo(Utilisateur, { foreignKey: 'utilisateurId', as: 'utilisateur' })

// CursusApprenant - Etablissement
CursusApprenant.belongsTo(Etablissement, { foreignKey: 'etablissementId', as: 'etablissement' })

// CursusApprenant - Parcours
Parcours.hasMany(CursusApprenant, { foreignKey: 'parcoursId', as: 'cursusApprenant' })
CursusApprenant.belongsTo(Parcours, { foreignKey: 'parcoursId', as: 'parcours' })

// CursusApprenant - NiveauEtude
NiveauEtude.hasMany(CursusApprenant, { foreignKey: 'niveauEtudeId', as: 'cursusApprenant' })
CursusApprenant.belongsTo(NiveauEtude, { foreignKey: 'niveauEtudeId', as: 'niveauEtude' })

// CursusApprenant - Classe
Classe.hasMany(CursusApprenant, { foreignKey: 'classeId', as: 'cursusApprenant' })
CursusApprenant.belongsTo(Classe, { foreignKey: 'classeId', as: 'classe' })

// CursusApprenant - AnneeAcademique
AnneeAcademique.hasMany(CursusApprenant, { foreignKey: 'anneeAcademiqueId', as: 'cursusApprenant' })
CursusApprenant.belongsTo(AnneeAcademique, { foreignKey: 'anneeAcademiqueId', as: 'anneeAcademique' })

// CursusApprenant - DemandeInscription
DemandeInscription.hasOne(CursusApprenant, { foreignKey: 'demandeInscriptionId', as: 'cursusApprenant' })
CursusApprenant.belongsTo(DemandeInscription, { foreignKey: 'demandeInscriptionId', as: 'demandeInscription' })

// SemestreAcademique - Parcours / AnneeAcademique
Parcours.hasMany(SemestreAcademique, { foreignKey: 'parcoursId', as: 'semestresAcademiques' })
SemestreAcademique.belongsTo(Parcours, { foreignKey: 'parcoursId', as: 'parcours' })
AnneeAcademique.hasMany(SemestreAcademique, { foreignKey: 'anneeAcademiqueId', as: 'semestresAcademiques' })
SemestreAcademique.belongsTo(AnneeAcademique, { foreignKey: 'anneeAcademiqueId', as: 'anneeAcademique' })

// CoursParticipant - Cours
Cours.hasMany(CoursParticipant, { foreignKey: 'coursId', as: 'coursParticipants' })
CoursParticipant.belongsTo(Cours, { foreignKey: 'coursId', as: 'cours' })

// CoursParticipant - Utilisateur
Utilisateur.hasMany(CoursParticipant, { foreignKey: 'utilisateurId', as: 'coursParticipants' })
CoursParticipant.belongsTo(Utilisateur, { foreignKey: 'utilisateurId', as: 'utilisateur' })

// CoursParticipant - CursusApprenant
CursusApprenant.hasMany(CoursParticipant, { foreignKey: 'cursusApprenantId', as: 'coursParticipants' })
CoursParticipant.belongsTo(CursusApprenant, { foreignKey: 'cursusApprenantId', as: 'cursusApprenant' })

// Cours - Enseignant
Enseignant.hasMany(Cours, { foreignKey: 'enseignantId', as: 'cours' })
Cours.belongsTo(Enseignant, { as: 'enseignant', foreignKey: 'enseignantId' })

// Cours - ChapitreCours
Cours.hasMany(ChapitreCours, { foreignKey: 'coursId', as: 'chapitresCours' })
ChapitreCours.belongsTo(Cours, { as: 'cours', foreignKey: 'coursId' })

// ChapitreCours - Ressource
ChapitreCours.hasMany(Ressource, { foreignKey: 'chapitreCoursId', as: 'ressources' })
Ressource.belongsTo(ChapitreCours, { as: 'chapitreCours', foreignKey: 'chapitreCoursId' })

// Ressource - FichierRessource
Ressource.hasMany(FichierRessource, { foreignKey: 'ressourceId', as: 'fichiersRessource' })
FichierRessource.belongsTo(Ressource, { as: 'ressource', foreignKey: 'ressourceId' })

// Cours - Seance
Cours.hasMany(Seance, { foreignKey: 'coursId', as: 'seances' })
Seance.belongsTo(Cours, { as: 'cours', foreignKey: 'coursId' })

// Enseignant - Seance
Enseignant.hasMany(Seance, { foreignKey: 'enseignantId', as: 'seances' })
Seance.belongsTo(Enseignant, { as: 'enseignant', foreignKey: 'enseignantId' })

// SalleDeClasse - Seance
SalleDeClasse.hasMany(Seance, { foreignKey: 'salleDeClasseId', as: 'seances' })
Seance.belongsTo(SalleDeClasse, { as: 'salleDeClasse', foreignKey: 'salleDeClasseId' })

// Cours - ListePresence
Cours.hasMany(ListePresence, { foreignKey: 'coursId', as: 'listesPresences' })
ListePresence.belongsTo(Cours, { as: 'cours', foreignKey: 'coursId' })

// Enseignant - ListePresence
Enseignant.hasMany(ListePresence, { foreignKey: 'enseignantId', as: 'listesPresences' })
ListePresence.belongsTo(Enseignant, { as: 'enseignant', foreignKey: 'enseignantId' })

// ListePresence - Presence
ListePresence.hasMany(Presence, { foreignKey: 'listePresenceId', as: 'presences' })
Presence.belongsTo(ListePresence, { as: 'listePresence', foreignKey: 'listePresenceId' })

// Presence - PresenceCoursParticipant
Presence.hasMany(PresenceCoursParticipant, { foreignKey: 'presenceId', as: 'presencesCoursParticipants' })
PresenceCoursParticipant.belongsTo(Presence, { as: 'presence', foreignKey: 'presenceId' })

// CoursParticipant - PresenceCoursParticipant
CoursParticipant.hasMany(PresenceCoursParticipant, { foreignKey: 'coursParticipantId', as: 'presencesCoursParticipants' })
PresenceCoursParticipant.belongsTo(CoursParticipant, { as: 'coursParticipant', foreignKey: 'coursParticipantId' })

// Cours - CahierDeTexte
Cours.hasMany(CahierDeTexte, { foreignKey: 'coursId', as: 'cahiersDeTexte' })
CahierDeTexte.belongsTo(Cours, { as: 'cours', foreignKey: 'coursId' })

// Enseignant - CahierDeTexte
Enseignant.hasMany(CahierDeTexte, { foreignKey: 'enseignantId', as: 'cahiersDeTexte' })
CahierDeTexte.belongsTo(Enseignant, { as: 'enseignant', foreignKey: 'enseignantId' })

// CahierDeTexte - BlocCahierDeTexte
CahierDeTexte.hasMany(BlocCahierDeTexte, { foreignKey: 'cahierDeTexteId', as: 'blocsCahierDeTexte' })
BlocCahierDeTexte.belongsTo(CahierDeTexte, { as: 'cahierDeTexte', foreignKey: 'cahierDeTexteId' })

// TypeNoteEvaluation - ListeNoteEvaluation
TypeNoteEvaluation.hasMany(ListeNoteEvaluation, { foreignKey: 'typeNoteEvaluationId', as: 'listesNotesEvaluation' })
ListeNoteEvaluation.belongsTo(TypeNoteEvaluation, { as: 'typeNoteEvaluation', foreignKey: 'typeNoteEvaluationId' })

// Cours - TypeNoteEvaluation (via ListeNoteEvaluation - already via ListeNoteEvaluation)
// Cours - ListeNoteEvaluation
Cours.hasMany(ListeNoteEvaluation, { foreignKey: 'coursId', as: 'listesNotesEvaluation' })
ListeNoteEvaluation.belongsTo(Cours, { as: 'cours', foreignKey: 'coursId' })

// ListeNoteEvaluation - NoteEvaluation
ListeNoteEvaluation.hasMany(NoteEvaluation, { foreignKey: 'listeNoteEvaluationId', as: 'notesEvaluation' })
NoteEvaluation.belongsTo(ListeNoteEvaluation, { as: 'listeNoteEvaluation', foreignKey: 'listeNoteEvaluationId' })

// AnneeAcademique - ListeNoteEvaluation
AnneeAcademique.hasMany(ListeNoteEvaluation, { foreignKey: 'anneeAcademiqueId', as: 'listesNotesEvaluation' })
ListeNoteEvaluation.belongsTo(AnneeAcademique, { as: 'anneeAcademique', foreignKey: 'anneeAcademiqueId' })

// Enseignant - ListeNoteEvaluation
Enseignant.hasMany(ListeNoteEvaluation, { foreignKey: 'enseignantId', as: 'listesNotesEvaluation' })
ListeNoteEvaluation.belongsTo(Enseignant, { as: 'enseignant', foreignKey: 'enseignantId' })

// CoursParticipant - NoteEvaluation
CoursParticipant.hasMany(NoteEvaluation, { foreignKey: 'coursParticipantId', as: 'notesEvaluation' })
NoteEvaluation.belongsTo(CoursParticipant, { as: 'coursParticipant', foreignKey: 'coursParticipantId' })

// Utilisateur - Pointage
Utilisateur.hasMany(Pointage, { foreignKey: 'utilisateurId', as: 'pointages' })
Pointage.belongsTo(Utilisateur, { as: 'utilisateur', foreignKey: 'utilisateurId' })

// Quitus - PaiementInscription
Quitus.belongsTo(PaiementInscription, { foreignKey: 'paiementInscriptionId', as: 'paiementInscription' })
PaiementInscription.hasOne(Quitus, { foreignKey: 'paiementInscriptionId', as: 'quitus' })

// DossierEtudiant - Utilisateur
Utilisateur.hasMany(DossierEtudiant, { foreignKey: 'utilisateurId', as: 'dossiersEtudiants' })
DossierEtudiant.belongsTo(Utilisateur, { foreignKey: 'utilisateurId', as: 'utilisateur' })

// DossierEtudiant - Echeance
DossierEtudiant.hasMany(Echeance, { foreignKey: 'dossierEtudiantId', as: 'echeances' })
Echeance.belongsTo(DossierEtudiant, { foreignKey: 'dossierEtudiantId', as: 'dossierEtudiant' })

// DossierEtudiant - CoursParticipant (via utilisateurId)
DossierEtudiant.hasMany(CoursParticipant, { foreignKey: 'utilisateurId', as: 'coursParticipants' })

// Bordereau - Echeance
Echeance.hasMany(Bordereau, { foreignKey: 'echeanceId', as: 'bordereaux' })
Bordereau.belongsTo(Echeance, { foreignKey: 'echeanceId', as: 'echeance' })

// Bordereau - Utilisateur (soumis par)
Utilisateur.hasMany(Bordereau, { foreignKey: 'utilisateurId', as: 'bordereaux' })
Bordereau.belongsTo(Utilisateur, { foreignKey: 'utilisateurId', as: 'utilisateur' })

// Bordereau - Utilisateur (validÃ© par)
Utilisateur.hasMany(Bordereau, { foreignKey: 'valideParId', as: 'bordereauxValides' })
Bordereau.belongsTo(Utilisateur, { foreignKey: 'valideParId', as: 'validePar' })

// Bordereau - Quitus
Bordereau.hasOne(Quitus, { foreignKey: 'bordereauId', as: 'quitus' })
Quitus.belongsTo(Bordereau, { foreignKey: 'bordereauId', as: 'bordereau' })

// ---- New LMD / Ã‰valuation AvancÃ©e Associations ----

import { Ecue } from "./Ecue";
import { Mcc } from "./Mcc";
import { RegleEvaluation } from "./RegleEvaluation";
import { SessionExamen } from "./SessionExamen";
import { Absence } from "./Absence";
import { Equivalence } from "./Equivalence";
import { Dispense } from "./Dispense";

// Mcc - Cours
Cours.hasMany(Mcc, { foreignKey: 'coursId', as: 'mccs' })
Mcc.belongsTo(Cours, { as: 'cours', foreignKey: 'coursId' })

// Ecue - Cours (ECUE appartient à une UE qui est un Cours)
Cours.hasMany(Ecue, { foreignKey: 'coursId', as: 'ecues' })
Ecue.belongsTo(Cours, { as: 'cours', foreignKey: 'coursId' })

// Mcc - Ecue
Ecue.hasMany(Mcc, { foreignKey: 'ecueId', as: 'mccs' })
Mcc.belongsTo(Ecue, { as: 'ecue', foreignKey: 'ecueId' })

// RegleEvaluation - Parcours
Parcours.hasMany(RegleEvaluation, { foreignKey: 'parcoursId', as: 'reglesEvaluation' })
RegleEvaluation.belongsTo(Parcours, { as: 'parcours', foreignKey: 'parcoursId' })

// SessionExamen - Classe
Classe.hasMany(SessionExamen, { foreignKey: 'classeId', as: 'sessionsExamen' })
SessionExamen.belongsTo(Classe, { as: 'classe', foreignKey: 'classeId' })

// SessionExamen - AnneeAcademique
AnneeAcademique.hasMany(SessionExamen, { foreignKey: 'anneeAcademiqueId', as: 'sessionsExamen' })
SessionExamen.belongsTo(AnneeAcademique, { as: 'anneeAcademique', foreignKey: 'anneeAcademiqueId' })

// Absence - NoteEvaluation
NoteEvaluation.hasOne(Absence, { foreignKey: 'noteEvaluationId', as: 'absence' })
Absence.belongsTo(NoteEvaluation, { as: 'noteEvaluation', foreignKey: 'noteEvaluationId' })

// Equivalence - CursusApprenant
CursusApprenant.hasMany(Equivalence, { foreignKey: 'cursusApprenantId', as: 'equivalences' })
Equivalence.belongsTo(CursusApprenant, { as: 'cursusApprenant', foreignKey: 'cursusApprenantId' })

// Equivalence - Cours
Cours.hasMany(Equivalence, { foreignKey: 'coursDestinationId', as: 'equivalences' })
Equivalence.belongsTo(Cours, { as: 'coursDestination', foreignKey: 'coursDestinationId' })

// Equivalence - Utilisateur (validePar)
Utilisateur.hasMany(Equivalence, { foreignKey: 'validePar', as: 'equivalencesValidees' })
Equivalence.belongsTo(Utilisateur, { as: 'valideParUtilisateur', foreignKey: 'validePar' })

// Dispense - CursusApprenant
CursusApprenant.hasMany(Dispense, { foreignKey: 'cursusApprenantId', as: 'dispenses' })
Dispense.belongsTo(CursusApprenant, { as: 'cursusApprenant', foreignKey: 'cursusApprenantId' })

// Dispense - Cours
Cours.hasMany(Dispense, { foreignKey: 'coursId', as: 'dispenses' })
Dispense.belongsTo(Cours, { as: 'cours', foreignKey: 'coursId' })

// Dispense - Utilisateur (validePar)
Utilisateur.hasMany(Dispense, { foreignKey: 'validePar', as: 'dispensesValidees' })
Dispense.belongsTo(Utilisateur, { as: 'valideParUtilisateur', foreignKey: 'validePar' })

// RattrapageInscription
import { RattrapageInscription } from "./RattrapageInscription";

CoursParticipant.hasMany(RattrapageInscription, { foreignKey: 'coursParticipantId', as: 'rattrapagesInscription' })
RattrapageInscription.belongsTo(CoursParticipant, { as: 'coursParticipant', foreignKey: 'coursParticipantId' })

Cours.hasMany(RattrapageInscription, { foreignKey: 'coursId', as: 'rattrapagesInscription' })
RattrapageInscription.belongsTo(Cours, { as: 'cours', foreignKey: 'coursId' })

SessionExamen.hasMany(RattrapageInscription, { foreignKey: 'sessionExamenId', as: 'rattrapagesInscription' })
RattrapageInscription.belongsTo(SessionExamen, { as: 'sessionExamen', foreignKey: 'sessionExamenId' })

// RattrapageInscription - Utilisateur (demandeur : étudiant ayant soumis la demande)
Utilisateur.hasMany(RattrapageInscription, { foreignKey: 'demandePar', as: 'rattrapagesDemandes' })
RattrapageInscription.belongsTo(Utilisateur, { foreignKey: 'demandePar', as: 'demandeur' })

// RattrapageInscription - Bordereau (paiementId : bordereau de paiement lié à la demande)
Bordereau.hasOne(RattrapageInscription, { foreignKey: 'paiementId', as: 'rattrapage' })
RattrapageInscription.belongsTo(Bordereau, { foreignKey: 'paiementId', as: 'bordereau' })

// ---- Rattrapage : workflow officiel (session, classes, pièces justificatives, comité) ----

import { RattrapageSession } from "./RattrapageSession";
import { RattrapageSessionClasse } from "./RattrapageSessionClasse";
import { RattrapageDocumentRequis } from "./RattrapageDocumentRequis";
import { RattrapageDocumentDepose } from "./RattrapageDocumentDepose";

// RattrapageSession - AnneeAcademique
AnneeAcademique.hasMany(RattrapageSession, { foreignKey: 'anneeAcademiqueId', as: 'rattrapagesSessions' })
RattrapageSession.belongsTo(AnneeAcademique, { as: 'anneeAcademique', foreignKey: 'anneeAcademiqueId' })

// RattrapageSession - Classes concernées (pivot RattrapageSessionClasse)
RattrapageSession.hasMany(RattrapageSessionClasse, { foreignKey: 'rattrapageSessionId', as: 'classes', onDelete: 'CASCADE' })
RattrapageSessionClasse.belongsTo(RattrapageSession, { as: 'rattrapageSession', foreignKey: 'rattrapageSessionId', onDelete: 'CASCADE' })
Classe.hasMany(RattrapageSessionClasse, { foreignKey: 'classeId', as: 'sessionsRattrapageClasses' })
RattrapageSessionClasse.belongsTo(Classe, { as: 'classe', foreignKey: 'classeId', onDelete: 'CASCADE' })

// RattrapageSession - Pièces justificatives requises
RattrapageSession.hasMany(RattrapageDocumentRequis, { foreignKey: 'rattrapageSessionId', as: 'documentsRequis', onDelete: 'CASCADE' })
RattrapageDocumentRequis.belongsTo(RattrapageSession, { as: 'rattrapageSession', foreignKey: 'rattrapageSessionId', onDelete: 'CASCADE' })

// RattrapageInscription - RattrapageSession
RattrapageSession.hasMany(RattrapageInscription, { foreignKey: 'rattrapageSessionId', as: 'inscriptions' })
RattrapageInscription.belongsTo(RattrapageSession, { as: 'rattrapageSession', foreignKey: 'rattrapageSessionId', onDelete: 'SET NULL' })

// RattrapageInscription - Bordereau (bordereauId : bordereau de paiement téléversé par l'étudiant)
Bordereau.hasMany(RattrapageInscription, { foreignKey: 'bordereauId', as: 'rattrapagesInscriptions' })
RattrapageInscription.belongsTo(Bordereau, { foreignKey: 'bordereauId', as: 'bordereauDepose', onDelete: 'SET NULL' })

// RattrapageInscription - Documents déposés
RattrapageInscription.hasMany(RattrapageDocumentDepose, { foreignKey: 'rattrapageInscriptionId', as: 'documentsDeposes', onDelete: 'CASCADE' })
RattrapageDocumentDepose.belongsTo(RattrapageInscription, { as: 'rattrapageInscription', foreignKey: 'rattrapageInscriptionId', onDelete: 'CASCADE' })

// RattrapageDocumentRequis - RattrapageDocumentDepose
RattrapageDocumentRequis.hasMany(RattrapageDocumentDepose, { foreignKey: 'documentRequisId', as: 'documentsDeposes', onDelete: 'CASCADE' })
RattrapageDocumentDepose.belongsTo(RattrapageDocumentRequis, { as: 'documentRequis', foreignKey: 'documentRequisId', onDelete: 'CASCADE' })

// SessionCorrecteur — correcteurs désignés par cours pour une session de rattrapage
import { SessionCorrecteur } from "./SessionCorrecteur";

SessionExamen.hasMany(SessionCorrecteur, { foreignKey: 'sessionExamenId', as: 'correcteurs' })
SessionCorrecteur.belongsTo(SessionExamen, { as: 'sessionExamen', foreignKey: 'sessionExamenId' })
Cours.hasMany(SessionCorrecteur, { foreignKey: 'coursId', as: 'correcteursSession' })
SessionCorrecteur.belongsTo(Cours, { as: 'cours', foreignKey: 'coursId' })
Enseignant.hasMany(SessionCorrecteur, { foreignKey: 'enseignantId', as: 'correcteursSession' })
SessionCorrecteur.belongsTo(Enseignant, { as: 'enseignant', foreignKey: 'enseignantId' })

import { PublicationNote } from "./PublicationNote";
import { DesignationMemoire } from "./DesignationMemoire";

// PublicationNote - ListeNoteEvaluation
ListeNoteEvaluation.hasMany(PublicationNote, { foreignKey: 'listeNoteEvaluationId', as: 'publicationsNotes' })
PublicationNote.belongsTo(ListeNoteEvaluation, { as: 'listeNoteEvaluation', foreignKey: 'listeNoteEvaluationId' })

// PublicationNote - Utilisateur (publiePar)
Utilisateur.hasMany(PublicationNote, { foreignKey: 'publiePar', as: 'publicationsNotes' })
PublicationNote.belongsTo(Utilisateur, { as: 'publieParUtilisateur', foreignKey: 'publiePar' })

// DesignationMemoire - CursusApprenant
CursusApprenant.hasMany(DesignationMemoire, { foreignKey: 'cursusApprenantId', as: 'designationMemoire' })
DesignationMemoire.belongsTo(CursusApprenant, { foreignKey: 'cursusApprenantId', as: 'cursusApprenant' })

// DesignationMemoire - Utilisateur (superviseur)
Utilisateur.hasMany(DesignationMemoire, { foreignKey: 'superviseurId', as: 'designationsMemoire' })
DesignationMemoire.belongsTo(Utilisateur, { as: 'superviseur', foreignKey: 'superviseurId' })

// Bulletin associations
initBulletinAssociations();
