import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";

export class SanctionDiscipline extends Model<InferAttributes<SanctionDiscipline>, InferCreationAttributes<SanctionDiscipline>> {
  declare id: CreationOptional<string>
  declare etudiant: string
  declare matricule: string
  declare classe: string
  declare date: Date
  declare motif: string
  declare sanction: string
  declare statut: string

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

SanctionDiscipline.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  etudiant: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  matricule: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  classe: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  motif: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  sanction: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  statut: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'SanctionDiscipline',
  tableName: MODULE_TABLE_PREFIX + 'sanctions_discipline',
  timestamps: true
})
