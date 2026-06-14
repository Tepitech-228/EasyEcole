import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { PresenceCoursParticipant } from "./PresenceCoursParticipant";
import { ListePresence } from "./ListePresence";

export class Presence extends Model<InferAttributes<Presence>, InferCreationAttributes<Presence>> {
  declare id: CreationOptional<string>
  declare date: Date
  declare heureDebut: Date
  declare heureFin: Date

  declare listePresenceId: ForeignKey<ListePresence['id']>
  declare listePresence?: NonAttribute<ListePresence>
  declare presencesCoursParticipants?: NonAttribute<PresenceCoursParticipant[]>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    listePresence: Association<Presence, ListePresence>,
    presencesCoursParticipants: Association<Presence, PresenceCoursParticipant>
  };
}

Presence.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  date: {
    type: DataTypes.DATEONLY,
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
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Presence',
  tableName: MODULE_TABLE_PREFIX + 'presences',
  timestamps: true
})