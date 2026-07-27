import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../StockModule";
import { Article } from "./Article";

export class Besoin extends Model<InferAttributes<Besoin>, InferCreationAttributes<Besoin>> {
  declare id: CreationOptional<string>
  declare articleId: ForeignKey<Article['id']>
  declare quantiteRequise: number
  declare quantiteApprouvee: CreationOptional<number>
  declare urgence: CreationOptional<string>
  declare motif: CreationOptional<string>
  declare statut: CreationOptional<string>
  declare dateBesoin: string
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

Besoin.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  articleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  quantiteRequise: { type: DataTypes.INTEGER, allowNull: false },
  quantiteApprouvee: { type: DataTypes.INTEGER, allowNull: true },
  urgence: { type: DataTypes.ENUM('basse', 'moyenne', 'haute', 'critique'), defaultValue: 'moyenne' },
  motif: { type: DataTypes.TEXT, allowNull: true },
  statut: { type: DataTypes.ENUM('soumis', 'approuve', 'refuse'), defaultValue: 'soumis' },
  dateBesoin: { type: DataTypes.DATEONLY, allowNull: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Besoin',
  tableName: MODULE_TABLE_PREFIX + 'besoin',
  timestamps: true
})
