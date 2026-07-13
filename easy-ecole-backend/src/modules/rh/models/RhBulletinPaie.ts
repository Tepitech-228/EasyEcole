import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhEmploye } from "./RhEmploye";
import { RhPeriodePaie } from "./RhPeriodePaie";
import { RhLigneBulletin } from "./RhLigneBulletin";

export class RhBulletinPaie extends Model<InferAttributes<RhBulletinPaie>, InferCreationAttributes<RhBulletinPaie>> {
  declare id: CreationOptional<string>
  declare employeId: ForeignKey<RhEmploye['id']>
  declare periodeId: ForeignKey<RhPeriodePaie['id']>
  declare totalGains: CreationOptional<number>
  declare totalRetenues: CreationOptional<number>
  declare netAPayer: CreationOptional<number>
  declare statut: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare employe?: NonAttribute<RhEmploye>
  declare periode?: NonAttribute<RhPeriodePaie>
  declare lignesBulletin?: NonAttribute<RhLigneBulletin[]>

  declare static associations: {
    employe: Association<RhBulletinPaie, RhEmploye>
    periode: Association<RhBulletinPaie, RhPeriodePaie>
    lignesBulletin: Association<RhBulletinPaie, RhLigneBulletin>
  }
}

RhBulletinPaie.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  totalGains: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0
  },
  totalRetenues: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0
  },
  netAPayer: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0
  },
  statut: {
    type: DataTypes.ENUM('brouillon', 'validé', 'versé'),
    defaultValue: 'brouillon'
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'BulletinPaie',
  tableName: MODULE_TABLE_PREFIX + 'bulletins_paie',
  timestamps: true
})
