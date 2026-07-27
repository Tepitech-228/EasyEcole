import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../GedModule";
import { Utilisateur } from "../../auth/models/Utilisateur";
import Domain from "./Domain";
import DocumentType from "./DocumentType";
import Folder from "./Folder";
import { SessionGed } from "./SessionGed";
import { ProcessusGenerateur } from "./ProcessusGenerateur";

export class DocumentGed extends Model<InferAttributes<DocumentGed>, InferCreationAttributes<DocumentGed>> {
  declare id: CreationOptional<number>

  // Legacy fields (kept for backward compatibility)
  declare titre: string
  declare reference: CreationOptional<string>
  declare eleve: CreationOptional<string>
  declare parcours: CreationOptional<string>
  declare categorie: CreationOptional<string>
  declare tags: CreationOptional<string>
  declare nommage: CreationOptional<string>
  declare type: CreationOptional<string>
  declare statut: CreationOptional<string>
  declare fichier: string
  declare taille: CreationOptional<string>
  declare dureeConservation: CreationOptional<string>
  declare archivedUntil: CreationOptional<Date>
  declare isArchived: CreationOptional<boolean>

  // v2 fields
  declare domainId: ForeignKey<Domain['id']>
  declare documentTypeId: ForeignKey<DocumentType['id']>
  declare classificationPath: CreationOptional<string>
  declare sourceType: CreationOptional<string>
  declare externalIssuer: CreationOptional<string | null>
  declare receptionDate: CreationOptional<Date>
  declare confidentialityLevel: CreationOptional<string>
  declare lifecycleStatus: CreationOptional<string>
  declare duaEndDate: CreationOptional<Date>
  declare integrityHash: CreationOptional<string>
  declare versionMajor: CreationOptional<number>
  declare versionMinor: CreationOptional<number>
  declare versionComment: CreationOptional<string>
  declare parentDocumentId: CreationOptional<number>
  declare isCurrentVersion: CreationOptional<boolean>
  declare isLocked: CreationOptional<boolean>
  declare lockedBy: CreationOptional<number | null>
  declare lockedAt: CreationOptional<Date | null>
  declare anneeAcademiqueId: CreationOptional<number>
  declare parcoursId: CreationOptional<number>
  declare niveauEtudeId: CreationOptional<number>
  declare semestre: CreationOptional<string | null>
  declare classeId: CreationOptional<number | null>
  declare salleId: CreationOptional<number | null>
  declare cursusApprenantId: CreationOptional<number | null>
  declare inscriptionDossierId: CreationOptional<number | null>
  declare bulletinId: CreationOptional<number | null>
  declare bordereauId: CreationOptional<number | null>

  // Processus générateur
  declare processusGenerateurId: ForeignKey<ProcessusGenerateur['id']> | null
  declare processusGenerateur?: NonAttribute<ProcessusGenerateur>

  // Storage & encryption
  declare storageLocation: CreationOptional<string>
  declare isEncrypted: CreationOptional<boolean>
  declare encryptionKeyId: CreationOptional<string | null>

  // Existing FKs
  declare folderId: CreationOptional<number>
  declare sessionId: CreationOptional<number>
  declare metadata: CreationOptional<object>
  declare uploaderId: ForeignKey<Utilisateur['id']>
  declare uploader?: NonAttribute<Utilisateur>

  // OCR fields
  declare nbPages: CreationOptional<number>
  declare auteur: CreationOptional<string>
  declare dateDocument: CreationOptional<Date>
  declare contenuTexte: CreationOptional<string>

  // Fields for outgoing documents (courrier sortant)
  declare destinataire: CreationOptional<string | null>
  declare dateEnvoi: CreationOptional<Date | null>
  declare modeEnvoi: CreationOptional<string | null>
  declare accuseReception: CreationOptional<boolean>
  declare numeroCourrier: CreationOptional<string | null>
  declare verificationCode: CreationOptional<string | null>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare deletedAt: CreationOptional<Date>
}

DocumentGed.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  titre: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  reference: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  eleve: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  parcours: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  categorie: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  nommage: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: new DataTypes.STRING,
    allowNull: true,
    defaultValue: 'PDF'
  },
  statut: {
    type: new DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Disponible'
  },
  fichier: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  dureeConservation: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  archivedUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  domainId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  documentTypeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  classificationPath: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  sourceType: {
    type: DataTypes.ENUM('genere_application', 'numerise_interne', 'recu_externe', 'document_sortant'),
    allowNull: false,
    defaultValue: 'numerise_interne'
  },
  externalIssuer: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  receptionDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  confidentialityLevel: {
    type: DataTypes.ENUM('public', 'interne', 'restreint', 'confidentiel'),
    allowNull: false,
    defaultValue: 'interne'
  },
  lifecycleStatus: {
    type: DataTypes.ENUM('courant', 'intermediaire', 'definitif', 'a_detruire'),
    allowNull: false,
    defaultValue: 'courant'
  },
  duaEndDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  integrityHash: {
    type: new DataTypes.STRING(64),
    allowNull: true
  },
  versionMajor: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  versionMinor: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  versionComment: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  parentDocumentId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  isCurrentVersion: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  lockedBy: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  lockedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  processusGenerateurId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'processus_generateur_id'
  },
  storageLocation: {
    type: new DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'local',
    field: 'storage_location'
  },
  isEncrypted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_encrypted'
  },
  encryptionKeyId: {
    type: new DataTypes.STRING(255),
    allowNull: true,
    field: 'encryption_key_id'
  },
  anneeAcademiqueId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  parcoursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  niveauEtudeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  semestre: {
    type: DataTypes.ENUM('semestre1', 'semestre2', 'semestre3', 'semestre4', 'semestre5', 'semestre6'),
    allowNull: true
  },
  classeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  salleId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  cursusApprenantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  inscriptionDossierId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  bulletinId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  bordereauId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  folderId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  sessionId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  metadata: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  taille: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  uploaderId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  nbPages: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  auteur: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  dateDocument: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  contenuTexte: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  destinataire: { type: new DataTypes.STRING, allowNull: true },
  dateEnvoi: { type: DataTypes.DATEONLY, allowNull: true },
  modeEnvoi: { type: DataTypes.ENUM('courrier', 'email', 'remise_main_propre', 'fax'), allowNull: true },
  accuseReception: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  numeroCourrier: { type: new DataTypes.STRING(50), allowNull: true },
  verificationCode: { type: new DataTypes.STRING(8), allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'DocumentGed',
  tableName: MODULE_TABLE_PREFIX + 'documents',
  timestamps: true
});
