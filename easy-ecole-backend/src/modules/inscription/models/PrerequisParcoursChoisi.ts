import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { ParcoursChoisi } from "./ParcoursChoisi";
import { PrerequisParcours } from "./PrerequisParcours";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";

export class PrerequisParcoursChoisi extends Model<InferAttributes<PrerequisParcoursChoisi>, InferCreationAttributes<PrerequisParcoursChoisi>> {
  declare id: CreationOptional<string>
  declare note: number
  declare parcoursChoisiId: ForeignKey<ParcoursChoisi['id']>
  declare parcoursChoisi?: NonAttribute<ParcoursChoisi>
  declare prerequisParcoursId: ForeignKey<PrerequisParcours['id']>
  declare prerequisParcours?: NonAttribute<PrerequisParcours>
  
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  
  declare static associations: {
    prerequisParcours: Association<PrerequisParcoursChoisi, PrerequisParcours>
  };
}

PrerequisParcoursChoisi.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  note: {
    type: DataTypes.FLOAT.UNSIGNED,
    allowNull: false
  },
  prerequisParcoursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  parcoursChoisiId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'PrerequisParcoursChoisi',
  tableName: MODULE_TABLE_PREFIX + 'prerequis_parcours_choisis',
  timestamps: true
})