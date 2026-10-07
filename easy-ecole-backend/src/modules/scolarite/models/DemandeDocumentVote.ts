import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";
import { DemandeDocument } from "./DemandeDocument";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class DemandeDocumentVote extends Model<InferAttributes<DemandeDocumentVote>, InferCreationAttributes<DemandeDocumentVote>> {
  declare id: CreationOptional<number>
  declare demandeId: ForeignKey<DemandeDocument['id']>
  declare membreId: ForeignKey<Utilisateur['id']>
  declare tour: number
  declare decision: 'valider' | 'corriger'
  declare motif: CreationOptional<string | null>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

DemandeDocumentVote.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  demandeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  membreId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  tour: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  decision: {
    type: DataTypes.ENUM('valider', 'corriger'),
    allowNull: false
  },
  motif: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'DemandeDocumentVote',
  tableName: MODULE_TABLE_PREFIX + 'demandes_document_votes',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['demandeId', 'membreId', 'tour'] },
    { fields: ['demandeId', 'tour'] }
  ]
})
