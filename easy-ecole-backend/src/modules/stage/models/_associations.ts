import { Entreprise } from "./Entreprise";
import { Tuteur } from "./Tuteur";
import { OffreStage } from "./OffreStage";
import { DemandeStage } from "./DemandeStage";
import { ConventionStage } from "./ConventionStage";
import { RapportStage } from "./RapportStage";
import { NoteStage } from "./NoteStage";
import { AttestationStage } from "./AttestationStage";
import { Institution as AutInstitution } from "../../auth/models/Institution";
import { Apprenant as AutApprenant } from "../../auth/models/Apprenant";
import { Enseignant as AutEnseignant } from "../../auth/models/Enseignant";

Tuteur.belongsTo(Entreprise, { as: 'entreprise', foreignKey: 'entrepriseId' })
Entreprise.hasMany(Tuteur, { as: 'tuteurs', foreignKey: 'entrepriseId' })

OffreStage.belongsTo(AutInstitution, { as: 'institution', foreignKey: 'institutionId' })
AutInstitution.hasMany(OffreStage, { as: 'offresStage', foreignKey: 'institutionId' })

DemandeStage.belongsTo(OffreStage, { as: 'offreStage', foreignKey: 'offreStageId' })
DemandeStage.belongsTo(Entreprise, { as: 'entreprise', foreignKey: 'entrepriseId' })
DemandeStage.belongsTo(AutApprenant, { as: 'apprenant', foreignKey: 'apprenantId' })
AutApprenant.hasMany(DemandeStage, { as: 'demandesStage', foreignKey: 'apprenantId' })

ConventionStage.belongsTo(DemandeStage, { as: 'demandeStage', foreignKey: 'demandeStageId' })
DemandeStage.hasOne(ConventionStage, { as: 'conventionStage', foreignKey: 'demandeStageId' })

RapportStage.belongsTo(DemandeStage, { as: 'demandeStage', foreignKey: 'demandeStageId' })
DemandeStage.hasOne(RapportStage, { as: 'rapportStage', foreignKey: 'demandeStageId' })

NoteStage.belongsTo(DemandeStage, { as: 'demandeStage', foreignKey: 'demandeStageId' })
NoteStage.belongsTo(AutEnseignant, { as: 'enseignant', foreignKey: 'enseignantId' })
AutEnseignant.hasMany(NoteStage, { as: 'notesStage', foreignKey: 'enseignantId' })
DemandeStage.hasOne(NoteStage, { as: 'noteStage', foreignKey: 'demandeStageId' })

AttestationStage.belongsTo(DemandeStage, { as: 'demandeStage', foreignKey: 'demandeStageId' })
DemandeStage.hasOne(AttestationStage, { as: 'attestationStage', foreignKey: 'demandeStageId' })
