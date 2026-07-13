
import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Apprenant } from "./Apprenant";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AuthModule";

export class AdresseApprenant extends Model<InferAttributes<AdresseApprenant>, InferCreationAttributes<AdresseApprenant>> {
  declare id: CreationOptional<string>
  declare boitePostale: string
  declare prorietaireBoitePostale: string
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

AdresseApprenant.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  boitePostale: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  prorietaireBoitePostale: {
    type: new DataTypes.STRING,
    allowNull: false
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
  modelName:  MODULE_MODEL_PREFIX + 'AdresseApprenant',
  tableName:  MODULE_TABLE_PREFIX + 'adresses_apprenants',
  timestamps: true
})