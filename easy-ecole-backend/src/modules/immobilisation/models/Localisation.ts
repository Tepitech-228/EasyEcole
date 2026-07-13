import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ImmobilisationModule";
import { Batiment } from "./Batiment";

export class Localisation extends Model<InferAttributes<Localisation>, InferCreationAttributes<Localisation>> {
  declare id: CreationOptional<string>
  declare batimentId: ForeignKey<Batiment['id']>
  declare code: string
  declare capacite: CreationOptional<number>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

Localisation.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  batimentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  code: { type: new DataTypes.STRING, allowNull: false, unique: true },
  capacite: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Localisation',
  tableName: MODULE_TABLE_PREFIX + 'localisation',
  timestamps: true
})
