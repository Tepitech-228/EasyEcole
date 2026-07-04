import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../GedModule";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class SessionGed extends Model<InferAttributes<SessionGed>, InferCreationAttributes<SessionGed>> {
  declare id: CreationOptional<number>
  declare nom: string
  declare description: CreationOptional<string>
  declare startDate: CreationOptional<Date>
  declare endDate: CreationOptional<Date>
  declare folderId: CreationOptional<number>
  declare categorie: CreationOptional<string>
  declare status: CreationOptional<string>
  declare fields: CreationOptional<object>
  declare participantIds: CreationOptional<number[]>
  declare createdBy: ForeignKey<Utilisateur['id']>

  declare documents?: NonAttribute<any[]>
  declare creator?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    creator: Association<SessionGed, Utilisateur>
    documents: Association<SessionGed, any>
    fields: Association<SessionGed, any>
    participants: Association<SessionGed, any>
  }
}

SessionGed.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  nom: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  folderId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  categorie: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: new DataTypes.STRING,
    allowNull: false,
    defaultValue: 'active'
  },
  fields: {
    type: DataTypes.JSON,
    allowNull: true
  },
  participantIds: {
    type: DataTypes.JSON,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'SessionGed',
  tableName: MODULE_TABLE_PREFIX + 'sessions',
  timestamps: true
});
