import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../QualiteModule";
import { QuaActionCorrective } from "./QuaActionCorrective";

export class QuaNonConformite extends Model<InferAttributes<QuaNonConformite>, InferCreationAttributes<QuaNonConformite>> {
  declare id: CreationOptional<number>
  declare type: 'critique' | 'majeure' | 'mineure'
  declare source: string
  declare processus: string
  declare description: string
  declare cause: CreationOptional<string | null>
  declare statut: CreationOptional<'ouverte' | 'en_cours' | 'traitee' | 'fermee'>
  declare priorite: CreationOptional<'haute' | 'moyenne' | 'basse'>
  declare declareePar: number
  declare declareeLe: CreationOptional<Date>
  declare clotureeLe: CreationOptional<Date | null>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>

  declare actionsCorrectives?: NonAttribute<QuaActionCorrective[]>

  declare static associations: {
    actionsCorrectives: Association<QuaNonConformite, QuaActionCorrective>
  }
}

QuaNonConformite.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  type: { type: DataTypes.ENUM('critique', 'majeure', 'mineure'), allowNull: false },
  source: { type: DataTypes.STRING(100), allowNull: false },
  processus: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  cause: { type: DataTypes.TEXT, allowNull: true },
  statut: { type: DataTypes.ENUM('ouverte', 'en_cours', 'traitee', 'fermee'), defaultValue: 'ouverte' },
  priorite: { type: DataTypes.ENUM('haute', 'moyenne', 'basse'), defaultValue: 'moyenne' },
  declareePar: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  declareeLe: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  clotureeLe: { type: DataTypes.DATEONLY, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'NonConformite',
  tableName: MODULE_TABLE_PREFIX + 'non_conformites',
  timestamps: true
})
