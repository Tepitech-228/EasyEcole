import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhBulletinPaie } from "./RhBulletinPaie";

export class RhPeriodePaie extends Model<InferAttributes<RhPeriodePaie>, InferCreationAttributes<RhPeriodePaie>> {
  declare id: CreationOptional<string>
  declare mois: number
  declare annee: number
  declare dateDebut: Date
  declare dateFin: Date
  declare statut: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare bulletinsPaie?: NonAttribute<RhBulletinPaie[]>

  declare static associations: {
    bulletinsPaie: Association<RhPeriodePaie, RhBulletinPaie>
  }
}

RhPeriodePaie.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  mois: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  annee: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  dateDebut: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dateFin: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  statut: {
    type: DataTypes.ENUM('ouverte', 'verrouillée'),
    defaultValue: 'ouverte'
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'PeriodePaie',
  tableName: MODULE_TABLE_PREFIX + 'periodes_paie',
  timestamps: true
})
