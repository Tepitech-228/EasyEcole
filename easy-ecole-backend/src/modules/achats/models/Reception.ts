import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AchatsModule";
import { Commande } from "./Commande";
import { LigneReception } from "./LigneReception";

export class Reception extends Model<InferAttributes<Reception>, InferCreationAttributes<Reception>> {
  declare id: CreationOptional<string>
  declare commandeId: ForeignKey<Commande['id']>
  declare commande?: NonAttribute<Commande>
  declare date: CreationOptional<Date>
  declare statut: string
  declare notes: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare lignesReception?: NonAttribute<LigneReception[]>

  declare static associations: {
    commande: Association<Reception, Commande>
    lignesReception: Association<Reception, LigneReception>
  };
}

Reception.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  date: { type: DataTypes.DATE, defaultValue: new Date(), allowNull: false },
  statut: { type: DataTypes.ENUM('partielle', 'totale'), allowNull: false },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Reception',
  tableName: MODULE_TABLE_PREFIX + 'receptions',
  timestamps: true
})
