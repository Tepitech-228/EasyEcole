import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Parcours } from "./Parcours";

export class UniteEnseignement extends Model<InferAttributes<UniteEnseignement>, InferCreationAttributes<UniteEnseignement>> {
  declare id: CreationOptional<number>
  declare code: string
  declare libelle: string
  declare semestre: string
  declare parcoursId: ForeignKey<Parcours['id']>
  declare creditEcts: CreationOptional<number>
  declare objectifs: CreationOptional<string | null>
  declare parcours?: NonAttribute<Parcours>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare readonly deletedAt: CreationOptional<Date | null>

  declare static associations: {
    parcours: Association<UniteEnseignement, Parcours>
  }
}

UniteEnseignement.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: 'code-parcours'
  },
  parcoursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: 'code-parcours'
  },
  libelle: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  semestre: {
    type: DataTypes.ENUM('semestre1', 'semestre2', 'semestre3', 'semestre4', 'semestre5', 'semestre6'),
    allowNull: false
  },
  creditEcts: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: 0
  },
  objectifs: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'UniteEnseignement',
  tableName: MODULE_TABLE_PREFIX + 'unites_enseignement',
  timestamps: true
})
