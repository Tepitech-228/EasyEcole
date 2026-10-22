import { Association, CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { CoursEnLigne } from "./CoursEnLigne";

export class Examen extends Model<InferAttributes<Examen>, InferCreationAttributes<Examen>> {
  declare id: CreationOptional<number>;
  declare coursId: number;
  declare anneeAcademiqueId: number;
  declare dateExamen: CreationOptional<Date | null>;
  declare lieu: CreationOptional<string | null>;
  declare dureeMinutes: CreationOptional<number | null>;
  declare sujetFichier: string;
  declare statut: "brouillon" | "publie" | "termine";
  declare creePar: number;
  declare cours?: NonAttribute<CoursEnLigne>;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
  declare static associations: {
    cours: Association<Examen, CoursEnLigne>;
  };
}

Examen.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  coursId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  anneeAcademiqueId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  dateExamen: { type: DataTypes.DATE, allowNull: true },
  lieu: { type: DataTypes.STRING(255), allowNull: true },
  dureeMinutes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  sujetFichier: { type: DataTypes.STRING(500), allowNull: false },
  statut: { type: DataTypes.ENUM("brouillon", "publie", "termine"), allowNull: false, defaultValue: "brouillon" },
  creePar: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + "Examen",
  tableName: MODULE_TABLE_PREFIX + "examens",
  timestamps: true,
  indexes: [{ unique: true, fields: ["coursId", "anneeAcademiqueId"] }],
});
