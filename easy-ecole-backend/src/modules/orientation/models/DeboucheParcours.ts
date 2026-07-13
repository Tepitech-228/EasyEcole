import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Parcours } from "./Parcours";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../OrientationModule";

export class DeboucheParcours extends Model<InferAttributes<DeboucheParcours>, InferCreationAttributes<DeboucheParcours>> {
  declare id: CreationOptional<string>
  declare titre: string
  declare description: string
  declare video: string
  declare parcoursId: ForeignKey<Parcours['id']>
  declare parcours?: NonAttribute<Parcours>
  
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

DeboucheParcours.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  titre: {
    type: new DataTypes.STRING,
    allowNull: false,
    unique: false
  },
  description: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  video: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'DeboucheParcours',
  tableName: MODULE_TABLE_PREFIX + 'debouches_parcours',
  timestamps: true
})