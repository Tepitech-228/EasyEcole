import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ReportingModule";

export class RptAchat extends Model<InferAttributes<RptAchat>, InferCreationAttributes<RptAchat>> {
  declare id: CreationOptional<string>
  declare categorieId: number | null
  declare periode: string | null
  declare nbDemandes: CreationOptional<number>
  declare nbCommandes: CreationOptional<number>
  declare montantTotal: CreationOptional<number>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

RptAchat.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  categorieId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  periode: { type: new DataTypes.STRING, allowNull: true },
  nbDemandes: { type: DataTypes.INTEGER, defaultValue: 0 },
  nbCommandes: { type: DataTypes.INTEGER, defaultValue: 0 },
  montantTotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'Achat',
  tableName: MODULE_TABLE_PREFIX + 'achats',
  timestamps: true
})
