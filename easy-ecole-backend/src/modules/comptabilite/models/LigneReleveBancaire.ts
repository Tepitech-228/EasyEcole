import { Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey, DataTypes, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ComptabiliteModule";
import { ReleveBancaire } from "./ReleveBancaire";
import { EcritureComptable } from "./EcritureComptable";

export class LigneReleveBancaire extends Model<InferAttributes<LigneReleveBancaire>, InferCreationAttributes<LigneReleveBancaire>> {
  declare id: CreationOptional<number>
  declare releveBancaireId: ForeignKey<ReleveBancaire['id']>
  declare dateOperation: Date
  declare dateValeur: CreationOptional<Date | null>
  declare libelle: string
  declare reference: CreationOptional<string | null>
  declare montant: number
  declare type: 'debit' | 'credit'
  declare rapprochee: CreationOptional<boolean>
  declare ecritureComptableId: CreationOptional<ForeignKey<EcritureComptable['id']> | null>
  declare dateRapprochement: CreationOptional<Date | null>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>

  declare releveBancaire?: NonAttribute<ReleveBancaire>
  declare ecritureComptable?: NonAttribute<EcritureComptable>

  declare static associations: {
    releveBancaire: Association<LigneReleveBancaire, ReleveBancaire>
    ecritureComptable: Association<LigneReleveBancaire, EcritureComptable>
  }
}

LigneReleveBancaire.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  releveBancaireId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  dateOperation: { type: DataTypes.DATEONLY, allowNull: false },
  dateValeur: { type: DataTypes.DATEONLY, allowNull: true },
  libelle: { type: DataTypes.STRING(255), allowNull: false },
  reference: { type: DataTypes.STRING(100), allowNull: true },
  montant: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  type: { type: DataTypes.ENUM('debit', 'credit'), allowNull: false },
  rapprochee: { type: DataTypes.BOOLEAN, defaultValue: false },
  ecritureComptableId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  dateRapprochement: { type: DataTypes.DATEONLY, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'LigneReleveBancaire',
  tableName: MODULE_TABLE_PREFIX + 'lignes_releves_bancaires',
  timestamps: true
})
