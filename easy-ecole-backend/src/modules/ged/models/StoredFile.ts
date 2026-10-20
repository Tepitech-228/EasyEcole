import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";

export type StoredFileCategory = "academique" | "financier" | "administratif" | "autre";
export type StoredFileOrigin = "import" | "legacy";

export default class StoredFile extends Model<InferAttributes<StoredFile>, InferCreationAttributes<StoredFile>> {
  declare id: CreationOptional<number>
  declare originKey: string
  declare originType: StoredFileOrigin
  declare sourceTable: CreationOptional<string | null>
  declare sourceRecordId: CreationOptional<string | null>
  declare sourceColumn: CreationOptional<string | null>
  declare titre: string
  declare nomFichier: string
  declare relativePath: string
  declare mimeType: string
  declare taille: number
  declare integrityHash: CreationOptional<string | null>
  declare categorie: StoredFileCategory
  declare anneeAcademiqueId: CreationOptional<number | null>
  declare etablissementId: CreationOptional<number | null>
  declare filiereId: CreationOptional<number | null>
  declare filiere: CreationOptional<string | null>
  declare niveauEtudeId: CreationOptional<number | null>
  declare parcoursId: CreationOptional<number | null>
  declare classeId: CreationOptional<number | null>
  declare createdBy: CreationOptional<number | null>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

StoredFile.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  originKey: { type: DataTypes.STRING(500), allowNull: false, unique: true },
  originType: { type: DataTypes.ENUM("import", "legacy"), allowNull: false },
  sourceTable: { type: DataTypes.STRING(100), allowNull: true },
  sourceRecordId: { type: DataTypes.STRING(191), allowNull: true },
  sourceColumn: { type: DataTypes.STRING(100), allowNull: true },
  titre: { type: DataTypes.STRING(255), allowNull: false },
  nomFichier: { type: DataTypes.STRING(255), allowNull: false },
  relativePath: { type: DataTypes.STRING(1000), allowNull: false },
  mimeType: { type: DataTypes.STRING(120), allowNull: false },
  taille: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, defaultValue: 0 },
  integrityHash: { type: DataTypes.CHAR(64), allowNull: true },
  categorie: {
    type: DataTypes.ENUM("academique", "financier", "administratif", "autre"),
    allowNull: false,
    defaultValue: "autre"
  },
  anneeAcademiqueId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  etablissementId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  filiereId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  filiere: { type: DataTypes.STRING(191), allowNull: true },
  niveauEtudeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  parcoursId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  classeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  createdBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: "StoredFile",
  tableName: "ged_fichiers_stockes",
  timestamps: true
});
