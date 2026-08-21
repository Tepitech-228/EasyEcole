import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";

export class TypeOperationBordereau extends Model<InferAttributes<TypeOperationBordereau>, InferCreationAttributes<TypeOperationBordereau>> {
  declare id: CreationOptional<number>
  declare code: string
  declare libelle: string
  declare actif: CreationOptional<boolean>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

TypeOperationBordereau.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  code: {
    type: new DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  libelle: {
    type: new DataTypes.STRING(100),
    allowNull: false
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'TypeOperationBordereau',
  tableName: MODULE_TABLE_PREFIX + 'types_operations_bordereau',
  timestamps: true
})
