import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { RattrapageSession } from "./RattrapageSession";
import { RattrapageDocumentDepose } from "./RattrapageDocumentDepose";

/**
 * Pièce justificative requise pour une session de rattrapage
 * (ex. 'Certificat médical', 'Justificatif d'absence', 'Relevé de notes').
 * Table: ins_rattrapage_documents_requis
 */
export class RattrapageDocumentRequis extends Model<InferAttributes<RattrapageDocumentRequis>, InferCreationAttributes<RattrapageDocumentRequis>> {
  declare id: CreationOptional<number>
  declare rattrapageSessionId: ForeignKey<RattrapageSession['id']>
  declare libelle: string
  declare obligatoire: CreationOptional<boolean> // BOOLEAN défaut true
  declare ordre: CreationOptional<number> // INTEGER défaut 0

  declare rattrapageSession?: NonAttribute<RattrapageSession>
  declare documentsDeposes?: NonAttribute<RattrapageDocumentDepose[]>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    rattrapageSession: Association<RattrapageDocumentRequis, RattrapageSession>
    documentsDeposes: Association<RattrapageDocumentRequis, RattrapageDocumentDepose>
  }
}

RattrapageDocumentRequis.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  rattrapageSessionId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  libelle: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  obligatoire: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  ordre: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'RattrapageDocumentRequis',
  tableName: MODULE_TABLE_PREFIX + 'rattrapage_documents_requis',
  timestamps: true
})

export default RattrapageDocumentRequis;