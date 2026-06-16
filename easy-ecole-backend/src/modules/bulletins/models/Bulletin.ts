import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { AnneeAcademique } from "../../inscription/models/AnneeAcademique";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";
import { Classe } from "../../inscription/models/Classe";
import { Parcours } from "../../inscription/models/Parcours";
import { NiveauEtude } from "../../inscription/models/NiveauEtude";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { LigneBulletin } from "./LigneBulletin";

const MODEL_PREFIX = 'Bulletin';
const TABLE_PREFIX = 'ins_';

export class Bulletin extends Model<InferAttributes<Bulletin>, InferCreationAttributes<Bulletin>> {
  declare id: CreationOptional<number>
  declare anneeAcademiqueId: ForeignKey<AnneeAcademique['id']>
  declare semestre: string
  declare cursusApprenantId: ForeignKey<CursusApprenant['id']>
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare classeId: ForeignKey<Classe['id']>
  declare parcoursId: ForeignKey<Parcours['id']>
  declare niveauEtudeId: ForeignKey<NiveauEtude['id']>
  declare moyenneGenerale: CreationOptional<number | null>
  declare totalCredits: CreationOptional<number | null>
  declare creditsValides: CreationOptional<number | null>
  declare rang: CreationOptional<number | null>
  declare effectifClasse: CreationOptional<number | null>
  declare mention: CreationOptional<string | null>
  declare appreciation: CreationOptional<string | null>
  declare statut: CreationOptional<string>
  declare dateGeneration: CreationOptional<Date | null>
  declare datePublication: CreationOptional<Date | null>

  declare anneeAcademique?: NonAttribute<AnneeAcademique>
  declare cursusApprenant?: NonAttribute<CursusApprenant>
  declare utilisateur?: NonAttribute<Utilisateur>
  declare classe?: NonAttribute<Classe>
  declare parcours?: NonAttribute<Parcours>
  declare niveauEtude?: NonAttribute<NiveauEtude>
  declare lignesBulletins?: NonAttribute<LigneBulletin[]>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare readonly deletedAt: CreationOptional<Date | null>

  declare static associations: {
    lignesBulletins: Association<Bulletin, LigneBulletin>
    anneeAcademique: Association<Bulletin, AnneeAcademique>
    cursusApprenant: Association<Bulletin, CursusApprenant>
    utilisateur: Association<Bulletin, Utilisateur>
    classe: Association<Bulletin, Classe>
    parcours: Association<Bulletin, Parcours>
    niveauEtude: Association<Bulletin, NiveauEtude>
  }
}

Bulletin.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  anneeAcademiqueId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  semestre: {
    type: DataTypes.ENUM('semestre1', 'semestre2'),
    allowNull: false
  },
  cursusApprenantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  utilisateurId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  classeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  parcoursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  niveauEtudeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  moyenneGenerale: { type: DataTypes.FLOAT, allowNull: true },
  totalCredits: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  creditsValides: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  rang: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  effectifClasse: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  mention: { type: DataTypes.STRING(50), allowNull: true },
  appreciation: { type: DataTypes.TEXT, allowNull: true },
  statut: {
    type: DataTypes.ENUM('brouillon', 'publie'),
    allowNull: false,
    defaultValue: 'brouillon'
  },
  dateGeneration: { type: DataTypes.DATE, allowNull: true },
  datePublication: { type: DataTypes.DATE, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  tableName: TABLE_PREFIX + 'bulletins',
  modelName: MODEL_PREFIX,
  paranoid: true,
  timestamps: true
});
