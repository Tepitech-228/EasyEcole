import { DocumentGed } from "./DocumentGed";
import { Utilisateur } from "../../auth/models/Utilisateur";
import Folder from './Folder';
import { SessionGed } from './SessionGed';

Utilisateur.hasMany(DocumentGed, { foreignKey: 'uploaderId', as: 'gedDocuments' });
DocumentGed.belongsTo(Utilisateur, { as: 'uploader', foreignKey: 'uploaderId' });

Folder.hasMany(DocumentGed, { foreignKey: 'folderId', as: 'documents' });
DocumentGed.belongsTo(Folder, { as: 'folder', foreignKey: 'folderId' });

SessionGed.hasMany(DocumentGed, { foreignKey: 'sessionId', as: 'documents' });
DocumentGed.belongsTo(SessionGed, { as: 'session', foreignKey: 'sessionId' });

Utilisateur.hasMany(Folder, { foreignKey: 'createdBy', as: 'gedFolders' });
Folder.belongsTo(Utilisateur, { as: 'creator', foreignKey: 'createdBy' });

Utilisateur.hasMany(SessionGed, { foreignKey: 'createdBy', as: 'gedSessions' });
SessionGed.belongsTo(Utilisateur, { as: 'creator', foreignKey: 'createdBy' });
