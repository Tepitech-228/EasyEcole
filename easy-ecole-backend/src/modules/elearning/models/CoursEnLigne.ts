import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { ModuleElearning } from "./ModuleElearning";
import { Salon } from "./Salon";

export class CoursEnLigne extends Model<InferAttributes<CoursEnLigne>, InferCreationAttributes<CoursEnLigne>> {
  declare id: CreationOptional<string>
  declare coursId: CreationOptional<string>
  declare titre: string
  declare description: CreationOptional<string>
  declare image: CreationOptional<string>
  declare statut: CreationOptional<string>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare modules?: NonAttribute<ModuleElearning[]>
  declare salons?: NonAttribute<Salon[]>

  declare static associations: {
    modules: Association<CoursEnLigne, ModuleElearning>
    salons: Association<CoursEnLigne, Salon>
  };
}

CoursEnLigne.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  coursId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  titre: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  statut: {
    type: new DataTypes.STRING,
    defaultValue: 'actif'
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'CoursEnLigne',
  tableName: MODULE_TABLE_PREFIX + 'cours',
  timestamps: true
})
