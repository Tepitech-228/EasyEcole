import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { ReponseInscription } from "./ReponseInscription";
import { ParcoursChoisi } from "./ParcoursChoisi";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Session } from "./Session";
import { Cours } from "./Cours";
import { PaiementInscription } from "./PaiementInscription";
import { EtapeInscription } from "./EtapeInscription";
import { DossierInscription } from "./DossierInscription";
import { DemandeInscriptionDossier } from "./DemandeInscriptionDossier";
import { CursusApprenant } from "./CursusApprenant";
import { DemandeInscriptionCours } from "./DemandeInscriptionCours";
import { PreInscription } from "./PreInscription";

export class DemandeInscription extends Model<InferAttributes<DemandeInscription>, InferCreationAttributes<DemandeInscription>> {
  declare id: CreationOptional<string>
  declare matricule: CreationOptional<string>
  declare dateDemande: Date
  declare dateValidation: CreationOptional<Date>
  declare sessionId: ForeignKey<Session['id']>
  declare session?: NonAttribute<Session>
  declare etapeInscriptionId: ForeignKey<EtapeInscription['id']>
  declare etapeInscription?: NonAttribute<EtapeInscription>
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare utilisateur?: NonAttribute<Utilisateur>
  declare reponseInscription?: NonAttribute<ReponseInscription>
  declare preInscription?: NonAttribute<PreInscription>
  declare parcoursChoisis?: ParcoursChoisi[]
  declare cours?: Cours[]
  declare coursChoisis?: DemandeInscriptionCours[]
  declare paiementsInscription?: PaiementInscription[]
  // declare dossiersInscription?: DossierInscription[]
  declare dossiersDemande?: DemandeInscriptionDossier[]

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    utilisateur: Association<DemandeInscription, Utilisateur>
    reponseInscription: Association<DemandeInscription, ReponseInscription>
    preInscription: Association<DemandeInscription, PreInscription>
    parcoursChoisis: Association<DemandeInscription, ParcoursChoisi>
    etapeInscription: Association<DemandeInscription, EtapeInscription>
    session: Association<DemandeInscription, Session>
    cours: Association<DemandeInscription, Cours>
    coursChoisis: Association<DemandeInscription, DemandeInscriptionCours>
    paiementsInscription: Association<DemandeInscription, PaiementInscription>
    // dossiersInscription: Association<DemandeInscription, DossierInscription>
    dossiersDemande: Association<DemandeInscription, DemandeInscriptionDossier>
    cursusApprenant: Association<DemandeInscription, CursusApprenant>
  };
}

DemandeInscription.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  matricule: {
    type: new DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  dateDemande: {
    type: DataTypes.DATE,
    defaultValue: new Date(),
    allowNull: false
  },
  dateValidation: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sessionId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: 'session-utilisateur'
  },
  utilisateurId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: 'session-utilisateur'
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'DemandeInscription',
  tableName: MODULE_TABLE_PREFIX + 'demandes_inscription',
  timestamps: true
})