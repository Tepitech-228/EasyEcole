import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../MarcheModule";
import { PlanificationMarche } from "./PlanificationMarche";

export class AppelOffre extends Model<InferAttributes<AppelOffre>, InferCreationAttributes<AppelOffre>> {
  declare id: CreationOptional<string>
  declare planificationMarcheId: ForeignKey<PlanificationMarche['id']>
  declare reference: string
  declare objet: string
  declare dateLancement: CreationOptional<Date>
  declare dateLimiteDepot: CreationOptional<Date>
  declare critereEvaluation: CreationOptional<string>
  declare modalitePaiement: CreationOptional<string>
  declare garantie: CreationOptional<string>
  declare statut: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

AppelOffre.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  planificationMarcheId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  reference: { type: DataTypes.STRING, allowNull: false },
  objet: { type: DataTypes.TEXT, allowNull: false },
  dateLancement: { type: DataTypes.DATEONLY, allowNull: true },
  dateLimiteDepot: { type: DataTypes.DATEONLY, allowNull: true },
  critereEvaluation: { type: DataTypes.TEXT, allowNull: true },
  modalitePaiement: { type: DataTypes.TEXT, allowNull: true },
  garantie: { type: DataTypes.TEXT, allowNull: true },
  statut: { type: DataTypes.ENUM('lance', 'depots', 'evaluating', 'attribue', 'infructueux', 'annule'), defaultValue: 'lance' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'AppelOffre',
  tableName: MODULE_TABLE_PREFIX + 'appels_offre',
  timestamps: true
})
