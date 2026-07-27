import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../MarcheModule";
import { PlanificationMarche } from "./PlanificationMarche";

export class ManifestationInteret extends Model<InferAttributes<ManifestationInteret>, InferCreationAttributes<ManifestationInteret>> {
  declare id: CreationOptional<string>
  declare planificationMarcheId: ForeignKey<PlanificationMarche['id']>
  declare reference: string
  declare objet: string
  declare dateDepot: CreationOptional<Date>
  declare dateOuverture: CreationOptional<Date>
  declare soumissionnaire: string
  declare montantEstime: CreationOptional<number>
  declare statut: CreationOptional<string>
  declare observations: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

ManifestationInteret.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  planificationMarcheId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  reference: { type: DataTypes.STRING, allowNull: false },
  objet: { type: DataTypes.TEXT, allowNull: false },
  dateDepot: { type: DataTypes.DATEONLY, allowNull: true },
  dateOuverture: { type: DataTypes.DATEONLY, allowNull: true },
  soumissionnaire: { type: DataTypes.STRING, allowNull: true },
  montantEstime: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  statut: { type: DataTypes.ENUM('deposee', 'examinee', 'rejetee', 'retenue'), defaultValue: 'deposee' },
  observations: { type: DataTypes.TEXT, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'ManifestationInteret',
  tableName: MODULE_TABLE_PREFIX + 'manifestations_interet',
  timestamps: true
})
