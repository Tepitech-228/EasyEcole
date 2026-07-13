import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { DemandeStage } from "./DemandeStage";
import { Enseignant } from "../../auth/models/Enseignant";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../StageModule";

export class NoteStage extends Model<InferAttributes<NoteStage>, InferCreationAttributes<NoteStage>> {
  declare id: CreationOptional<string>
  declare demandeStageId: ForeignKey<DemandeStage['id']>
  declare demandeStage?: NonAttribute<DemandeStage>
  declare enseignantId: ForeignKey<Enseignant['id']>
  declare enseignant?: NonAttribute<Enseignant>
  declare note: number
  declare appreciation: CreationOptional<string>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    demandeStage: Association<NoteStage, DemandeStage>
    enseignant: Association<NoteStage, Enseignant>
  }
}

NoteStage.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  note: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  appreciation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'NoteStage',
  tableName: MODULE_TABLE_PREFIX + 'notes_stage',
  timestamps: true
})
