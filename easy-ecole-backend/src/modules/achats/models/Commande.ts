import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AchatsModule";
import { Demande } from "./Demande";
import { Fournisseur } from "./Fournisseur";
import { LigneCommande } from "./LigneCommande";
import { Reception } from "./Reception";
import { FactureProforma } from "./FactureProforma";

export class Commande extends Model<InferAttributes<Commande>, InferCreationAttributes<Commande>> {
  declare id: CreationOptional<string>
  declare demandeId: ForeignKey<Demande['id']>
  declare demande?: NonAttribute<Demande>
  declare fournisseurId: ForeignKey<Fournisseur['id'] | null>
  declare fournisseur?: NonAttribute<Fournisseur>
  declare dateCommande: CreationOptional<Date>
  declare statut: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare lignesCommande?: NonAttribute<LigneCommande[]>
  declare receptions?: NonAttribute<Reception[]>
  declare facturesProforma?: NonAttribute<FactureProforma[]>

  declare static associations: {
    demande: Association<Commande, Demande>
    fournisseur: Association<Commande, Fournisseur>
    lignesCommande: Association<Commande, LigneCommande>
    receptions: Association<Commande, Reception>
    facturesProforma: Association<Commande, FactureProforma>
  };
}

Commande.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  dateCommande: { type: DataTypes.DATE, defaultValue: new Date(), allowNull: false },
  statut: { type: DataTypes.ENUM('en_cours', 'livree', 'annulee'), defaultValue: 'en_cours' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Commande',
  tableName: MODULE_TABLE_PREFIX + 'commandes',
  timestamps: true
})
