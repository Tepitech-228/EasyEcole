import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhFicheEvaluation } from "./RhFicheEvaluation";
import { RhCritereEvaluation } from "./RhCritereEvaluation";

export class RhEvaluationCritere extends Model<InferAttributes<RhEvaluationCritere>, InferCreationAttributes<RhEvaluationCritere>> {
  declare id: CreationOptional<string>
  declare ficheId: ForeignKey<RhFicheEvaluation['id']>
  declare critereId: ForeignKey<RhCritereEvaluation['id']>
  declare note: number
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare fiche?: NonAttribute<RhFicheEvaluation>
  declare critere?: NonAttribute<RhCritereEvaluation>

  declare static associations: {
    fiche: Association<RhEvaluationCritere, RhFicheEvaluation>
    critere: Association<RhEvaluationCritere, RhCritereEvaluation>
  }
}

RhEvaluationCritere.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  note: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'EvaluationCritere',
  tableName: MODULE_TABLE_PREFIX + 'evaluations_criteres',
  timestamps: true
})
