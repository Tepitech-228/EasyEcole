import { Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey, DataTypes, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../QualiteModule";
import { QuaAudit } from "./QuaAudit";

export class QuaAuditPiste extends Model<InferAttributes<QuaAuditPiste>, InferCreationAttributes<QuaAuditPiste>> {
  declare id: CreationOptional<number>
  declare auditId: ForeignKey<QuaAudit['id']>
  declare reference: string
  declare critere: string
  declare constat: CreationOptional<string | null>
  declare note: CreationOptional<number | null>
  declare conforme: CreationOptional<boolean | null>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>

  declare audit?: NonAttribute<QuaAudit>

  declare static associations: {
    audit: Association<QuaAuditPiste, QuaAudit>
  }
}

QuaAuditPiste.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  auditId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  reference: { type: DataTypes.STRING(50), allowNull: false },
  critere: { type: DataTypes.TEXT, allowNull: false },
  constat: { type: DataTypes.TEXT, allowNull: true },
  note: { type: DataTypes.INTEGER, allowNull: true },
  conforme: { type: DataTypes.BOOLEAN, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'AuditPiste',
  tableName: MODULE_TABLE_PREFIX + 'audit_pistes',
  timestamps: true
})
