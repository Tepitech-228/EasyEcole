import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association, QueryTypes, Transaction } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Echeance } from "./Echeance";
import { CoursParticipant } from "./CoursParticipant";

export class DossierEtudiant extends Model<InferAttributes<DossierEtudiant>, InferCreationAttributes<DossierEtudiant>> {
  declare id: CreationOptional<number>
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare matricule: string
  declare codeQR: CreationOptional<string>
  declare photo: CreationOptional<string>
  declare cartePath: CreationOptional<string>
  declare carteGeneree: CreationOptional<boolean>
  declare statut: 'actif' | 'suspendu' | 'archive'
  declare anneePremiereInscription: CreationOptional<number>
  declare nombreInscriptions: CreationOptional<number>
  declare dateCreation: CreationOptional<Date>
  declare fraisScolarite: number
  /**
   * Snapshot grille tarifaire figé à la 1ère validation du dossier (JSON).
   * Contient les montants, la modalité et la date de figement. NULL tant que
   * le dossier n'a pas été validé une première fois.
   */
  declare fraisScolariteSnapshot: CreationOptional<string | null>
  declare modePaiement: 'unique' | 'mensuel'
  declare nbMensualites: number
  declare demarrageParcours: Date
  declare utilisateur?: NonAttribute<Utilisateur>
  declare echeances?: NonAttribute<Echeance[]>
  declare coursParticipants?: NonAttribute<CoursParticipant[]>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    utilisateur: Association<DossierEtudiant, Utilisateur>
    echeances: Association<DossierEtudiant, Echeance>
    coursParticipants: Association<DossierEtudiant, CoursParticipant>
  };

  /**
   * Prochain numéro d'ordre du matricule final
   * (`{ordre}-{FILIERE}{ANNEE}{J|S}-{AA}-{SITE}`).
   *
   * On s'appuie sur le plus grand ordre DÉJÀ ATTRIBUÉ — y compris les dossiers
   * supprimés logiquement — plutôt que sur `count() + 1`. `count()` ignore les
   * enregistrements soft-deleted : après une suppression, il peut donc
   * réattribuer un ordre déjà utilisé et produire un matricule EN COLLISION.
   * Seuls les matricules au format FINAL sont comptés (les matricules
   * temporaires de demande, à 8 chiffres, sont ignorés).
   */
  static async prochainOrdreMatricule(transaction?: Transaction): Promise<number> {
    const table = MODULE_TABLE_PREFIX + 'dossiers_etudiants'
    const rows = await DossierEtudiant.sequelize!.query(
      `SELECT MAX(CAST(SUBSTRING_INDEX(matricule, '-', 1) AS UNSIGNED)) AS maxOrdre
         FROM ${table}
        WHERE matricule REGEXP '^[0-9]+-[A-Z]+[0-9]?[JS]-[0-9]{2}-[A-Z]+$'`,
      { transaction, type: QueryTypes.SELECT }
    ) as any[]
    const max = Number(rows?.[0]?.maxOrdre || 0)
    return max + 1
  }
}

DossierEtudiant.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  matricule: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  codeQR: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  photo: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  cartePath: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  carteGeneree: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  statut: {
    type: DataTypes.ENUM('actif', 'suspendu', 'archive'),
    defaultValue: 'actif',
    allowNull: false
  },
  anneePremiereInscription: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  nombreInscriptions: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
  },
  dateCreation: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  fraisScolarite: {
    type: DataTypes.FLOAT.UNSIGNED,
    allowNull: false
  },
  fraisScolariteSnapshot: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  modePaiement: {
    type: DataTypes.ENUM('unique', 'mensuel'),
    allowNull: false
  },
  nbMensualites: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  demarrageParcours: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'DossierEtudiant',
  tableName: MODULE_TABLE_PREFIX + 'dossiers_etudiants',
  timestamps: true
})
