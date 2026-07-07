import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Parcours } from "./Parcours";
import { NiveauEtude } from "./NiveauEtude";
import { AnneeAcademique } from "./AnneeAcademique";
import { ReductionFrais } from "./ReductionFrais";
import { PenaliteRetard } from "./PenaliteRetard";

export class FraisParcours extends Model<InferAttributes<FraisParcours>, InferCreationAttributes<FraisParcours>> {
  declare id: CreationOptional<number>
  declare montantInscription: CreationOptional<number | null>
  declare montantScolarite: CreationOptional<number | null>
  declare nbMensualites: CreationOptional<number>
  declare fraisBibliotheque: CreationOptional<number | null>
  declare fraisAssurance: CreationOptional<number | null>
  declare fraisLogement: CreationOptional<number | null>
  declare autresFrais: CreationOptional<object | null>

  declare parcoursId: ForeignKey<Parcours['id']>
  declare parcours?: NonAttribute<Parcours>
  declare niveauEtudeId: ForeignKey<NiveauEtude['id']>
  declare niveauEtude?: NonAttribute<NiveauEtude>
  declare anneeAcademiqueId: ForeignKey<AnneeAcademique['id']>
  declare anneeAcademique?: NonAttribute<AnneeAcademique>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare reductions?: NonAttribute<ReductionFrais[]>
  declare penalites?: NonAttribute<PenaliteRetard[]>

  declare static associations: {
    parcours: Association<FraisParcours, Parcours>,
    niveauEtude: Association<FraisParcours, NiveauEtude>,
    anneeAcademique: Association<FraisParcours, AnneeAcademique>,
    reductions: Association<FraisParcours, ReductionFrais>,
    penalites: Association<FraisParcours, PenaliteRetard>,
  };
}

FraisParcours.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  montantInscription: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  montantScolarite: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  nbMensualites: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  fraisBibliotheque: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  fraisAssurance: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  fraisLogement: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  autresFrais: {
    type: DataTypes.JSON,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'FraisParcours',
  tableName: MODULE_TABLE_PREFIX + 'frais_parcours',
  timestamps: true
})
