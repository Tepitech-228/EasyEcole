import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ReportingModule";

export class RptPresence extends Model<InferAttributes<RptPresence>, InferCreationAttributes<RptPresence>> {
  declare id: CreationOptional<string>
  declare coursId: number | null
  declare seanceId: number | null
  declare date: Date | null
  declare nbPresent: CreationOptional<number>
  declare nbAbsent: CreationOptional<number>
  declare taux: CreationOptional<number>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

RptPresence.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  coursId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  seanceId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  date: { type: DataTypes.DATEONLY, allowNull: true },
  nbPresent: { type: DataTypes.INTEGER, defaultValue: 0 },
  nbAbsent: { type: DataTypes.INTEGER, defaultValue: 0 },
  taux: { type: DataTypes.FLOAT, defaultValue: 0 },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'Presence',
  tableName: MODULE_TABLE_PREFIX + 'presences',
  timestamps: true
})
