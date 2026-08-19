import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ComptabiliteModule";

/**
 * Modèle ParametreFrais - Paramétrage centralisé des frais de services
 * (frais de rattrapage, frais de demande de document, comptes produits associés...)
 * Table: cpt_parametres_frais
 */
export class ParametreFrais extends Model<InferAttributes<ParametreFrais>, InferCreationAttributes<ParametreFrais>> {
  declare id: CreationOptional<number>
  declare cle: string // Ex: 'frais_rattrapage', 'frais_demande_document', 'compte_produit_rattrapage', 'compte_produit_document'
  declare libelle: string
  declare valeur: number // Valeur par défaut du paramètre
  declare description: CreationOptional<string | null>
  declare type: 'montant' | 'compte_comptable' | 'pourcentage' | 'texte'
  declare module: CreationOptional<string | null> // Ex: 'scolarite', 'evaluations'

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare readonly deletedAt: CreationOptional<Date | null>
}

ParametreFrais.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  cle: {
    type: new DataTypes.STRING(100),
    allowNull: false
  },
  libelle: {
    type: new DataTypes.STRING(255),
    allowNull: false
  },
  valeur: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('montant', 'compte_comptable', 'pourcentage', 'texte'),
    defaultValue: 'montant',
    allowNull: false
  },
  module: {
    type: new DataTypes.STRING(50),
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'ParametreFrais',
  tableName: MODULE_TABLE_PREFIX + 'parametres_frais',
  paranoid: true,
  timestamps: true
})
