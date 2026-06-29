import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Echeance } from "./Echeance";
import { CoursParticipant } from "./CoursParticipant";

export class DossierEtudiant extends Model<InferAttributes<DossierEtudiant>, InferCreationAttributes<DossierEtudiant>> {
  declare id: CreationOptional<string>
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare matricule: string
  declare codeQR: CreationOptional<string>
  declare photo: CreationOptional<string>
  declare statut: 'actif' | 'suspendu' | 'archive'
  declare dateCreation: CreationOptional<Date>
  declare fraisScolarite: number
  declare modePaiement: 'unique' | 'mensuel'
  declare nbMensualites: number
  declare demarrageParcours: Date
  declare utilisateur?: NonAttribute<Utilisateur>
  declare echeances?: NonAttribute<Echeance[]>
  declare coursParticipants?: NonAttribute<CoursParticipant[]>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    utilisateur: Association<DossierEtudiant, Utilisateur>
    echeances: Association<DossierEtudiant, Echeance>
    coursParticipants: Association<DossierEtudiant, CoursParticipant>
  };
}

DossierEtudiant.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  matricule: {
    type: new DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  codeQR: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  photo: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('actif', 'suspendu', 'archive'),
    defaultValue: 'actif',
    allowNull: false
  },
  dateCreation: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  fraisScolarite: {
    type: DataTypes.FLOAT.UNSIGNED,
    allowNull: false
  },
  modePaiement: {
    type: DataTypes.ENUM('unique', 'mensuel'),
    allowNull: false
  },
  nbMensualites: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  demarrageParcours: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'DossierEtudiant',
  tableName: MODULE_TABLE_PREFIX + 'dossiers_etudiants',
  timestamps: true
})
