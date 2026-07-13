import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AchatsModule";
import { FactureProforma } from "./FactureProforma";
import { LigneCommande } from "./LigneCommande";

export class LigneFacture extends Model<InferAttributes<LigneFacture>, InferCreationAttributes<LigneFacture>> {
  declare id: CreationOptional<string>
  declare factureId: ForeignKey<FactureProforma['id']>
  declare facture?: NonAttribute<FactureProforma>
  declare ligneCommandeId: ForeignKey<LigneCommande['id']>
  declare ligneCommande?: NonAttribute<LigneCommande>
  declare designation: string
  declare quantite: number
  declare prixUnitaire: number
  declare total: number
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    facture: Association<LigneFacture, FactureProforma>
    ligneCommande: Association<LigneFacture, LigneCommande>
  };
}

LigneFacture.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  designation: { type: new DataTypes.STRING, allowNull: false },
  quantite: { type: DataTypes.INTEGER, allowNull: false },
  prixUnitaire: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'LigneFacture',
  tableName: MODULE_TABLE_PREFIX + 'lignes_facture',
  timestamps: true
})
