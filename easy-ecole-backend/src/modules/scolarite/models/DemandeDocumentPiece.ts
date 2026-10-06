import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";
import { DemandeDocument } from "./DemandeDocument";

export class DemandeDocumentPiece extends Model<InferAttributes<DemandeDocumentPiece>, InferCreationAttributes<DemandeDocumentPiece>> {
  declare id: CreationOptional<number>
  declare demandeId: ForeignKey<DemandeDocument['id']>
  declare cle: string
  declare libelle: string
  declare nomOriginal: string
  declare cheminFichier: string
  declare typeMime: string
  declare tailleOctets: number
  declare version: CreationOptional<number>
  declare estCourante: CreationOptional<boolean>
  declare statutAudit: CreationOptional<'en_attente' | 'validee' | 'rejetee'>
  declare motifRejet: CreationOptional<string | null>
  declare demande?: NonAttribute<DemandeDocument>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    demande: Association<DemandeDocumentPiece, DemandeDocument>
  }
}

DemandeDocumentPiece.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  cle: {
    type: DataTypes.STRING(80),
    allowNull: false
  },
  libelle: {
    type: DataTypes.STRING(160),
    allowNull: false
  },
  nomOriginal: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  cheminFichier: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  typeMime: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  tailleOctets: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  version: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 1
  },
  estCourante: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  statutAudit: {
    type: DataTypes.ENUM('en_attente', 'validee', 'rejetee'),
    allowNull: false,
    defaultValue: 'en_attente'
  },
  motifRejet: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  demandeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'DemandeDocumentPiece',
  tableName: MODULE_TABLE_PREFIX + 'demandes_document_pieces',
  timestamps: true,
  indexes: [
    { fields: ['demandeId', 'cle', 'estCourante'] }
  ]
})
