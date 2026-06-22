import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Echeance } from "./Echeance";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class Bordereau extends Model<InferAttributes<Bordereau>, InferCreationAttributes<Bordereau>> {
  declare id: CreationOptional<string>
  declare echeanceId: ForeignKey<Echeance['id']>
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare fichier: string
  declare montant: number
  declare referenceBancaire: CreationOptional<string>
  declare statut: 'en_attente' | 'valide' | 'rejete'
  declare dateSoumission: CreationOptional<Date>
  declare dateValidation: CreationOptional<Date | null>
  declare valideParId: CreationOptional<ForeignKey<Utilisateur['id']> | null>
  declare commentaire: CreationOptional<string>
  declare echeance?: NonAttribute<Echeance>
  declare utilisateur?: NonAttribute<Utilisateur>
  declare validePar?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    echeance: Association<Bordereau, Echeance>
    utilisateur: Association<Bordereau, Utilisateur>
    validePar: Association<Bordereau, Utilisateur>
  };
}

Bordereau.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  fichier: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  montant: {
    type: DataTypes.FLOAT.UNSIGNED,
    allowNull: false
  },
  referenceBancaire: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'valide', 'rejete'),
    defaultValue: 'en_attente',
    allowNull: false
  },
  dateSoumission: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  dateValidation: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null
  },
  valideParId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: null
  },
  commentaire: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Bordereau',
  tableName: MODULE_TABLE_PREFIX + 'bordereaux',
  timestamps: true
})
