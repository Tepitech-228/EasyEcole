import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ReportingModule";

export class RptDocumentAcademique extends Model<InferAttributes<RptDocumentAcademique>, InferCreationAttributes<RptDocumentAcademique>> {
  declare id: CreationOptional<string>
  declare typeDocument: string | null
  declare periode: string | null
  declare nbDemandes: CreationOptional<number>
  declare nbDelivres: CreationOptional<number>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

RptDocumentAcademique.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  typeDocument: { type: new DataTypes.STRING, allowNull: true },
  periode: { type: new DataTypes.STRING, allowNull: true },
  nbDemandes: { type: DataTypes.INTEGER, defaultValue: 0 },
  nbDelivres: { type: DataTypes.INTEGER, defaultValue: 0 },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'DocumentAcademique',
  tableName: MODULE_TABLE_PREFIX + 'documents_academiques',
  timestamps: true
})
