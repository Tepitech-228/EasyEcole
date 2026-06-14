import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { DemandeStage } from "./DemandeStage";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../StageModule";

export class AttestationStage extends Model<InferAttributes<AttestationStage>, InferCreationAttributes<AttestationStage>> {
  declare id: CreationOptional<string>
  declare demandeStageId: ForeignKey<DemandeStage['id']>
  declare demandeStage?: NonAttribute<DemandeStage>
  declare fichier: string
  declare dateEmission: string

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    demandeStage: Association<AttestationStage, DemandeStage>
  }
}

AttestationStage.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  fichier: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  dateEmission: {
    type: DataTypes.DATE,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'AttestationStage',
  tableName: MODULE_TABLE_PREFIX + 'attestations_stage',
  timestamps: true
})
