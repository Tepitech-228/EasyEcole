import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AchatsModule";
import { Commande } from "./Commande";
import { LigneFacture } from "./LigneFacture";

export class FactureProforma extends Model<InferAttributes<FactureProforma>, InferCreationAttributes<FactureProforma>> {
  declare id: CreationOptional<string>
  declare commandeId: ForeignKey<Commande['id']>
  declare commande?: NonAttribute<Commande>
  declare dateEmission: CreationOptional<Date>
  declare montantTotal: number
  declare statut: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare lignesFacture?: NonAttribute<LigneFacture[]>

  declare static associations: {
    commande: Association<FactureProforma, Commande>
    lignesFacture: Association<FactureProforma, LigneFacture>
  };
}

FactureProforma.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  dateEmission: { type: DataTypes.DATE, defaultValue: new Date(), allowNull: false },
  montantTotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  statut: { type: DataTypes.ENUM('emise', 'payee', 'annulee'), defaultValue: 'emise' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'FactureProforma',
  tableName: MODULE_TABLE_PREFIX + 'factures_proforma',
  timestamps: true
})
