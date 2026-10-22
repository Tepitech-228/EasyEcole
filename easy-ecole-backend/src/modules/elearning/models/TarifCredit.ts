import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";

export class TarifCredit extends Model<InferAttributes<TarifCredit>, InferCreationAttributes<TarifCredit>> {
  declare id: CreationOptional<number>;
  declare cle: string;
  declare libelle: string;
  declare valeur: number;
  declare unite: CreationOptional<string>;
  declare dateEffet: Date;
  declare anneeAcademiqueId: CreationOptional<number | null>;
  declare actif: CreationOptional<boolean>;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

TarifCredit.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  cle: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  libelle: { type: DataTypes.STRING(255), allowNull: false },
  valeur: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  unite: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "FCFA" },
  dateEffet: { type: DataTypes.DATEONLY, allowNull: false },
  anneeAcademiqueId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  actif: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + "TarifCredit",
  tableName: MODULE_TABLE_PREFIX + "tarifs_credit",
  timestamps: true,
});
