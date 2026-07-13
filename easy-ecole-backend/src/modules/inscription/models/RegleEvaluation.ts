import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Parcours } from "./Parcours";

export class RegleEvaluation extends Model<InferAttributes<RegleEvaluation>, InferCreationAttributes<RegleEvaluation>> {
  declare id: CreationOptional<number>
  declare parcoursId: ForeignKey<Parcours['id'] | null>
  declare semestre: CreationOptional<string | null>
  declare type: string
  declare valeur: string
  declare actif: CreationOptional<boolean>
  declare description: CreationOptional<string | null>

  declare parcours?: NonAttribute<Parcours>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare readonly deletedAt: CreationOptional<Date | null>

  declare static associations: {
    parcours: Association<RegleEvaluation, Parcours>
  }
}

RegleEvaluation.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  parcoursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  semestre: {
    type: DataTypes.ENUM('semestre1', 'semestre2', 'semestre3', 'semestre4', 'semestre5', 'semestre6'),
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('compensation', 'seuil_eliminatoire', 'note_minimale', 'validation_credit', 'regle_passage'),
    allowNull: false
  },
  valeur: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  actif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'RegleEvaluation',
  tableName: MODULE_TABLE_PREFIX + 'regles_evaluation',
  timestamps: true
})
