import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../StockModule";
import { Article } from "./Article";

export class Rebut extends Model<InferAttributes<Rebut>, InferCreationAttributes<Rebut>> {
  declare id: CreationOptional<string>
  declare articleId: ForeignKey<Article['id']>
  declare quantite: number
  declare motif: string
  declare dateRebut: string
  declare coutEstime: CreationOptional<number>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

Rebut.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  articleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  quantite: { type: DataTypes.INTEGER, allowNull: false },
  motif: { type: DataTypes.TEXT, allowNull: false },
  dateRebut: { type: DataTypes.DATEONLY, allowNull: false },
  coutEstime: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Rebut',
  tableName: MODULE_TABLE_PREFIX + 'rebut',
  timestamps: true
})
