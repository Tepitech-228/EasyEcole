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
