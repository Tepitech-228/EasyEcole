import { DemandeDocument } from "./DemandeDocument";
import { TypeDocument } from "./TypeDocument";
import { DocumentDelivre } from "./DocumentDelivre";
import { Reclamation } from "./Reclamation";
import { ReponseReclamation } from "./ReponseReclamation";
import { ConseilClasse } from "./ConseilClasse";
import { DecisionConseil } from "./DecisionConseil";
import { SanctionDiscipline } from "./SanctionDiscipline";
import { RegistreAcademique } from "./RegistreAcademique";
import { EvenementCalendrier } from "./EvenementCalendrier";
import { Livre } from "./Livre";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";
import { Parcours } from "../../inscription/models/Parcours";
import { AnneeAcademique } from "../../inscription/models/AnneeAcademique";
import { NiveauEtude } from "../../inscription/models/NiveauEtude";
import { DecisionPassage } from "./DecisionPassage";
import { DemandeReorientation } from "./DemandeReorientation";
import { SanctionAcademique } from "./SanctionAcademique";
import { Diplome } from "./Diplome";
import { DemandeVAE } from "./DemandeVAE";
import { ProgressionPedagogique } from "./ProgressionPedagogique";
import { Classe } from "../../inscription/models/Classe";
import { Cours } from "../../inscription/models/Cours";
import { ChapitreCours } from "../../inscription/models/ChapitreCours";

ConseilClasse.hasMany(DecisionConseil, { foreignKey: 'conseilClasseId', as: 'decisions' })
DecisionConseil.belongsTo(ConseilClasse, { foreignKey: 'conseilClasseId', as: 'conseilClasse' })

TypeDocument.hasMany(DemandeDocument, { foreignKey: 'typeDocumentId', as: 'demandesDocument' })
DemandeDocument.belongsTo(TypeDocument, { foreignKey: 'typeDocumentId', as: 'typeDocument' })

Utilisateur.hasMany(DemandeDocument, { foreignKey: 'etudiantId', as: 'demandesDocument' })
DemandeDocument.belongsTo(Utilisateur, { foreignKey: 'etudiantId', as: 'etudiant' })

DemandeDocument.hasOne(DocumentDelivre, { foreignKey: 'demandeId', as: 'documentDelivre' })
DocumentDelivre.belongsTo(DemandeDocument, { foreignKey: 'demandeId', as: 'demande' })

Utilisateur.hasMany(Reclamation, { foreignKey: 'etudiantId', as: 'reclamations' })
Reclamation.belongsTo(Utilisateur, { foreignKey: 'etudiantId', as: 'etudiant' })

Reclamation.hasMany(ReponseReclamation, { foreignKey: 'reclamationId', as: 'reponsesReclamation' })
ReponseReclamation.belongsTo(Reclamation, { foreignKey: 'reclamationId', as: 'reclamation' })

Utilisateur.hasMany(ReponseReclamation, { foreignKey: 'repondeurId', as: 'reponsesReclamation' })
ReponseReclamation.belongsTo(Utilisateur, { foreignKey: 'repondeurId', as: 'repondeur' })

Utilisateur.hasMany(Livre, { foreignKey: 'uploaderId', as: 'livres' })
Livre.belongsTo(Utilisateur, { as: 'uploader', foreignKey: 'uploaderId' })

CursusApprenant.hasMany(DecisionPassage, { foreignKey: 'cursusApprenantId', as: 'decisionsPassage' })
DecisionPassage.belongsTo(CursusApprenant, { foreignKey: 'cursusApprenantId', as: 'cursusApprenant' })
AnneeAcademique.hasMany(DecisionPassage, { foreignKey: 'anneeAcademiqueId', as: 'decisionsPassage' })
DecisionPassage.belongsTo(AnneeAcademique, { foreignKey: 'anneeAcademiqueId', as: 'anneeAcademique' })
Utilisateur.hasMany(DecisionPassage, { foreignKey: 'validePar', as: 'decisionsPassage' })
DecisionPassage.belongsTo(Utilisateur, { foreignKey: 'validePar', as: 'valideParUtilisateur' })

CursusApprenant.hasMany(DemandeReorientation, { foreignKey: 'cursusApprenantId', as: 'demandesReorientation' })
DemandeReorientation.belongsTo(CursusApprenant, { foreignKey: 'cursusApprenantId', as: 'cursusApprenant' })
Parcours.hasMany(DemandeReorientation, { foreignKey: 'parcoursActuelId', as: 'demandesReorientationActuel' })
DemandeReorientation.belongsTo(Parcours, { foreignKey: 'parcoursActuelId', as: 'parcoursActuel' })
Parcours.hasMany(DemandeReorientation, { foreignKey: 'parcoursCibleId', as: 'demandesReorientationCible' })
DemandeReorientation.belongsTo(Parcours, { foreignKey: 'parcoursCibleId', as: 'parcoursCible' })
Utilisateur.hasMany(DemandeReorientation, { foreignKey: 'traitePar', as: 'demandesReorientationTraite' })
DemandeReorientation.belongsTo(Utilisateur, { foreignKey: 'traitePar', as: 'traiteParUtilisateur' })

CursusApprenant.hasMany(SanctionAcademique, { foreignKey: 'cursusApprenantId', as: 'sanctionsAcademiques' })
SanctionAcademique.belongsTo(CursusApprenant, { foreignKey: 'cursusApprenantId', as: 'cursusApprenant' })
Utilisateur.hasMany(SanctionAcademique, { foreignKey: 'decidePar', as: 'sanctionsAcademiques' })
SanctionAcademique.belongsTo(Utilisateur, { foreignKey: 'decidePar', as: 'decideParUtilisateur' })

CursusApprenant.hasMany(Diplome, { foreignKey: 'cursusApprenantId', as: 'diplomes' })
Diplome.belongsTo(CursusApprenant, { foreignKey: 'cursusApprenantId', as: 'cursusApprenant' })
Parcours.hasMany(Diplome, { foreignKey: 'parcoursId', as: 'diplomes' })
Diplome.belongsTo(Parcours, { foreignKey: 'parcoursId', as: 'parcours' })
NiveauEtude.hasMany(Diplome, { foreignKey: 'niveauEtudeId', as: 'diplomes' })
Diplome.belongsTo(NiveauEtude, { foreignKey: 'niveauEtudeId', as: 'niveauEtude' })

Utilisateur.hasMany(DemandeVAE, { foreignKey: 'utilisateurId', as: 'demandesVAE' })
DemandeVAE.belongsTo(Utilisateur, { foreignKey: 'utilisateurId', as: 'utilisateur' })
Parcours.hasMany(DemandeVAE, { foreignKey: 'parcoursCibleId', as: 'demandesVAE' })
DemandeVAE.belongsTo(Parcours, { foreignKey: 'parcoursCibleId', as: 'parcoursCible' })

Classe.hasMany(EvenementCalendrier, { foreignKey: 'classeId', as: 'evenementsCalendrier' })
EvenementCalendrier.belongsTo(Classe, { foreignKey: 'classeId', as: 'classe' })
Parcours.hasMany(EvenementCalendrier, { foreignKey: 'parcoursId', as: 'evenementsCalendrier' })
EvenementCalendrier.belongsTo(Parcours, { foreignKey: 'parcoursId', as: 'parcours' })

Cours.hasMany(ProgressionPedagogique, { foreignKey: 'coursId', as: 'progressionsPedagogiques' })
ProgressionPedagogique.belongsTo(Cours, { foreignKey: 'coursId', as: 'cours' })
ChapitreCours.hasMany(ProgressionPedagogique, { foreignKey: 'chapitreId', as: 'progressionsPedagogiques' })
ProgressionPedagogique.belongsTo(ChapitreCours, { foreignKey: 'chapitreId', as: 'chapitre' })
