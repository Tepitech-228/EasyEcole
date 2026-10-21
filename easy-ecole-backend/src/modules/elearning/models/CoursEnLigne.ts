import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { ModuleElearning } from "./ModuleElearning";
import { Salon } from "./Salon";

export class CoursEnLigne extends Model<InferAttributes<CoursEnLigne>, InferCreationAttributes<CoursEnLigne>> {
  declare id: CreationOptional<number>
  declare coursId: CreationOptional<string | null>
  declare titre: string
  declare description: CreationOptional<string>
  declare image: CreationOptional<string>
  declare statut: CreationOptional<"brouillon" | "publie" | "desactive" | string>
  declare enseignantId: CreationOptional<number | null>
  declare format: CreationOptional<string>
  declare code: CreationOptional<string | null>
  declare ueId: CreationOptional<number | null>
  declare niveauEtudeId: CreationOptional<number | null>
  declare anneeAcademiqueId: CreationOptional<number | null>
  declare nbCredits: CreationOptional<number>
  declare coutUnitaire: CreationOptional<number | null>
  declare coutTotal: CreationOptional<number | null>
  declare chargeSupportId: CreationOptional<number | null>
  declare professeurId: CreationOptional<number | null>
  declare datePublication: CreationOptional<Date | null>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare modules?: NonAttribute<ModuleElearning[]>
  declare salons?: NonAttribute<Salon[]>

  declare static associations: {
    modules: Association<CoursEnLigne, ModuleElearning>
    salons: Association<CoursEnLigne, Salon>
  };
}

CoursEnLigne.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  coursId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  titre: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  statut: {
    type: new DataTypes.STRING,
    defaultValue: 'actif'
  },
  enseignantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  format: {
    type: new DataTypes.STRING,
    allowNull: true,
    defaultValue: 'mixte'
  },
  code: { type: DataTypes.STRING(50), allowNull: true },
  ueId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  niveauEtudeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  anneeAcademiqueId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  nbCredits: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  coutUnitaire: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
  coutTotal: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
  chargeSupportId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  professeurId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  datePublication: { type: DataTypes.DATE, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'CoursEnLigne',
  tableName: MODULE_TABLE_PREFIX + 'cours',
  timestamps: true
})
