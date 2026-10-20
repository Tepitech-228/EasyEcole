import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { PointageTerminal } from "./PointageTerminal";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Etablissement } from "../../etablissement/models/Etablissement";

export class HikvisionEnrollment extends Model<InferAttributes<HikvisionEnrollment>, InferCreationAttributes<HikvisionEnrollment>> {
  declare id: CreationOptional<number>
  declare terminalId: ForeignKey<PointageTerminal["id"]>
  declare utilisateurId: ForeignKey<Utilisateur["id"]>
  declare etablissementId: ForeignKey<Etablissement["id"]>
  declare employeeNo: string
  declare statut: "en_attente" | "en_cours" | "termine"
  declare tentatives: CreationOptional<number>
  declare prochaineTentativeAt: CreationOptional<Date>
  declare derniereErreur: CreationOptional<string | null>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
}

HikvisionEnrollment.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  terminalId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  utilisateurId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  etablissementId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  employeeNo: {
    type: DataTypes.STRING(64),
    allowNull: false
  },
  statut: {
    type: DataTypes.ENUM("en_attente", "en_cours", "termine"),
    allowNull: false,
    defaultValue: "en_attente"
  },
  tentatives: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  prochaineTentativeAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  derniereErreur: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + "HikvisionEnrollment",
  tableName: MODULE_TABLE_PREFIX + "hikvision_enrollments",
  timestamps: true
});
