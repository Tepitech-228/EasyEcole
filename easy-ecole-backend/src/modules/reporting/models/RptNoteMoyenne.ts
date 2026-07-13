import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ReportingModule";

export class RptNoteMoyenne extends Model<InferAttributes<RptNoteMoyenne>, InferCreationAttributes<RptNoteMoyenne>> {
  declare id: CreationOptional<string>
  declare classeId: number | null
  declare matiereId: number | null
  declare periode: string | null
  declare moyenneClasse: CreationOptional<number>
  declare min: CreationOptional<number>
  declare max: CreationOptional<number>
  declare nbEtudiants: CreationOptional<number>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

RptNoteMoyenne.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  classeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  matiereId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  periode: { type: new DataTypes.STRING, allowNull: true },
  moyenneClasse: { type: DataTypes.FLOAT, defaultValue: 0 },
  min: { type: DataTypes.FLOAT, defaultValue: 0 },
  max: { type: DataTypes.FLOAT, defaultValue: 0 },
  nbEtudiants: { type: DataTypes.INTEGER, defaultValue: 0 },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'NoteMoyenne',
  tableName: MODULE_TABLE_PREFIX + 'notes_moyennes',
  timestamps: true
})
