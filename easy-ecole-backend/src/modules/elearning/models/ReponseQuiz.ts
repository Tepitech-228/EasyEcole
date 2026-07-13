import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { Quiz } from "./Quiz";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class ReponseQuiz extends Model<InferAttributes<ReponseQuiz>, InferCreationAttributes<ReponseQuiz>> {
  declare id: CreationOptional<string>
  declare quizId: ForeignKey<Quiz['id']>
  declare quiz?: NonAttribute<Quiz>
  declare apprenantId: ForeignKey<Utilisateur['id']>
  declare apprenant?: NonAttribute<Utilisateur>
  declare reponses: string
  declare score: CreationOptional<number>
  declare total: CreationOptional<number>
  declare date: CreationOptional<Date>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare static associations: {
    quiz: Association<ReponseQuiz, Quiz>
    apprenant: Association<ReponseQuiz, Utilisateur>
  }
}

ReponseQuiz.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  reponses: { type: DataTypes.TEXT, allowNull: false },
  score: { type: DataTypes.FLOAT, allowNull: true },
  total: { type: DataTypes.INTEGER, allowNull: true },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'ReponseQuiz',
  tableName: MODULE_TABLE_PREFIX + 'reponses_quiz',
  timestamps: true
})
