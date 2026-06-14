import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Classe } from "./Classe";
import { Cours } from "./Cours";
import { Ressource } from "./Ressource";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";

export class ChapitreCours extends Model<InferAttributes<ChapitreCours>, InferCreationAttributes<ChapitreCours>> {
  declare id: CreationOptional<string>
  declare titre: string
  declare description: CreationOptional<string>
  declare image: CreationOptional<string>
  declare coursId: ForeignKey<Cours['id']>
  declare cours?: NonAttribute<Cours>
  declare ressources?: NonAttribute<Ressource[]>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    cours: Association<ChapitreCours, Cours>
    ressources: Association<ChapitreCours, Ressource>
  };
}

ChapitreCours.init({
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
  image: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'ChapitreCours',
  tableName: MODULE_TABLE_PREFIX + 'chapitres_cours',
  timestamps: true
})