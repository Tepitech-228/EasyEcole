import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhEmploye } from "./RhEmploye";

export class RhTypeContrat extends Model<InferAttributes<RhTypeContrat>, InferCreationAttributes<RhTypeContrat>> {
  declare id: CreationOptional<string>
  declare code: string
  declare libelle: string
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare employes?: NonAttribute<RhEmploye[]>

  declare static associations: {
    employes: Association<RhTypeContrat, RhEmploye>
  }
}

RhTypeContrat.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  code: {
    type: new DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  libelle: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'TypeContrat',
  tableName: MODULE_TABLE_PREFIX + 'types_contrat',
  timestamps: true
})
