import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";

const MODEL_PREFIX = 'EchelleNote';
const TABLE_PREFIX = 'ins_';

export class EchelleNote extends Model<InferAttributes<EchelleNote>, InferCreationAttributes<EchelleNote>> {
  declare id: CreationOptional<number>
  declare libelle: string
  declare noteMin: number
  declare noteMax: number
  declare mention: string
  declare estActive: CreationOptional<boolean>
  declare ordre: CreationOptional<number>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare readonly deletedAt: CreationOptional<Date | null>
}

EchelleNote.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  libelle: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  noteMin: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  noteMax: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  mention: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  estActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  ordre: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODEL_PREFIX,
  tableName: TABLE_PREFIX + 'echelles_notes',
  timestamps: true
})
