import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhEmploye } from "./RhEmploye";
import { RhEvaluationCritere } from "./RhEvaluationCritere";

export class RhFicheEvaluation extends Model<InferAttributes<RhFicheEvaluation>, InferCreationAttributes<RhFicheEvaluation>> {
  declare id: CreationOptional<string>
  declare employeId: ForeignKey<RhEmploye['id']>
  declare evaluateurId: string
  declare dateEvaluation: Date
  declare noteGlobale: CreationOptional<number>
  declare commentaire: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare employe?: NonAttribute<RhEmploye>
  declare evaluationsCriteres?: NonAttribute<RhEvaluationCritere[]>

  declare static associations: {
    employe: Association<RhFicheEvaluation, RhEmploye>
    evaluationsCriteres: Association<RhFicheEvaluation, RhEvaluationCritere>
  }
}

RhFicheEvaluation.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  evaluateurId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  dateEvaluation: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  noteGlobale: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  commentaire: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'FicheEvaluation',
  tableName: MODULE_TABLE_PREFIX + 'fiches_evaluation',
  timestamps: true
})
