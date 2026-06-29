import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ComptabiliteModule";
import { Compte } from "./Compte";
import { JournalComptable } from "./JournalComptable";
import { Utilisateur } from "../../auth/models/Utilisateur";

/**
 * Modèle EcritureComptable - Écritures comptables OHADA
 */
export class EcritureComptable extends Model<InferAttributes<EcritureComptable>, InferCreationAttributes<EcritureComptable>> {
  declare id: CreationOptional<string>
  declare journalId: ForeignKey<JournalComptable['id']>
  declare numeroEcriture: string // Ex: "ACH001", "VEN042", "BANQ123"
  declare dateEcriture: Date
  declare dateComptable: Date
  declare compteDebitId: ForeignKey<Compte['id']>
  declare compteCreditId: ForeignKey<Compte['id']>
  declare montant: number
  declare libelle: string // Description de l'opération
  declare reference: CreationOptional<string> // Ex: numéro facture, numéro chèque
  declare pieceJustificative: CreationOptional<string> // Fichier PDF, image
  declare moduleSource: CreationOptional<string> // Ex: "inscription", "rh", "immobilisations"
  declare referenceModuleId: CreationOptional<string> // ID de l'objet source (facture, facture paie, etc.)
  declare utilisateurSaisieId: CreationOptional<ForeignKey<Utilisateur['id']>>
  declare validee: boolean
  declare utilisateurValidationId: CreationOptional<ForeignKey<Utilisateur['id']>>
  declare dateValidation: CreationOptional<Date | null>
  declare observations: CreationOptional<string>

  declare journal?: NonAttribute<JournalComptable>
  declare compteDebit?: NonAttribute<Compte>
  declare compteCredit?: NonAttribute<Compte>
  declare utilisateurSaisie?: NonAttribute<Utilisateur>
  declare utilisateurValidation?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    journal: Association<EcritureComptable, JournalComptable>
    compteDebit: Association<EcritureComptable, Compte>
    compteCredit: Association<EcritureComptable, Compte>
    utilisateurSaisie: Association<EcritureComptable, Utilisateur>
    utilisateurValidation: Association<EcritureComptable, Utilisateur>
  };
}

EcritureComptable.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  journalId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  numeroEcriture: {
    type: new DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  dateEcriture: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dateComptable: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  compteDebitId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  compteCreditId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  montant: {
    type: DataTypes.FLOAT.UNSIGNED,
    allowNull: false
  },
  libelle: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  reference: {
    type: new DataTypes.STRING(100),
    allowNull: true
  },
  pieceJustificative: {
    type: new DataTypes.STRING(255),
    allowNull: true
  },
  moduleSource: {
    type: new DataTypes.STRING(50),
    allowNull: true
  },
  referenceModuleId: {
    type: new DataTypes.STRING(50),
    allowNull: true
  },
  utilisateurSaisieId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  validee: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  utilisateurValidationId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  dateValidation: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null
  },
  observations: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'EcritureComptable',
  tableName: MODULE_TABLE_PREFIX + 'ecritures_comptables',
  timestamps: true
})
