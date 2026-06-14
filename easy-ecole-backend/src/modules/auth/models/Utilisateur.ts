import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, Association } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Institution } from "./Institution";
import { Apprenant } from "./Apprenant";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AuthModule";
import { CaissierBanque } from "./CaissierBanque";
import { Enseignant } from "./Enseignant";

export class Utilisateur extends Model<InferAttributes<Utilisateur>, InferCreationAttributes<Utilisateur>> {
  declare id: CreationOptional<string>
  declare nom: string
  declare prenoms: string
  declare identifiant: string
  declare email: string
  declare motDePasse: string
  declare role: RolesUtilisateur
  declare contact: string
  declare photoDeProfil: CreationOptional<string>
  declare dateVerificationEmail: CreationOptional<Date>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare apprenant?: NonAttribute<Apprenant>
  declare institution?: NonAttribute<Institution>
  declare enseignant?: NonAttribute<Enseignant>
  declare caissierBanque?: NonAttribute<CaissierBanque>

  declare static associations: {
    apprenant: Association<Utilisateur, Apprenant>
    institution: Association<Utilisateur, Institution>
    enseignant: Association<Utilisateur, Enseignant>
    caissierBanque: Association<Utilisateur, CaissierBanque>
  }
}

Utilisateur.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  nom: {
    type: new DataTypes.STRING,
    allowNull: false,
    unique: 'nom-prenoms'
  },
  prenoms: {
    type: new DataTypes.STRING,
    allowNull: false,
    unique: 'nom-prenoms'
  },
  identifiant: {
    type: new DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: new DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  motDePasse: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM,
    values: [RolesUtilisateur.APPRENANT, RolesUtilisateur.INSTITUTION, RolesUtilisateur.ENSEIGNANT, RolesUtilisateur.CAISSIER_BANQUE, RolesUtilisateur.ADMIN],
    defaultValue: RolesUtilisateur.APPRENANT
  },
  contact: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  photoDeProfil: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  dateVerificationEmail: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName:  MODULE_MODEL_PREFIX + 'Utilisateur',
  tableName:  MODULE_TABLE_PREFIX + 'utilisateurs',
  timestamps: true
})