import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AchatsModule";
import { Budget } from "./Budget";
import { Demande } from "./Demande";

export class Engagement extends Model<InferAttributes<Engagement>, InferCreationAttributes<Engagement>> {
  declare id: CreationOptional<string>
  declare budgetId: ForeignKey<Budget['id']>
  declare budget?: NonAttribute<Budget>
  declare demandeId: ForeignKey<Demande['id']>
  declare demande?: NonAttribute<Demande>
  declare montant: number
  declare date: CreationOptional<Date>
  declare statut: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    budget: Association<Engagement, Budget>
    demande: Association<Engagement, Demande>
  };
}

Engagement.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  montant: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  date: { type: DataTypes.DATE, defaultValue: new Date(), allowNull: false },
  statut: { type: DataTypes.ENUM('actif', 'liberee'), defaultValue: 'actif' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Engagement',
  tableName: MODULE_TABLE_PREFIX + 'engagements',
  timestamps: true
})
