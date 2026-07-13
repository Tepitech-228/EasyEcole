
import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Apprenant } from "./Apprenant";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AuthModule";

export class PersonnePrevenirApprenant extends Model<InferAttributes<PersonnePrevenirApprenant>, InferCreationAttributes<PersonnePrevenirApprenant>> {
  declare id: CreationOptional<string>
  declare nom: string
  declare prenoms: string
  declare boitePostale: CreationOptional<string>
  declare email: CreationOptional<string>
  declare telMobile: string
  declare telDomicile: CreationOptional<string>
  declare quartier: string
  declare ville: string
  declare pays: string
  declare apprenantId: ForeignKey<Apprenant['id']>
  declare apprenant?: NonAttribute<Apprenant>
  
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

PersonnePrevenirApprenant.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  nom: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  prenoms: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  boitePostale: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  telMobile: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  telDomicile: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  quartier: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  ville: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  pays: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName:  MODULE_MODEL_PREFIX + 'PersonnePrevenirApprenant',
  tableName:  MODULE_TABLE_PREFIX + 'personnes_prevenir_apprenants',
  timestamps: true
})