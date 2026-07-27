import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Cours } from "./Cours";

export class Ecue extends Model<InferAttributes<Ecue>, InferCreationAttributes<Ecue>> {
  declare id: CreationOptional<number>
  declare code: string
  declare libelle: string
  declare creditEcts: CreationOptional<number | null>
  declare coefficient: CreationOptional<number | null>
  declare coursId: ForeignKey<Cours['id']>

  declare cours?: NonAttribute<Cours>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare readonly deletedAt: CreationOptional<Date | null>

  declare static associations: {
    cours: Association<Ecue, Cours>
  }
}

Ecue.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  libelle: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  creditEcts: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: true
  },
  coefficient: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    defaultValue: 1.0
  },
  coursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Ecue',
  tableName: MODULE_TABLE_PREFIX + 'ecue',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['code', 'coursId'] }
  ]
})
