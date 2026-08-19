import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";

export class RhCategorieProfessionnelle extends Model<InferAttributes<RhCategorieProfessionnelle>, InferCreationAttributes<RhCategorieProfessionnelle>> {
  declare id: CreationOptional<string>
  declare code: string
  declare libelle: string
  declare description: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

RhCategorieProfessionnelle.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  code: { type: new DataTypes.STRING, allowNull: false },
  libelle: { type: new DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'CategorieProfessionnelle',
  tableName: MODULE_TABLE_PREFIX + 'categories_professionnelles',
  timestamps: true
})
