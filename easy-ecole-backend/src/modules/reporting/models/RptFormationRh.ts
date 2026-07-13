import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ReportingModule";

export class RptFormationRh extends Model<InferAttributes<RptFormationRh>, InferCreationAttributes<RptFormationRh>> {
  declare id: CreationOptional<string>
  declare formationId: number | null
  declare nbParticipants: CreationOptional<number>
  declare coutTotal: CreationOptional<number>
  declare dureeTotale: CreationOptional<number>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

RptFormationRh.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  formationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  nbParticipants: { type: DataTypes.INTEGER, defaultValue: 0 },
  coutTotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  dureeTotale: { type: DataTypes.INTEGER, defaultValue: 0 },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'FormationRh',
  tableName: MODULE_TABLE_PREFIX + 'formations_rh',
  timestamps: true
})
