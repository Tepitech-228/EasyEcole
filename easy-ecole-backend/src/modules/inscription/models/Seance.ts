import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Cours } from "./Cours";
import { JoursSemaine } from "../../../core/enums/JoursSemaine";
import { Enseignant } from "../../auth/models/Enseignant";
import { SalleDeClasse } from "./SalleDeClasse";
import { RegimesCours } from "../../../core/enums/RegimesCours";
import { Creneau } from "./Creneau";
import { Classe } from "./Classe";
import { NiveauEtude } from "./NiveauEtude";
import { Parcours } from "./Parcours";
import { AnneeAcademique } from "./AnneeAcademique";
import { SemestreAcademique } from "./SemestreAcademique";

export class Seance extends Model<InferAttributes<Seance>, InferCreationAttributes<Seance>> {
  declare id: CreationOptional<number>
  declare titre: string
  declare jourSemaine: JoursSemaine
  declare salle: string
  declare dateDebut: Date
  declare dateFin: Date
  declare heureDebut: Date
  declare heureFin: Date
  declare description: CreationOptional<string>
  declare regime: CreationOptional<RegimesCours | null>

  declare coursId: ForeignKey<Cours['id']>
  declare cours?: NonAttribute<Cours>
  declare enseignantId: ForeignKey<Enseignant['id']>
  declare enseignant?: NonAttribute<Enseignant>
  declare salleDeClasseId: ForeignKey<SalleDeClasse['id'] | null>
  declare salleDeClasse?: NonAttribute<SalleDeClasse>
  declare creneauId: ForeignKey<Creneau['id'] | null>
  declare creneau?: NonAttribute<Creneau>
  declare classeGroupeId: ForeignKey<Classe['id'] | null>
  declare classeGroupe?: NonAttribute<Classe>
  declare niveauEtudeId: ForeignKey<NiveauEtude['id'] | null>
  declare niveauEtude?: NonAttribute<NiveauEtude>
  declare parcoursId: ForeignKey<Parcours['id'] | null>
  declare parcours?: NonAttribute<Parcours>
  declare anneeAcademiqueId: ForeignKey<AnneeAcademique['id'] | null>
  declare anneeAcademique?: NonAttribute<AnneeAcademique>
  declare semestreAcademiqueId: ForeignKey<SemestreAcademique['id'] | null>
  declare semestreAcademique?: NonAttribute<SemestreAcademique>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    cours: Association<Seance, Cours>,
    enseignant: Association<Seance, Enseignant>,
    salleDeClasse: Association<Seance, SalleDeClasse>,
    creneau: Association<Seance, Creneau>,
    classeGroupe: Association<Seance, Classe>,
    niveauEtude: Association<Seance, NiveauEtude>,
    parcours: Association<Seance, Parcours>,
    anneeAcademique: Association<Seance, AnneeAcademique>,
    semestreAcademique: Association<Seance, SemestreAcademique>,
  };
}

Seance.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  titre: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  jourSemaine: {
    type: DataTypes.ENUM,
    values: [JoursSemaine.LUNDI, JoursSemaine.MARDI, JoursSemaine.MERCREDI, JoursSemaine.JEUDI, JoursSemaine.VENDREDI, JoursSemaine.SAMEDI],
    allowNull: false
  },
  salle: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  coursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  enseignantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  dateDebut: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dateFin: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  description: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  heureDebut: {
    type: DataTypes.TIME,
    allowNull: false
  },
  heureFin: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  salleDeClasseId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  regime: {
    type: DataTypes.ENUM(RegimesCours.JOUR, RegimesCours.SOIR, RegimesCours.JOUR_ET_SOIR),
    allowNull: true,
    comment: "Régime de la séance (JOUR, SOIR ou les deux)"
  },
  creneauId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  classeGroupeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  niveauEtudeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  parcoursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  anneeAcademiqueId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  semestreAcademiqueId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Seance',
  tableName: MODULE_TABLE_PREFIX + 'seances',
  timestamps: true
})
