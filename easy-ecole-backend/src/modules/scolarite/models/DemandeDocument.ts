import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { TypeDocument } from "./TypeDocument";
import { DocumentDelivre } from "./DocumentDelivre";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";

export class DemandeDocument extends Model<InferAttributes<DemandeDocument>, InferCreationAttributes<DemandeDocument>> {
  declare id: CreationOptional<string>
  declare etudiantId: ForeignKey<Utilisateur['id']>
  declare typeDocumentId: ForeignKey<TypeDocument['id']>
  declare statut: string
  declare date: CreationOptional<Date>
  declare fraisPayes: CreationOptional<boolean>
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
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'DemandeDocument',
  tableName: MODULE_TABLE_PREFIX + 'demandes_document',
  timestamps: true
})
