import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Cours } from "./Cours";
import { Enseignant } from "../../auth/models/Enseignant";
import { TypeNoteEvaluation } from "./TypeNoteEvaluation";
import { NoteEvaluation } from "./NoteEvaluation";

export class ListeNoteEvaluation extends Model<InferAttributes<ListeNoteEvaluation>, InferCreationAttributes<ListeNoteEvaluation>> {
  declare id: CreationOptional<string>
  declare date: Date
  declare heureDebut: Date
  declare heureFin: Date
  declare commentaire: CreationOptional<string>
  declare poidsTypeNoteEvaluation: Number

  declare typeNoteEvaluationId: ForeignKey<TypeNoteEvaluation['id']>
  declare typeNoteEvaluation?: NonAttribute<TypeNoteEvaluation>
  declare coursId: ForeignKey<Cours['id']>
  declare cours?: NonAttribute<Cours>
  declare enseignantId: ForeignKey<Enseignant['id']>
  declare enseignant?: NonAttribute<Enseignant>

  declare notesEvaluation?: NonAttribute<NoteEvaluation[]>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    cours: Association<ListeNoteEvaluation, Cours>,
    enseignant: Association<ListeNoteEvaluation, Enseignant>,
    typeNoteEvaluation: Association<ListeNoteEvaluation, TypeNoteEvaluation>,
    notesEvaluation: Association<ListeNoteEvaluation, NoteEvaluation>
  };
}

ListeNoteEvaluation.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  poidsTypeNoteEvaluation: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  heureDebut: {
    type: DataTypes.TIME,
    allowNull: false
  },
  heureFin: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  commentaire: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'ListeNoteEvaluation',
  tableName: MODULE_TABLE_PREFIX + 'listes_notes_evaluation',
  timestamps: true
})