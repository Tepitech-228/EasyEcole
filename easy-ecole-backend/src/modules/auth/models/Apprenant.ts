import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Utilisateur } from "./Utilisateur";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AuthModule";
import { AdresseApprenant } from "./AdresseApprenant";
import { IdentiteApprenant } from "./IdentiteApprenant";
import { InformationsSalarieApprenant } from "./InformationsSalarieApprenant";
import { InformationsParentsApprenant } from "./InformationsParentsApprenant";
import { PersonnePrevenirApprenant } from "./PersonnePrevenirApprenant";

export class Apprenant extends Model<InferAttributes<Apprenant>, InferCreationAttributes<Apprenant>> {
  declare id: CreationOptional<string>
  declare photo: CreationOptional<string>
  declare qrCode: CreationOptional<string>
  declare dateNaissance: Date
  declare lieuNaissance: string
  declare adresseId: ForeignKey<AdresseApprenant['id']>
  declare adresse?: AdresseApprenant
  declare identiteId: ForeignKey<IdentiteApprenant['id']>
  declare identite?: IdentiteApprenant
  declare informationsSalarieId: ForeignKey<InformationsSalarieApprenant['id']>
  declare informationsSalarie?: InformationsSalarieApprenant
  declare informationsParentsId: ForeignKey<InformationsParentsApprenant['id']>
  declare informationsParents?: InformationsParentsApprenant
  declare personnePrevenirId: ForeignKey<PersonnePrevenirApprenant['id']>
  declare personnePrevenir?: PersonnePrevenirApprenant
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare utilisateur?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    adresse: Association<Apprenant, AdresseApprenant>
    identite: Association<Apprenant, IdentiteApprenant>
    informationsSalarie: Association<Apprenant, InformationsSalarieApprenant>
    informationsParents: Association<Apprenant, InformationsParentsApprenant>
    personnePrevenir: Association<Apprenant, PersonnePrevenirApprenant>
    utilisateur: Association<Apprenant, Utilisateur>
  }
}

Apprenant.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  photo: {
    type: new DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  qrCode: {
    type: new DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  dateNaissance: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  lieuNaissance: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Apprenant',
  tableName: MODULE_TABLE_PREFIX + 'apprenants',
  timestamps: true
})