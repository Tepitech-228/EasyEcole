import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Parcours } from "./Parcours";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../OrientationModule";

export class NiveauEtude extends Model<InferAttributes<NiveauEtude>, InferCreationAttributes<NiveauEtude>> {
  declare id: CreationOptional<string>
  declare libelle: string
  declare parcours?: NonAttribute<Parcours[]>
  
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

NiveauEtude.init({
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
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_TABLE_PREFIX + 'NiveauEtude',
  tableName:  MODULE_TABLE_PREFIX + 'niveaux_etudes',
  timestamps: true
})