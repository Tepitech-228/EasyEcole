import { Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey, DataTypes, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../QualiteModule";
import { QuaEnqueteSatisfaction } from "./QuaEnqueteSatisfaction";

export class QuaReponseSatisfaction extends Model<InferAttributes<QuaReponseSatisfaction>, InferCreationAttributes<QuaReponseSatisfaction>> {
  declare id: CreationOptional<number>
  declare enqueteSatisfactionId: ForeignKey<QuaEnqueteSatisfaction['id']>
  declare utilisateurId: number
  declare reponses: string
  declare commentaire: CreationOptional<string | null>
  declare soumiseLe: CreationOptional<Date>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>

  declare enquete?: NonAttribute<QuaEnqueteSatisfaction>

  declare static associations: {
    enquete: Association<QuaReponseSatisfaction, QuaEnqueteSatisfaction>
  }
}

QuaReponseSatisfaction.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  enqueteSatisfactionId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  utilisateurId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  reponses: { type: DataTypes.TEXT, allowNull: false },
  commentaire: { type: DataTypes.TEXT, allowNull: true },
  soumiseLe: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'ReponseSatisfaction',
  tableName: MODULE_TABLE_PREFIX + 'reponses_satisfaction',
  timestamps: true
})
