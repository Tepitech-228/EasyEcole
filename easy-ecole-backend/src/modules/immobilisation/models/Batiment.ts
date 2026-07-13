import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ImmobilisationModule";
import { Site } from "./Site";

export class Batiment extends Model<InferAttributes<Batiment>, InferCreationAttributes<Batiment>> {
  declare id: CreationOptional<string>
  declare siteId: ForeignKey<Site['id']>
  declare nom: string
  declare adresse: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

Batiment.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  siteId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  nom: { type: new DataTypes.STRING, allowNull: false },
  adresse: { type: DataTypes.TEXT, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Batiment',
  tableName: MODULE_TABLE_PREFIX + 'batiment',
  timestamps: true
})
