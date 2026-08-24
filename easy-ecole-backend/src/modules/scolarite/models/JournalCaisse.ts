import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";
import { DemandeDocument } from "./DemandeDocument";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { ClotureCaisse } from "./ClotureCaisse";

export class JournalCaisse extends Model<InferAttributes<JournalCaisse>, InferCreationAttributes<JournalCaisse>> {
  declare id: CreationOptional<number>
  declare clotureId: ForeignKey<ClotureCaisse['id']> | null
  declare demandeDocumentId: ForeignKey<DemandeDocument['id']> | null
  declare recuId: CreationOptional<number | null>
  declare modePaiement: 'especes' | 'mobile_money' | 'autre'
  declare montant: number
  declare cloture?: NonAttribute<ClotureCaisse>
  declare demandeDocument?: NonAttribute<DemandeDocument>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    cloture: Association<JournalCaisse, ClotureCaisse>
    demandeDocument: Association<JournalCaisse, DemandeDocument>
  }
}

JournalCaisse.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  clotureId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'scol_clotures_caisse', key: 'id' }
  },
  demandeDocumentId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'scol_demandes_document', key: 'id' }
  },
  recuId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  modePaiement: {
    type: DataTypes.ENUM('especes', 'mobile_money', 'autre'),
    allowNull: false,
    defaultValue: 'especes'
  },
  montant: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'JournalCaisse',
  tableName: MODULE_TABLE_PREFIX + 'journal_caisse',
  timestamps: true
})
