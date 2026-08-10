import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { TypeDocument } from "./TypeDocument";
import { DocumentDelivre } from "./DocumentDelivre";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";

export class DemandeDocument extends Model<InferAttributes<DemandeDocument>, InferCreationAttributes<DemandeDocument>> {
  declare id: CreationOptional<number>
  declare etudiantId: ForeignKey<Utilisateur['id']>
  declare typeDocumentId: ForeignKey<TypeDocument['id']>
  declare statut: string
  declare date: CreationOptional<Date>
  declare fraisPayes: CreationOptional<boolean>
  declare source: CreationOptional<string>
  declare montant: CreationOptional<number | null>
  declare paiementId: CreationOptional<number | null>
  declare compteProduit: CreationOptional<string | null>
  declare parcoursId: CreationOptional<number | null>
  declare niveauEtudeId: CreationOptional<number | null>
  declare classeId: CreationOptional<number | null>
  declare anneeAcademiqueId: CreationOptional<number | null>
  declare etudiant?: NonAttribute<Utilisateur>
  declare typeDocument?: NonAttribute<TypeDocument>
  declare documentDelivre?: NonAttribute<DocumentDelivre>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    etudiant: Association<DemandeDocument, Utilisateur>
    typeDocument: Association<DemandeDocument, TypeDocument>
    documentDelivre: Association<DemandeDocument, DocumentDelivre>
  };
}

DemandeDocument.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  statut: {
    type: DataTypes.ENUM('soumise', 'validee', 'rejetee', 'delivree'),
    defaultValue: 'soumise',
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: new Date(),
    allowNull: false
  },
  fraisPayes: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  source: {
    type: DataTypes.ENUM('automatique', 'demande_etudiant'),
    defaultValue: 'demande_etudiant',
    allowNull: false
  },
  montant: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0
  },
  paiementId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: null
  },
  compteProduit: {
    type: new DataTypes.STRING,
    allowNull: true,
    defaultValue: '704'
  },
  parcoursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  niveauEtudeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  classeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  anneeAcademiqueId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'DemandeDocument',
  tableName: MODULE_TABLE_PREFIX + 'demandes_document',
  timestamps: true
})
