import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AchatsModule";
import { Commande } from "./Commande";
import { LigneReception } from "./LigneReception";
import { LigneFacture } from "./LigneFacture";

export class LigneCommande extends Model<InferAttributes<LigneCommande>, InferCreationAttributes<LigneCommande>> {
  declare id: CreationOptional<string>
  declare commandeId: ForeignKey<Commande['id']>
  declare commande?: NonAttribute<Commande>
  declare designation: string
  declare quantite: number
  declare prixUnitaire: number
  declare total: CreationOptional<number>
  declare gereEnStock: CreationOptional<boolean>
  declare actifImmobilise: CreationOptional<boolean>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare lignesReception?: NonAttribute<LigneReception[]>
  declare lignesFacture?: NonAttribute<LigneFacture[]>

  declare static associations: {
    commande: Association<LigneCommande, Commande>
    lignesReception: Association<LigneCommande, LigneReception>
    lignesFacture: Association<LigneCommande, LigneFacture>
  };
}

LigneCommande.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  designation: { type: new DataTypes.STRING, allowNull: false },
  quantite: { type: DataTypes.INTEGER, allowNull: false },
  prixUnitaire: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  total: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  gereEnStock: { type: DataTypes.BOOLEAN, defaultValue: false },
  actifImmobilise: { type: DataTypes.BOOLEAN, defaultValue: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'LigneCommande',
  tableName: MODULE_TABLE_PREFIX + 'lignes_commande',
  timestamps: true
})
