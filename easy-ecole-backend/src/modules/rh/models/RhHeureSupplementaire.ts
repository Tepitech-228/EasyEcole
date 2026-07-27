import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhEmploye } from "./RhEmploye";

export class RhHeureSupplementaire extends Model<InferAttributes<RhHeureSupplementaire>, InferCreationAttributes<RhHeureSupplementaire>> {
  declare id: CreationOptional<string>
  declare employeId: ForeignKey<RhEmploye['id']>
  declare date: string
  declare nombreHeures: number
  declare tauxMajoration: CreationOptional<number>
  declare motif: CreationOptional<string>
  declare statut: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

RhHeureSupplementaire.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  employeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  nombreHeures: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  tauxMajoration: { type: DataTypes.DECIMAL(5, 2), defaultValue: 25 },
  motif: { type: DataTypes.TEXT, allowNull: true },
  statut: { type: DataTypes.ENUM('saisie', 'validee', 'payee'), defaultValue: 'saisie' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'HeureSupplementaire',
  tableName: MODULE_TABLE_PREFIX + 'heures_supplementaires',
  timestamps: true
})
