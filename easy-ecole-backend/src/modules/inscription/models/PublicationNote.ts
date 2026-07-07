import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { ListeNoteEvaluation } from "./ListeNoteEvaluation";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class PublicationNote extends Model<InferAttributes<PublicationNote>, InferCreationAttributes<PublicationNote>> {
  declare id: CreationOptional<number>

  declare listeNoteEvaluationId: ForeignKey<ListeNoteEvaluation['id']>
  declare listeNoteEvaluation?: NonAttribute<ListeNoteEvaluation>
  declare datePublication: CreationOptional<Date>
  declare publiePar: ForeignKey<Utilisateur['id']>
  declare publieParUtilisateur?: NonAttribute<Utilisateur>
  declare message: CreationOptional<string | null>
  declare nbEtudiantsNotifies: CreationOptional<number>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    listeNoteEvaluation: Association<PublicationNote, ListeNoteEvaluation>,
    publieParUtilisateur: Association<PublicationNote, Utilisateur>,
  };
}

PublicationNote.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  datePublication: {
    type: DataTypes.DATE,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  nbEtudiantsNotifies: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'PublicationNote',
  tableName: MODULE_TABLE_PREFIX + 'publications_notes',
  timestamps: true
})
