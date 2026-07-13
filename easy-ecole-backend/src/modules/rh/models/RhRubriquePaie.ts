import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhLigneBulletin } from "./RhLigneBulletin";

export class RhRubriquePaie extends Model<InferAttributes<RhRubriquePaie>, InferCreationAttributes<RhRubriquePaie>> {
  declare id: CreationOptional<string>
  declare code: string
  declare libelle: string
  declare type: CreationOptional<string>
  declare modeCalcul: CreationOptional<string>
  declare valeur: CreationOptional<number>
  declare imposable: CreationOptional<boolean>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare lignesBulletin?: NonAttribute<RhLigneBulletin[]>

  declare static associations: {
    lignesBulletin: Association<RhRubriquePaie, RhLigneBulletin>
  }
}

RhRubriquePaie.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  code: {
    type: new DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  libelle: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('gain', 'retenue', 'cotisation'),
    defaultValue: 'gain'
  },
  modeCalcul: {
    type: DataTypes.ENUM('fixe', 'pourcentage', 'formule'),
    defaultValue: 'fixe'
  },
  valeur: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0
  },
  imposable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'RubriquePaie',
  tableName: MODULE_TABLE_PREFIX + 'rubriques_paie',
  timestamps: true
})
