import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../GedModule";

class GedNotification extends Model<InferAttributes<GedNotification>, InferCreationAttributes<GedNotification>> {
  declare id: CreationOptional<number>
  declare documentId: number
  declare type: string
  declare message: string
  declare destinataireId: CreationOptional<number | null>
  declare lu: CreationOptional<boolean>
  declare luAt: CreationOptional<Date | null>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

GedNotification.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  documentId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('dua_expiration', 'dua_approche', 'destruction_imminente', 'signature_demandee', 'signature_effectuee'),
    allowNull: false
  },
  message: {
    type: new DataTypes.STRING(500),
    allowNull: false
  },
  destinataireId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  lu: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  luAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: false,
  modelName: MODULE_MODEL_PREFIX + 'GedNotification',
  tableName: MODULE_TABLE_PREFIX + 'notifications',
  timestamps: true
});

export default GedNotification;
