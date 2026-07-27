import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../StockModule";
import { Article } from "./Article";

export class TransfertStock extends Model<InferAttributes<TransfertStock>, InferCreationAttributes<TransfertStock>> {
  declare id: CreationOptional<string>
  declare articleId: ForeignKey<Article['id']>
  declare quantite: number
  declare sourceStockId: CreationOptional<string>
  declare destinationStockId: CreationOptional<string>
  declare motif: CreationOptional<string>
  declare statut: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

TransfertStock.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  articleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  quantite: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  sourceStockId: { type: DataTypes.STRING, allowNull: true },
  destinationStockId: { type: DataTypes.STRING, allowNull: true },
  motif: { type: DataTypes.TEXT, allowNull: true },
  statut: { type: DataTypes.ENUM('valide', 'annule'), defaultValue: 'valide' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'TransfertStock',
  tableName: MODULE_TABLE_PREFIX + 'transferts',
  timestamps: true
})
