import { BourseConfiguration } from "./BourseConfiguration";
import { BourseAttribution } from "./BourseAttribution";
import { DossierEtudiant } from "../../inscription/models/DossierEtudiant";
import { Utilisateur } from "../../auth/models/Utilisateur";

// ── BourseAttribution ── BourseConfiguration ──
BourseAttribution.belongsTo(BourseConfiguration, { foreignKey: 'configurationId', as: 'configuration' });
BourseConfiguration.hasMany(BourseAttribution, { foreignKey: 'configurationId', as: 'attributions' });

// ── BourseAttribution ── DossierEtudiant ──
BourseAttribution.belongsTo(DossierEtudiant, { foreignKey: 'dossierEtudiantId', as: 'dossierEtudiant' });
DossierEtudiant.hasMany(BourseAttribution, { foreignKey: 'dossierEtudiantId', as: 'bourses' });

// ── BourseAttribution ── Utilisateur (validePar) ──
BourseAttribution.belongsTo(Utilisateur, { foreignKey: 'valideParId', as: 'validePar' });
