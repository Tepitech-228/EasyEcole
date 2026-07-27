import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../GedModule";

class DocumentAccessGrant extends Model<InferAttributes<DocumentAccessGrant>, InferCreationAttributes<DocumentAccessGrant>> {
  declare id: CreationOptional<number>
  declare documentId: number
  declare userId: number
  declare grantedBy: number
  declare grantedAt: CreationOptional<Date>
  declare expiresAt: CreationOptional<Date>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare readonly deletedAt: CreationOptional<Date>
}

DocumentAccessGrant.init({
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
  grantedBy: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  grantedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'DocumentAccessGrant',
  tableName: MODULE_TABLE_PREFIX + 'document_access_grants',
  timestamps: true
});

export default DocumentAccessGrant;
