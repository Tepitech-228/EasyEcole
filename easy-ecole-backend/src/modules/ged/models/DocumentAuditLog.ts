import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../GedModule";

class DocumentAuditLog extends Model<InferAttributes<DocumentAuditLog>, InferCreationAttributes<DocumentAuditLog>> {
  declare id: CreationOptional<number>
  declare documentId: number
  declare userId: number
  declare action: string
  declare actionDate: CreationOptional<Date>
  declare details: CreationOptional<string>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

DocumentAuditLog.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  documentId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  action: {
    type: DataTypes.ENUM(
      'consultation',
      'telechargement',
      'creation',
      'modification',
      'validation',
      'archivage',
      'marquage_destruction',
      'suppression_effective',
      'restauration',
      'nouvelle_version',
      'verrouillage',
      'deverrouillage',
      'verification_integrite'
    ),
    allowNull: false
  },
  actionDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: false,
  modelName: MODULE_MODEL_PREFIX + 'DocumentAuditLog',
  tableName: MODULE_TABLE_PREFIX + 'audit_logs',
  timestamps: true
});

export default DocumentAuditLog;
