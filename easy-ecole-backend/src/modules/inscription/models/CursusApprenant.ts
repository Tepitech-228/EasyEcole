import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, ForeignKey, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Classe } from "./Classe";
import { Parcours } from "./Parcours";
import { NiveauEtude } from "./NiveauEtude";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { DemandeInscription } from "./DemandeInscription";
import { AnneeAcademique } from "./AnneeAcademique";
import { Etablissement } from "../../etablissement/models/Etablissement";

export class CursusApprenant extends Model<InferAttributes<CursusApprenant>, InferCreationAttributes<CursusApprenant>> {
  declare id: CreationOptional<number>
  declare externe: boolean
  declare etablissementId: ForeignKey<Etablissement['id'] | null>
  declare etablissement?: NonAttribute<Etablissement>
  declare statutReinscription: CreationOptional<string>
  declare dateReinscription: CreationOptional<Date>
  declare emailReinscriptionEnvoyeLe: CreationOptional<Date>
  declare intituleParcours: string
  declare parcoursId: ForeignKey<Parcours['id']>
  declare parcours?: NonAttribute<Parcours>
  declare niveauEtudeId: ForeignKey<NiveauEtude['id']>
  declare niveauEtude?: NonAttribute<NiveauEtude>
  declare classeId: ForeignKey<Classe['id']>
  declare classe?: NonAttribute<Classe>
  declare anneeAcademiqueId: ForeignKey<AnneeAcademique['id']>
  declare anneeAcademique?: NonAttribute<AnneeAcademique>
  declare demandeInscriptionId: ForeignKey<DemandeInscription['id']>
  declare demandeInscription?: NonAttribute<DemandeInscription>
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare utilisateur?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    etablissement: Association<CursusApprenant, Etablissement>
    parcours: Association<CursusApprenant, Parcours>
    niveauEtude: Association<CursusApprenant, NiveauEtude>
    classe: Association<CursusApprenant, Classe>
    anneeAcademique: Association<CursusApprenant, AnneeAcademique>
    demandeInscription: Association<CursusApprenant, DemandeInscription>
    utilisateur: Association<CursusApprenant, Utilisateur>
  };
}

CursusApprenant.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  externe: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  etablissementId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  statutReinscription: { type: DataTypes.ENUM('en_attente','confirme','abandon','desactive'), allowNull: true },
  dateReinscription: { type: DataTypes.DATE, allowNull: true },
  emailReinscriptionEnvoyeLe: { type: DataTypes.DATE, allowNull: true },
  intituleParcours: {
    type: new DataTypes.STRING,
    allowNull: true,
  },
  parcoursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  niveauEtudeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  classeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  anneeAcademiqueId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  demandeInscriptionId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  utilisateurId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'CursusApprenant',
  tableName: MODULE_TABLE_PREFIX + 'cursus_apprenants',
  timestamps: true
})
