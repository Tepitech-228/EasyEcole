import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../GedModule";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class DocumentGed extends Model<InferAttributes<DocumentGed>, InferCreationAttributes<DocumentGed>> {
  declare id: CreationOptional<number>
  declare titre: string
  declare reference: CreationOptional<string>
  declare eleve: CreationOptional<string>
  declare parcours: CreationOptional<string>
  declare categorie: CreationOptional<string>
  declare tags: CreationOptional<string>
  declare nommage: CreationOptional<string>
  declare type: CreationOptional<string>
  declare statut: CreationOptional<string>
  declare fichier: string
  declare taille: CreationOptional<string>
  declare dureeConservation: CreationOptional<string>
  declare archivedUntil: CreationOptional<Date>
  declare isArchived: CreationOptional<boolean>

  declare folderId: CreationOptional<number>
  declare sessionId: CreationOptional<number>
  declare metadata: CreationOptional<object>
  // folder?: NonAttribute<Folder> // forward ref in associations file

  declare uploaderId: ForeignKey<Utilisateur['id']>
  declare uploader?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    uploader: Association<DocumentGed, Utilisateur>
    session: Association<DocumentGed, any>
  }
}

DocumentGed.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  titre: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  reference: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  eleve: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  parcours: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  categorie: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  nommage: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: new DataTypes.STRING,
    allowNull: true,
    defaultValue: 'PDF'
  },
  statut: {
    type: new DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Disponible'
  },
  fichier: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  dureeConservation: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  archivedUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  folderId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  sessionId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  metadata: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  taille: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  uploaderId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'DocumentGed',
  tableName: MODULE_TABLE_PREFIX + 'documents',
  timestamps: true
});
