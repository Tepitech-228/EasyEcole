import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ComptabiliteModule";
import { Bordereau } from "../../inscription/models/Bordereau";
import { Echeance } from "../../inscription/models/Echeance";

/**
 * Lettrage bordereau ↔ échéance (Phase 0 refonte paiements).
 *
 * Une ligne = l'imputation d'un montant d'un bordereau validé sur une échéance.
 * L'UNIQUE (bordereauId, echeanceId) empêche la double imputation du même
 * bordereau sur la même échéance. Le paiement PARTIEL est possible : plusieurs
 * lignes font référence à la même échéance (bordereaux distincts), le cumul de
 * `montantImpute` alimente `ins_echeances.montantPaye`.
 */
export class BordereauEcheance extends Model<InferAttributes<BordereauEcheance>, InferCreationAttributes<BordereauEcheance>> {
  declare id: CreationOptional<number>
  declare bordereauId: ForeignKey<Bordereau['id']>
  declare echeanceId: ForeignKey<Echeance['id']>
  declare montantImpute: number

  declare bordereau?: NonAttribute<Bordereau>
  declare echeance?: NonAttribute<Echeance>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    bordereau: Association<BordereauEcheance, Bordereau>
    echeance: Association<BordereauEcheance, Echeance>
  };
}

BordereauEcheance.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  bordereauId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  echeanceId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  montantImpute: {
    type: DataTypes.DECIMAL(12, 0),
    allowNull: false,
    defaultValue: 0
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'BordereauEcheance',
  tableName: MODULE_TABLE_PREFIX + 'bordereau_echeance',
  timestamps: true,
  // Anti double-imputation : l'index UNIQUE NOMINATIF est idempotent au sync
  // (comparaison par nom — pas de suffixe _2 régénéré à chaque boot).
  indexes: [
    {
      unique: true,
      fields: ['bordereauId', 'echeanceId'],
      name: 'uq_bordereau_echeance'
    }
  ]
})