import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhBulletinPaie } from "./RhBulletinPaie";
import { RhRubriquePaie } from "./RhRubriquePaie";

export class RhLigneBulletin extends Model<InferAttributes<RhLigneBulletin>, InferCreationAttributes<RhLigneBulletin>> {
  declare id: CreationOptional<string>
  declare bulletinId: ForeignKey<RhBulletinPaie['id']>
  declare rubriqueId: ForeignKey<RhRubriquePaie['id']>
  declare libelle: CreationOptional<string>
  declare base: CreationOptional<number>
  declare taux: CreationOptional<number>
  declare montant: CreationOptional<number>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare bulletin?: NonAttribute<RhBulletinPaie>
  declare rubrique?: NonAttribute<RhRubriquePaie>

  declare static associations: {
    bulletin: Association<RhLigneBulletin, RhBulletinPaie>
    rubrique: Association<RhLigneBulletin, RhRubriquePaie>
  }
}

RhLigneBulletin.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  libelle: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  base: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0
  },
  taux: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0
  },
  montant: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'LigneBulletin',
  tableName: MODULE_TABLE_PREFIX + 'lignes_bulletin',
  timestamps: true
})
