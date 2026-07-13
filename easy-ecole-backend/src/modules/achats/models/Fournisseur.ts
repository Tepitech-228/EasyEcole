import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AchatsModule";

export class Fournisseur extends Model<InferAttributes<Fournisseur>, InferCreationAttributes<Fournisseur>> {
  declare id: CreationOptional<string>
  declare nom: string
  declare contact: CreationOptional<string>
  declare email: CreationOptional<string>
  declare telephone: CreationOptional<string>
  declare adresse: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

Fournisseur.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  nom: { type: new DataTypes.STRING, allowNull: false },
  contact: { type: new DataTypes.STRING, allowNull: true },
  email: { type: new DataTypes.STRING, allowNull: true },
  telephone: { type: new DataTypes.STRING, allowNull: true },
  adresse: { type: DataTypes.TEXT, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Fournisseur',
  tableName: MODULE_TABLE_PREFIX + 'fournisseurs',
  timestamps: true
})
