import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../CommunicationModule";

export class Suggestion extends Model<InferAttributes<Suggestion>, InferCreationAttributes<Suggestion>> {
  declare id: CreationOptional<string>
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare type: string
  declare message: string
  declare statut: string
  declare date: CreationOptional<Date>
  declare utilisateur?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    utilisateur: Association<Suggestion, Utilisateur>
  };
}

Suggestion.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  type: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  statut: {
    type: DataTypes.ENUM('ouverte', 'traitee', 'fermee'),
    defaultValue: 'ouverte',
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
  modelName: MODULE_MODEL_PREFIX + 'Suggestion',
  tableName: MODULE_TABLE_PREFIX + 'suggestions',
  timestamps: true
})
