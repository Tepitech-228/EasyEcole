import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ImmobilisationModule";
import { Immobilisation } from "./Immobilisation";

export class Cession extends Model<InferAttributes<Cession>, InferCreationAttributes<Cession>> {
  declare id: CreationOptional<string>
  declare immobilisationId: ForeignKey<Immobilisation['id']>
  declare dateCession: string
  declare motif: string
  declare typeOperation: CreationOptional<string>
  declare prixCession: CreationOptional<number>
  declare destinataire: CreationOptional<string>
  declare approuvePar: CreationOptional<string>
  declare dateApprobation: CreationOptional<Date>
  declare motifRefus: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

Cession.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  immobilisationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  dateCession: { type: DataTypes.DATE, allowNull: false },
  motif: { type: DataTypes.TEXT, allowNull: false },
  typeOperation: { type: DataTypes.ENUM('cession', 'rebut'), defaultValue: 'cession' },
  prixCession: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  destinataire: { type: new DataTypes.STRING, allowNull: true },
  approuvePar: { type: new DataTypes.STRING, allowNull: true },
  dateApprobation: { type: DataTypes.DATE, allowNull: true },
  motifRefus: { type: DataTypes.TEXT, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Cession',
  tableName: MODULE_TABLE_PREFIX + 'cession',
  timestamps: true
})
