import { Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../DocGenModule";
import { DocGenType } from "./DocGenType";
import { DocGenTemplate } from "./DocGenTemplate";

export class DocGenDocument extends Model<InferAttributes<DocGenDocument>, InferCreationAttributes<DocGenDocument>> {
  declare id: CreationOptional<number>
  declare typeId: ForeignKey<DocGenType['id']>
  declare templateId: ForeignKey<DocGenTemplate['id']>
  declare reference: CreationOptional<string>
  declare statut: CreationOptional<string>
  declare filePath: CreationOptional<string>
  declare hash: CreationOptional<string>
  declare metadata: CreationOptional<string>
  declare sourceType: CreationOptional<string>
  declare sourceId: CreationOptional<number>
  declare generatedById: CreationOptional<number>
  declare version: CreationOptional<number>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

DocGenDocument.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  typeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: DocGenType, key: 'id' }
  },
  templateId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: DocGenTemplate, key: 'id' }
  },
  reference: {
    type: new DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  statut: {
    type: new DataTypes.STRING(30),
    defaultValue: 'brouillon'
  },
  filePath: {
    type: new DataTypes.STRING(500),
    allowNull: true
  },
  hash: {
    type: new DataTypes.STRING(128),
    allowNull: true
  },
  metadata: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  sourceType: {
    type: new DataTypes.STRING(50),
    allowNull: true
  },
  sourceId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  generatedById: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'Document',
  tableName: MODULE_TABLE_PREFIX + 'documents',
  timestamps: true
})