import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Suggestion } from "./Suggestion";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../CommunicationModule";

export class ReponseSuggestion extends Model<InferAttributes<ReponseSuggestion>, InferCreationAttributes<ReponseSuggestion>> {
  declare id: CreationOptional<string>
  declare suggestionId: ForeignKey<Suggestion['id']>
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare message: string
  declare date: CreationOptional<Date>
  declare suggestion?: NonAttribute<Suggestion>
  declare utilisateur?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    suggestion: Association<ReponseSuggestion, Suggestion>
    utilisateur: Association<ReponseSuggestion, Utilisateur>
  };
}

ReponseSuggestion.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: new Date(),
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'ReponseSuggestion',
  tableName: MODULE_TABLE_PREFIX + 'reponses_suggestion',
  timestamps: true
})
