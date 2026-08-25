import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../BourseModule";
import { BourseConfiguration } from "./BourseConfiguration";
import { DossierEtudiant } from "../../inscription/models/DossierEtudiant";
import { Utilisateur } from "../../auth/models/Utilisateur";

/**
 * BourseAttribution — Attribution d'une bourse à un étudiant.
 *
 * Une seule bourse ACTIVE est autorisée par étudiant pour une même année académique.
 * Le taux et le montant sont calculés au moment de l'attribution et stockés
 * pour garantir l'immuabilité historique.
 *
 * statut :
 *  - ACTIVE    : la bourse est appliquée dans les calculs financiers
 *  - SUSPENDUE : temporairement suspendue (pas d'effet financier)
 *  - EXPIREE   : date de fin dépassée
 */
export class BourseAttribution extends Model<InferAttributes<BourseAttribution>, InferCreationAttributes<BourseAttribution>> {
  declare id: CreationOptional<number>
  declare dossierEtudiantId: ForeignKey<DossierEtudiant['id']>
  declare configurationId: ForeignKey<BourseConfiguration['id']>
  declare type: 'TOTAL' | 'PARTIELLE'
  declare taux: number                   // snapshot du taux au moment de l'attribution
  declare dateDebut: Date
  declare dateFin: CreationOptional<Date | null>
  declare statut: 'ACTIVE' | 'SUSPENDUE' | 'EXPIREE'
  declare motif: CreationOptional<string | null>
  declare valideParId: ForeignKey<Utilisateur['id']>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  // Associations eager-loaded
  declare configuration?: NonAttribute<BourseConfiguration>
  declare dossierEtudiant?: NonAttribute<DossierEtudiant>
  declare validePar?: NonAttribute<Utilisateur>

  declare static associations: {
    configuration: Association<BourseAttribution, BourseConfiguration>
    dossierEtudiant: Association<BourseAttribution, DossierEtudiant>
    validePar: Association<BourseAttribution, Utilisateur>
  }
}

BourseAttribution.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  dossierEtudiantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  configurationId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('TOTAL', 'PARTIELLE'),
    allowNull: false
  },
  taux: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  dateDebut: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dateFin: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null
  },
  statut: {
    type: DataTypes.ENUM('ACTIVE', 'SUSPENDUE', 'EXPIREE'),
    defaultValue: 'ACTIVE',
    allowNull: false
  },
  motif: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  valideParId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'BourseAttribution',
  tableName: MODULE_TABLE_PREFIX + 'attributions',
  timestamps: true
})
