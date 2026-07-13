import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../StockModule";
import { Fournisseur } from "./Fournisseur";
import { LigneBonCommande } from "./LigneBonCommande";
import { Site } from "../../immobilisation/models/Site";

export class BonCommande extends Model<InferAttributes<BonCommande>, InferCreationAttributes<BonCommande>> {
  declare id: CreationOptional<string>
  declare fournisseurId: ForeignKey<Fournisseur['id']>
  declare fournisseur?: NonAttribute<Fournisseur>
  declare siteId: ForeignKey<Site['id'] | null>
  declare site?: NonAttribute<Site>
  declare dateCommande: Date
  declare dateLivraisonPrevue: CreationOptional<string>
  declare statut: CreationOptional<string>
  declare montantTotal: CreationOptional<number>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare lignesBonCommande?: NonAttribute<LigneBonCommande[]>

  declare static associations: {
    fournisseur: Association<BonCommande, Fournisseur>
    lignesBonCommande: Association<BonCommande, LigneBonCommande>
    site: Association<BonCommande, Site>
  };
}

BonCommande.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  siteId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  dateCommande: { type: DataTypes.DATE, defaultValue: new Date(), allowNull: false },
  dateLivraisonPrevue: { type: DataTypes.DATEONLY, allowNull: true },
  statut: { type: DataTypes.ENUM('en_attente', 'livree', 'annulee'), defaultValue: 'en_attente' },
  montantTotal: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'BonCommande',
  tableName: MODULE_TABLE_PREFIX + 'bon_commande',
  timestamps: true
})
