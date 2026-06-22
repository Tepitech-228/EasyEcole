import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../CommunicationModule";

export class Communication extends Model<InferAttributes<Communication>, InferCreationAttributes<Communication>> {
  declare id: CreationOptional<string>
  declare titre: string
  declare contenu: string
  declare datePublication: CreationOptional<Date>
  declare statut: string

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

Communication.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  titre: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  contenu: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  datePublication: {
    type: DataTypes.DATE,
    defaultValue: new Date(),
    allowNull: false
  },
  statut: {
    type: DataTypes.ENUM('brouillon', 'publiee'),
    defaultValue: 'brouillon',
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Communication',
  tableName: MODULE_TABLE_PREFIX + 'communications',
  timestamps: true
})
