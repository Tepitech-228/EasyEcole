import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { RattrapagePlanning } from "./RattrapagePlanning";
import { Enseignant } from "../../auth/models/Enseignant";
import { Cours } from "./Cours";

/**
 * Désignation d'un enseignant par créneau de rattrapage (samedi) et filière.
 * Un enseignant peut être désigné pour plusieurs créneaux.
 * Un créneau (samedi + filière) ne peut avoir qu'un seul enseignant.
 * Table: ins_rattrapage_enseignants
 */
export class RattrapageEnseignant extends Model<InferAttributes<RattrapageEnseignant>, InferCreationAttributes<RattrapageEnseignant>> {
  declare id: CreationOptional<number>
  declare rattrapagePlanningId: ForeignKey<RattrapagePlanning['id']>
  declare enseignantId: ForeignKey<Enseignant['id']>
  declare ueId: ForeignKey<Cours['id']> | null
  declare ecueId: ForeignKey<Cours['id']> | null
  declare statut: CreationOptional<string> // ENUM('designe','confirmé','annulé') défaut 'designe'

  declare rattrapagePlanning?: NonAttribute<RattrapagePlanning>
  declare enseignant?: NonAttribute<Enseignant>
  declare ue?: NonAttribute<Cours>
  declare ecue?: NonAttribute<Cours>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    rattrapagePlanning: Association<RattrapageEnseignant, RattrapagePlanning>
    enseignant: Association<RattrapageEnseignant, Enseignant>
    ue: Association<RattrapageEnseignant, Cours>
    ecue: Association<RattrapageEnseignant, Cours>
  }
}

RattrapageEnseignant.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  rattrapagePlanningId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  enseignantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  ueId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  ecueId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('designe', 'confirmé', 'annulé'),
    allowNull: false,
    defaultValue: 'designe'
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'RattrapageEnseignant',
  tableName: MODULE_TABLE_PREFIX + 'rattrapage_enseignants',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['rattrapagePlanningId', 'enseignantId'] },
    { fields: ['rattrapagePlanningId'] },
    { fields: ['enseignantId'] }
  ]
})

export default RattrapageEnseignant;