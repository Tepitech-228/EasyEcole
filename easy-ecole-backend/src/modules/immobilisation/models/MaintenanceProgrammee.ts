import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ImmobilisationModule";
import { Immobilisation } from "./Immobilisation";

export class MaintenanceProgrammee extends Model<InferAttributes<MaintenanceProgrammee>, InferCreationAttributes<MaintenanceProgrammee>> {
  declare id: CreationOptional<string>
  declare immobilisationId: ForeignKey<Immobilisation['id']>
  declare description: string
  declare periodicite: string
  declare prochaineEcheance: string
  declare actif: CreationOptional<boolean>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

MaintenanceProgrammee.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  immobilisationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  periodicite: { type: new DataTypes.STRING, allowNull: false },
  prochaineEcheance: { type: DataTypes.DATE, allowNull: false },
  actif: { type: DataTypes.BOOLEAN, defaultValue: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'MaintenanceProgrammee',
  tableName: MODULE_TABLE_PREFIX + 'maintenance_programmee',
  timestamps: true
})
