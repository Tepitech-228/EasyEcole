import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { DemandeStage } from "./DemandeStage";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../StageModule";

export class ConventionStage extends Model<InferAttributes<ConventionStage>, InferCreationAttributes<ConventionStage>> {
  declare id: CreationOptional<string>
  declare demandeStageId: ForeignKey<DemandeStage['id']>
  declare demandeStage?: NonAttribute<DemandeStage>
  declare fichier: string
  declare dateSignature: CreationOptional<string>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    demandeStage: Association<ConventionStage, DemandeStage>
  }
}

ConventionStage.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  fichier: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  dateSignature: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'ConventionStage',
  tableName: MODULE_TABLE_PREFIX + 'conventions_stage',
  timestamps: true
})
