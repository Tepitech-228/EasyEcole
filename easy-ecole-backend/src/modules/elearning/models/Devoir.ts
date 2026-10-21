import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { CoursEnLigne } from "./CoursEnLigne";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class Devoir extends Model<InferAttributes<Devoir>, InferCreationAttributes<Devoir>> {
  declare id: CreationOptional<number>
  declare titre: string
  declare description: CreationOptional<string>
  declare dateLimite: Date
  declare fichier: CreationOptional<string | null>
  declare coursId: ForeignKey<CoursEnLigne['id']>
  declare cours?: NonAttribute<CoursEnLigne>
  declare enseignantId: ForeignKey<Utilisateur['id']>
  declare enseignant?: NonAttribute<Utilisateur>
  declare semestre: CreationOptional<1 | 2 | null>
  declare anneeAcademiqueId: CreationOptional<number | null>
  declare statut: CreationOptional<"brouillon" | "publie" | "ferme">
  declare consignes: CreationOptional<string | null>
  declare poids: CreationOptional<number>
  declare datePublication: CreationOptional<Date | null>
  declare sujetFichier: CreationOptional<string | null>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare static associations: {
    cours: Association<Devoir, CoursEnLigne>
    enseignant: Association<Devoir, Utilisateur>
  }
}

Devoir.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  titre: { type: new DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  dateLimite: { type: DataTypes.DATE, allowNull: false },
  fichier: { type: new DataTypes.STRING, allowNull: true },
  semestre: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
  anneeAcademiqueId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  statut: { type: DataTypes.ENUM("brouillon", "publie", "ferme"), allowNull: false, defaultValue: "brouillon" },
  consignes: { type: DataTypes.TEXT, allowNull: true },
  poids: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 50 },
  datePublication: { type: DataTypes.DATE, allowNull: true },
  sujetFichier: { type: DataTypes.STRING(500), allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Devoir',
  tableName: MODULE_TABLE_PREFIX + 'devoirs',
  timestamps: true
})
