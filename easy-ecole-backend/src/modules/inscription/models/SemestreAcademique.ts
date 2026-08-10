import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Parcours } from "./Parcours";
import { AnneeAcademique } from "./AnneeAcademique";

export class SemestreAcademique extends Model<InferAttributes<SemestreAcademique>, InferCreationAttributes<SemestreAcademique>> {
  declare id: CreationOptional<number>
  declare parcoursId: ForeignKey<Parcours['id']>
  declare parcours?: NonAttribute<Parcours>
  declare anneeAcademiqueId: ForeignKey<AnneeAcademique['id']>
  declare anneeAcademique?: NonAttribute<AnneeAcademique>
  declare codeSemestre: string
  declare libelle: string
  declare statut: string
  declare dateDebut: CreationOptional<Date | null>
  declare dateFin: CreationOptional<Date | null>
  declare dateCloture: CreationOptional<Date | null>
  declare cloturePar: CreationOptional<number | null>
  declare commentaire: CreationOptional<string | null>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    parcours: Association<SemestreAcademique, Parcours>
    anneeAcademique: Association<SemestreAcademique, AnneeAcademique>
  }
}

SemestreAcademique.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  parcoursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  anneeAcademiqueId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  codeSemestre: {
    type: DataTypes.ENUM('semestre1', 'semestre2', 'semestre3', 'semestre4', 'semestre5', 'semestre6'),
    allowNull: false
  },
  libelle: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  statut: {
    type: DataTypes.ENUM('planifie', 'en_cours', 'cloture', 'archive'),
    allowNull: false,
    defaultValue: 'planifie'
  },
  dateDebut: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dateFin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dateCloture: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cloturePar: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  commentaire: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'SemestreAcademique',
  tableName: MODULE_TABLE_PREFIX + 'semestres_academiques',
  timestamps: true
})
