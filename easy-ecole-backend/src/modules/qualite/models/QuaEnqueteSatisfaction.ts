import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../QualiteModule";
import { QuaReponseSatisfaction } from "./QuaReponseSatisfaction";

export class QuaEnqueteSatisfaction extends Model<InferAttributes<QuaEnqueteSatisfaction>, InferCreationAttributes<QuaEnqueteSatisfaction>> {
  declare id: CreationOptional<number>
  declare titre: string
  declare description: CreationOptional<string | null>
  declare cible: 'apprenants' | 'parents' | 'personnel' | 'enseignants' | 'tous'
  declare questions: string
  declare dateDebut: Date
  declare dateFin: Date
  declare statut: CreationOptional<'brouillon' | 'active' | 'cloturee'>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>

  declare reponses?: NonAttribute<QuaReponseSatisfaction[]>

  declare static associations: {
    reponses: Association<QuaEnqueteSatisfaction, QuaReponseSatisfaction>
  }
}

QuaEnqueteSatisfaction.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  titre: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  cible: { type: DataTypes.ENUM('apprenants', 'parents', 'personnel', 'enseignants', 'tous'), allowNull: false },
  questions: { type: DataTypes.TEXT, allowNull: false },
  dateDebut: { type: DataTypes.DATEONLY, allowNull: false },
  dateFin: { type: DataTypes.DATEONLY, allowNull: false },
  statut: { type: DataTypes.ENUM('brouillon', 'active', 'cloturee'), defaultValue: 'brouillon' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'EnqueteSatisfaction',
  tableName: MODULE_TABLE_PREFIX + 'enquetes_satisfaction',
  timestamps: true
})
