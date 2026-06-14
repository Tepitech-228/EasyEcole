import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ImmobilisationModule";
import { Immobilisation } from "./Immobilisation";

export class Acquisition extends Model<InferAttributes<Acquisition>, InferCreationAttributes<Acquisition>> {
  declare id: CreationOptional<string>
  declare immobilisationId: ForeignKey<Immobilisation['id']>
  declare fournisseurNom: string
  declare montant: number
  declare dateAcquisition: string
  declare modeAcquisition: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

Acquisition.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  immobilisationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  fournisseurNom: { type: new DataTypes.STRING, allowNull: false },
  montant: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  dateAcquisition: { type: DataTypes.DATE, allowNull: false },
  modeAcquisition: { type: DataTypes.ENUM('achat', 'don', 'transfert'), defaultValue: 'achat' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Acquisition',
  tableName: MODULE_TABLE_PREFIX + 'acquisition',
  timestamps: true
})
