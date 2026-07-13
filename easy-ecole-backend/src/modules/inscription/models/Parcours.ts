import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { NiveauEtude } from "./NiveauEtude";
import { PrerequisParcours } from "./PrerequisParcours";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Cours } from "./Cours";

export class Parcours extends Model<InferAttributes<Parcours>, InferCreationAttributes<Parcours>> {
  declare id: CreationOptional<string>
  declare titre: string
  declare description: CreationOptional<string>
  declare type: CreationOptional<string>
  declare niveauEtudeId: ForeignKey<NiveauEtude['id']>
  declare niveauEtude?: NonAttribute<NiveauEtude>
  declare prerequisParcours?: NonAttribute<PrerequisParcours[]>
  declare cours?: NonAttribute<Cours[]>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    niveauEtude: Association<Parcours, NiveauEtude>
    prerequisParcours: Association<Parcours, PrerequisParcours>
    cours: Association<Parcours, Cours>
  };
}

Parcours.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  titre: {
    type: new DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('LICENCE', 'MASTER', 'DOCTORAT'),
    allowNull: true
  },
  niveauEtudeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Parcours',
  tableName: MODULE_TABLE_PREFIX + 'parcours',
  timestamps: true
})