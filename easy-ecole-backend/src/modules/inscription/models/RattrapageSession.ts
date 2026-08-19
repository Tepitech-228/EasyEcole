import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { AnneeAcademique } from "./AnneeAcademique";
import { RattrapageSessionClasse } from "./RattrapageSessionClasse";
import { RattrapageDocumentRequis } from "./RattrapageDocumentRequis";
import { RattrapageInscription } from "./RattrapageInscription";

/**
 * Session de rattrapage (workflow officiel) :
 * l'ADMIN crée une période de rattrapage, précise les filières (classes) concernées
 * et définit les pièces justificatives obligatoires.
 * Table: ins_sessions_rattrapage
 */
export class RattrapageSession extends Model<InferAttributes<RattrapageSession>, InferCreationAttributes<RattrapageSession>> {
  declare id: CreationOptional<number>
  declare libelle: string
  declare dateDebut: CreationOptional<Date | null>
  declare dateFin: CreationOptional<Date | null>
  declare anneeAcademiqueId: ForeignKey<AnneeAcademique['id']> | null
  declare statut: CreationOptional<string> // ENUM('preparation','ouverte','cloturee') défaut 'preparation'
  declare description: CreationOptional<string | null>

  declare anneeAcademique?: NonAttribute<AnneeAcademique>
  declare classes?: NonAttribute<RattrapageSessionClasse[]>
  declare documentsRequis?: NonAttribute<RattrapageDocumentRequis[]>
  declare inscriptions?: NonAttribute<RattrapageInscription[]>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare readonly deletedAt: CreationOptional<Date | null>

  declare static associations: {
    anneeAcademique: Association<RattrapageSession, AnneeAcademique>
    classes: Association<RattrapageSession, RattrapageSessionClasse>
    documentsRequis: Association<RattrapageSession, RattrapageDocumentRequis>
    inscriptions: Association<RattrapageSession, RattrapageInscription>
  }
}

RattrapageSession.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  libelle: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  dateDebut: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dateFin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  anneeAcademiqueId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('preparation', 'ouverte', 'cloturee'),
    allowNull: false,
    defaultValue: 'preparation'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'RattrapageSession',
  tableName: MODULE_TABLE_PREFIX + 'sessions_rattrapage',
  timestamps: true
})

export default RattrapageSession;