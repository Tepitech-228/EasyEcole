import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { PointageTerminal } from "./PointageTerminal";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Etablissement } from "../../etablissement/models/Etablissement";
import { Pointage } from "./Pointage";

export class PointageTerminalEvent extends Model<InferAttributes<PointageTerminalEvent>, InferCreationAttributes<PointageTerminalEvent>> {
  declare id: CreationOptional<number>
  declare terminalId: ForeignKey<PointageTerminal["id"]>
  declare utilisateurId: ForeignKey<Utilisateur["id"]> | null
  declare etablissementId: ForeignKey<Etablissement["id"]>
  declare pointageId: ForeignKey<Pointage["id"]> | null
  declare pin: string
  declare date: string
  declare heure: string
  declare statusCode: number
  declare verifyType: number
  declare statut: "enregistre" | "refuse" | "en_attente"
  declare motifRefus: CreationOptional<string | null>
  declare fingerprint: string
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
}

PointageTerminalEvent.init({
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
    allowNull: true
  },
  etablissementId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  pointageId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  pin: {
    type: DataTypes.STRING(64),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  heure: {
    type: DataTypes.TIME,
    allowNull: false
  },
  statusCode: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  verifyType: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  statut: {
    type: DataTypes.ENUM("enregistre", "refuse", "en_attente"),
    allowNull: false
  },
  motifRefus: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  fingerprint: {
    type: DataTypes.CHAR(64),
    allowNull: false,
    unique: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + "PointageTerminalEvent",
  tableName: MODULE_TABLE_PREFIX + "pointage_terminal_events",
  timestamps: true
})
