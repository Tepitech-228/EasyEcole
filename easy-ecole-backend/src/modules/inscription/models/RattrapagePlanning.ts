import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { RattrapageSession } from "./RattrapageSession";
import { Classe } from "./Classe";
import { SalleDeClasse } from "./SalleDeClasse";

/**
 * Créneau de rattrapage (samedi généré entre dateDebut et dateFin d'une session).
 * Chaque samedi est lié à une filière (classe) de la session.
 * Table: ins_rattrapage_planning
 */
export class RattrapagePlanning extends Model<InferAttributes<RattrapagePlanning>, InferCreationAttributes<RattrapagePlanning>> {
  declare id: CreationOptional<number>
  declare rattrapageSessionId: ForeignKey<RattrapageSession['id']>
  declare classeId: ForeignKey<Classe['id']>
  declare dateSamedi: Date
  declare heureDebut: string
  declare heureFin: string
  declare salleId: ForeignKey<SalleDeClasse['id']> | null
  declare statut: CreationOptional<string> // ENUM('programme','convoque','present','absent','saisie_notes') défaut 'programme'

  declare rattrapageSession?: NonAttribute<RattrapageSession>
  declare classe?: NonAttribute<Classe>
  declare salle?: NonAttribute<SalleDeClasse>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    rattrapageSession: Association<RattrapagePlanning, RattrapageSession>
    classe: Association<RattrapagePlanning, Classe>
    salle: Association<RattrapagePlanning, SalleDeClasse>
  }
}

RattrapagePlanning.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  rattrapageSessionId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  classeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  dateSamedi: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  heureDebut: {
    type: DataTypes.TIME,
    allowNull: false
  },
  heureFin: {
    type: DataTypes.TIME,
    allowNull: false
  },
  salleId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('programme', 'convoque', 'present', 'absent', 'saisie_notes'),
    allowNull: false,
    defaultValue: 'programme'
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'RattrapagePlanning',
  tableName: MODULE_TABLE_PREFIX + 'rattrapage_planning',
  timestamps: true
})

export default RattrapagePlanning;