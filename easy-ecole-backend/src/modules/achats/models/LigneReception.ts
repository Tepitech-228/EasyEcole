import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AchatsModule";
import { Reception } from "./Reception";
import { LigneCommande } from "./LigneCommande";

export class LigneReception extends Model<InferAttributes<LigneReception>, InferCreationAttributes<LigneReception>> {
  declare id: CreationOptional<string>
  declare receptionId: ForeignKey<Reception['id']>
  declare reception?: NonAttribute<Reception>
  declare ligneCommandeId: ForeignKey<LigneCommande['id']>
  declare ligneCommande?: NonAttribute<LigneCommande>
  declare quantiteRecue: number
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    reception: Association<LigneReception, Reception>
    ligneCommande: Association<LigneReception, LigneCommande>
  };
}

LigneReception.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  quantiteRecue: { type: DataTypes.INTEGER, allowNull: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'LigneReception',
  tableName: MODULE_TABLE_PREFIX + 'lignes_reception',
  timestamps: true
})
