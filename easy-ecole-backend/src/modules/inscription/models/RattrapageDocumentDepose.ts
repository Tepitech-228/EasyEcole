import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { RattrapageInscription } from "./RattrapageInscription";
import { RattrapageDocumentRequis } from "./RattrapageDocumentRequis";

/**
 * Document téléversé par l'étudiant dans le cadre d'une demande de rattrapage,
 * rattaché à une pièce justificative requise (RattrapageDocumentRequis).
 * * fichier : chemin (relatif public/) du fichier stocké.
 * Table: ins_rattrapage_documents_deposes
 */
export class RattrapageDocumentDepose extends Model<InferAttributes<RattrapageDocumentDepose>, InferCreationAttributes<RattrapageDocumentDepose>> {
  declare id: CreationOptional<number>
  declare rattrapageInscriptionId: ForeignKey<RattrapageInscription['id']>
  declare documentRequisId: ForeignKey<RattrapageDocumentRequis['id']>
  declare fichier: string

  declare rattrapageInscription?: NonAttribute<RattrapageInscription>
  declare documentRequis?: NonAttribute<RattrapageDocumentRequis>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    rattrapageInscription: Association<RattrapageDocumentDepose, RattrapageInscription>
    documentRequis: Association<RattrapageDocumentDepose, RattrapageDocumentRequis>
  }
}

RattrapageDocumentDepose.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  rattrapageInscriptionId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  documentRequisId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  fichier: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'RattrapageDocumentDepose',
  tableName: MODULE_TABLE_PREFIX + 'rattrapage_documents_deposes',
  timestamps: true
})

export default RattrapageDocumentDepose;