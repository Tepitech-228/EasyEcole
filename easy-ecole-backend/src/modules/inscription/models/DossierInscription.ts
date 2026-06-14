import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Session } from "./Session";

export class DossierInscription extends Model<InferAttributes<DossierInscription>, InferCreationAttributes<DossierInscription>> {
  declare id: CreationOptional<string>
  declare titre: string
  declare description: CreationOptional<string>
  declare tailleMax: number
  declare sessionId: ForeignKey<Session['id']>
  declare session?: NonAttribute<Session>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    session: Association<DossierInscription, Session>
  };
}

DossierInscription.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  titre: {
    type: new DataTypes.STRING,
    allowNull: false,
    unique: 'titre-session'
  },
  description: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  tailleMax: {
    type: DataTypes.FLOAT.UNSIGNED,
    allowNull: true
  },
  sessionId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: 'titre-session'
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'DossierInscription',
  tableName: MODULE_TABLE_PREFIX + 'dossiers_inscription',
  timestamps: true
})