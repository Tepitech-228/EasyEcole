import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ComptabiliteModule";

/**
 * Modèle JournalComptable - Journaux de saisie OHADA
 * Types: Achat, Vente, Banque, Caisse, Paie, etc.
 */
export class JournalComptable extends Model<InferAttributes<JournalComptable>, InferCreationAttributes<JournalComptable>> {
  declare id: CreationOptional<string>
  declare code: string // Ex: "ACH", "VEN", "BA", "CAI", "PAI"
  declare libelle: string // Ex: "Journal d'achat", "Journal de vente"
  declare type: 'Achat' | 'Vente' | 'Banque' | 'Caisse' | 'Paie' | 'OD' | 'Divers' // OD = Opérations Diverses
  declare description: CreationOptional<string>
  declare actif: boolean

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

JournalComptable.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  code: {
    type: new DataTypes.STRING(10),
    allowNull: false,
    unique: true
  },
  libelle: {
    type: new DataTypes.STRING(255),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('Achat', 'Vente', 'Banque', 'Caisse', 'Paie', 'OD', 'Divers'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'JournalComptable',
  tableName: MODULE_TABLE_PREFIX + 'journaux_comptables',
  timestamps: true
})
