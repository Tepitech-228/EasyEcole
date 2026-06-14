import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Parcours } from "./Parcours";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../OrientationModule";

export class Categorie extends Model<InferAttributes<Categorie>, InferCreationAttributes<Categorie>> {
  declare id: CreationOptional<string>
  declare libelle: string
  declare description: string
  declare parcours?: NonAttribute<Parcours[]>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

Categorie.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  libelle: {
    type: new DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Categorie',
  tableName: MODULE_TABLE_PREFIX + 'categories',
  timestamps: true
})