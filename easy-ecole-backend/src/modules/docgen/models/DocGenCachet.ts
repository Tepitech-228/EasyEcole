import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../DocGenModule";

export class DocGenCachet extends Model<InferAttributes<DocGenCachet>, InferCreationAttributes<DocGenCachet>> {
  declare id: CreationOptional<number>
  declare libelle: string
  declare imagePath: string
  declare positionX: CreationOptional<number>
  declare positionY: CreationOptional<number>
  declare width: CreationOptional<number>
  declare height: CreationOptional<number>
  declare isActive: CreationOptional<boolean>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

DocGenCachet.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  libelle: {
    type: new DataTypes.STRING(200),
    allowNull: false
  },
  imagePath: {
    type: new DataTypes.STRING(500),
    allowNull: false
  },
  positionX: {
    type: DataTypes.FLOAT,
    defaultValue: 450
  },
  positionY: {
    type: DataTypes.FLOAT,
    defaultValue: 700
  },
  width: {
    type: DataTypes.FLOAT,
    defaultValue: 120
  },
  height: {
    type: DataTypes.FLOAT,
    defaultValue: 120
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'Cachet',
  tableName: MODULE_TABLE_PREFIX + 'cachets',
  timestamps: true
})
