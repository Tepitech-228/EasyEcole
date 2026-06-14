import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { TypesEvaluation } from "../../../core/enums/TypesEvaluation";
import { PeriodesEvaluation } from "../../../core/enums/PeriodesEvaluation";
import { MatierePrerequis } from "./MatierePrerequis";
import { Parcours } from "./Parcours";
import { NiveauEtude } from "./NiveauEtude";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";

export class PrerequisParcours extends Model<InferAttributes<PrerequisParcours>, InferCreationAttributes<PrerequisParcours>> {
  declare id: CreationOptional<string>
  declare noteRequise: number
  declare typeEvaluation: TypesEvaluation
  declare periodeEvaluation: PeriodesEvaluation
  declare parcoursId: ForeignKey<Parcours['id']>
  declare parcours?: NonAttribute<Parcours>
  declare niveauEtudeId: ForeignKey<NiveauEtude['id']>
  declare niveauEtude?: NonAttribute<NiveauEtude>
  declare matierePrerequisId: ForeignKey<MatierePrerequis['id']>
  declare matierePrerequis?: NonAttribute<MatierePrerequis>
  
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    parcours: Association<PrerequisParcours, Parcours>
    niveauEtude: Association<PrerequisParcours, NiveauEtude>
    matierePrerequis: Association<PrerequisParcours, MatierePrerequis>
  };
}

PrerequisParcours.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  noteRequise: {
    type: DataTypes.FLOAT.UNSIGNED,
    allowNull: false
  },
  typeEvaluation: {
    type: DataTypes.ENUM,
    values: [TypesEvaluation.DST, TypesEvaluation.COMPO, TypesEvaluation.MOY, TypesEvaluation.EXAMEN],
    defaultValue: TypesEvaluation.MOY,
    allowNull: false
  },
  periodeEvaluation: {
    type: DataTypes.ENUM,
    values: [PeriodesEvaluation.TRIM1, PeriodesEvaluation.TRIM2, PeriodesEvaluation.TRIM3, PeriodesEvaluation.SEM1, PeriodesEvaluation.SEM2, PeriodesEvaluation.EXAM],
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'PrerequisParcours',
  tableName: MODULE_TABLE_PREFIX + 'prerequis_parcours',
  timestamps: true
})