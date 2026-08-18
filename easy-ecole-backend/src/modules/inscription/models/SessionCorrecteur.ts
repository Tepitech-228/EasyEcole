import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { SessionExamen } from "./SessionExamen";
import { Cours } from "./Cours";
import { Enseignant } from "../../auth/models/Enseignant";

/**
 * Correcteurs désignés par l'institution lors de la création d'une session de rattrapage.
 * Un correcteur par cours : c'est le seul enseignant autorisé à saisir les notes de rattrapage de ce cours.
 */
export class SessionCorrecteur extends Model<InferAttributes<SessionCorrecteur>, InferCreationAttributes<SessionCorrecteur>> {
  declare id: CreationOptional<number>
  declare sessionExamenId: ForeignKey<SessionExamen['id']>
  declare coursId: ForeignKey<Cours['id']>
  declare enseignantId: ForeignKey<Enseignant['id']>

  declare sessionExamen?: NonAttribute<SessionExamen>
  declare cours?: NonAttribute<Cours>
  declare enseignant?: NonAttribute<Enseignant>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

SessionCorrecteur.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  sessionExamenId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  coursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  enseignantId: {
    type: DataTypes.STRING(36),
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'SessionCorrecteur',
  tableName: MODULE_TABLE_PREFIX + 'session_correcteurs',
  timestamps: true
})

export default SessionCorrecteur;
