import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../CommunicationModule";

export class Actualite extends Model<InferAttributes<Actualite>, InferCreationAttributes<Actualite>> {
  declare id: CreationOptional<string>
  declare titre: string
  declare contenu: string
  declare date: CreationOptional<Date>
  declare image: CreationOptional<string>
  declare categorie: CreationOptional<string>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

Actualite.init({
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
  date: {
    type: DataTypes.DATE,
    defaultValue: new Date(),
    allowNull: false
  },
  image: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  categorie: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Actualite',
  tableName: MODULE_TABLE_PREFIX + 'actualites',
  timestamps: true
})
