import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { CoursEnLigne } from "./CoursEnLigne";

export class Quiz extends Model<InferAttributes<Quiz>, InferCreationAttributes<Quiz>> {
  declare id: CreationOptional<string>
  declare titre: string
  declare description: CreationOptional<string>
  declare tempsLimite: CreationOptional<number>
  declare questions: string
  declare coursId: ForeignKey<CoursEnLigne['id']>
  declare cours?: NonAttribute<CoursEnLigne>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare static associations: {
    cours: Association<Quiz, CoursEnLigne>
  }
}

Quiz.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  titre: { type: new DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  tempsLimite: { type: DataTypes.INTEGER, allowNull: true },
  questions: { type: DataTypes.TEXT, allowNull: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Quiz',
  tableName: MODULE_TABLE_PREFIX + 'quiz',
  timestamps: true
})
