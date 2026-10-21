import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";

export class Mouvement extends Model<InferAttributes<Mouvement>, InferCreationAttributes<Mouvement>> {
  declare id: CreationOptional<number>;
  declare enveloppeId: number;
  declare type: "credit" | "consommation" | "ajustement";
  declare montant: number;
  declare soldeCourant: number;
  declare commentaire: CreationOptional<string | null>;
  declare referenceType: CreationOptional<string | null>;
  declare referenceId: CreationOptional<number | null>;
  declare dateMouvement: CreationOptional<Date>;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

Mouvement.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  enveloppeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  type: { type: DataTypes.ENUM("credit", "consommation", "ajustement"), allowNull: false },
  montant: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  soldeCourant: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  commentaire: { type: DataTypes.STRING(255), allowNull: true },
  referenceType: { type: DataTypes.STRING(50), allowNull: true },
  referenceId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  dateMouvement: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + "Mouvement",
  tableName: MODULE_TABLE_PREFIX + "mouvements",
  timestamps: true,
});
