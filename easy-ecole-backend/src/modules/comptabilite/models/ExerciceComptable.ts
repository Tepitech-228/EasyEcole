import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ComptabiliteModule";
import { EcritureComptable } from "./EcritureComptable";

/**
 * Modèle ExerciceComptable - Exercices comptables
 * Table: cpt_exercices
 */
export class ExerciceComptable extends Model<InferAttributes<ExerciceComptable>, InferCreationAttributes<ExerciceComptable>> {
  declare id: CreationOptional<number>
  declare code: string // Ex: "2025", "2025-2026"
  declare libelle: string // Ex: "Exercice 2025"
  declare dateDebut: string // DATEONLY
  declare dateFin: string // DATEONLY
  declare statut: 'Ouvert' | 'En cours de clôture' | 'Clôturé'
  declare dateCloture: CreationOptional<string | null> // DATEONLY
  declare resultatNet: CreationOptional<number | null>
  declare actif: boolean

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  // Associations
  declare ecritures?: NonAttribute<EcritureComptable[]>
}

ExerciceComptable.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  code: {
    type: new DataTypes.STRING(9),
    allowNull: false,
    unique: true
  },
  libelle: {
    type: new DataTypes.STRING(255),
    allowNull: false
  },
  dateDebut: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dateFin: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  statut: {
    type: DataTypes.ENUM('Ouvert', 'En cours de clôture', 'Clôturé'),
    defaultValue: 'Ouvert',
    allowNull: false
  },
  dateCloture: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  resultatNet: {
    type: DataTypes.FLOAT,
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
  modelName: MODULE_MODEL_PREFIX + 'ExerciceComptable',
  tableName: MODULE_TABLE_PREFIX + 'exercices',
  timestamps: true
})
