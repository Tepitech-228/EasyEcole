import { Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../DocGenModule";
import { DocGenType } from "./DocGenType";

export class DocGenReference extends Model<InferAttributes<DocGenReference>, InferCreationAttributes<DocGenReference>> {
  declare id: CreationOptional<number>
  declare typeId: ForeignKey<DocGenType['id']>
  declare annee: number
  declare compteur: number

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

DocGenReference.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  typeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: DocGenType, key: 'id' }
  },
  annee: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  compteur: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'Reference',
  tableName: MODULE_TABLE_PREFIX + 'references',
  timestamps: true
})
