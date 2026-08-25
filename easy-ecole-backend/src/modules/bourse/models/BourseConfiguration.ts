import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../BourseModule";

/**
 * BourseConfiguration — Définition d'un type de bourse.
 *
 * Deux types principaux :
 *  - TOTAL    : prise en charge de 100 % des frais de scolarité (taux=100, non modifiable)
 *  - PARTIELLE : pourcentage configurable (0 < taux < 100)
 *
 * RÈGLE ABSOLUE : la bourse s'applique UNIQUEMENT aux frais de scolarité.
 * Les frais d'inscription ne sont JAMAIS réduits.
 */
export class BourseConfiguration extends Model<InferAttributes<BourseConfiguration>, InferCreationAttributes<BourseConfiguration>> {
  declare id: CreationOptional<number>
  declare nom: string
  declare type: 'TOTAL' | 'PARTIELLE'
  declare taux: number                // DECIMAL(5,2) — 100.00 pour TOTAL, 0<x<100 pour PARTIELLE
  declare description: CreationOptional<string | null>
  declare statut: 'ACTIVE' | 'INACTIVE'
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

BourseConfiguration.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  nom: {
    type: new DataTypes.STRING(150),
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.ENUM('TOTAL', 'PARTIELLE'),
    allowNull: false
  },
  taux: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Le taux ne peut pas être négatif' },
      max: { args: [100], msg: 'Le taux ne peut pas dépasser 100' },
      isFloatOrInt(value: number) {
        if (typeof value !== 'number' || isNaN(value)) {
          throw new Error('Le taux doit être un nombre valide');
        }
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
    defaultValue: 'ACTIVE',
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'BourseConfiguration',
  tableName: MODULE_TABLE_PREFIX + 'configurations',
  timestamps: true
})
