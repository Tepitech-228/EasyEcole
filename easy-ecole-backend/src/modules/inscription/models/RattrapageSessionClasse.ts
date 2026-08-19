import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { RattrapageSession } from "./RattrapageSession";
import { Classe } from "./Classe";

/**
 * Pivot : classes (filières) concernées par une session de rattrapage.
 * Table: ins_sessions_rattrapage_classes
 */
export class RattrapageSessionClasse extends Model<InferAttributes<RattrapageSessionClasse>, InferCreationAttributes<RattrapageSessionClasse>> {
  declare id: CreationOptional<number>
  declare rattrapageSessionId: ForeignKey<RattrapageSession['id']>
  declare classeId: ForeignKey<Classe['id']>

  declare rattrapageSession?: NonAttribute<RattrapageSession>
  declare classe?: NonAttribute<Classe>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    rattrapageSession: Association<RattrapageSessionClasse, RattrapageSession>
    classe: Association<RattrapageSessionClasse, Classe>
  }
}

RattrapageSessionClasse.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  rattrapageSessionId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: 'rattrapage-session-classe'
  },
  classeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: 'rattrapage-session-classe'
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'RattrapageSessionClasse',
  tableName: MODULE_TABLE_PREFIX + 'sessions_rattrapage_classes',
  timestamps: true
})

export default RattrapageSessionClasse;