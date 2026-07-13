import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ReportingModule";

export class RptPaie extends Model<InferAttributes<RptPaie>, InferCreationAttributes<RptPaie>> {
  declare id: CreationOptional<string>
  declare periode: string | null
  declare nbBulletins: CreationOptional<number>
  declare totalGains: CreationOptional<number>
  declare totalRetenues: CreationOptional<number>
  declare netTotal: CreationOptional<number>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

RptPaie.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  periode: { type: new DataTypes.STRING, allowNull: true },
  nbBulletins: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalGains: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  totalRetenues: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  netTotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'Paie',
  tableName: MODULE_TABLE_PREFIX + 'paie',
  timestamps: true
})
