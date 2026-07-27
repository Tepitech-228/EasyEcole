import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhPret } from "./RhPret";

export class RhRemboursementPret extends Model<InferAttributes<RhRemboursementPret>, InferCreationAttributes<RhRemboursementPret>> {
  declare id: CreationOptional<string>
  declare pretId: ForeignKey<RhPret['id']>
  declare dateRemboursement: string
  declare montant: number
  declare soldeApres: number
  declare type: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

RhRemboursementPret.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  pretId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  dateRemboursement: { type: DataTypes.DATEONLY, allowNull: false },
  montant: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  soldeApres: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  type: { type: DataTypes.ENUM('prelevement', 'versement'), defaultValue: 'prelevement' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'RemboursementPret',
  tableName: MODULE_TABLE_PREFIX + 'remboursements_pret',
  timestamps: true
})
