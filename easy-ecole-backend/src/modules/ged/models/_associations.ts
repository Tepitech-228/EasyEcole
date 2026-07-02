import { DocumentGed } from "./DocumentGed";
import { Utilisateur } from "../../auth/models/Utilisateur";

Utilisateur.hasMany(DocumentGed, { foreignKey: 'uploaderId', as: 'gedDocuments' });
DocumentGed.belongsTo(Utilisateur, { as: 'uploader', foreignKey: 'uploaderId' });
