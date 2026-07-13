import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../StockModule";
import { BonCommande } from "./BonCommande";
import { Article } from "./Article";

export class LigneBonCommande extends Model<InferAttributes<LigneBonCommande>, InferCreationAttributes<LigneBonCommande>> {
  declare id: CreationOptional<string>
  declare bonCommandeId: ForeignKey<BonCommande['id']>
  declare bonCommande?: NonAttribute<BonCommande>
  declare articleId: ForeignKey<Article['id']>
  declare article?: NonAttribute<Article>
  declare quantite: number
  declare prixUnitaire: number
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    bonCommande: Association<LigneBonCommande, BonCommande>
    article: Association<LigneBonCommande, Article>
  };
}

LigneBonCommande.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  quantite: { type: DataTypes.INTEGER, allowNull: false },
  prixUnitaire: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'LigneBonCommande',
  tableName: MODULE_TABLE_PREFIX + 'ligne_bon_commande',
  timestamps: true
})
