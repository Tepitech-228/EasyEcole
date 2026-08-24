import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Utilisateur } from "./Utilisateur";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AuthModule";
import { AdresseEnseignant } from "./AdresseEnseignant";
import { Cours } from "../../inscription/models/Cours";

export class Enseignant extends Model<InferAttributes<Enseignant>, InferCreationAttributes<Enseignant>> {
  declare id: CreationOptional<string>
  declare photo: CreationOptional<string>
  declare qrCode: CreationOptional<string>
  declare matricule: CreationOptional<string>
  declare gradeAcademique: CreationOptional<string>
  declare specialite: CreationOptional<string>
  declare statut: CreationOptional<string>
  declare fonctionAdministrative: CreationOptional<string>
  declare anneeExperience: CreationOptional<number>
  declare heureTheoriqueAnnuelle: CreationOptional<number>
  declare heureReelleAnnuelle: CreationOptional<number>
  declare cni: CreationOptional<string>
  declare nifOtr: CreationOptional<string>
  declare dateNaissance: CreationOptional<Date>
  declare lieuNaissance: CreationOptional<string>
  declare sexe: CreationOptional<'M' | 'F' | 'Autre'>
  declare nationalite: CreationOptional<string>
  declare contact: CreationOptional<string>
  declare plusHautDiplome: CreationOptional<string>
  declare statutHandicap: CreationOptional<boolean>
  declare natureHandicap: CreationOptional<string>
  declare adresseId: ForeignKey<AdresseEnseignant['id']>
  declare adresse?: AdresseEnseignant
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare utilisateur?: NonAttribute<Utilisateur>
  
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    adresse: Association<Enseignant, AdresseEnseignant>
    utilisateur: Association<Enseignant, Utilisateur>,
    cours: Association<Enseignant, Cours>
  }
}

Enseignant.init({
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
  matricule: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  gradeAcademique: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  specialite: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  statut: {
    type: new DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Permanent'
  },
  fonctionAdministrative: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  anneeExperience: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  heureTheoriqueAnnuelle: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  heureReelleAnnuelle: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  cni: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  nifOtr: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  dateNaissance: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lieuNaissance: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  sexe: {
    type: DataTypes.ENUM('M', 'F', 'Autre'),
    allowNull: true,
    defaultValue: 'M'
  },
  nationalite: {
    type: new DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Ivoirienne'
  },
  contact: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  plusHautDiplome: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  statutHandicap: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  natureHandicap: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  utilisateurId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: 'enseignant_utilisateur'
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName:  MODULE_MODEL_PREFIX + 'Enseignant',
  tableName:  MODULE_TABLE_PREFIX + 'enseignants',
  timestamps: true
})