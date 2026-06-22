import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ReportingModule";

export class RptBudgetVsReel extends Model<InferAttributes<RptBudgetVsReel>, InferCreationAttributes<RptBudgetVsReel>> {
  declare id: CreationOptional<string>
  declare departementId: number | null
  declare periode: string | null
  declare budgetPrevu: CreationOptional<number>
  declare budgetReel: CreationOptional<number>
  declare ecart: CreationOptional<number>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

RptBudgetVsReel.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  departementId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  periode: { type: new DataTypes.STRING, allowNull: true },
  budgetPrevu: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  budgetReel: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  ecart: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'BudgetVsReel',
  tableName: MODULE_TABLE_PREFIX + 'budget_vs_reel',
  timestamps: true
})
