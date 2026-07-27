import { Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey, DataTypes, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ComptabiliteModule";
import { CompteBancaire } from "./CompteBancaire";
import { LigneReleveBancaire } from "./LigneReleveBancaire";

export class ReleveBancaire extends Model<InferAttributes<ReleveBancaire>, InferCreationAttributes<ReleveBancaire>> {
  declare id: CreationOptional<number>
  declare compteBancaireId: ForeignKey<CompteBancaire['id']>
  declare dateDebut: Date
  declare dateFin: Date
  declare soldeOuverture: number
  declare soldeFermeture: number
  declare reference: CreationOptional<string | null>
  declare statut: CreationOptional<'importe' | 'verifie' | 'rapproche'>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>

  declare compteBancaire?: NonAttribute<CompteBancaire>
  declare lignes?: NonAttribute<LigneReleveBancaire[]>

  declare static associations: {
    compteBancaire: Association<ReleveBancaire, CompteBancaire>
    lignes: Association<ReleveBancaire, LigneReleveBancaire>
  }
}

ReleveBancaire.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  compteBancaireId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  dateDebut: { type: DataTypes.DATEONLY, allowNull: false },
  dateFin: { type: DataTypes.DATEONLY, allowNull: false },
  soldeOuverture: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  soldeFermeture: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  reference: { type: DataTypes.STRING(100), allowNull: true },
  statut: { type: DataTypes.ENUM('importe', 'verifie', 'rapproche'), defaultValue: 'importe' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'ReleveBancaire',
  tableName: MODULE_TABLE_PREFIX + 'releves_bancaires',
  timestamps: true
})
