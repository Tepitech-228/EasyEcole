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
  declare sexe: CreationOptional<'M' | 'F' | 'Autre'>
  declare nationalite: CreationOptional<string>
  declare cni: CreationOptional<string>
  declare statutHandicap: CreationOptional<boolean>
  declare natureHandicap: CreationOptional<string>
  declare anneeObtentionBac: CreationOptional<string>
  declare serieBac: CreationOptional<string>
  declare anneePremiereInscription: CreationOptional<string>
  declare nombreInscriptions: CreationOptional<number>
  declare statutEtudiant: CreationOptional<'nouveau' | 'ancien'>
  declare periode: CreationOptional<'matin' | 'soir' | 'en_ligne' | null>
  declare diplomePrepare: CreationOptional<string>
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
    allowNull: true
  },
  qrCode: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  dateNaissance: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  lieuNaissance: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  sexe: {
    type: DataTypes.ENUM('M', 'F', 'Autre'),
    defaultValue: 'M',
    allowNull: false
  },
  nationalite: {
    type: new DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Ivoirienne'
  },
  cni: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  statutHandicap: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  natureHandicap: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  anneeObtentionBac: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  serieBac: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  anneePremiereInscription: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  nombreInscriptions: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
  },
  statutEtudiant: {
    type: DataTypes.ENUM('nouveau', 'ancien'),
    allowNull: true,
    defaultValue: 'nouveau'
  },
  periode: {
    type: DataTypes.ENUM('matin', 'soir', 'en_ligne'),
    allowNull: true
  },
  diplomePrepare: {
    type: new DataTypes.STRING,
    allowNull: true
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