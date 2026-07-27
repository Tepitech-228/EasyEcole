import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../GedModule";

class Domain extends Model<InferAttributes<Domain>, InferCreationAttributes<Domain>> {
  declare id: CreationOptional<number>
  declare code: string
  declare label: string

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare readonly deletedAt: CreationOptional<Date>
}

Domain.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  code: {
    type: new DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  label: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Domain',
  tableName: MODULE_TABLE_PREFIX + 'domains',
  timestamps: true
});

export default Domain;
