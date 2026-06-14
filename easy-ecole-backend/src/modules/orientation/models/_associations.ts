import { Categorie } from "./Categorie";
import { PrerequisParcours } from "./PrerequisParcours";
import { NiveauEtude } from "./NiveauEtude";
import { Parcours } from "./Parcours";
import { DeboucheParcours } from "./DeboucheParcours";
import { ParcoursChoisi } from "./ParcoursChoisi";
import { PrerequisParcoursChoisi } from "./PrerequisParcoursChoisi";
import { DemandeOrientation } from "./DemandeOrientation";
import { ReponseOrientation } from "./ReponseOrientation";
import { MatierePrerequis } from "./MatierePrerequis";
import { PanierParcoursChoisi } from "./PanierParcoursChoisi";
import { Utilisateur } from "../../auth/models/Utilisateur";

// Categorie - Parcours
Categorie.hasMany(Parcours, { foreignKey: 'categorieId', as: 'parcours' })
Parcours.belongsTo(Categorie, { as: 'categorie', foreignKey: 'categorieId' })

// NiveauEtude - Parcours
NiveauEtude.hasMany(Parcours, { foreignKey: 'niveauEtudeId', as: 'parcours' })
Parcours.belongsTo(NiveauEtude, { as: 'niveauEtude', foreignKey: 'niveauEtudeId' })

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

// Parcours - DeboucheParcours
Parcours.hasMany(DeboucheParcours, { foreignKey: 'parcoursId', as: 'debouchesParcours' })
DeboucheParcours.belongsTo(Parcours, { foreignKey: 'parcoursId', as: 'parcours'})

// ParcoursChoisi - PrerequisParcoursChoisi
ParcoursChoisi.hasMany(PrerequisParcoursChoisi, { foreignKey: 'parcoursChoisiId', as: 'prerequisParcoursChoisis' })
PrerequisParcoursChoisi.belongsTo(ParcoursChoisi, { as: 'parcoursChoisi', foreignKey: 'parcoursChoisiId' })

// PrerequisParcours - PrerequisParcoursChoisi
// PrerequisParcours.hasMany(PrerequisParcoursChoisi, { foreignKey: 'parcoursChoisiId', as: 'prerequisParcoursChoisis' })
PrerequisParcoursChoisi.belongsTo(PrerequisParcours, { as: 'prerequisParcours', foreignKey: 'prerequisParcoursId' })

// ParcoursChoisi - DemandeOrientation
DemandeOrientation.hasMany(ParcoursChoisi, { foreignKey: 'demandeOrientationId', as: 'parcoursChoisis'})
ParcoursChoisi.belongsTo(DemandeOrientation, { foreignKey: 'demandeOrientationId', as: 'parcoursChoisi' })

// DemandeOrientation - ReponseOrientation
ReponseOrientation.belongsTo(DemandeOrientation, { foreignKey: 'demandeOrientationId', as: 'demandeOrientation' })
DemandeOrientation.hasOne(ReponseOrientation, { foreignKey: 'demandeOrientationId', as: 'reponseOrientation' })

// DemandeOrientation - Utilisateur
Utilisateur.hasMany(DemandeOrientation, { foreignKey: 'utilisateurId', as: 'demandesOrientation' })
DemandeOrientation.belongsTo(Utilisateur, { foreignKey: 'utilisateurId', as: 'utilisateur' })

// ReponseOrientation - Utilisateur
Utilisateur.hasMany(ReponseOrientation, { foreignKey: 'utilisateurId', as: 'reponsesOrientation' })
ReponseOrientation.belongsTo(Utilisateur, { foreignKey: 'utilisateurId', as: 'utilisateur' })

// PanierParcoursChoisi - ParcoursChoisi
PanierParcoursChoisi.belongsTo(ParcoursChoisi, { as: 'parcoursChoisi', foreignKey: 'parcoursChoisiId' })

// PanierParcoursChoisi - Utilisateur
PanierParcoursChoisi.belongsTo(Utilisateur, { as: 'utilisateur', foreignKey: 'utilisateurId' })