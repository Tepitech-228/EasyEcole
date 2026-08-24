import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";

export class TypeDocument extends Model<InferAttributes<TypeDocument>, InferCreationAttributes<TypeDocument>> {
  declare id: CreationOptional<number>
  declare libelle: string
  declare frais: number
  declare format: CreationOptional<string>
  declare categorie: CreationOptional<string | null>
  declare delaiTraitement: CreationOptional<number | null>
  declare paiementObligatoire: CreationOptional<boolean>
  declare generationAuto: CreationOptional<boolean>
  declare actif: CreationOptional<boolean>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

TypeDocument.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  libelle: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  frais: {
    type: DataTypes.FLOAT.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  format: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  categorie: {
    type: new DataTypes.STRING(80),
    allowNull: true
  },
  delaiTraitement: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  paiementObligatoire: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  generationAuto: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  actif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'TypeDocument',
  tableName: MODULE_TABLE_PREFIX + 'types_document',
  timestamps: true
})
