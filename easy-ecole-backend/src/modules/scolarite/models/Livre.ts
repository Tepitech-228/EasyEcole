import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class Livre extends Model<InferAttributes<Livre>, InferCreationAttributes<Livre>> {
  declare id: CreationOptional<string>
  declare titre: string
  declare auteur: string
  declare description: CreationOptional<string>
  declare fichier: string
  declare taille: CreationOptional<string>
  declare consultations: CreationOptional<number>

  declare uploaderId: ForeignKey<Utilisateur['id']>
  declare uploader?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    uploader: Association<Livre, Utilisateur>
  }
}

Livre.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  titre: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  auteur: {
    type: new DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Inconnu'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fichier: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  taille: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  consultations: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Livre',
  tableName: MODULE_TABLE_PREFIX + 'livres',
  timestamps: true
})
