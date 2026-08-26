import { BourseConfiguration } from "./BourseConfiguration";
import { BourseAttribution } from "./BourseAttribution";
import { DossierEtudiant } from "../../inscription/models/DossierEtudiant";
import { NiveauEtude } from "../../inscription/models/NiveauEtude";
import { Utilisateur } from "../../auth/models/Utilisateur";

// ── BourseAttribution ── BourseConfiguration ──
BourseAttribution.belongsTo(BourseConfiguration, { foreignKey: 'configurationId', as: 'configuration' });
BourseConfiguration.hasMany(BourseAttribution, { foreignKey: 'configurationId', as: 'attributions' });

// ── BourseAttribution ── DossierEtudiant ──
BourseAttribution.belongsTo(DossierEtudiant, { foreignKey: 'dossierEtudiantId', as: 'dossierEtudiant' });
DossierEtudiant.hasMany(BourseAttribution, { foreignKey: 'dossierEtudiantId', as: 'bourses' });

// ── BourseAttribution ── NiveauEtude (traçabilité promotion) ──
BourseAttribution.belongsTo(NiveauEtude, { foreignKey: 'niveauEtudeId', as: 'niveauEtude' });

// ── BourseAttribution ── Utilisateur (validePar) ──
BourseAttribution.belongsTo(Utilisateur, { foreignKey: 'valideParId', as: 'validePar' });
