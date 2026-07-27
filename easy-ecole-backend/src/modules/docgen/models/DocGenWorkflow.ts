import { Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../DocGenModule";
import { DocGenType } from "./DocGenType";

export class DocGenWorkflow extends Model<InferAttributes<DocGenWorkflow>, InferCreationAttributes<DocGenWorkflow>> {
  declare id: CreationOptional<number>
  declare typeId: ForeignKey<DocGenType['id']>
  declare ordre: number
  declare role: string
  declare libelle: string
  declare delaiHeures: CreationOptional<number>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

DocGenWorkflow.init({
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
  ordre: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  role: {
    type: new DataTypes.STRING(30),
    allowNull: false
  },
  libelle: {
    type: new DataTypes.STRING(200),
    allowNull: false
  },
  delaiHeures: {
    type: DataTypes.INTEGER,
    defaultValue: 48
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'Workflow',
  tableName: MODULE_TABLE_PREFIX + 'workflows',
  timestamps: true
})
