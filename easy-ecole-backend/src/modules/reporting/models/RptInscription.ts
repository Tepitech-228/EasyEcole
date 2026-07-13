import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ReportingModule";

export class RptInscription extends Model<InferAttributes<RptInscription>, InferCreationAttributes<RptInscription>> {
  declare id: CreationOptional<string>
  declare sessionId: number | null
  declare date: Date | null
  declare nbInscrits: CreationOptional<number>
  declare montantTotal: CreationOptional<number>
  declare statut: string | null
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

RptInscription.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  sessionId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  date: { type: DataTypes.DATEONLY, allowNull: true },
  nbInscrits: { type: DataTypes.INTEGER, defaultValue: 0 },
  montantTotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  statut: { type: new DataTypes.STRING, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'Inscription',
  tableName: MODULE_TABLE_PREFIX + 'inscriptions',
  timestamps: true
})
