import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../GedModule";
import Domain from "./Domain";

class DocumentType extends Model<InferAttributes<DocumentType>, InferCreationAttributes<DocumentType>> {
  declare id: CreationOptional<number>
  declare domainId: ForeignKey<Domain['id']>
  declare code: string
  declare shortCode: CreationOptional<string>
  declare label: string
  declare defaultConfidentiality: CreationOptional<string>
  declare duaDurationYears: CreationOptional<number>
  declare isPermanent: CreationOptional<boolean>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare readonly deletedAt: CreationOptional<Date>

  declare domain?: NonAttribute<Domain>
}

DocumentType.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  domainId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  code: {
    type: new DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  shortCode: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  label: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  defaultConfidentiality: {
    type: DataTypes.ENUM('public', 'interne', 'restreint', 'confidentiel'),
    allowNull: false,
    defaultValue: 'interne'
  },
  duaDurationYears: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  isPermanent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'DocumentType',
  tableName: MODULE_TABLE_PREFIX + 'document_types',
  timestamps: true
});

DocumentType.belongsTo(Domain, { foreignKey: 'domainId', as: 'domain' });

export default DocumentType;
