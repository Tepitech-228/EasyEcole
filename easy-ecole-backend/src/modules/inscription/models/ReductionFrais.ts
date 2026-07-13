import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { FraisParcours } from "./FraisParcours";

export type TypeReduction = 'bourse' | 'fratrie' | 'merite' | 'personnalisee';
export type ModeReduction = 'pourcentage' | 'montant_fixe';

export class ReductionFrais extends Model<InferAttributes<ReductionFrais>, InferCreationAttributes<ReductionFrais>> {
  declare id: CreationOptional<number>
  declare type: TypeReduction
  declare mode: ModeReduction
  declare valeur: number
  declare description: CreationOptional<string | null>
  declare dateDebut: CreationOptional<Date | null>
  declare dateFin: CreationOptional<Date | null>
  declare actif: CreationOptional<boolean>

  declare fraisParcoursId: ForeignKey<FraisParcours['id']>
  declare fraisParcours?: NonAttribute<FraisParcours>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    fraisParcours: Association<ReductionFrais, FraisParcours>,
  };
}

ReductionFrais.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('bourse', 'fratrie', 'merite', 'personnalisee'),
    allowNull: false
  },
  mode: {
    type: DataTypes.ENUM('pourcentage', 'montant_fixe'),
    allowNull: false
  },
  valeur: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dateDebut: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  dateFin: {
    type: DataTypes.DATEONLY,
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
  modelName: MODULE_MODEL_PREFIX + 'ReductionFrais',
  tableName: MODULE_TABLE_PREFIX + 'reduction_frais',
  timestamps: true
})
