import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Utilisateur } from "./Utilisateur";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AuthModule";
import { AdresseInstitution } from "./AdresseInstitution";

export class Institution extends Model<InferAttributes<Institution>, InferCreationAttributes<Institution>> {
  declare id: CreationOptional<string>
  declare dateNaissance: CreationOptional<Date>
  declare lieuNaissance: CreationOptional<string>
  declare fonction: CreationOptional<string>
  declare adresseId: ForeignKey<AdresseInstitution['id']>
  declare adresse?: AdresseInstitution
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare utilisateur?: NonAttribute<Utilisateur>
  
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    adresse: Association<Institution, AdresseInstitution>
    utilisateur: Association<Institution, Utilisateur>
  }
}

Institution.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  dateNaissance: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lieuNaissance: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  fonction: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName:  MODULE_MODEL_PREFIX + 'Institution',
  tableName:  MODULE_TABLE_PREFIX + 'institutions',
  timestamps: true
})