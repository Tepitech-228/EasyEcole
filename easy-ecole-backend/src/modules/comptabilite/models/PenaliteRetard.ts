import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ComptabiliteModule";

export class PenaliteRetard extends Model<InferAttributes<PenaliteRetard>, InferCreationAttributes<PenaliteRetard>> {
  declare id: CreationOptional<number>
  declare echeanceId: number
  declare montant: number
  declare calcul: string
  declare dateApplication: Date
  declare payee: boolean

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

PenaliteRetard.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  echeanceId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  montant: {
    type: DataTypes.DECIMAL(12, 0),
    allowNull: false
  },
  calcul: {
    type: new DataTypes.STRING(255),
    allowNull: false
  },
  dateApplication: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  payee: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'PenaliteRetard',
  tableName: MODULE_TABLE_PREFIX + 'penalites_retard',
  timestamps: true
})
