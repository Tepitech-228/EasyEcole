import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ReportingModule";

export class RptPaiement extends Model<InferAttributes<RptPaiement>, InferCreationAttributes<RptPaiement>> {
  declare id: CreationOptional<string>
  declare date: Date | null
  declare modePaiement: string | null
  declare montantTotal: CreationOptional<number>
  declare nbTransactions: CreationOptional<number>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

RptPaiement.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  date: { type: DataTypes.DATEONLY, allowNull: true },
  modePaiement: { type: new DataTypes.STRING, allowNull: true },
  montantTotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  nbTransactions: { type: DataTypes.INTEGER, defaultValue: 0 },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'Paiement',
  tableName: MODULE_TABLE_PREFIX + 'paiements',
  timestamps: true
})
