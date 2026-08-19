import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ImmobilisationModule";
import { Immobilisation } from "./Immobilisation";

export class Assurance extends Model<InferAttributes<Assurance>, InferCreationAttributes<Assurance>> {
  declare id: CreationOptional<string>
  declare immobilisationId: ForeignKey<Immobilisation['id']>
  declare policeNumber: string
  declare assureur: string
  declare couverture: CreationOptional<string>
  declare primeAnnuelle: CreationOptional<number>
  declare dateDebut: string
  declare dateFin: string
  declare statut: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

Assurance.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  immobilisationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  policeNumber: { type: new DataTypes.STRING, allowNull: false },
  assureur: { type: new DataTypes.STRING, allowNull: false },
  couverture: { type: DataTypes.TEXT, allowNull: true },
  primeAnnuelle: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  dateDebut: { type: DataTypes.DATEONLY, allowNull: false },
  dateFin: { type: DataTypes.DATEONLY, allowNull: false },
  statut: { type: DataTypes.ENUM('active', 'expiree', 'resiliee'), defaultValue: 'active' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Assurance',
  tableName: MODULE_TABLE_PREFIX + 'assurance',
  timestamps: true
})
