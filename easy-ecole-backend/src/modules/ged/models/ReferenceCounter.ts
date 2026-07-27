import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../GedModule";

class ReferenceCounter extends Model<InferAttributes<ReferenceCounter>, InferCreationAttributes<ReferenceCounter>> {
  declare id: CreationOptional<number>
  declare domainCode: string
  declare year: number
  declare lastSequence: CreationOptional<number>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

ReferenceCounter.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  domainCode: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  lastSequence: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: false,
  modelName: MODULE_MODEL_PREFIX + 'ReferenceCounter',
  tableName: MODULE_TABLE_PREFIX + 'reference_counters',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['domainCode', 'year']
    }
  ]
});

export default ReferenceCounter;
