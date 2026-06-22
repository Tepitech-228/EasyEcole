import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { CoursEnLigne } from "./CoursEnLigne";
import { Message } from "./Message";
import { ParticipantSalon } from "./ParticipantSalon";

export class Salon extends Model<InferAttributes<Salon>, InferCreationAttributes<Salon>> {
  declare id: CreationOptional<string>
  declare coursId: ForeignKey<CoursEnLigne['id']>
  declare titre: string
  declare type: CreationOptional<string>
  declare dateCreation: CreationOptional<Date>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare cours?: NonAttribute<CoursEnLigne>
  declare messages?: NonAttribute<Message[]>
  declare participants?: NonAttribute<ParticipantSalon[]>

  declare static associations: {
    cours: Association<Salon, CoursEnLigne>
    messages: Association<Salon, Message>
    participants: Association<Salon, ParticipantSalon>
  };
}

Salon.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  coursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  titre: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: new DataTypes.STRING,
    defaultValue: 'cours'
  },
  dateCreation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Salon',
  tableName: MODULE_TABLE_PREFIX + 'salons',
  timestamps: true
})
