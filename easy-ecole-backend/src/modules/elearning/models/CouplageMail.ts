import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { Support } from "./Support";

export class CouplageMail extends Model<InferAttributes<CouplageMail>, InferCreationAttributes<CouplageMail>> {
  declare id: CreationOptional<string>
  declare supportId: ForeignKey<Support['id']>
  declare emailEnvoye: string
  declare dateEnvoi: CreationOptional<Date>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

CouplageMail.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  supportId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  emailEnvoye: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  dateEnvoi: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'CouplageMail',
  tableName: MODULE_TABLE_PREFIX + 'couplages_mail',
  timestamps: true
})
