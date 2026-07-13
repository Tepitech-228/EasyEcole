import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ReportingModule";

export class RptEffectifRh extends Model<InferAttributes<RptEffectifRh>, InferCreationAttributes<RptEffectifRh>> {
  declare id: CreationOptional<string>
  declare departementId: number | null
  declare date: Date | null
  declare nbEmployes: CreationOptional<number>
  declare nbActifs: CreationOptional<number>
  declare masseSalariale: CreationOptional<number>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

RptEffectifRh.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  departementId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  date: { type: DataTypes.DATEONLY, allowNull: true },
  nbEmployes: { type: DataTypes.INTEGER, defaultValue: 0 },
  nbActifs: { type: DataTypes.INTEGER, defaultValue: 0 },
  masseSalariale: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'EffectifRh',
  tableName: MODULE_TABLE_PREFIX + 'effectifs_rh',
  timestamps: true
})
