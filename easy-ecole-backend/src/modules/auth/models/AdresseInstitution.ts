
import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Institution } from "./Institution";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AuthModule";

export class AdresseInstitution extends Model<InferAttributes<AdresseInstitution>, InferCreationAttributes<AdresseInstitution>> {
  declare id: CreationOptional<string>
  declare boitePostale: CreationOptional<string>
  declare prorietaireBoitePostale: CreationOptional<string>
  declare telMobile: CreationOptional<string>
  declare telDomicile: CreationOptional<string>
  declare quartier: CreationOptional<string>
  declare ville: CreationOptional<string>
  declare pays: CreationOptional<string>
  declare institutionId: ForeignKey<Institution['id']>
  declare institution?: NonAttribute<Institution>
  
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

AdresseInstitution.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  boitePostale: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  prorietaireBoitePostale: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  telMobile: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  telDomicile: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  quartier: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  ville: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  pays: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName:  MODULE_MODEL_PREFIX + 'AdresseInstitution',
  tableName:  MODULE_TABLE_PREFIX + 'adresses_institutions',
  timestamps: true
})