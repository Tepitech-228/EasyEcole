import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { Salon } from "./Salon";

export class Message extends Model<InferAttributes<Message>, InferCreationAttributes<Message>> {
  declare id: CreationOptional<string>
  declare salonId: ForeignKey<Salon['id']>
  declare utilisateurId: number
  declare message: string
  declare date: CreationOptional<Date>
  declare lu: CreationOptional<boolean>
  declare typeMessage: CreationOptional<string>
  declare pieceJointe: CreationOptional<string | null>
  declare estModifie: CreationOptional<boolean>
  declare estSupprime: CreationOptional<boolean>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

Message.init({
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
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  lu: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  typeMessage: {
    type: new DataTypes.STRING,
    defaultValue: 'text'
  },
  pieceJointe: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  estModifie: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  estSupprime: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Message',
  tableName: MODULE_TABLE_PREFIX + 'messages',
  timestamps: true
})
