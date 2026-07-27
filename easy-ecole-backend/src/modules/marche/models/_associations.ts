import { PlanificationMarche } from "./PlanificationMarche";
import { ManifestationInteret } from "./ManifestationInteret";
import { AppelOffre } from "./AppelOffre";
import { ContratMarche } from "./ContratMarche";
import { AvenantMarche } from "./AvenantMarche";

PlanificationMarche.hasMany(ManifestationInteret, { foreignKey: 'planificationMarcheId', as: 'manifestations' })
ManifestationInteret.belongsTo(PlanificationMarche, { as: 'planification', foreignKey: 'planificationMarcheId' })

PlanificationMarche.hasMany(AppelOffre, { foreignKey: 'planificationMarcheId', as: 'appelsOffre' })
AppelOffre.belongsTo(PlanificationMarche, { as: 'planification', foreignKey: 'planificationMarcheId' })

AppelOffre.hasMany(ContratMarche, { foreignKey: 'appelOffreId', as: 'contrats' })
ContratMarche.belongsTo(AppelOffre, { as: 'appelOffre', foreignKey: 'appelOffreId' })

ManifestationInteret.hasMany(ContratMarche, { foreignKey: 'manifestationInteretId', as: 'contrats' })
ContratMarche.belongsTo(ManifestationInteret, { as: 'manifestationInteret', foreignKey: 'manifestationInteretId' })

ContratMarche.hasMany(AvenantMarche, { foreignKey: 'contratMarcheId', as: 'avenants' })
AvenantMarche.belongsTo(ContratMarche, { as: 'contrat', foreignKey: 'contratMarcheId' })
