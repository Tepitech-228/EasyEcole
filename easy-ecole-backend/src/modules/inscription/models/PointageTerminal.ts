import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Etablissement } from "../../etablissement/models/Etablissement";

export class PointageTerminal extends Model<InferAttributes<PointageTerminal>, InferCreationAttributes<PointageTerminal>> {
  declare id: CreationOptional<number>
  declare serialNumber: string
  declare nom: string
  declare sourceIp: string
  declare etablissementId: ForeignKey<Etablissement["id"]>
  declare protocol: CreationOptional<"zkteco_adms" | "hikvision_isapi">
  declare hikvisionPort: CreationOptional<number | null>
  declare hikvisionHttps: CreationOptional<boolean>
  declare hikvisionUsername: CreationOptional<string | null>
  declare hikvisionPasswordEncrypted: CreationOptional<string | null>
  declare actif: CreationOptional<boolean>
  declare attStamp: CreationOptional<number>
  declare lastSeenAt: CreationOptional<Date | null>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
}

PointageTerminal.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  serialNumber: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true
  },
  nom: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  sourceIp: {
    type: DataTypes.STRING(45),
    allowNull: false
  },
  etablissementId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  protocol: {
    type: DataTypes.ENUM("zkteco_adms", "hikvision_isapi"),
    allowNull: false,
    defaultValue: "zkteco_adms"
  },
  hikvisionPort: {
    type: DataTypes.SMALLINT.UNSIGNED,
    allowNull: true
  },
  hikvisionHttps: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  hikvisionUsername: {
    type: DataTypes.STRING(120),
    allowNull: true
  },
  hikvisionPasswordEncrypted: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  actif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  attStamp: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  lastSeenAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + "PointageTerminal",
  tableName: MODULE_TABLE_PREFIX + "pointage_terminaux",
  timestamps: true
})
