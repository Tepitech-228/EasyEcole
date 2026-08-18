import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { CursusApprenant } from "./CursusApprenant";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class DesignationMemoire extends Model<InferAttributes<DesignationMemoire>, InferCreationAttributes<DesignationMemoire>> {
  declare id: CreationOptional<number>
  declare cursusApprenantId: ForeignKey<CursusApprenant['id']>
  declare sujet: string
  declare superviseurId: ForeignKey<Utilisateur['id']>
  declare gradeSuperviseur: string
  declare emailSuperviseur: string
  declare telephoneSuperviseur: string
  declare dateDesignation: CreationOptional<Date>
  declare statut: CreationOptional<string>
  declare commentaire: CreationOptional<string | null>

  declare cursusApprenant?: NonAttribute<CursusApprenant>
  declare superviseur?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare readonly deletedAt: CreationOptional<Date | null>

  declare static associations: {
    cursusApprenant: Association<DesignationMemoire, CursusApprenant>
    superviseur: Association<DesignationMemoire, Utilisateur>
  }
}

DesignationMemoire.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  cursusApprenantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  sujet: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  superviseurId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  gradeSuperviseur: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  emailSuperviseur: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  telephoneSuperviseur: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  dateDesignation: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('propose', 'confirme', 'rejete'),
    allowNull: false,
    defaultValue: 'propose'
  },
  commentaire: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'DesignationMemoire',
  tableName: MODULE_TABLE_PREFIX + 'designation_memoires',
  timestamps: true
})
