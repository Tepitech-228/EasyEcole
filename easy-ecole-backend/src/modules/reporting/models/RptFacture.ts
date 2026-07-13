import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ReportingModule";

export class RptFacture extends Model<InferAttributes<RptFacture>, InferCreationAttributes<RptFacture>> {
  declare id: CreationOptional<string>
  declare mois: string | null
  declare nbFactures: CreationOptional<number>
  declare montantTotal: CreationOptional<number>
  declare statut: string | null
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

RptFacture.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  mois: { type: new DataTypes.STRING, allowNull: true },
  nbFactures: { type: DataTypes.INTEGER, defaultValue: 0 },
  montantTotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  statut: { type: new DataTypes.STRING, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'Facture',
  tableName: MODULE_TABLE_PREFIX + 'factures',
  timestamps: true
})
