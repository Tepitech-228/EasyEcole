import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { CoursEnLigne } from "./CoursEnLigne";
import { Support } from "./Support";

export class ModuleElearning extends Model<InferAttributes<ModuleElearning>, InferCreationAttributes<ModuleElearning>> {
  declare id: CreationOptional<string>
  declare coursId: ForeignKey<CoursEnLigne['id']>
  declare titre: string
  declare description: CreationOptional<string>
  declare ordre: CreationOptional<number>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare cours?: NonAttribute<CoursEnLigne>
  declare supports?: NonAttribute<Support[]>

  declare static associations: {
    cours: Association<ModuleElearning, CoursEnLigne>
    supports: Association<ModuleElearning, Support>
  };
}

ModuleElearning.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  coursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  titre: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ordre: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Module',
  tableName: MODULE_TABLE_PREFIX + 'modules',
  timestamps: true
})
