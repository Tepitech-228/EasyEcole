import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../GedModule";

export default class BackupRecord extends Model<InferAttributes<BackupRecord>, InferCreationAttributes<BackupRecord>> {
  declare id: CreationOptional<number>
  declare path: string
  declare totalDocuments: number
  declare totalSize: number
  declare status: CreationOptional<string>
  declare startedBy: number
  declare completedAt: CreationOptional<Date | null>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

BackupRecord.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  path: {
    type: new DataTypes.STRING(500),
    allowNull: false
  },
  totalDocuments: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  totalSize: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM("pending", "completed", "failed", "restored"),
    allowNull: false,
    defaultValue: "pending"
  },
  startedBy: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: false,
  modelName: MODULE_MODEL_PREFIX + 'BackupRecord',
  tableName: MODULE_TABLE_PREFIX + 'backups',
  timestamps: true
});
