import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { DatabaseConnection } from '../../../core/helpers/DatabaseConnection';

export class Document extends Model<InferAttributes<Document>, InferCreationAttributes<Document>> {
  declare id: CreationOptional<number>;
  declare cheminRelatif: string;
  declare nomFichier: string;
  declare taille: CreationOptional<number>;
  declare sha256: CreationOptional<string | null>;
  declare hash: CreationOptional<string | null>;
  declare direction: CreationOptional<'cree' | 'recu'>;
  declare typeDocument: CreationOptional<string | null>;
  declare mimeType: CreationOptional<string | null>;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

Document.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  cheminRelatif: {
    type: new DataTypes.STRING(1000),
    allowNull: false
  },
  nomFichier: {
    type: new DataTypes.STRING(255),
    allowNull: false
  },
  taille: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  sha256: {
    type: DataTypes.CHAR(64),
    allowNull: true
  },
  hash: {
    type: DataTypes.CHAR(64),
    allowNull: true
  },
  direction: {
    type: DataTypes.ENUM('cree', 'recu'),
    allowNull: false,
    defaultValue: 'cree'
  },
  typeDocument: {
    type: new DataTypes.STRING(100),
    allowNull: true
  },
  mimeType: {
    type: new DataTypes.STRING(120),
    allowNull: true,
    defaultValue: 'application/pdf'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  tableName: 'documents',
  timestamps: true,
  freezeTableName: true
});

export default Document;
