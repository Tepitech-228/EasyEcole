import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhDepartement } from "./RhDepartement";
import { RhEmploye } from "./RhEmploye";
import { RhOffreEmploi } from "./RhOffreEmploi";

export class RhPoste extends Model<InferAttributes<RhPoste>, InferCreationAttributes<RhPoste>> {
  declare id: CreationOptional<string>
  declare titre: string
  declare description: CreationOptional<string>
  declare departementId: ForeignKey<RhDepartement['id']>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare departement?: NonAttribute<RhDepartement>
  declare employes?: NonAttribute<RhEmploye[]>
  declare offresEmploi?: NonAttribute<RhOffreEmploi[]>

  declare static associations: {
    departement: Association<RhPoste, RhDepartement>
    employes: Association<RhPoste, RhEmploye>
    offresEmploi: Association<RhPoste, RhOffreEmploi>
  }
}

RhPoste.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  titre: {
    type: new DataTypes.STRING,
    allowNull: false
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
  modelName: MODULE_MODEL_PREFIX + 'Poste',
  tableName: MODULE_TABLE_PREFIX + 'postes',
  timestamps: true
})
