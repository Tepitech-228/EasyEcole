import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../EtablissementModule";

export class Etablissement extends Model<InferAttributes<Etablissement>, InferCreationAttributes<Etablissement>> {
  declare id: CreationOptional<string>
  declare nom: string
  declare type: CreationOptional<string>
  declare pays: CreationOptional<string>
  declare ville: CreationOptional<string>
  declare adresse: CreationOptional<string>
  declare telephone: CreationOptional<string>
  declare email: CreationOptional<string>
  declare siteWeb: CreationOptional<string>
  declare code: CreationOptional<string>
  declare logo: CreationOptional<string>
  declare devise: CreationOptional<string>
  declare anneeScolaireCourante: CreationOptional<string>
  declare actif: CreationOptional<boolean>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

Etablissement.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  nom: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: true },
  pays: { type: DataTypes.STRING, allowNull: true },
  ville: { type: DataTypes.STRING, allowNull: true },
  adresse: { type: DataTypes.TEXT, allowNull: true },
  telephone: { type: DataTypes.STRING, allowNull: true },
  email: { type: DataTypes.STRING, allowNull: true },
  siteWeb: { type: DataTypes.STRING, allowNull: true },
  code: { type: DataTypes.STRING(10), allowNull: true, unique: true },
  logo: { type: DataTypes.STRING, allowNull: true },
  devise: { type: DataTypes.STRING(10), defaultValue: 'FCFA' },
  anneeScolaireCourante: { type: DataTypes.STRING(20), allowNull: true },
  actif: { type: DataTypes.BOOLEAN, defaultValue: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Etablissement',
  tableName: MODULE_TABLE_PREFIX + 'etablissements',
  timestamps: true
})
