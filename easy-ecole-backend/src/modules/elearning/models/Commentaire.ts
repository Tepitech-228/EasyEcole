import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { Support } from "./Support";

export class Commentaire extends Model<InferAttributes<Commentaire>, InferCreationAttributes<Commentaire>> {
  declare id: CreationOptional<string>
  declare supportId: ForeignKey<Support['id']>
  declare utilisateurId: number
  declare message: string
  declare date: CreationOptional<Date>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

Commentaire.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  supportId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  utilisateurId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Commentaire',
  tableName: MODULE_TABLE_PREFIX + 'commentaires',
  timestamps: true
})
