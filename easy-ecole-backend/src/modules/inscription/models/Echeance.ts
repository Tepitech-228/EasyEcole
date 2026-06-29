import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { DossierEtudiant } from "./DossierEtudiant";

export class Echeance extends Model<InferAttributes<Echeance>, InferCreationAttributes<Echeance>> {
  declare id: CreationOptional<string>
  declare dossierEtudiantId: CreationOptional<ForeignKey<DossierEtudiant['id']>>
  declare type: 'inscription' | 'scolarite'
  declare numeroEcheance: number
  declare montant: number
  declare devise: CreationOptional<string>
  declare dateLimite: Date
  declare datePaiement: CreationOptional<Date | null>
  declare statut: 'impaye' | 'paye' | 'en_retard'
  declare moisConcerne: CreationOptional<string>
  declare dossierEtudiant?: NonAttribute<DossierEtudiant>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    dossierEtudiant: Association<Echeance, DossierEtudiant>
  };
}

Echeance.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  dossierEtudiantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: null
  },
  type: {
    type: DataTypes.ENUM('inscription', 'scolarite'),
    allowNull: false
  },
  numeroEcheance: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  montant: {
    type: DataTypes.FLOAT.UNSIGNED,
    allowNull: false
  },
  devise: {
    type: new DataTypes.STRING,
    defaultValue: 'XAF',
    allowNull: false
  },
  dateLimite: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  datePaiement: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null
  },
  statut: {
    type: DataTypes.ENUM('impaye', 'paye', 'en_retard'),
    defaultValue: 'impaye',
    allowNull: false
  },
  moisConcerne: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Echeance',
  tableName: MODULE_TABLE_PREFIX + 'echeances',
  timestamps: true
})
