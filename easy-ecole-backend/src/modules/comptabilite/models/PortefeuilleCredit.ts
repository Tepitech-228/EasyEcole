import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ComptabiliteModule";
import { DossierEtudiant } from "../../inscription/models/DossierEtudiant";
import { Bordereau } from "../../inscription/models/Bordereau";
import { Echeance } from "../../inscription/models/Echeance";

/**
 * Portefeuille de crédit étudiant (surplus / trop-perçu) — Phase 0 refonte paiements.
 *
 * Chaque ligne = UN mouvement horodaté. Le `soldeCourant` est capturé APRÈS le
 * mouvement → traçabilité comptable complète de l'historique du portefeuille.
 *
 * FK portée : `dossierEtudiantId` → ins_dossiers_etudiants (ET NON aut_apprenants
 * ni aut_utilisateurs), car :
 *   1. le dossier est l'ancre financière existante de l'étudiant : échéancier
 *      (ins_echeances.dossierEtudiantId), bordereaux et lignes de frais y sont
 *      déjà rattachés → le crédit s'impute FIFO directement sur les échéances du
 *      même dossier, sans jointure transverse ;
 *   2. `matricule` (ins_dossiers_etudiants) est l'identité scolaire stable qui
 *      circule dans les quitus et les paiements ;
 *   3. aut_apprenants n'est relié ni à l'échéancier ni aux bordereaux (seule
 *      liaison indirecte via utilisateurId), et un même utilisateur/apprenant
 *      peut porter plusieurs dossiers (réinscriptions annuelles) : rattacher le
 *      portefeuille au dossier permet de borner chaque mouvement au contrat
 *      académique courant. Le FIFO « toutes années confondues » reste réalisable
 *      côté service en remontant les échéances via le dossier ;
 *   4. références croisées bordereauId/echeanceId pour tracer l'origine du crédit
 *      (trop-perçu) et la consommation (imputation FIFO sur une échéance).
 */
export class PortefeuilleCredit extends Model<InferAttributes<PortefeuilleCredit>, InferCreationAttributes<PortefeuilleCredit>> {
  declare id: CreationOptional<number>
  declare dossierEtudiantId: ForeignKey<DossierEtudiant['id']>
  declare type: 'credit' | 'consommation' | 'ajustement'
  /** Mouvement signé : >0 = apport (credit/ajustement+), <0 = consommation. */
  declare montant: number
  /** Solde du portefeuille APRÈS ce mouvement (trace de l'historique). */
  declare soldeCourant: number
  declare bordereauId: CreationOptional<ForeignKey<Bordereau['id']> | null>
  declare echeanceId: CreationOptional<ForeignKey<Echeance['id']> | null>
  declare commentaire: CreationOptional<string | null>

  declare dossierEtudiant?: NonAttribute<DossierEtudiant>
  declare bordereau?: NonAttribute<Bordereau>
  declare echeance?: NonAttribute<Echeance>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    dossierEtudiant: Association<PortefeuilleCredit, DossierEtudiant>
    bordereau: Association<PortefeuilleCredit, Bordereau>
    echeance: Association<PortefeuilleCredit, Echeance>
  };
}

PortefeuilleCredit.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  dossierEtudiantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('credit', 'consommation', 'ajustement'),
    allowNull: false
  },
  montant: {
    type: DataTypes.DECIMAL(12, 0),
    allowNull: false
  },
  soldeCourant: {
    type: DataTypes.DECIMAL(12, 0),
    allowNull: false
  },
  bordereauId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: null
  },
  echeanceId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: null
  },
  commentaire: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'PortefeuilleCredit',
  tableName: MODULE_TABLE_PREFIX + 'portefeuille_credit',
  timestamps: true,
  // Requêtes fréquentes : solde par dossier (dernier mouvement), consommation FIFO.
  indexes: [
    {
      unique: false,
      fields: ['dossierEtudiantId', 'createdAt'],
      name: 'idx_portefeuille_credit_dossier'
    }
  ]
})