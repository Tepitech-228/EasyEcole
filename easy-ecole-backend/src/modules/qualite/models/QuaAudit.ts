import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../QualiteModule";
import { QuaAuditPiste } from "./QuaAuditPiste";

export class QuaAudit extends Model<InferAttributes<QuaAudit>, InferCreationAttributes<QuaAudit>> {
  declare id: CreationOptional<number>
  declare type: 'interne' | 'externe'
  declare titre: string
  declare processus: string
  declare datePlanifiee: Date
  declare dateRealisation: CreationOptional<Date | null>
  declare equipe: string
  declare referentiel: CreationOptional<string | null>
  declare constats: CreationOptional<string | null>
  declare conclusion: CreationOptional<string | null>
  declare statut: CreationOptional<'planifie' | 'en_cours' | 'termine' | 'cloture'>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>

  declare pistes?: NonAttribute<QuaAuditPiste[]>

  declare static associations: {
    pistes: Association<QuaAudit, QuaAuditPiste>
  }
}

QuaAudit.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  type: { type: DataTypes.ENUM('interne', 'externe'), allowNull: false },
  titre: { type: DataTypes.STRING(200), allowNull: false },
  processus: { type: DataTypes.STRING(100), allowNull: false },
  datePlanifiee: { type: DataTypes.DATEONLY, allowNull: false },
  dateRealisation: { type: DataTypes.DATEONLY, allowNull: true },
  equipe: { type: DataTypes.TEXT, allowNull: false },
  referentiel: { type: DataTypes.STRING(100), allowNull: true },
  constats: { type: DataTypes.TEXT, allowNull: true },
  conclusion: { type: DataTypes.TEXT, allowNull: true },
  statut: { type: DataTypes.ENUM('planifie', 'en_cours', 'termine', 'cloture'), defaultValue: 'planifie' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Audit',
  tableName: MODULE_TABLE_PREFIX + 'audits',
  timestamps: true
})
