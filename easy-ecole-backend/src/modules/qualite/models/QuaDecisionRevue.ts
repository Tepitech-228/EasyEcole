import { Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey, DataTypes, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../QualiteModule";
import { QuaRevueDirection } from "./QuaRevueDirection";

export class QuaDecisionRevue extends Model<InferAttributes<QuaDecisionRevue>, InferCreationAttributes<QuaDecisionRevue>> {
  declare id: CreationOptional<number>
  declare revueDirectionId: ForeignKey<QuaRevueDirection['id']>
  declare decision: string
  declare responsableId: number
  declare dateEcheance: CreationOptional<Date | null>
  declare statut: CreationOptional<'en_attente' | 'en_cours' | 'realisee' | 'annulee'>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>

  declare revueDirection?: NonAttribute<QuaRevueDirection>

  declare static associations: {
    revueDirection: Association<QuaDecisionRevue, QuaRevueDirection>
  }
}

QuaDecisionRevue.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  revueDirectionId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  decision: { type: DataTypes.TEXT, allowNull: false },
  responsableId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  dateEcheance: { type: DataTypes.DATEONLY, allowNull: true },
  statut: { type: DataTypes.ENUM('en_attente', 'en_cours', 'realisee', 'annulee'), defaultValue: 'en_attente' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'DecisionRevue',
  tableName: MODULE_TABLE_PREFIX + 'decisions_revue',
  timestamps: true
})
