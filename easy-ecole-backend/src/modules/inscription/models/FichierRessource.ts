import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Classe } from "./Classe";
import { Cours } from "./Cours";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Ressource } from "./Ressource";

export class FichierRessource extends Model<InferAttributes<FichierRessource>, InferCreationAttributes<FichierRessource>> {
  declare id: CreationOptional<string>
  declare titre: string
  declare description: CreationOptional<string>
  declare fichier: string
  declare ressourceId?: ForeignKey<Ressource['id']>
  declare ressource?: NonAttribute<Ressource>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    ressource: Association<FichierRessource, Ressource>
  };
}

FichierRessource.init({
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
    type: new DataTypes.STRING,
    allowNull: true
  },
  fichier: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'FichierRessource',
  tableName: MODULE_TABLE_PREFIX + 'fichiers_ressources',
  timestamps: true
})