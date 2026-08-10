import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Cours } from "./Cours";
import { SessionExamen } from "./SessionExamen";
import { CoursParticipant } from "./CoursParticipant";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Bordereau } from "./Bordereau";

export class RattrapageInscription extends Model<InferAttributes<RattrapageInscription>, InferCreationAttributes<RattrapageInscription>> {
  declare id: CreationOptional<number>
  declare coursParticipantId: ForeignKey<CoursParticipant['id']>
  declare coursId: ForeignKey<Cours['id']>
  declare sessionExamenId: ForeignKey<SessionExamen['id']>
  declare noteRattrapage: CreationOptional<number | null>
  declare statut: CreationOptional<string>
  declare enseignantId: CreationOptional<number | null>
  declare salle: CreationOptional<string | null>
  declare dateRattrapage: CreationOptional<Date | null>
  declare heureDebut: CreationOptional<string | null>
  declare heureFin: CreationOptional<string | null>
  declare notificationEnvoyee: CreationOptional<boolean>

  // Champs demandes étudiantes (rattrapage à la demande)
  declare source: CreationOptional<string> // ENUM('auto','demande_etudiant') défaut 'auto'
  declare motifEtudiant: CreationOptional<string | null>
  declare creneauSouhaite: CreationOptional<string | null>
  declare montant: CreationOptional<number | null>
  declare statutPaiement: CreationOptional<string> // ENUM('impaye','paye') défaut 'impaye'
  declare paiementId: CreationOptional<number | null>
  declare demandePar: CreationOptional<number | null> // utilisateurId étudiant

  declare coursParticipant?: NonAttribute<CoursParticipant>
  declare cours?: NonAttribute<Cours>
  declare sessionExamen?: NonAttribute<SessionExamen>
  declare demandeur?: NonAttribute<Utilisateur>
  declare bordereau?: NonAttribute<Bordereau>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare readonly deletedAt: CreationOptional<Date | null>

  declare static associations: {
    coursParticipant: Association<RattrapageInscription, CoursParticipant>
    cours: Association<RattrapageInscription, Cours>
    sessionExamen: Association<RattrapageInscription, SessionExamen>
    demandeur: Association<RattrapageInscription, Utilisateur>
    bordereau: Association<RattrapageInscription, Bordereau>
  }
}

RattrapageInscription.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  coursParticipantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  coursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  sessionExamenId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  noteRattrapage: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('inscrit', 'convoque', 'present', 'absent', 'valide'),
    allowNull: false,
    defaultValue: 'inscrit'
  },
  enseignantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  salle: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  dateRattrapage: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  heureDebut: {
    type: DataTypes.TIME,
    allowNull: true
  },
  heureFin: {
    type: DataTypes.TIME,
    allowNull: true
  },
  notificationEnvoyee: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  source: {
    type: DataTypes.ENUM('auto', 'demande_etudiant'),
    allowNull: false,
    defaultValue: 'auto'
  },
  motifEtudiant: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  creneauSouhaite: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  montant: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  statutPaiement: {
    type: DataTypes.ENUM('impaye', 'paye'),
    allowNull: false,
    defaultValue: 'impaye'
  },
  paiementId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  demandePar: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'RattrapageInscription',
  tableName: MODULE_TABLE_PREFIX + 'rattrapages_inscriptions',
  timestamps: true
})
