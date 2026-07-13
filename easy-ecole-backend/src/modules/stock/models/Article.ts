import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../StockModule";
import { CategorieArticle } from "./CategorieArticle";
import { MouvementStock } from "./MouvementStock";
import { Site } from "../../immobilisation/models/Site";

export class Article extends Model<InferAttributes<Article>, InferCreationAttributes<Article>> {
  declare id: CreationOptional<string>
  declare nom: string
  declare reference: string
  declare description: CreationOptional<string>
  declare categorieId: ForeignKey<CategorieArticle['id'] | null>
  declare categorie?: NonAttribute<CategorieArticle>
  declare siteId: ForeignKey<Site['id'] | null>
  declare site?: NonAttribute<Site>
  declare stockActuel: CreationOptional<number>
  declare stockMinimum: CreationOptional<number>
  declare prixUnitaire: CreationOptional<number>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare mouvementsStock?: NonAttribute<MouvementStock[]>

  declare static associations: {
    categorie: Association<Article, CategorieArticle>
    mouvementsStock: Association<Article, MouvementStock>
    site: Association<Article, Site>
  };
}

Article.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  nom: { type: new DataTypes.STRING, allowNull: false },
  reference: { type: new DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  siteId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  stockActuel: { type: DataTypes.INTEGER, defaultValue: 0 },
  stockMinimum: { type: DataTypes.INTEGER, defaultValue: 5 },
  prixUnitaire: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Article',
  tableName: MODULE_TABLE_PREFIX + 'article',
  timestamps: true
})
