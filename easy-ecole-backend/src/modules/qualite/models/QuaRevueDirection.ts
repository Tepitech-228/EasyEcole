import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../QualiteModule";
import { QuaDecisionRevue } from "./QuaDecisionRevue";

export class QuaRevueDirection extends Model<InferAttributes<QuaRevueDirection>, InferCreationAttributes<QuaRevueDirection>> {
  declare id: CreationOptional<number>
  declare titre: string
  declare dateTenue: Date
  declare participants: string
  declare ordreJour: string
  declare compteRendu: CreationOptional<string | null>
  declare statut: CreationOptional<'planifiee' | 'tenue' | 'validee'>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>

  declare decisions?: NonAttribute<QuaDecisionRevue[]>

  declare static associations: {
    decisions: Association<QuaRevueDirection, QuaDecisionRevue>
  }
}

QuaRevueDirection.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  titre: { type: DataTypes.STRING(200), allowNull: false },
  dateTenue: { type: DataTypes.DATEONLY, allowNull: false },
  participants: { type: DataTypes.TEXT, allowNull: false },
  ordreJour: { type: DataTypes.TEXT, allowNull: false },
  compteRendu: { type: DataTypes.TEXT, allowNull: true },
  statut: { type: DataTypes.ENUM('planifiee', 'tenue', 'validee'), defaultValue: 'planifiee' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'RevueDirection',
  tableName: MODULE_TABLE_PREFIX + 'revues_direction',
  timestamps: true
})
