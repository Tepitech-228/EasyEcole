import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Cours } from "./Cours";
import { Enseignant } from "../../auth/models/Enseignant";
import { TypeNoteEvaluation } from "./TypeNoteEvaluation";
import { NoteEvaluation } from "./NoteEvaluation";
import { PublicationNote } from "./PublicationNote";
import { AnneeAcademique } from "./AnneeAcademique";

export class ListeNoteEvaluation extends Model<InferAttributes<ListeNoteEvaluation>, InferCreationAttributes<ListeNoteEvaluation>> {
  declare id: CreationOptional<number>
  declare date: Date
  declare datePublication: CreationOptional<Date | null>
  declare dateLimiteSaisie: CreationOptional<Date | null>
  declare statutGestion: CreationOptional<'brouillon' | 'publie' | 'annulee'>
  declare saisieBloquee: CreationOptional<boolean>
  declare verrouillageDefinitif: CreationOptional<boolean>
  declare motifBlocage: CreationOptional<string | null>
  declare bloqueePar: CreationOptional<number | null>
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

  declare anneeAcademiqueId: ForeignKey<AnneeAcademique['id']>
  declare anneeAcademique?: NonAttribute<AnneeAcademique>

  declare notesEvaluation?: NonAttribute<NoteEvaluation[]>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    cours: Association<ListeNoteEvaluation, Cours>,
    enseignant: Association<ListeNoteEvaluation, Enseignant>,
    typeNoteEvaluation: Association<ListeNoteEvaluation, TypeNoteEvaluation>,
    anneeAcademique: Association<ListeNoteEvaluation, AnneeAcademique>,
    notesEvaluation: Association<ListeNoteEvaluation, NoteEvaluation>,
    publicationsNotes: Association<ListeNoteEvaluation, PublicationNote>
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
  dateLimiteSaisie: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Deadline saisie notes (examen +14j) pour alertes SG/DG'
  },
  datePublication: {
    type: DataTypes.DATE,
    allowNull: true
  },
  statutGestion: {
    type: DataTypes.ENUM('brouillon', 'publie', 'annulee'),
    allowNull: false,
    defaultValue: 'brouillon'
  },
  saisieBloquee: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  verrouillageDefinitif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  motifBlocage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  bloqueePar: {
    type: DataTypes.INTEGER.UNSIGNED,
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
  anneeAcademiqueId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
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
