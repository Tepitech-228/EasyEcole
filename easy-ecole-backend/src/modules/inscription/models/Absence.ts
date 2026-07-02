import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { NoteEvaluation } from "./NoteEvaluation";

export class Absence extends Model<InferAttributes<Absence>, InferCreationAttributes<Absence>> {
  declare id: CreationOptional<number>
  declare noteEvaluationId: ForeignKey<NoteEvaluation['id']>
  declare type: string
  declare motif: CreationOptional<string | null>
  declare justificatif: CreationOptional<string | null>
  declare declareLe: CreationOptional<Date | null>

  declare noteEvaluation?: NoteEvaluation

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    noteEvaluation: Association<Absence, NoteEvaluation>
  }
}

Absence.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  noteEvaluationId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.ENUM('present', 'justifie', 'injustifie'),
    allowNull: false,
    defaultValue: 'present'
  },
  motif: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  justificatif: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  declareLe: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'Absence',
  tableName: MODULE_TABLE_PREFIX + 'absences',
  timestamps: true
})
