import { Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../DocGenModule";
import { DocGenType } from "./DocGenType";

export class DocGenTemplate extends Model<InferAttributes<DocGenTemplate>, InferCreationAttributes<DocGenTemplate>> {
  declare id: CreationOptional<number>
  declare typeId: ForeignKey<DocGenType['id']>
  declare libelle: string
  declare contenu: string
  declare variables: CreationOptional<string>
  declare version: CreationOptional<number>
  declare isDefault: CreationOptional<boolean>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

DocGenTemplate.init({
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
  libelle: {
    type: new DataTypes.STRING(200),
    allowNull: false
  },
  contenu: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  variables: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'Template',
  tableName: MODULE_TABLE_PREFIX + 'templates',
  timestamps: true
})
