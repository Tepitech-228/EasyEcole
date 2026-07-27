import { Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../DocGenModule";
import { DocGenDocument } from "./DocGenDocument";

export class DocGenSignature extends Model<InferAttributes<DocGenSignature>, InferCreationAttributes<DocGenSignature>> {
  declare id: CreationOptional<number>
  declare documentId: ForeignKey<DocGenDocument['id']>
  declare signataireId: number
  declare signataireType: string
  declare type: string
  declare statut: CreationOptional<string>
  declare signatureData: CreationOptional<string>
  declare commentaire: CreationOptional<string>
  declare signedAt: CreationOptional<Date>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

DocGenSignature.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  documentId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: DocGenDocument, key: 'id' }
  },
  signataireId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  signataireType: {
    type: new DataTypes.STRING(30),
    allowNull: false
  },
  type: {
    type: new DataTypes.STRING(30),
    allowNull: false
  },
  statut: {
    type: new DataTypes.STRING(20),
    defaultValue: 'en_attente'
  },
  signatureData: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  commentaire: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  signedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'Signature',
  tableName: MODULE_TABLE_PREFIX + 'signatures',
  timestamps: true
})
