import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Deliberation } from "./Deliberation";
import { ResultatDeliberation } from "./ResultatDeliberation";

const MODEL_PREFIX = 'HistoriqueDecision';
const TABLE_PREFIX = 'ins_';

export class HistoriqueDecision extends Model<InferAttributes<HistoriqueDecision>, InferCreationAttributes<HistoriqueDecision>> {
  declare id: CreationOptional<number>
  declare deliberationId: ForeignKey<Deliberation['id']>
  declare resultatId: ForeignKey<ResultatDeliberation['id']>
  declare ancienneDecision: string
  declare nouvelleDecision: string
  declare auteurId: number
  declare motif: CreationOptional<string | null>

  declare readonly createdAt: CreationOptional<Date>
}

HistoriqueDecision.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  deliberationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  resultatId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  ancienneDecision: { type: DataTypes.STRING(50), allowNull: false },
  nouvelleDecision: { type: DataTypes.STRING(50), allowNull: false },
  auteurId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  motif: { type: DataTypes.TEXT, allowNull: true },
  createdAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  tableName: TABLE_PREFIX + 'historique_decisions',
  modelName: MODEL_PREFIX,
  timestamps: true,
  updatedAt: false
});
