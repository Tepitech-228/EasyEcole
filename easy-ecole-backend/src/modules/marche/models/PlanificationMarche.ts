import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../MarcheModule";

export class PlanificationMarche extends Model<InferAttributes<PlanificationMarche>, InferCreationAttributes<PlanificationMarche>> {
  declare id: CreationOptional<string>
  declare libelle: string
  declare dateDebut: Date
  declare dateFin: Date
  declare description: CreationOptional<string>
  declare statut: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

PlanificationMarche.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  libelle: { type: DataTypes.STRING, allowNull: false },
  dateDebut: { type: DataTypes.DATEONLY, allowNull: false },
  dateFin: { type: DataTypes.DATEONLY, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  statut: { type: DataTypes.ENUM('planifie', 'en_cours', 'termine', 'annule'), defaultValue: 'planifie' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'PlanificationMarche',
  tableName: MODULE_TABLE_PREFIX + 'planifications',
  timestamps: true
})
