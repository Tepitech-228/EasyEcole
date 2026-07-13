import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AchatsModule";
import { Departement } from "../../immobilisation/models/Departement";
import { LigneBudget } from "./LigneBudget";
import { Engagement } from "./Engagement";

export class Budget extends Model<InferAttributes<Budget>, InferCreationAttributes<Budget>> {
  declare id: CreationOptional<string>
  declare departementId: ForeignKey<Departement['id'] | null>
  declare departement?: NonAttribute<Departement>
  declare periode: string
  declare montantAlloue: number
  declare montantUtilise: CreationOptional<number>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare lignesBudget?: NonAttribute<LigneBudget[]>
  declare engagements?: NonAttribute<Engagement[]>

  declare static associations: {
    departement: Association<Budget, Departement>
    lignesBudget: Association<Budget, LigneBudget>
    engagements: Association<Budget, Engagement>
  };
}

Budget.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  periode: { type: new DataTypes.STRING, allowNull: false },
  montantAlloue: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  montantUtilise: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Budget',
  tableName: MODULE_TABLE_PREFIX + 'budgets',
  timestamps: true
})
