import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { Support } from "./Support";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class ProgressionApprenant extends Model<InferAttributes<ProgressionApprenant>, InferCreationAttributes<ProgressionApprenant>> {
  declare id: CreationOptional<string>
  declare supportId: ForeignKey<Support['id']>
  declare apprenantId: ForeignKey<Utilisateur['id']>
  declare termine: CreationOptional<boolean>
  declare tempsPasse: CreationOptional<number>
  declare dernierAcces: CreationOptional<Date>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare support?: NonAttribute<Support>
  declare apprenant?: NonAttribute<Utilisateur>

  declare static associations: {
    support: Association<ProgressionApprenant, Support>
    apprenant: Association<ProgressionApprenant, Utilisateur>
  };
}

ProgressionApprenant.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  supportId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  apprenantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  termine: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tempsPasse: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  dernierAcces: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'ProgressionApprenant',
  tableName: MODULE_TABLE_PREFIX + 'progression_apprenant',
  timestamps: true
})
