import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ImmobilisationModule";

export class Inventaire extends Model<InferAttributes<Inventaire>, InferCreationAttributes<Inventaire>> {
  declare id: CreationOptional<string>
  declare anneeFiscal: number
  declare dateDebut: string
  declare dateFin: CreationOptional<string>
  declare statut: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

Inventaire.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  anneeFiscal: { type: DataTypes.INTEGER, allowNull: false },
  dateDebut: { type: DataTypes.DATEONLY, allowNull: false },
  dateFin: { type: DataTypes.DATEONLY, allowNull: true },
  statut: { type: DataTypes.ENUM('en_cours', 'cloture'), defaultValue: 'en_cours' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Inventaire',
  tableName: MODULE_TABLE_PREFIX + 'inventaire',
  timestamps: true
})
