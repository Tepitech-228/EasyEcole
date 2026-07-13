
import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Apprenant } from "./Apprenant";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AuthModule";

export class InformationsSalarieApprenant extends Model<InferAttributes<InformationsSalarieApprenant>, InferCreationAttributes<InformationsSalarieApprenant>> {
  declare id: CreationOptional<string>
  declare estSalarie: CreationOptional<boolean>
  declare profession: CreationOptional<string>
  declare entreprise: CreationOptional<string>
  declare apprenantId: ForeignKey<Apprenant['id']>
  declare apprenant?: NonAttribute<Apprenant>
  
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

InformationsSalarieApprenant.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  estSalarie: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  profession: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  entreprise: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName:  MODULE_MODEL_PREFIX + 'InformationsSalarieApprenant',
  tableName:  MODULE_TABLE_PREFIX + 'informations_salarie_apprenants',
  timestamps: true
})