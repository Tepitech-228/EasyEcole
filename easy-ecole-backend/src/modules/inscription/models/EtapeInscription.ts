import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Session } from "./Session";

export class EtapeInscription extends Model<InferAttributes<EtapeInscription>, InferCreationAttributes<EtapeInscription>> {
  declare id: CreationOptional<string>
  declare libelle: string
  declare ordre: number

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

EtapeInscription.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  libelle: {
    type: new DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  ordre: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    unique: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'EtapeInscription',
  tableName: MODULE_TABLE_PREFIX + 'etapes_inscription',
  timestamps: true
})