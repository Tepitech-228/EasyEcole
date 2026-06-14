import { AdresseApprenant } from "./AdresseApprenant";
import { AdresseCaissierBanque } from "./AdresseCaissierBanque";
import { AdresseEnseignant } from "./AdresseEnseignant";
import { AdresseInstitution } from "./AdresseInstitution";
import { Apprenant } from "./Apprenant";
import { Banque } from "./Banque";
import { CaissierBanque } from "./CaissierBanque";
import { Enseignant } from "./Enseignant";
import { IdentiteApprenant } from "./IdentiteApprenant";
import { InformationsParentsApprenant } from "./InformationsParentsApprenant";
import { InformationsSalarieApprenant } from "./InformationsSalarieApprenant";
import { Institution } from "./Institution";
import { PersonnePrevenirApprenant } from "./PersonnePrevenirApprenant";
import { Utilisateur } from "./Utilisateur";

// Utilisateur - Apprenant
Apprenant.belongsTo(Utilisateur, { as: 'utilisateur', foreignKey: 'utilisateurId' })
Utilisateur.hasOne(Apprenant, { as: 'apprenant', foreignKey: 'utilisateurId' })

// Apprenant - AdresseApprenant
AdresseApprenant.belongsTo(Apprenant, { as: 'apprenant', foreignKey: 'apprenantId' })
Apprenant.hasOne(AdresseApprenant, { as: 'adresse', foreignKey: 'apprenantId' })

// Apprenant - IdentiteApprenant
IdentiteApprenant.belongsTo(Apprenant, { as: 'apprenant', foreignKey: 'apprenantId' })
Apprenant.hasOne(IdentiteApprenant, { as: 'identite', foreignKey: 'apprenantId' })

// Apprenant - InformationsSalarieApprenant
InformationsSalarieApprenant.belongsTo(Apprenant, { as: 'apprenant', foreignKey: 'apprenantId' })
Apprenant.hasOne(InformationsSalarieApprenant, { as: 'informationsSalarie', foreignKey: 'apprenantId' })

// Apprenant - InformationsParentsApprenant
InformationsParentsApprenant.belongsTo(Apprenant, { as: 'apprenant', foreignKey: 'apprenantId' })
Apprenant.hasOne(InformationsParentsApprenant, { as: 'informationsParents', foreignKey: 'apprenantId' })

// Apprenant - PersonnePrevenirApprenant
PersonnePrevenirApprenant.belongsTo(Apprenant, { as: 'apprenant', foreignKey: 'apprenantId' })
Apprenant.hasOne(PersonnePrevenirApprenant, { as: 'personnePrevenir', foreignKey: 'apprenantId' })

// Utilisateur - Institution
Institution.belongsTo(Utilisateur, { as: 'utilisateur', foreignKey: 'utilisateurId' })
Utilisateur.hasOne(Institution, { as: 'institution', foreignKey: 'utilisateurId' })

// Institution - AdresseInstitution
AdresseInstitution.belongsTo(Institution, { as: 'institution', foreignKey: 'institutionId' })
Institution.hasOne(AdresseInstitution, { as: 'adresse', foreignKey: 'institutionId' })

// Utilisateur - CaissierBanque
CaissierBanque.belongsTo(Utilisateur, { as: 'utilisateur', foreignKey: 'utilisateurId' })
Utilisateur.hasOne(CaissierBanque, { as: 'caissierBanque', foreignKey: 'utilisateurId' })

// Banque - CaissierBanque
CaissierBanque.belongsTo(Banque, { as: 'banque', foreignKey: 'banqueId' })
Banque.hasMany(CaissierBanque, { as: 'caissiers', foreignKey: 'banqueId' })

// CaissierBanque - AdresseCaissierBanque
AdresseCaissierBanque.belongsTo(CaissierBanque, { as: 'caissierBanque', foreignKey: 'caissierBanqueId' })
CaissierBanque.hasOne(AdresseCaissierBanque, { as: 'adresse', foreignKey: 'caissierBanqueId' })

// Utilisateur - Enseignant
Enseignant.belongsTo(Utilisateur, { as: 'utilisateur', foreignKey: 'utilisateurId' })
Utilisateur.hasOne(Enseignant, { as: 'enseignant', foreignKey: 'utilisateurId' })

// Enseignant - AdresseEnseignant
AdresseEnseignant.belongsTo(Enseignant, { as: 'enseignant', foreignKey: 'enseignantId' })
Enseignant.hasOne(AdresseEnseignant, { as: 'adresse', foreignKey: 'enseignantId' })