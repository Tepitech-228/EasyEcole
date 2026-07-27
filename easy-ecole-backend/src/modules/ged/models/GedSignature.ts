import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../GedModule";
import { Utilisateur } from "../../auth/models/Utilisateur";

class GedSignature extends Model<InferAttributes<GedSignature>, InferCreationAttributes<GedSignature>> {
  declare id: CreationOptional<number>
  declare documentId: number
  declare requestedBy: number
  declare requestedAt: CreationOptional<Date>
  declare status: CreationOptional<string>
  declare signedBy: CreationOptional<number>
  declare signedAt: CreationOptional<Date>
  declare rejectReason: CreationOptional<string>
  declare rejectedBy: CreationOptional<number>
  declare rejectedAt: CreationOptional<Date>

  declare requester?: NonAttribute<Utilisateur>
  declare signer?: NonAttribute<Utilisateur>
  declare rejector?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

GedSignature.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  documentId: {
    type: DataTypes.INTEGER.UNSIGNED,
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
    type: DataTypes.ENUM('en_attente', 'signe', 'rejete'),
    allowNull: false,
    defaultValue: 'en_attente'
  },
  signedBy: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  signedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejectReason: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  rejectedBy: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  rejectedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: false,
  modelName: MODULE_MODEL_PREFIX + 'GedSignature',
  tableName: MODULE_TABLE_PREFIX + 'signatures',
  timestamps: true
});

export default GedSignature;
