import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { Salon } from "./Salon";

export class ParticipantSalon extends Model<InferAttributes<ParticipantSalon>, InferCreationAttributes<ParticipantSalon>> {
  declare id: CreationOptional<string>
  declare salonId: ForeignKey<Salon['id']>
  declare utilisateurId: number
  declare dateAjout: CreationOptional<Date>
  declare role: CreationOptional<string>
  declare dateDerniereLecture: CreationOptional<Date | null>
  declare estPresent: CreationOptional<boolean>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare salon?: NonAttribute<Salon>

  declare static associations: {
    salon: Association<ParticipantSalon, Salon>
  };
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
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  dateAjout: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  role: {
    type: new DataTypes.STRING,
    defaultValue: 'membre'
  },
  dateDerniereLecture: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estPresent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
