import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhEmploye } from "./RhEmploye";
import { RhPoste } from "./RhPoste";

export class RhDepartement extends Model<InferAttributes<RhDepartement>, InferCreationAttributes<RhDepartement>> {
  declare id: CreationOptional<string>
  declare nom: string
  declare description: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare employes?: NonAttribute<RhEmploye[]>
  declare postes?: NonAttribute<RhPoste[]>

  declare static associations: {
    employes: Association<RhDepartement, RhEmploye>
    postes: Association<RhDepartement, RhPoste>
  }
}

RhDepartement.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  nom: {
    type: new DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Departement',
  tableName: MODULE_TABLE_PREFIX + 'departements',
  timestamps: true
})
