import { Site } from "./Site";
import { Batiment } from "./Batiment";
import { Localisation } from "./Localisation";
import { Departement } from "./Departement";
import { CategorieImmobilisation } from "./CategorieImmobilisation";
import { Immobilisation } from "./Immobilisation";
import { Acquisition } from "./Acquisition";
import { Amortissement } from "./Amortissement";
import { Maintenance } from "./Maintenance";
import { MaintenanceProgrammee } from "./MaintenanceProgrammee";
import { Cession } from "./Cession";
import { Assurance } from "./Assurance";
import { Affectation } from "./Affectation";
import { SortieProvisoire } from "./SortieProvisoire";
import { Inventaire } from "./Inventaire";
import { LigneInventaire } from "./LigneInventaire";
import { RebutImmobilisation } from "./RebutImmobilisation";

Batiment.belongsTo(Site, { foreignKey: 'siteId', as: 'site' })
Site.hasMany(Batiment, { foreignKey: 'siteId', as: 'batiments' })

Localisation.belongsTo(Batiment, { foreignKey: 'batimentId', as: 'batiment' })
Batiment.hasMany(Localisation, { foreignKey: 'batimentId', as: 'localisations' })

Immobilisation.belongsTo(CategorieImmobilisation, { foreignKey: 'categorieId', as: 'categorie' })
CategorieImmobilisation.hasMany(Immobilisation, { foreignKey: 'categorieId', as: 'immobilisations' })

Immobilisation.belongsTo(Localisation, { foreignKey: 'localisationId', as: 'localisation' })

Immobilisation.belongsTo(Departement, { foreignKey: 'departementId', as: 'departement' })
Departement.hasMany(Immobilisation, { foreignKey: 'departementId', as: 'immobilisations' })

Immobilisation.belongsTo(Site, { foreignKey: 'siteId', as: 'site' })
Site.hasMany(Immobilisation, { foreignKey: 'siteId', as: 'immobilisations' })

Acquisition.belongsTo(Immobilisation, { foreignKey: 'immobilisationId', as: 'immobilisation' })
Immobilisation.hasOne(Acquisition, { foreignKey: 'immobilisationId', as: 'acquisition' })

Amortissement.belongsTo(Immobilisation, { foreignKey: 'immobilisationId', as: 'immobilisation' })
Immobilisation.hasMany(Amortissement, { foreignKey: 'immobilisationId', as: 'amortissements' })

Maintenance.belongsTo(Immobilisation, { foreignKey: 'immobilisationId', as: 'immobilisation' })
Immobilisation.hasMany(Maintenance, { foreignKey: 'immobilisationId', as: 'maintenances' })

MaintenanceProgrammee.belongsTo(Immobilisation, { foreignKey: 'immobilisationId', as: 'immobilisation' })
Immobilisation.hasMany(MaintenanceProgrammee, { foreignKey: 'immobilisationId', as: 'maintenancesProgrammees' })

Cession.belongsTo(Immobilisation, { foreignKey: 'immobilisationId', as: 'immobilisation' })
Immobilisation.hasOne(Cession, { foreignKey: 'immobilisationId', as: 'cession' })

Assurance.belongsTo(Immobilisation, { foreignKey: 'immobilisationId', as: 'immobilisation' })
Immobilisation.hasOne(Assurance, { foreignKey: 'immobilisationId', as: 'assurance' })

Affectation.belongsTo(Immobilisation, { foreignKey: 'immobilisationId', as: 'immobilisation' })
Immobilisation.hasMany(Affectation, { foreignKey: 'immobilisationId', as: 'affectations' })
Affectation.belongsTo(Site, { foreignKey: 'siteId', as: 'site' })
Affectation.belongsTo(Departement, { foreignKey: 'departementId', as: 'departement' })
Affectation.belongsTo(Localisation, { foreignKey: 'localisationId', as: 'localisation' })

SortieProvisoire.belongsTo(Immobilisation, { foreignKey: 'immobilisationId', as: 'immobilisation' })
Immobilisation.hasMany(SortieProvisoire, { foreignKey: 'immobilisationId', as: 'sortiesProvisoires' })

Inventaire.hasMany(LigneInventaire, { foreignKey: 'inventaireId', as: 'lignes' })
LigneInventaire.belongsTo(Inventaire, { foreignKey: 'inventaireId', as: 'inventaire' })
LigneInventaire.belongsTo(Immobilisation, { foreignKey: 'immobilisationId', as: 'immobilisation' })
Immobilisation.hasMany(LigneInventaire, { foreignKey: 'immobilisationId', as: 'lignesInventaire' })

RebutImmobilisation.belongsTo(Immobilisation, { foreignKey: 'immobilisationId', as: 'immobilisation' })
Immobilisation.hasMany(RebutImmobilisation, { foreignKey: 'immobilisationId', as: 'rebutsImmobilisation' })
