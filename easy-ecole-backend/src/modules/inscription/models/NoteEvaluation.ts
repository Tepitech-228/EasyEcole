import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { ListeNoteEvaluation } from "./ListeNoteEvaluation";
import { CoursParticipant } from "./CoursParticipant";

export class NoteEvaluation extends Model<InferAttributes<NoteEvaluation>, InferCreationAttributes<NoteEvaluation>> {
  declare id: CreationOptional<string>
  declare note: CreationOptional<Number>

  declare listeNoteEvaluationId: ForeignKey<ListeNoteEvaluation['id']>
  declare listeNoteEvaluation?: NonAttribute<ListeNoteEvaluation>
  declare coursParticipantId: ForeignKey<CoursParticipant['id']>
  declare coursParticipant?: NonAttribute<CoursParticipant>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    listeNoteEvaluation: Association<NoteEvaluation, ListeNoteEvaluation>,
    coursParticipant: Association<NoteEvaluation, CoursParticipant>,
  };
}

NoteEvaluation.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  note: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'NoteEvaluation',
  tableName: MODULE_TABLE_PREFIX + 'notes_evaluation',
  timestamps: true
})