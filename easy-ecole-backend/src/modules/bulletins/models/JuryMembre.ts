import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Deliberation } from "./Deliberation";
import { Utilisateur } from "../../auth/models/Utilisateur";

const MODEL_PREFIX = 'JuryMembre';
const TABLE_PREFIX = 'ins_';

export class JuryMembre extends Model<InferAttributes<JuryMembre>, InferCreationAttributes<JuryMembre>> {
  declare id: CreationOptional<number>
  declare deliberationId: ForeignKey<Deliberation['id']>
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare role: string
  declare estPresent: CreationOptional<boolean>

  declare deliberation?: NonAttribute<Deliberation>
  declare utilisateur?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    deliberation: Association<JuryMembre, Deliberation>
    utilisateur: Association<JuryMembre, Utilisateur>
  }
}

JuryMembre.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  deliberationId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  utilisateurId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('president', 'secretaire', 'membre', 'invite'),
    allowNull: false,
    defaultValue: 'membre'
  },
  estPresent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODEL_PREFIX,
  tableName: TABLE_PREFIX + 'jury_membres',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['deliberationId', 'utilisateurId'] }
  ]
})
