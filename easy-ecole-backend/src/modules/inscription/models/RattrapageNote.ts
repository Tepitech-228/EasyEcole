import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { RattrapageInscription } from "./RattrapageInscription";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Cours } from "./Cours";

/**
 * Notes de rattrapage (historique conservé avec note_originale et note_rattrapage).
 * Le bulletin utilise COALESCE(note_rattrapage, note_originale).
 * Table: ins_rattrapage_notes
 */
export class RattrapageNote extends Model<InferAttributes<RattrapageNote>, InferCreationAttributes<RattrapageNote>> {
  declare id: CreationOptional<number>
  declare rattrapageInscriptionId: ForeignKey<RattrapageInscription['id']>
  declare etudiantId: ForeignKey<Utilisateur['id']>
  declare ueId: ForeignKey<Cours['id']> | null
  declare note_originale: CreationOptional<number | null> // Note avant rattrapage (conservée)
  declare note_rattrapage: CreationOptional<number | null> // Note obtenue au rattrapage
  declare saisiPar: ForeignKey<Utilisateur['id']> | null // enseignant correcteur
  declare statut: CreationOptional<string> // ENUM('en_attente','saisie','validée') défaut 'en_attente'

  declare rattrapageInscription?: NonAttribute<RattrapageInscription>
  declare etudiant?: NonAttribute<Utilisateur>
  declare ue?: NonAttribute<Cours>
  declare saisiParUser?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    rattrapageInscription: Association<RattrapageNote, RattrapageInscription>
    etudiant: Association<RattrapageNote, Utilisateur>
    ue: Association<RattrapageNote, Cours>
    saisiParUser: Association<RattrapageNote, Utilisateur>
  }
}

RattrapageNote.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  rattrapageInscriptionId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  etudiantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  ueId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  note_originale: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  note_rattrapage: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  saisiPar: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'saisie', 'validée'),
    allowNull: false,
    defaultValue: 'en_attente'
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'RattrapageNote',
  tableName: MODULE_TABLE_PREFIX + 'rattrapage_notes',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['rattrapageInscriptionId', 'ueId'] },
    { fields: ['rattrapageInscriptionId'] },
    { fields: ['etudiantId'] },
    { fields: ['ueId'] },
    { fields: ['saisiPar'] }
  ]
})

export default RattrapageNote;