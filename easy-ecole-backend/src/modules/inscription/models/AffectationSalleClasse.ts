import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { SalleDeClasse } from "./SalleDeClasse";
import { Classe } from "./Classe";
import { AnneeAcademique } from "./AnneeAcademique";
import { RegimesCours } from "../../../core/enums/RegimesCours";
import { Etablissement } from "../../etablissement/models/Etablissement";

export class AffectationSalleClasse extends Model<InferAttributes<AffectationSalleClasse>, InferCreationAttributes<AffectationSalleClasse>> {
  declare id: CreationOptional<number>
  declare salleId: ForeignKey<SalleDeClasse['id']>
  declare salle?: NonAttribute<SalleDeClasse>
  declare classeId: ForeignKey<Classe['id']>
  declare classe?: NonAttribute<Classe>
  declare anneeAcademiqueId: ForeignKey<AnneeAcademique['id'] | null>
  declare anneeAcademique?: NonAttribute<AnneeAcademique>
  declare regime: RegimesCours
  declare dateDebut: string
  declare dateFin: string
  declare etablissementId: ForeignKey<Etablissement['id'] | null>
  declare etablissement?: NonAttribute<Etablissement>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    salle: Association<AffectationSalleClasse, SalleDeClasse>,
    classe: Association<AffectationSalleClasse, Classe>,
    anneeAcademique: Association<AffectationSalleClasse, AnneeAcademique>,
    etablissement: Association<AffectationSalleClasse, Etablissement>,
  };
}

AffectationSalleClasse.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  salleId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  classeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  anneeAcademiqueId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  regime: {
    type: DataTypes.ENUM(RegimesCours.JOUR, RegimesCours.SOIR, RegimesCours.JOUR_ET_SOIR),
    allowNull: false,
    comment: "Régime de l'affectation"
  },
  dateDebut: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: "Début de validité de l'affectation"
  },
  dateFin: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: "Fin de validité de l'affectation"
  },
  etablissementId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'AffectationSalleClasse',
  tableName: MODULE_TABLE_PREFIX + 'affectations_salles_classes',
  timestamps: true
})
