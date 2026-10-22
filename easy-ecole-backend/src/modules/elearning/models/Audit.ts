import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";

export class Audit extends Model<InferAttributes<Audit>, InferCreationAttributes<Audit>> {
  declare id: CreationOptional<number>;
  declare acteurId: CreationOptional<number | null>;
  declare acteurRole: CreationOptional<string | null>;
  declare action: string;
  declare entite: string;
  declare entiteId: CreationOptional<string | null>;
  declare payload: CreationOptional<object | null>;
  declare dateEvenement: CreationOptional<Date>;
  declare readonly createdAt: CreationOptional<Date>;
}

Audit.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  acteurId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  acteurRole: { type: DataTypes.STRING(50), allowNull: true },
  action: { type: DataTypes.STRING(100), allowNull: false },
  entite: { type: DataTypes.STRING(50), allowNull: false },
  entiteId: { type: DataTypes.STRING(50), allowNull: true },
  payload: { type: DataTypes.JSON, allowNull: true },
  dateEvenement: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  createdAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + "Audit",
  tableName: MODULE_TABLE_PREFIX + "audit",
  timestamps: false,
});
