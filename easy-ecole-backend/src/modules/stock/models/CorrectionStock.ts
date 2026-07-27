import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../StockModule";
import { Article } from "./Article";

export class CorrectionStock extends Model<InferAttributes<CorrectionStock>, InferCreationAttributes<CorrectionStock>> {
  declare id: CreationOptional<string>
  declare articleId: ForeignKey<Article['id']>
  declare quantiteAvant: number
  declare quantiteApres: number
  declare motif: string
  declare dateCorrection: string
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

CorrectionStock.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  articleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  quantiteAvant: { type: DataTypes.INTEGER, allowNull: false },
  quantiteApres: { type: DataTypes.INTEGER, allowNull: false },
  motif: { type: DataTypes.TEXT, allowNull: false },
  dateCorrection: { type: DataTypes.DATEONLY, allowNull: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'CorrectionStock',
  tableName: MODULE_TABLE_PREFIX + 'correction_stock',
  timestamps: true
})
