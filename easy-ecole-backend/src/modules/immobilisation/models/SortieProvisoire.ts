import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ImmobilisationModule";
import { Immobilisation } from "./Immobilisation";

export class SortieProvisoire extends Model<InferAttributes<SortieProvisoire>, InferCreationAttributes<SortieProvisoire>> {
  declare id: CreationOptional<string>
  declare immobilisationId: ForeignKey<Immobilisation['id']>
  declare dateSortie: string
  declare dateRetourPrevu: string
  declare dateRetourEffectif: CreationOptional<string>
  declare motif: string
  declare prestataire: CreationOptional<string>
  declare description: CreationOptional<string>
  declare statut: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

SortieProvisoire.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  immobilisationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  dateSortie: { type: DataTypes.DATEONLY, allowNull: false },
  dateRetourPrevu: { type: DataTypes.DATEONLY, allowNull: false },
  dateRetourEffectif: { type: DataTypes.DATEONLY, allowNull: true },
  motif: { type: new DataTypes.STRING, allowNull: false },
  prestataire: { type: new DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  statut: { type: DataTypes.ENUM('en_cours', 'retourne'), defaultValue: 'en_cours' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'SortieProvisoire',
  tableName: MODULE_TABLE_PREFIX + 'sortie_provisoire',
  timestamps: true
})
