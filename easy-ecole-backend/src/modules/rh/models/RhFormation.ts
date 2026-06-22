import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhParticipationFormation } from "./RhParticipationFormation";

export class RhFormation extends Model<InferAttributes<RhFormation>, InferCreationAttributes<RhFormation>> {
  declare id: CreationOptional<string>
  declare titre: string
  declare description: CreationOptional<string>
  declare dateDebut: Date
  declare dateFin: Date
  declare formateur: string
  declare type: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare participations?: NonAttribute<RhParticipationFormation[]>

  declare static associations: {
    participations: Association<RhFormation, RhParticipationFormation>
  }
}

RhFormation.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  titre: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dateDebut: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dateFin: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  formateur: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('interne', 'externe'),
    defaultValue: 'interne'
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Formation',
  tableName: MODULE_TABLE_PREFIX + 'formations',
  timestamps: true
})
