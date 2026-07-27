import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../StockModule";
import { InventaireStock } from "./InventaireStock";
import { Article } from "./Article";

export class LigneInventaireStock extends Model<InferAttributes<LigneInventaireStock>, InferCreationAttributes<LigneInventaireStock>> {
  declare id: CreationOptional<string>
  declare inventaireId: ForeignKey<InventaireStock['id']>
  declare articleId: ForeignKey<Article['id']>
  declare quantiteTheorique: number
  declare quantiteReelle: number
  declare ecart: number
  declare commentaire: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

LigneInventaireStock.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  inventaireId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  articleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  quantiteTheorique: { type: DataTypes.INTEGER, allowNull: false },
  quantiteReelle: { type: DataTypes.INTEGER, allowNull: false },
  ecart: { type: DataTypes.INTEGER, allowNull: false },
  commentaire: { type: DataTypes.TEXT, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'LigneInventaireStock',
  tableName: MODULE_TABLE_PREFIX + 'ligne_inventaire_stock',
  timestamps: true
})
