import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhEvaluationCritere } from "./RhEvaluationCritere";

export class RhCritereEvaluation extends Model<InferAttributes<RhCritereEvaluation>, InferCreationAttributes<RhCritereEvaluation>> {
  declare id: CreationOptional<string>
  declare nom: string
  declare description: CreationOptional<string>
  declare poids: CreationOptional<number>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare evaluationsCriteres?: NonAttribute<RhEvaluationCritere[]>

  declare static associations: {
    evaluationsCriteres: Association<RhCritereEvaluation, RhEvaluationCritere>
  }
}

RhCritereEvaluation.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  nom: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  poids: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: 0
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'CritereEvaluation',
  tableName: MODULE_TABLE_PREFIX + 'criteres_evaluation',
  timestamps: true
})
