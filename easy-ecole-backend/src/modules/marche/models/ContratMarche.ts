import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../MarcheModule";
import { AppelOffre } from "./AppelOffre";
import { ManifestationInteret } from "./ManifestationInteret";

export class ContratMarche extends Model<InferAttributes<ContratMarche>, InferCreationAttributes<ContratMarche>> {
  declare id: CreationOptional<string>
  declare appelOffreId: ForeignKey<AppelOffre['id'] | null>
  declare manifestationInteretId: ForeignKey<ManifestationInteret['id'] | null>
  declare reference: string
  declare objet: string
  declare dateSignature: CreationOptional<Date>
  declare dateDebut: Date
  declare dateFin: Date
  declare montantContractuel: CreationOptional<number>
  declare conditionsParticulieres: CreationOptional<string>
  declare statut: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

ContratMarche.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  appelOffreId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  manifestationInteretId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  reference: { type: DataTypes.STRING, allowNull: false },
  objet: { type: DataTypes.TEXT, allowNull: false },
  dateSignature: { type: DataTypes.DATEONLY, allowNull: true },
  dateDebut: { type: DataTypes.DATEONLY, allowNull: false },
  dateFin: { type: DataTypes.DATEONLY, allowNull: false },
  montantContractuel: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  conditionsParticulieres: { type: DataTypes.TEXT, allowNull: true },
  statut: { type: DataTypes.ENUM('signe', 'encours', 'termine', 'resile'), defaultValue: 'signe' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'ContratMarche',
  tableName: MODULE_TABLE_PREFIX + 'contrats',
  timestamps: true
})
