import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { UniteEnseignement } from "./UniteEnseignement";
import { Cours } from "./Cours";

export class Mcc extends Model<InferAttributes<Mcc>, InferCreationAttributes<Mcc>> {
  declare id: CreationOptional<number>
  declare ueId: ForeignKey<UniteEnseignement['id']>
  declare coursId: ForeignKey<Cours['id']>
  declare coefficient: CreationOptional<number>
  declare session: CreationOptional<string>
  declare estEliminatoire: CreationOptional<boolean>
  declare seuilEliminatoire: CreationOptional<number | null>
  declare estObligatoire: CreationOptional<boolean>

  declare uniteEnseignement?: NonAttribute<UniteEnseignement>
  declare cours?: NonAttribute<Cours>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare readonly deletedAt: CreationOptional<Date | null>

  declare static associations: {
    uniteEnseignement: Association<Mcc, UniteEnseignement>
    cours: Association<Mcc, Cours>
  }
}

Mcc.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  ueId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
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
    { unique: true, fields: ['ueId', 'coursId', 'session'] }
  ]
})
