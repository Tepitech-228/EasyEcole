import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { CoursEnLigne } from "./CoursEnLigne";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class Devoir extends Model<InferAttributes<Devoir>, InferCreationAttributes<Devoir>> {
  declare id: CreationOptional<string>
  declare titre: string
  declare description: CreationOptional<string>
  declare dateLimite: Date
  declare fichier: CreationOptional<string>
  declare coursId: ForeignKey<CoursEnLigne['id']>
  declare cours?: NonAttribute<CoursEnLigne>
  declare enseignantId: ForeignKey<Utilisateur['id']>
  declare enseignant?: NonAttribute<Utilisateur>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare static associations: {
    cours: Association<Devoir, CoursEnLigne>
    enseignant: Association<Devoir, Utilisateur>
  }
}

Devoir.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  titre: { type: new DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  dateLimite: { type: DataTypes.DATE, allowNull: false },
  fichier: { type: new DataTypes.STRING, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Devoir',
  tableName: MODULE_TABLE_PREFIX + 'devoirs',
  timestamps: true
})
