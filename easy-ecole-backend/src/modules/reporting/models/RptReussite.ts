import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ReportingModule";

export class RptReussite extends Model<InferAttributes<RptReussite>, InferCreationAttributes<RptReussite>> {
  declare id: CreationOptional<string>
  declare classeId: number | null
  declare semestre: string | null
  declare annee: string | null
  declare nbAdmis: CreationOptional<number>
  declare nbEchoues: CreationOptional<number>
  declare tauxReussite: CreationOptional<number>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

RptReussite.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  classeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  semestre: { type: new DataTypes.STRING, allowNull: true },
  annee: { type: new DataTypes.STRING, allowNull: true },
  nbAdmis: { type: DataTypes.INTEGER, defaultValue: 0 },
  nbEchoues: { type: DataTypes.INTEGER, defaultValue: 0 },
  tauxReussite: { type: DataTypes.FLOAT, defaultValue: 0 },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'Reussite',
  tableName: MODULE_TABLE_PREFIX + 'reussite',
  timestamps: true
})
