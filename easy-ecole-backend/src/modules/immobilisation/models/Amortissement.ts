import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ImmobilisationModule";
import { Immobilisation } from "./Immobilisation";

export class Amortissement extends Model<InferAttributes<Amortissement>, InferCreationAttributes<Amortissement>> {
  declare id: CreationOptional<string>
  declare immobilisationId: ForeignKey<Immobilisation['id']>
  declare annee: number
  declare montantAmorti: number
  declare valeurResiduelle: number
  declare dateCalcul: string
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

Amortissement.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  immobilisationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  annee: { type: DataTypes.INTEGER, allowNull: false },
  montantAmorti: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  valeurResiduelle: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  dateCalcul: { type: DataTypes.DATE, allowNull: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Amortissement',
  tableName: MODULE_TABLE_PREFIX + 'amortissement',
  timestamps: true
})
