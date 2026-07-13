import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ReportingModule";

export class RptEvaluation extends Model<InferAttributes<RptEvaluation>, InferCreationAttributes<RptEvaluation>> {
  declare id: CreationOptional<string>
  declare periode: string | null
  declare nbEvaluations: CreationOptional<number>
  declare noteMoyenneGlobale: CreationOptional<number>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

RptEvaluation.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  periode: { type: new DataTypes.STRING, allowNull: true },
  nbEvaluations: { type: DataTypes.INTEGER, defaultValue: 0 },
  noteMoyenneGlobale: { type: DataTypes.FLOAT, defaultValue: 0 },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'Evaluation',
  tableName: MODULE_TABLE_PREFIX + 'evaluations',
  timestamps: true
})
