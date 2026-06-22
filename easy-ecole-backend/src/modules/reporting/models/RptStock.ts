import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ReportingModule";

export class RptStock extends Model<InferAttributes<RptStock>, InferCreationAttributes<RptStock>> {
  declare id: CreationOptional<string>
  declare articleId: number | null
  declare stockActuel: CreationOptional<number>
  declare stockAlerte: CreationOptional<number>
  declare valeurStock: CreationOptional<number>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

RptStock.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  articleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  stockActuel: { type: DataTypes.INTEGER, defaultValue: 0 },
  stockAlerte: { type: DataTypes.INTEGER, defaultValue: 0 },
  valeurStock: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'Stock',
  tableName: MODULE_TABLE_PREFIX + 'stocks',
  timestamps: true
})
