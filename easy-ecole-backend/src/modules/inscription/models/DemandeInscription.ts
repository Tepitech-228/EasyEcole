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
import { Etablissement } from "../../etablissement/models/Etablissement";

export class DemandeInscription extends Model<InferAttributes<DemandeInscription>, InferCreationAttributes<DemandeInscription>> {
  declare id: CreationOptional<number>
  declare matricule: CreationOptional<string>
  /**
   * Pipeline d'inscription (flux définitif) :
   *   soumis → authentifie (cabinet) → saisie_validee / transmis_comite (ESA-COMPTA)
   *   → valide | correction_demandee | rejete (comité, étape finale).
   * NULL = dossiers legacy antérieurs au pipeline (traités comme 'soumis').
   */
  declare statutPipeline: CreationOptional<'soumis' | 'authentifie' | 'saisie_validee' | 'transmis_comite' | 'valide' | 'correction_demandee' | 'rejete' | null>
  declare motifPipeline?: CreationOptional<string | null>
  declare soumissionComite: CreationOptional<boolean>
  declare dateDemande: Date
  declare dateValidation: CreationOptional<Date>
  declare sessionId: ForeignKey<Session['id']>
  declare session?: NonAttribute<Session>
  declare etapeInscriptionId: ForeignKey<EtapeInscription['id']>
  declare etapeInscription?: NonAttribute<EtapeInscription>
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare utilisateur?: NonAttribute<Utilisateur>
  declare etablissementId: ForeignKey<Etablissement['id'] | null>
  declare etablissement?: NonAttribute<Etablissement>
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
    etablissement: Association<DemandeInscription, Etablissement>
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
    allowNull: false
  },
  statutPipeline: {
    type: new DataTypes.STRING(30),
    allowNull: true,
    defaultValue: null
  },
  soumissionComite: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  motifPipeline: {
    type: new DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
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
  etablissementId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'DemandeInscription',
  tableName: MODULE_TABLE_PREFIX + 'demandes_inscription',
  timestamps: true,
  // Index requis : la FK ins_paiements_inscription.matriculeInscription
  // référence cette colonne (targetKey 'matricule'). Sans index, la création
  // de la contrainte échoue sur une base VIERGE (sync production au démarrage).
  indexes: [{ name: 'idx_demandes_inscription_matricule', fields: ['matricule'] }]
})
