import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../GedModule";

export class Tag extends Model<InferAttributes<Tag>, InferCreationAttributes<Tag>> {
  declare id: CreationOptional<number>
  declare nom: string
  declare couleur: CreationOptional<string>
  declare description: CreationOptional<string | null>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

Tag.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  nom: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  couleur: { type: DataTypes.STRING(7), defaultValue: '#3B82F6' },
  description: { type: DataTypes.TEXT, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  tableName: MODULE_TABLE_PREFIX + 'tags',
  modelName: MODULE_MODEL_PREFIX + 'Tag',
  timestamps: true,
});

export default Tag;
