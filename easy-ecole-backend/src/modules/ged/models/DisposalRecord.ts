import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../GedModule";

class DisposalRecord extends Model<InferAttributes<DisposalRecord>, InferCreationAttributes<DisposalRecord>> {
  declare id: CreationOptional<number>
  declare documentId: number
  declare reason: string
  declare requestedBy: number
  declare requestedAt: CreationOptional<Date>
  declare status: CreationOptional<string>
  declare confirmedBy: CreationOptional<number>
  declare confirmedAt: CreationOptional<Date>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

DisposalRecord.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  documentId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  reason: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  requestedBy: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  requestedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('en_attente', 'validee', 'rejetee'),
    allowNull: false,
    defaultValue: 'en_attente'
  },
  confirmedBy: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  confirmedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: false,
  modelName: MODULE_MODEL_PREFIX + 'DisposalRecord',
  tableName: MODULE_TABLE_PREFIX + 'disposal_records',
  timestamps: true
});

export default DisposalRecord;
