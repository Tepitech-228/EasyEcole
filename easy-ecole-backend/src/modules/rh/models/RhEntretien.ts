import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhCandidature } from "./RhCandidature";

export class RhEntretien extends Model<InferAttributes<RhEntretien>, InferCreationAttributes<RhEntretien>> {
  declare id: CreationOptional<string>
  declare candidatureId: ForeignKey<RhCandidature['id']>
  declare date: Date
  declare heure: string
  declare lieu: CreationOptional<string>
  declare commentaire: CreationOptional<string>
  declare statut: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare candidature?: NonAttribute<RhCandidature>

  declare static associations: {
    candidature: Association<RhEntretien, RhCandidature>
  }
}

RhEntretien.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  heure: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  lieu: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  commentaire: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  statut: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Entretien',
  tableName: MODULE_TABLE_PREFIX + 'entretiens',
  timestamps: true
})
