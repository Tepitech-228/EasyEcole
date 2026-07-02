import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { NoteEvaluation } from "../../inscription/models/NoteEvaluation";
import { Utilisateur } from "../../auth/models/Utilisateur";

const MODEL_PREFIX = 'AuditNote';
const TABLE_PREFIX = 'ins_';

export class AuditNote extends Model<InferAttributes<AuditNote>, InferCreationAttributes<AuditNote>> {
  declare id: CreationOptional<number>
  declare noteEvaluationId: ForeignKey<NoteEvaluation['id']>
  declare ancienneNote: CreationOptional<number | null>
  declare nouvelleNote: CreationOptional<number | null>
  declare modifiePar: ForeignKey<Utilisateur['id']>
  declare motif: CreationOptional<string | null>

  declare modifieParUtilisateur?: Utilisateur

  declare readonly createdAt: CreationOptional<Date>

  declare static associations: {
    modifieParUtilisateur: Association<AuditNote, Utilisateur>
  }
}

AuditNote.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  noteEvaluationId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  ancienneNote: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  nouvelleNote: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  modifiePar: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  motif: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODEL_PREFIX,
  tableName: TABLE_PREFIX + 'audit_notes',
  timestamps: true,
  updatedAt: false
})
