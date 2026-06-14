import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { DemandeStage } from "./DemandeStage";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../StageModule";

export class RapportStage extends Model<InferAttributes<RapportStage>, InferCreationAttributes<RapportStage>> {
  declare id: CreationOptional<string>
  declare demandeStageId: ForeignKey<DemandeStage['id']>
  declare demandeStage?: NonAttribute<DemandeStage>
  declare fichier: string
  declare dateSoumission: string

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    demandeStage: Association<RapportStage, DemandeStage>
  }
}

RapportStage.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  fichier: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  dateSoumission: {
    type: DataTypes.DATE,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'RapportStage',
  tableName: MODULE_TABLE_PREFIX + 'rapports_stage',
  timestamps: true
})
