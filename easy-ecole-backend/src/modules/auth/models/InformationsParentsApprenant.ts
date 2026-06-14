
import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Apprenant } from "./Apprenant";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AuthModule";

export class InformationsParentsApprenant extends Model<InferAttributes<InformationsParentsApprenant>, InferCreationAttributes<InformationsParentsApprenant>> {
  declare id: CreationOptional<string>
  declare pereVivant: CreationOptional<boolean>
  declare nomPrenomsPere: string
  declare professionPere: string
  declare mereVivante: CreationOptional<boolean>
  declare nomPrenomsMere: string
  declare professionMere: string
  declare apprenantId: ForeignKey<Apprenant['id']>
  declare apprenant?: NonAttribute<Apprenant>
  
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

InformationsParentsApprenant.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  pereVivant: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  nomPrenomsPere: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  professionPere: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  mereVivante: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  nomPrenomsMere: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  professionMere: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName:  MODULE_MODEL_PREFIX + 'InformationsParentsApprenant',
  tableName:  MODULE_TABLE_PREFIX + 'informations_parents_apprenants',
  timestamps: true
})