import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Utilisateur } from "./Utilisateur";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AuthModule";
import { CaissierBanque } from "./CaissierBanque";

export class Banque extends Model<InferAttributes<Banque>, InferCreationAttributes<Banque>> {
  declare id: CreationOptional<string>
  declare nom: string
  declare logo: CreationOptional<string>
  declare caissiers?: NonAttribute<Utilisateur>
  
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    caissiers: Association<Banque, CaissierBanque>
  }
}

Banque.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  nom: {
    type: new DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  logo: {
    type: new DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName:  MODULE_MODEL_PREFIX + 'Banque',
  tableName:  MODULE_TABLE_PREFIX + 'banques',
  timestamps: true
})