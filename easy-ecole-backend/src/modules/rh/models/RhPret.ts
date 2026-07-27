import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhEmploye } from "./RhEmploye";

export class RhPret extends Model<InferAttributes<RhPret>, InferCreationAttributes<RhPret>> {
  declare id: CreationOptional<string>
  declare employeId: ForeignKey<RhEmploye['id']>
  declare typePret: CreationOptional<string>
  declare montant: number
  declare mensualite: CreationOptional<number>
  declare nombreMois: number
  declare dateOctroi: string
  declare datePremierRemboursement: CreationOptional<string>
  declare soldeRestant: CreationOptional<number>
  declare statut: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

RhPret.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  employeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  typePret: { type: DataTypes.ENUM('avance', 'pret', 'acompte'), defaultValue: 'pret' },
  montant: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  mensualite: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  nombreMois: { type: DataTypes.INTEGER, allowNull: false },
  dateOctroi: { type: DataTypes.DATEONLY, allowNull: false },
  datePremierRemboursement: { type: DataTypes.DATEONLY, allowNull: true },
  soldeRestant: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  statut: { type: DataTypes.ENUM('actif', 'rembourse', 'impaye'), defaultValue: 'actif' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Pret',
  tableName: MODULE_TABLE_PREFIX + 'prets',
  timestamps: true
})
