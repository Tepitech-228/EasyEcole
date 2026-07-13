import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";

const MODEL_PREFIX = 'DetteAcademique';
const TABLE_PREFIX = 'ins_';

export class DetteAcademique extends Model<InferAttributes<DetteAcademique>, InferCreationAttributes<DetteAcademique>> {
  declare id: CreationOptional<number>
  declare cursusApprenantId: number
  declare ueId: number
  declare anneeOrigineId: number
  declare anneeAttacheeId: CreationOptional<number | null>
  declare deliberationId: CreationOptional<number | null>
  declare creditEcts: number
  declare nbTentatives: CreationOptional<number>
  declare statut: CreationOptional<string>
  declare dateLimite: CreationOptional<Date | null>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

DetteAcademique.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  cursusApprenantId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  ueId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  anneeOrigineId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  anneeAttacheeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  deliberationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  creditEcts: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  nbTentatives: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  statut: { type: DataTypes.ENUM('active', 'resorbee', 'echeance'), defaultValue: 'active', allowNull: false },
  dateLimite: { type: DataTypes.DATE, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  tableName: TABLE_PREFIX + 'dettes_academiques',
  modelName: MODEL_PREFIX,
  timestamps: true
});
