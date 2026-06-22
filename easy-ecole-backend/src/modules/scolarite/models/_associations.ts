import { DemandeDocument } from "./DemandeDocument";
import { TypeDocument } from "./TypeDocument";
import { DocumentDelivre } from "./DocumentDelivre";
import { Reclamation } from "./Reclamation";
import { ReponseReclamation } from "./ReponseReclamation";
import { Utilisateur } from "../../auth/models/Utilisateur";

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
