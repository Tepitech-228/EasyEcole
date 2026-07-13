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
  declare dateNaissance: CreationOptional<Date>
  declare lieuNaissance: CreationOptional<string>
  declare fonction: CreationOptional<string>
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
  modelName:  MODULE_MODEL_PREFIX + 'Enseignant',
  tableName:  MODULE_TABLE_PREFIX + 'enseignants',
  timestamps: true
})