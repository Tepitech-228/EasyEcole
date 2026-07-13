import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { DemandeDocument } from "./DemandeDocument";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";

export class DocumentDelivre extends Model<InferAttributes<DocumentDelivre>, InferCreationAttributes<DocumentDelivre>> {
  declare id: CreationOptional<string>
  declare demandeId: ForeignKey<DemandeDocument['id']>
  declare fichierPDF: string
  declare dateDelivrance: CreationOptional<Date>
  declare demande?: NonAttribute<DemandeDocument>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    demande: Association<DocumentDelivre, DemandeDocument>
  };
}

DocumentDelivre.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  fichierPDF: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  dateDelivrance: {
    type: DataTypes.DATE,
    defaultValue: new Date(),
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'DocumentDelivre',
  tableName: MODULE_TABLE_PREFIX + 'documents_delivres',
  timestamps: true
})
