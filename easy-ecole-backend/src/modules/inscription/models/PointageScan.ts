import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import type { Pointage } from "./Pointage";

export class PointageScan extends Model<InferAttributes<PointageScan>, InferCreationAttributes<PointageScan>> {
  declare id: CreationOptional<number>
  declare heure: string
  declare pointageId: ForeignKey<Pointage["id"]>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

PointageScan.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  heure: {
    type: DataTypes.TIME,
    allowNull: false
  },
  pointageId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + "PointageScan",
  tableName: MODULE_TABLE_PREFIX + "pointage_scans",
  timestamps: true,
  indexes: [
    { name: "idx_ins_pointage_scans_pointage", fields: ["pointageId", "id"] }
  ]
})
