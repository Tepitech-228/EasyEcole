import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ComptabiliteModule";

export class ReductionFrais extends Model<InferAttributes<ReductionFrais>, InferCreationAttributes<ReductionFrais>> {
  declare id: CreationOptional<number>
  declare dossierEtudiantId: ForeignKey<number>
  declare type: 'bourse_externe' | 'bourse_interne' | 'exoneration' | 'remise' | 'fratrie'
  declare montant: CreationOptional<number | null>
  declare pourcentage: CreationOptional<number | null>
  declare validePar: ForeignKey<number>
  declare dateValidation: Date
  declare motif: string
  declare dateDebut: Date
  declare dateFin: Date

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

ReductionFrais.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  dossierEtudiantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('bourse_externe', 'bourse_interne', 'exoneration', 'remise', 'fratrie'),
    allowNull: false
  },
  montant: {
    type: DataTypes.DECIMAL(12, 0),
    allowNull: true
  },
  pourcentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  validePar: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  dateValidation: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  motif: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  dateDebut: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dateFin: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'ReductionFrais',
  tableName: MODULE_TABLE_PREFIX + 'reductions_frais',
  timestamps: true
})
