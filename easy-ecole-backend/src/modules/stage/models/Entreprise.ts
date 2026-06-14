import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Tuteur } from "./Tuteur";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../StageModule";

export class Entreprise extends Model<InferAttributes<Entreprise>, InferCreationAttributes<Entreprise>> {
  declare id: CreationOptional<string>
  declare nom: string
  declare adresse: CreationOptional<string>
  declare telephone: string
  declare email: string
  declare siteWeb: CreationOptional<string>
  declare tuteurs?: Tuteur[]

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    tuteurs: Association<Entreprise, Tuteur>
  }
}

Entreprise.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  nom: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  adresse: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  telephone: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  siteWeb: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Entreprise',
  tableName: MODULE_TABLE_PREFIX + 'entreprises',
  timestamps: true
})
