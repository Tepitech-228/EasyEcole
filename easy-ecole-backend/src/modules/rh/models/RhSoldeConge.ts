import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhEmploye } from "./RhEmploye";

export class RhSoldeConge extends Model<InferAttributes<RhSoldeConge>, InferCreationAttributes<RhSoldeConge>> {
  declare id: CreationOptional<number>
  declare employeId: ForeignKey<RhEmploye['id']>
  declare annee: number
  declare typeConge: 'annuel' | 'maladie' | 'exceptionnel'
  declare total: number
  declare pris: CreationOptional<number>
  declare reste: CreationOptional<number>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>

  declare employe?: NonAttribute<RhEmploye>

  declare static associations: {
    employe: Association<RhSoldeConge, RhEmploye>
  }
}

RhSoldeConge.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  employeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  annee: { type: DataTypes.INTEGER, allowNull: false },
  typeConge: { type: DataTypes.ENUM('annuel', 'maladie', 'exceptionnel'), allowNull: false },
  total: { type: DataTypes.DECIMAL(5, 1), allowNull: false },
  pris: { type: DataTypes.DECIMAL(5, 1), defaultValue: 0 },
  reste: { type: DataTypes.DECIMAL(5, 1), allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'SoldeConge',
  tableName: MODULE_TABLE_PREFIX + 'soldes_conge',
  timestamps: true
})
