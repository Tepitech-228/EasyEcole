import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../StockModule";

export class InventaireStock extends Model<InferAttributes<InventaireStock>, InferCreationAttributes<InventaireStock>> {
  declare id: CreationOptional<string>
  declare reference: string
  declare dateDebut: string
  declare dateFin: CreationOptional<string>
  declare statut: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

InventaireStock.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  reference: { type: new DataTypes.STRING, allowNull: false, unique: true },
  dateDebut: { type: DataTypes.DATEONLY, allowNull: false },
  dateFin: { type: DataTypes.DATEONLY, allowNull: true },
  statut: { type: DataTypes.ENUM('en_cours', 'cloture'), defaultValue: 'en_cours' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'InventaireStock',
  tableName: MODULE_TABLE_PREFIX + 'inventaire_stock',
  timestamps: true
})
