import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Cours } from "./Cours";
import { Ecue } from "./Ecue";

export class Mcc extends Model<InferAttributes<Mcc>, InferCreationAttributes<Mcc>> {
  declare id: CreationOptional<number>
  declare ecueId: ForeignKey<Ecue['id'] | null>
  declare coursId: ForeignKey<Cours['id']>
  declare coefficient: CreationOptional<number>
  declare session: CreationOptional<string>
  declare estEliminatoire: CreationOptional<boolean>
  declare seuilEliminatoire: CreationOptional<number | null>
  declare estObligatoire: CreationOptional<boolean>

  declare ecue?: NonAttribute<Ecue>
  declare cours?: NonAttribute<Cours>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare readonly deletedAt: CreationOptional<Date | null>

  declare static associations: {
    ecue: Association<Mcc, Ecue>
    cours: Association<Mcc, Cours>
  }
}

Mcc.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  ecueId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  coursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  coefficient: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 1
  },
  session: {
    type: DataTypes.ENUM('session1', 'session2'),
    allowNull: false,
    defaultValue: 'session1'
  },
  estEliminatoire: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  seuilEliminatoire: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  estObligatoire: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Mcc',
  tableName: MODULE_TABLE_PREFIX + 'mcc',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['coursId', 'ecueId', 'session'] }
  ]
})
