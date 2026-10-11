import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class Pointage extends Model<InferAttributes<Pointage>, InferCreationAttributes<Pointage>> {
  declare id: CreationOptional<number>
  declare date: Date
  declare heureArrivee: Date
  declare heureDepart: CreationOptional<Date | null>

  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare utilisateur?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    utilisateur: Association<Pointage, Utilisateur>
  };
}

Pointage.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  heureArrivee: {
    type: DataTypes.TIME,
    allowNull: false
  },
  heureDepart: {
    type: DataTypes.TIME,
    allowNull: true
  },
  // Déclaré explicitement (et non uniquement via `belongsTo`) afin que
  // l'index composite ci-dessous le résolve sans dépendre de l'ordre de
  // chargement des associations.
  utilisateurId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Pointage',
  tableName: MODULE_TABLE_PREFIX + 'pointages',
  timestamps: true,
  indexes: [
    // Un seul pointage par utilisateur et par date (arrivée puis départ sur la
    // même ligne). Empêche le doublon créé lors de deux scans concurrents :
    // le contrôle findOne-then-create du contrôleur n'est pas atomique.
    { unique: true, name: 'uq_ins_pointages_utilisateur_date', fields: ['utilisateurId', 'date'] }
  ]
})
