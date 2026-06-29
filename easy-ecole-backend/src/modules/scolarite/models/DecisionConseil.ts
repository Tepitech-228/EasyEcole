import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";
import { ConseilClasse } from "./ConseilClasse";

export class DecisionConseil extends Model<InferAttributes<DecisionConseil>, InferCreationAttributes<DecisionConseil>> {
  declare id: CreationOptional<string>
  declare conseilClasseId: ForeignKey<ConseilClasse['id']>
  declare theme: string
  declare description: string

  declare conseilClasse?: NonAttribute<ConseilClasse>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    conseilClasse: Association<DecisionConseil, ConseilClasse>
  };
}

DecisionConseil.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  conseilClasseId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  theme: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'DecisionConseil',
  tableName: MODULE_TABLE_PREFIX + 'decisions_conseil',
  timestamps: true
})
