import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ReportingModule";

export class RptImmobilisation extends Model<InferAttributes<RptImmobilisation>, InferCreationAttributes<RptImmobilisation>> {
  declare id: CreationOptional<string>
  declare categorieId: number | null
  declare nbActifs: CreationOptional<number>
  declare valeurAcquisition: CreationOptional<number>
  declare amortissementTotal: CreationOptional<number>
  declare valeurNet: CreationOptional<number>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

RptImmobilisation.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  categorieId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  nbActifs: { type: DataTypes.INTEGER, defaultValue: 0 },
  valeurAcquisition: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  amortissementTotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  valeurNet: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'Immobilisation',
  tableName: MODULE_TABLE_PREFIX + 'immobilisations',
  timestamps: true
})
