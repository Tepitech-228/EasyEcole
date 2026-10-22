import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";

export class AnneeElearning extends Model<InferAttributes<AnneeElearning>, InferCreationAttributes<AnneeElearning>> {
  declare id: CreationOptional<number>;
  declare libelle: string;
  declare dateDebut: Date;
  declare dateFin: Date;
  declare active: CreationOptional<boolean>;
  declare anneeAcademiqueId: CreationOptional<number | null>;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

AnneeElearning.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  libelle: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  dateDebut: { type: DataTypes.DATEONLY, allowNull: false },
  dateFin: { type: DataTypes.DATEONLY, allowNull: false },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  anneeAcademiqueId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + "AnneeElearning",
  tableName: MODULE_TABLE_PREFIX + "annees",
  timestamps: true,
});
