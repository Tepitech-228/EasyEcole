import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ComptabiliteModule";

/**
 * Modèle Compte - Plan comptable OHADA
 * Classes: 1=Financement, 2=Immobilisé, 3=Circulant, 4=Dettes, 5=Trésorerie, 6=Charges, 7=Revenus, 8=Spéciaux
 */
export class Compte extends Model<InferAttributes<Compte>, InferCreationAttributes<Compte>> {
  declare id: CreationOptional<string>
  declare numero: string // Ex: 101, 211, 512, 601, 701
  declare libelle: string // Ex: "Capital social", "Constructions", "Banque", "Achats", "Revenus scolarité"
  declare classe: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' // Classe comptable OHADA
  declare sousClasse: CreationOptional<string> // Ex: 1 pour 101, 51, 52 pour 512, 513
  declare nature: 'Débit' | 'Crédit' | 'Débit/Crédit' // Nature du compte
  declare categorie: string // Ex: "Capitaux", "Immobilisations", "Trésorerie", "Charges", "Revenus"
  declare description: CreationOptional<string>
  declare actif: boolean // Compte actif ou fermé
  declare moduleSource: CreationOptional<string> // Ex: "inscription", "rh", "immobilisations", "stock"

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

Compte.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  numero: {
    type: new DataTypes.STRING(10),
    allowNull: false,
    unique: true
  },
  libelle: {
    type: new DataTypes.STRING(255),
    allowNull: false
  },
  classe: {
    type: DataTypes.ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9'),
    allowNull: false
  },
  sousClasse: {
    type: new DataTypes.STRING(10),
    allowNull: true
  },
  nature: {
    type: DataTypes.ENUM('Débit', 'Crédit', 'Débit/Crédit'),
    defaultValue: 'Débit/Crédit',
    allowNull: false
  },
  categorie: {
    type: new DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  moduleSource: {
    type: new DataTypes.STRING(50),
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'Compte',
  tableName: MODULE_TABLE_PREFIX + 'comptes',
  timestamps: true
})
