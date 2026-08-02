import { Etablissement } from './Etablissement';
import { Utilisateur } from '../../auth/models/Utilisateur';
import { Cours } from '../../inscription/models/Cours';
import { Classe } from '../../inscription/models/Classe';
import { Parcours } from '../../inscription/models/Parcours';
import { Session } from '../../inscription/models/Session';
import { DemandeInscription } from '../../inscription/models/DemandeInscription';
import { CursusApprenant } from '../../inscription/models/CursusApprenant';

// Établissement hasMany associations
Etablissement.hasMany(Utilisateur, { foreignKey: 'etablissementId', as: 'utilisateurs' });
Etablissement.hasMany(Cours, { foreignKey: 'etablissementId', as: 'cours' });
Etablissement.hasMany(Classe, { foreignKey: 'etablissementId', as: 'classes' });
Etablissement.hasMany(Parcours, { foreignKey: 'etablissementId', as: 'parcours' });
Etablissement.hasMany(Session, { foreignKey: 'etablissementId', as: 'sessions' });
Etablissement.hasMany(DemandeInscription, { foreignKey: 'etablissementId', as: 'demandesInscription' });
Etablissement.hasMany(CursusApprenant, { foreignKey: 'etablissementId', as: 'cursusApprenants' });

// belongsTo associations sont déclarées dans les modèles respectifs
