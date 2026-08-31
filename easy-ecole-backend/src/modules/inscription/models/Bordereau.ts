import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Echeance } from "./Echeance";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Quitus } from "./Quitus";
import { TypeOperationBordereau } from "./TypeOperationBordereau";

export class Bordereau extends Model<InferAttributes<Bordereau>, InferCreationAttributes<Bordereau>> {
  declare id: CreationOptional<number>
  /**
   * Refonte du flux bordereaux (Phase 0) : l'étudiant ne fait plus que l'UPLOAD
   * du fichier. Le type et le montant sont saisis par le cabinet comptable au
   * moment du traitement → colonnes NULLABLES (le dépôt crée un bordereau sans
   * type ni montant).
   */
  declare type?: 'inscription' | 'scolarite' | 'rattrapage' | 'mixte' | null
  /**
   * Type 'mixte' : répartition déclarée par ESA-COMPTA au moment de la saisie,
   * sérialisée en JSON (ex : [{"type":"inscription","montant":450000},{"type":"scolarite","montant":30000}]).
   * La somme des composantes doit être égale au montant constaté.
   */
  declare composition?: string | null
  declare echeanceId: ForeignKey<Echeance['id']> | null
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare fichier: string
  declare montant?: number | null
  declare modalite: '1x' | '3x' | '10x'
  declare referenceBancaire: CreationOptional<string>
  declare statut: 'en_attente' | 'valide' | 'rejete' | 'en_saisie_comptable' | 'traite'
  declare statutPaiement: 'pending' | 'saisi' | 'finalise'
  declare dateSoumission: CreationOptional<Date>
  declare dateValidation: CreationOptional<Date | null>
  declare datePaiement: CreationOptional<Date | null>
  declare valideParId: CreationOptional<ForeignKey<Utilisateur['id']> | null>
  declare commentaire: CreationOptional<string>
  declare quitusId: CreationOptional<ForeignKey<Quitus['id']>>
  declare typeOperationId: CreationOptional<ForeignKey<TypeOperationBordereau['id']> | null>
  declare numeroBordereau: CreationOptional<string | null>
  declare moyenPaiement: CreationOptional<'virement' | 'especes' | 'mobile_money' | 'cheque' | null>
  declare banque: CreationOptional<'ecobank' | 'ib_bank' | 'orabank' | null>
  declare echeance?: NonAttribute<Echeance>
  declare utilisateur?: NonAttribute<Utilisateur>
  declare validePar?: NonAttribute<Utilisateur>
  declare quitus?: NonAttribute<Quitus>
  declare typeOperation?: NonAttribute<TypeOperationBordereau>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    echeance: Association<Bordereau, Echeance>
    utilisateur: Association<Bordereau, Utilisateur>
    validePar: Association<Bordereau, Utilisateur>
    quitus: Association<Bordereau, Quitus>
    typeOperation: Association<Bordereau, TypeOperationBordereau>
  };
}

Bordereau.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  echeanceId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  utilisateurId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('inscription', 'scolarite', 'rattrapage', 'mixte'),
    allowNull: true,
    defaultValue: null
  },
  composition: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  fichier: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  montant: {
    type: DataTypes.FLOAT.UNSIGNED,
    allowNull: true,
    defaultValue: null
  },
  /**
   * Modalité de paiement choisie lors du chargement du bordereau d'inscription
   * (chantier 1x/3x/10x). N'a de sens que pour les bordereaux de type
   * 'inscription' (les bordereaux 'scolarite' conservent la valeur par défaut '1x').
   */
  modalite: {
    type: DataTypes.ENUM('1x', '3x', '10x'),
    defaultValue: '1x',
    allowNull: false
  },
  referenceBancaire: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'valide', 'rejete', 'en_saisie_comptable', 'traite'),
    defaultValue: 'en_attente',
    allowNull: false
  },
  statutPaiement: {
    type: DataTypes.ENUM('pending', 'saisi', 'finalise'),
    defaultValue: 'pending',
    allowNull: false
  },
  dateSoumission: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  dateValidation: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null
  },
  datePaiement: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null
  },
  valideParId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: null
  },
  commentaire: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  quitusId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: null
  },
  typeOperationId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: null
  },
  numeroBordereau: {
    type: new DataTypes.STRING(100),
    allowNull: true,
    defaultValue: null
  },
  moyenPaiement: {
    type: DataTypes.ENUM('virement', 'especes', 'mobile_money', 'cheque'),
    allowNull: true,
    defaultValue: null
  },
  /**
   * Banque émettrice de l'opération de paiement, saisie par ESA-COMPTA lors du
   * traitement du bordereau. Enum limité aux banques partenaires.
   */
  banque: {
    type: DataTypes.ENUM('ecobank', 'ib_bank', 'orabank'),
    allowNull: true,
    defaultValue: null
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Bordereau',
  tableName: MODULE_TABLE_PREFIX + 'bordereaux',
  timestamps: true
})
