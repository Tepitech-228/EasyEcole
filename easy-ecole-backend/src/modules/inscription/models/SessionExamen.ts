import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Classe } from "./Classe";
import { AnneeAcademique } from "./AnneeAcademique";

export class SessionExamen extends Model<InferAttributes<SessionExamen>, InferCreationAttributes<SessionExamen>> {
  declare id: CreationOptional<number>
  declare libelle: string
  declare type: string
  declare classeId: ForeignKey<Classe['id']>
  declare anneeAcademiqueId: ForeignKey<AnneeAcademique['id']>
  declare semestre: string
  declare dateDebut: CreationOptional<Date | null>
  declare dateFin: CreationOptional<Date | null>
  declare statut: CreationOptional<string>
  declare observations: CreationOptional<string | null>

  declare classe?: NonAttribute<Classe>
  declare anneeAcademique?: NonAttribute<AnneeAcademique>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare readonly deletedAt: CreationOptional<Date | null>

  declare static associations: {
    classe: Association<SessionExamen, Classe>
    anneeAcademique: Association<SessionExamen, AnneeAcademique>
  }
}

SessionExamen.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  libelle: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('normale', 'rattrapage'),
    allowNull: false,
    defaultValue: 'normale'
  },
  classeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  anneeAcademiqueId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  semestre: {
    type: DataTypes.ENUM('semestre1', 'semestre2', 'semestre3', 'semestre4', 'semestre5', 'semestre6'),
    allowNull: false
  },
  dateDebut: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dateFin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('planifiee', 'en_cours', 'terminee', 'cloturee'),
    allowNull: false,
    defaultValue: 'planifiee'
  },
  observations: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'SessionExamen',
  tableName: MODULE_TABLE_PREFIX + 'sessions_examens',
  timestamps: true
})
