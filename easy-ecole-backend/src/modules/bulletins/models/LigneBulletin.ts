import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Cours } from "../../inscription/models/Cours";
import { Bulletin } from "./Bulletin";

const MODEL_PREFIX = 'LigneBulletin';
const TABLE_PREFIX = 'ins_';

export class LigneBulletin extends Model<InferAttributes<LigneBulletin>, InferCreationAttributes<LigneBulletin>> {
  declare id: CreationOptional<number>
  declare bulletinId: ForeignKey<Bulletin['id']>
  declare coursId: ForeignKey<Cours['id']>
  declare moyenneCC: CreationOptional<number | null>
  declare noteDevoir: CreationOptional<number | null>
  declare noteExamen: CreationOptional<number | null>
  declare moyenne: CreationOptional<number | null>
  declare coefficient: CreationOptional<number | null>
  declare rang: CreationOptional<number | null>
  declare appreciation: CreationOptional<string | null>

  declare bulletin?: NonAttribute<Bulletin>
  declare cours?: NonAttribute<Cours>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    bulletin: Association<LigneBulletin, Bulletin>
    cours: Association<LigneBulletin, Cours>
  }
}

LigneBulletin.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  bulletinId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  coursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  moyenneCC: { type: DataTypes.FLOAT, allowNull: true },
  noteDevoir: { type: DataTypes.FLOAT, allowNull: true },
  noteExamen: { type: DataTypes.FLOAT, allowNull: true },
  moyenne: { type: DataTypes.FLOAT, allowNull: true },
  coefficient: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  rang: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  appreciation: { type: DataTypes.TEXT, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  tableName: TABLE_PREFIX + 'lignes_bulletins',
  modelName: MODEL_PREFIX,
  timestamps: true
});
