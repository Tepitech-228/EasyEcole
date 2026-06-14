import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ImmobilisationModule";
import { Immobilisation } from "./Immobilisation";

export class Maintenance extends Model<InferAttributes<Maintenance>, InferCreationAttributes<Maintenance>> {
  declare id: CreationOptional<string>
  declare immobilisationId: ForeignKey<Immobilisation['id']>
  declare dateMaintenance: string
  declare type: string
  declare description: string
  declare cout: CreationOptional<number>
  declare prestataire: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

Maintenance.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  immobilisationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  dateMaintenance: { type: DataTypes.DATE, allowNull: false },
  type: { type: DataTypes.ENUM('preventive', 'corrective'), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  cout: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  prestataire: { type: new DataTypes.STRING, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Maintenance',
  tableName: MODULE_TABLE_PREFIX + 'maintenance',
  timestamps: true
})
