import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhFormation } from "./RhFormation";
import { RhEmploye } from "./RhEmploye";

export class RhParticipationFormation extends Model<InferAttributes<RhParticipationFormation>, InferCreationAttributes<RhParticipationFormation>> {
  declare id: CreationOptional<string>
  declare formationId: ForeignKey<RhFormation['id']>
  declare employeId: ForeignKey<RhEmploye['id']>
  declare statut: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare formation?: NonAttribute<RhFormation>
  declare employe?: NonAttribute<RhEmploye>

  declare static associations: {
    formation: Association<RhParticipationFormation, RhFormation>
    employe: Association<RhParticipationFormation, RhEmploye>
  }
}

RhParticipationFormation.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  statut: {
    type: DataTypes.ENUM('inscrit', 'terminé', 'abandon'),
    defaultValue: 'inscrit'
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'ParticipationFormation',
  tableName: MODULE_TABLE_PREFIX + 'participations_formation',
  timestamps: true
})
