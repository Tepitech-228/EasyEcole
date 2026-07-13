import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AchatsModule";
import { Budget } from "./Budget";
import { CategorieAchat } from "./CategorieAchat";

export class LigneBudget extends Model<InferAttributes<LigneBudget>, InferCreationAttributes<LigneBudget>> {
  declare id: CreationOptional<string>
  declare budgetId: ForeignKey<Budget['id']>
  declare budget?: NonAttribute<Budget>
  declare categorieAchatId: ForeignKey<CategorieAchat['id'] | null>
  declare categorieAchat?: NonAttribute<CategorieAchat>
  declare montantAlloue: number
  declare montantUtilise: CreationOptional<number>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    budget: Association<LigneBudget, Budget>
    categorieAchat: Association<LigneBudget, CategorieAchat>
  };
}

LigneBudget.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  montantAlloue: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  montantUtilise: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'LigneBudget',
  tableName: MODULE_TABLE_PREFIX + 'lignes_budget',
  timestamps: true
})
