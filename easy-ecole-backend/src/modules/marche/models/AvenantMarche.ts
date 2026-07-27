import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../MarcheModule";
import { ContratMarche } from "./ContratMarche";

export class AvenantMarche extends Model<InferAttributes<AvenantMarche>, InferCreationAttributes<AvenantMarche>> {
  declare id: CreationOptional<string>
  declare contratMarcheId: ForeignKey<ContratMarche['id']>
  declare reference: string
  declare objet: string
  declare dateSignature: CreationOptional<Date>
  declare montantAvenant: CreationOptional<number>
  declare dureeAvenant: CreationOptional<number>
  declare statut: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

AvenantMarche.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  contratMarcheId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  reference: { type: DataTypes.STRING, allowNull: false },
  objet: { type: DataTypes.TEXT, allowNull: false },
  dateSignature: { type: DataTypes.DATEONLY, allowNull: true },
  montantAvenant: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  dureeAvenant: { type: DataTypes.INTEGER, allowNull: true },
  statut: { type: DataTypes.ENUM('valide', 'applique'), defaultValue: 'valide' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'AvenantMarche',
  tableName: MODULE_TABLE_PREFIX + 'avenants',
  timestamps: true
})
