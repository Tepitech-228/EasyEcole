import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { FraisParcours } from "./FraisParcours";

export type TypePenalite = 'mensualite' | 'inscription' | 'scolarite';

export class PenaliteRetard extends Model<InferAttributes<PenaliteRetard>, InferCreationAttributes<PenaliteRetard>> {
  declare id: CreationOptional<number>
  declare type: TypePenalite
  declare pourcentage: number
  declare nbJoursGrace: CreationOptional<number>
  declare montantMaximum: CreationOptional<number | null>
  declare actif: CreationOptional<boolean>

  declare fraisParcoursId: ForeignKey<FraisParcours['id']>
  declare fraisParcours?: NonAttribute<FraisParcours>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    fraisParcours: Association<PenaliteRetard, FraisParcours>,
  };
}

PenaliteRetard.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('mensualite', 'inscription', 'scolarite'),
    allowNull: false
  },
  pourcentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  nbJoursGrace: {
    type: DataTypes.INTEGER,
    defaultValue: 15
  },
  montantMaximum: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'PenaliteRetard',
  tableName: MODULE_TABLE_PREFIX + 'penalite_retard',
  timestamps: true
})
