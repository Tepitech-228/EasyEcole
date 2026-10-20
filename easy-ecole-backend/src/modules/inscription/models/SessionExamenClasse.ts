import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { SessionExamen } from "./SessionExamen";
import { Classe } from "./Classe";

export class SessionExamenClasse extends Model<InferAttributes<SessionExamenClasse>, InferCreationAttributes<SessionExamenClasse>> {
  declare id: CreationOptional<number>
  declare sessionExamenId: ForeignKey<SessionExamen['id']>
  declare classeId: ForeignKey<Classe['id']>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
}

SessionExamenClasse.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  sessionExamenId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: 'uq_session_examen_classe'
  },
  classeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: 'uq_session_examen_classe'
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'SessionExamenClasse',
  tableName: MODULE_TABLE_PREFIX + 'session_examen_classes',
  timestamps: true
})
