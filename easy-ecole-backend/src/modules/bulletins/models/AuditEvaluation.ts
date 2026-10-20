import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { ListeNoteEvaluation } from "../../inscription/models/ListeNoteEvaluation";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class AuditEvaluation extends Model<InferAttributes<AuditEvaluation>, InferCreationAttributes<AuditEvaluation>> {
  declare id: CreationOptional<number>
  declare evaluationId: ForeignKey<ListeNoteEvaluation["id"]>
  declare effectuePar: ForeignKey<Utilisateur["id"]>
  declare action: string
  declare motif: CreationOptional<string | null>
  declare ancienneValeur: CreationOptional<string | null>
  declare nouvelleValeur: CreationOptional<string | null>
  declare createdAt: CreationOptional<Date>
}

AuditEvaluation.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  evaluationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  effectuePar: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  action: { type: DataTypes.STRING(40), allowNull: false },
  motif: { type: DataTypes.TEXT, allowNull: true },
  ancienneValeur: { type: DataTypes.TEXT, allowNull: true },
  nouvelleValeur: { type: DataTypes.TEXT, allowNull: true },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: "AuditEvaluation",
  tableName: "ins_audit_evaluations",
  timestamps: true,
  updatedAt: false
})
