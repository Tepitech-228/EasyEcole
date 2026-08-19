import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Utilisateur } from "./Utilisateur";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AuthModule";
import { Etablissement } from "../../etablissement/models/Etablissement";

export class PersonnelAdministratif extends Model<InferAttributes<PersonnelAdministratif>, InferCreationAttributes<PersonnelAdministratif>> {
  declare id: CreationOptional<number>
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare matricule: CreationOptional<string>
  declare statut: CreationOptional<string>
  declare fonction: string
  declare directionService: CreationOptional<string>
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
  declare etablissementId: ForeignKey<Etablissement['id'] | null>
  declare utilisateur?: NonAttribute<Utilisateur>
  declare etablissement?: NonAttribute<Etablissement>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare readonly deletedAt: CreationOptional<Date>

  declare static associations: {
    utilisateur: Association<PersonnelAdministratif, Utilisateur>
    etablissement: Association<PersonnelAdministratif, Etablissement>
  }
}

PersonnelAdministratif.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  utilisateurId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  matricule: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  statut: {
    type: new DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Permanent'
  },
  fonction: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  directionService: {
    type: new DataTypes.STRING,
    allowNull: true
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
    allowNull: true
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
  etablissementId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'PersonnelAdministratif',
  tableName: MODULE_TABLE_PREFIX + 'personnel_administratif',
  timestamps: true
})
