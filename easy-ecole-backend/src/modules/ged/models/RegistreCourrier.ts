import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../GedModule";
import { DocumentGed } from "./DocumentGed";

export class RegistreCourrier extends Model<InferAttributes<RegistreCourrier>, InferCreationAttributes<RegistreCourrier>> {
  declare id: CreationOptional<number>
  declare sens: string
  declare numeroOrdre: number
  declare annee: number
  declare dateCourrier: CreationOptional<Date>
  declare expediteur: CreationOptional<string | null>
  declare destinataire: CreationOptional<string | null>
  declare objet: string
  declare modeEnvoi: CreationOptional<string | null>
  declare accuseReception: CreationOptional<boolean>
  declare referenceDocument: CreationOptional<string | null>
  declare annotations: CreationOptional<string | null>
  declare documentId: ForeignKey<DocumentGed['id']> | null
  declare utilisateurId: ForeignKey<number>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

RegistreCourrier.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  sens: {
    type: DataTypes.ENUM('entrant', 'sortant'),
    allowNull: false
  },
  numeroOrdre: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  annee: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  dateCourrier: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  expediteur: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  destinataire: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  objet: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  modeEnvoi: {
    type: DataTypes.ENUM('courrier', 'email', 'remise_main_propre', 'fax'),
    allowNull: true
  },
  accuseReception: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  referenceDocument: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  annotations: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  documentId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  utilisateurId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'RegistreCourrier',
  tableName: MODULE_TABLE_PREFIX + 'registre_courrier',
  timestamps: true
});

export default RegistreCourrier;
