import { DocumentGed } from "./DocumentGed";
import { Utilisateur } from "../../auth/models/Utilisateur";
import Folder from "./Folder";
import { SessionGed } from "./SessionGed";
import Domain from "./Domain";
import DocumentType from "./DocumentType";
import DocumentAuditLog from "./DocumentAuditLog";
import DisposalRecord from "./DisposalRecord";
import DocumentAccessGrant from "./DocumentAccessGrant";
import { ProcessusGenerateur } from "./ProcessusGenerateur";
import RolePermission from "./RolePermission";
import RegistreCourrier from "./RegistreCourrier";
import GedSignature from "./GedSignature";
import Tag from "./Tag";
import DocumentTag from "./DocumentTag";

// ── Uploader ──
Utilisateur.hasMany(DocumentGed, { foreignKey: 'uploaderId', as: 'gedDocuments' });
DocumentGed.belongsTo(Utilisateur, { as: 'uploader', foreignKey: 'uploaderId' });

// ── Folder ──
Folder.hasMany(DocumentGed, { foreignKey: 'folderId', as: 'documents' });
DocumentGed.belongsTo(Folder, { as: 'folder', foreignKey: 'folderId' });

// ── Folder parent (self-reference for tree) ──
Folder.hasMany(Folder, { foreignKey: 'parentId', as: 'children' });
Folder.belongsTo(Folder, { foreignKey: 'parentId', as: 'parent' });

// ── Folder <-> Domain ──
Domain.hasMany(Folder, { foreignKey: 'domainId', as: 'folders' });
Folder.belongsTo(Domain, { foreignKey: 'domainId', as: 'domain' });

// ── Session ──
SessionGed.hasMany(DocumentGed, { foreignKey: 'sessionId', as: 'documents' });
DocumentGed.belongsTo(SessionGed, { as: 'session', foreignKey: 'sessionId' });

// ── Folder creator ──
Utilisateur.hasMany(Folder, { foreignKey: 'createdBy', as: 'gedFolders' });
Folder.belongsTo(Utilisateur, { as: 'creator', foreignKey: 'createdBy' });

// ── Session creator ──
Utilisateur.hasMany(SessionGed, { foreignKey: 'createdBy', as: 'gedSessions' });
SessionGed.belongsTo(Utilisateur, { as: 'creator', foreignKey: 'createdBy' });

// ── Domain ──
Domain.hasMany(DocumentGed, { foreignKey: 'domainId', as: 'documents' });
DocumentGed.belongsTo(Domain, { as: 'domain', foreignKey: 'domainId' });

// ── DocumentType ──
DocumentType.hasMany(DocumentGed, { foreignKey: 'documentTypeId', as: 'documents' });
DocumentGed.belongsTo(DocumentType, { as: 'documentType', foreignKey: 'documentTypeId' });

// ── Parent document (self-reference for versioning) ──
DocumentGed.hasMany(DocumentGed, { foreignKey: 'parentDocumentId', as: 'versions' });
DocumentGed.belongsTo(DocumentGed, { foreignKey: 'parentDocumentId', as: 'parent' });

// ── Audit logs ──
DocumentGed.hasMany(DocumentAuditLog, { foreignKey: 'documentId', as: 'auditLogs' });
DocumentAuditLog.belongsTo(DocumentGed, { foreignKey: 'documentId', as: 'document' });

// ── Disposal records ──
DocumentGed.hasMany(DisposalRecord, { foreignKey: 'documentId', as: 'disposalRecords' });
DisposalRecord.belongsTo(DocumentGed, { foreignKey: 'documentId', as: 'document' });

// ── Disposal requester / confirmer ──
Utilisateur.hasMany(DisposalRecord, { foreignKey: 'requestedBy', as: 'disposalRequests' });
DisposalRecord.belongsTo(Utilisateur, { foreignKey: 'requestedBy', as: 'requester' });
Utilisateur.hasMany(DisposalRecord, { foreignKey: 'confirmedBy', as: 'disposalConfirmations' });
DisposalRecord.belongsTo(Utilisateur, { foreignKey: 'confirmedBy', as: 'confirmer' });

// ── Access grants ──
DocumentGed.hasMany(DocumentAccessGrant, { foreignKey: 'documentId', as: 'accessGrants' });
DocumentAccessGrant.belongsTo(DocumentGed, { foreignKey: 'documentId', as: 'document' });

// ── Locked by ──
Utilisateur.hasMany(DocumentGed, { foreignKey: 'lockedBy', as: 'lockedDocuments' });
DocumentGed.belongsTo(Utilisateur, { foreignKey: 'lockedBy', as: 'locker' });

// ── Processus générateur ──
ProcessusGenerateur.hasMany(DocumentGed, { foreignKey: 'processusGenerateurId', as: 'documents' });
DocumentGed.belongsTo(ProcessusGenerateur, { foreignKey: 'processusGenerateurId', as: 'processusGenerateur' });

// ── RolePermission <-> Domain ──
Domain.hasMany(RolePermission, { foreignKey: 'domainId', as: 'rolePermissions' });
RolePermission.belongsTo(Domain, { as: 'domain', foreignKey: 'domainId' });

// ── RolePermission <-> ProcessusGenerateur ──
ProcessusGenerateur.hasMany(RolePermission, { foreignKey: 'processusGenerateurId', as: 'rolePermissions' });
RolePermission.belongsTo(ProcessusGenerateur, { as: 'processusGenerateur', foreignKey: 'processusGenerateurId' });

// ── Signatures ──
DocumentGed.hasMany(GedSignature, { foreignKey: 'documentId', as: 'signatures' });
GedSignature.belongsTo(DocumentGed, { foreignKey: 'documentId', as: 'document' });
Utilisateur.hasMany(GedSignature, { foreignKey: 'requestedBy', as: 'signatureRequests' });
GedSignature.belongsTo(Utilisateur, { foreignKey: 'requestedBy', as: 'requester' });
Utilisateur.hasMany(GedSignature, { foreignKey: 'signedBy', as: 'signatureSigns' });
GedSignature.belongsTo(Utilisateur, { foreignKey: 'signedBy', as: 'signer' });
Utilisateur.hasMany(GedSignature, { foreignKey: 'rejectedBy', as: 'signatureRejects' });
GedSignature.belongsTo(Utilisateur, { foreignKey: 'rejectedBy', as: 'rejector' });

// ── Registre Courrier ──
DocumentGed.hasMany(RegistreCourrier, { foreignKey: 'documentId', as: 'registreCourriers' });
RegistreCourrier.belongsTo(DocumentGed, { foreignKey: 'documentId', as: 'document' });
Utilisateur.hasMany(RegistreCourrier, { foreignKey: 'utilisateurId', as: 'registreCourriers' });
RegistreCourrier.belongsTo(Utilisateur, { foreignKey: 'utilisateurId', as: 'utilisateur' });

// ── Tags (many-to-many) ──
DocumentGed.belongsToMany(Tag, { through: DocumentTag, foreignKey: 'documentId', otherKey: 'tagId', as: 'tagList' });
Tag.belongsToMany(DocumentGed, { through: DocumentTag, foreignKey: 'tagId', otherKey: 'documentId', as: 'documents' });
DocumentTag.belongsTo(DocumentGed, { foreignKey: 'documentId', as: 'document' });
DocumentTag.belongsTo(Tag, { foreignKey: 'tagId', as: 'tag' });
DocumentGed.hasMany(DocumentTag, { foreignKey: 'documentId', as: 'documentTags' });
Tag.hasMany(DocumentTag, { foreignKey: 'tagId', as: 'documentTags' });
