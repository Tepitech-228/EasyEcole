import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, Association, HasManyGetAssociationsMixin, HasManyCreateAssociationMixin } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";
import { DecisionConseil } from "./DecisionConseil";

export class ConseilClasse extends Model<InferAttributes<ConseilClasse>, InferCreationAttributes<ConseilClasse>> {
  declare id: CreationOptional<string>
  declare classe: string
  declare date: Date
  declare trimestre: number
  declare president: string
  declare statut: string

  declare decisions?: NonAttribute<DecisionConseil[]>

  declare getDecisions: HasManyGetAssociationsMixin<DecisionConseil>
  declare createDecision: HasManyCreateAssociationMixin<DecisionConseil>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    decisions: Association<ConseilClasse, DecisionConseil>
  };
}

ConseilClasse.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  classe: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  trimestre: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  president: {
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
  modelName: MODULE_MODEL_PREFIX + 'ConseilClasse',
  tableName: MODULE_TABLE_PREFIX + 'conseils_classe',
  timestamps: true
})
