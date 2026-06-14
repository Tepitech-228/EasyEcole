import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { EtatsDePresence } from "../../../core/enums/EtatsDePresence";
import { Presence } from "./Presence";
import { CoursParticipant } from "./CoursParticipant";

export class  PresenceCoursParticipant extends Model<InferAttributes<PresenceCoursParticipant>, InferCreationAttributes<PresenceCoursParticipant>> {
  declare etatDePresence: CreationOptional<EtatsDePresence>

  declare presenceId: ForeignKey<Presence['id']>
  declare presence?: NonAttribute<Presence>
  declare coursParticipantId: ForeignKey<CoursParticipant['id']>
  declare coursParticipant?: NonAttribute<CoursParticipant>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    coursParticipant: Association<PresenceCoursParticipant, CoursParticipant>,
    presence: Association<PresenceCoursParticipant, Presence>,
  };
}

PresenceCoursParticipant.init({
  coursParticipantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: 'presence-cours-participant'
  },
  presenceId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: 'presence-cours-participant'
  },
  etatDePresence: {
    type: DataTypes.ENUM,
    values: [EtatsDePresence.NON_RENSEIGNE, EtatsDePresence.PRESENT, EtatsDePresence.ABSENT, EtatsDePresence.ABSENCE_JUSTIFIEE],
    defaultValue: EtatsDePresence.NON_RENSEIGNE
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'PresenceCoursParticipant',
  tableName: MODULE_TABLE_PREFIX + 'presences_cours_participants',
  timestamps: true
})