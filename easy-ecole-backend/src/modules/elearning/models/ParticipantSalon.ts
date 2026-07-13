import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { Salon } from "./Salon";

export class ParticipantSalon extends Model<InferAttributes<ParticipantSalon>, InferCreationAttributes<ParticipantSalon>> {
  declare id: CreationOptional<string>
  declare salonId: ForeignKey<Salon['id']>
  declare utilisateurId: number
  declare dateAjout: CreationOptional<Date>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

ParticipantSalon.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  salonId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  utilisateurId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  dateAjout: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'ParticipantSalon',
  tableName: MODULE_TABLE_PREFIX + 'participants_salon',
  timestamps: true
})
