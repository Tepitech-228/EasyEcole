import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../StockModule";
import { Article } from "./Article";
import { Fournisseur } from "./Fournisseur";

export class DemandePrix extends Model<InferAttributes<DemandePrix>, InferCreationAttributes<DemandePrix>> {
  declare id: CreationOptional<string>
  declare articleId: ForeignKey<Article['id']>
  declare fournisseurId: ForeignKey<Fournisseur['id']>
  declare prixPropose: number
  declare quantite: number
  declare delaiLivraison: CreationOptional<number>
  declare dateValidite: CreationOptional<string>
  declare statut: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

DemandePrix.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  articleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  fournisseurId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  prixPropose: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  quantite: { type: DataTypes.INTEGER, allowNull: false },
  delaiLivraison: { type: DataTypes.INTEGER, allowNull: true },
  dateValidite: { type: DataTypes.DATEONLY, allowNull: true },
  statut: { type: DataTypes.ENUM('en_attente', 'retenu', 'refuse'), defaultValue: 'en_attente' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'DemandePrix',
  tableName: MODULE_TABLE_PREFIX + 'demande_prix',
  timestamps: true
})
