import { Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey, DataTypes, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../QualiteModule";
import { QuaNonConformite } from "./QuaNonConformite";

export class QuaActionCorrective extends Model<InferAttributes<QuaActionCorrective>, InferCreationAttributes<QuaActionCorrective>> {
  declare id: CreationOptional<number>
  declare nonConformiteId: ForeignKey<QuaNonConformite['id']>
  declare type: 'corrective' | 'preventive'
  declare description: string
  declare responsableId: number
  declare dateLimite: CreationOptional<Date | null>
  declare statut: CreationOptional<'planifiee' | 'en_cours' | 'terminee' | 'verifiee'>
  declare efficacite: CreationOptional<'satisfaisante' | 'partielle' | 'insuffisante' | null>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>

  declare nonConformite?: NonAttribute<QuaNonConformite>

  declare static associations: {
    nonConformite: Association<QuaActionCorrective, QuaNonConformite>
  }
}

QuaActionCorrective.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  nonConformiteId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  type: { type: DataTypes.ENUM('corrective', 'preventive'), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  responsableId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  dateLimite: { type: DataTypes.DATEONLY, allowNull: true },
  statut: { type: DataTypes.ENUM('planifiee', 'en_cours', 'terminee', 'verifiee'), defaultValue: 'planifiee' },
  efficacite: { type: DataTypes.ENUM('satisfaisante', 'partielle', 'insuffisante'), allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'ActionCorrective',
  tableName: MODULE_TABLE_PREFIX + 'actions_correctives',
  timestamps: true
})
