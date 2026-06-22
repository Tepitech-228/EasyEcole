import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../StockModule";
import { Article } from "./Article";
import { Fournisseur } from "./Fournisseur";
import { Site } from "../../immobilisation/models/Site";

export class MouvementStock extends Model<InferAttributes<MouvementStock>, InferCreationAttributes<MouvementStock>> {
  declare id: CreationOptional<string>
  declare articleId: ForeignKey<Article['id']>
  declare article?: NonAttribute<Article>
  declare type: string
  declare quantite: number
  declare motif: CreationOptional<string>
  declare fournisseurId: ForeignKey<Fournisseur['id'] | null>
  declare fournisseur?: NonAttribute<Fournisseur>
  declare siteId: ForeignKey<Site['id'] | null>
  declare site?: NonAttribute<Site>
  declare prixUnitaire: CreationOptional<number>
  declare dateMouvement: Date
  declare utilisateurId: number
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    article: Association<MouvementStock, Article>
    fournisseur: Association<MouvementStock, Fournisseur>
    site: Association<MouvementStock, Site>
  };
}

MouvementStock.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  type: { type: DataTypes.ENUM('entree', 'sortie'), allowNull: false },
  quantite: { type: DataTypes.INTEGER, allowNull: false },
  motif: { type: new DataTypes.STRING, allowNull: true },
  siteId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  prixUnitaire: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  dateMouvement: { type: DataTypes.DATE, defaultValue: new Date(), allowNull: false },
  utilisateurId: { type: DataTypes.INTEGER, allowNull: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'MouvementStock',
  tableName: MODULE_TABLE_PREFIX + 'mouvement_stock',
  timestamps: true
})
