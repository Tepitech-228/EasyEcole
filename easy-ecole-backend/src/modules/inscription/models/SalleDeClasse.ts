import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, ForeignKey, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Classe } from "./Classe";

export class SalleDeClasse extends Model<InferAttributes<SalleDeClasse>, InferCreationAttributes<SalleDeClasse>> {
  declare id: CreationOptional<string>
  declare libelle: string
  declare description: CreationOptional<string>
  declare classeId: ForeignKey<Classe['id']>
  declare classe?: NonAttribute<Classe>
  
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    classe: Association<SalleDeClasse, Classe>
  };
}

SalleDeClasse.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  libelle: {
    type: new DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'SalleDeClasse',
  tableName: MODULE_TABLE_PREFIX + 'salles_de_classes',
  timestamps: true
})