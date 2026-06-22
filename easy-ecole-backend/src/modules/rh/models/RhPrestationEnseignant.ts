import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhEmploye } from "./RhEmploye";

export class RhPrestationEnseignant extends Model<InferAttributes<RhPrestationEnseignant>, InferCreationAttributes<RhPrestationEnseignant>> {
  declare id: CreationOptional<string>
  declare enseignantId: ForeignKey<RhEmploye['id']>
  declare coursId: string
  declare mois: number
  declare annee: number
  declare nombreHeures: number
  declare tauxHoraire: number
  declare montant: CreationOptional<number>
  declare statut: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare enseignant?: NonAttribute<RhEmploye>

  declare static associations: {
    enseignant: Association<RhPrestationEnseignant, RhEmploye>
  }
}

RhPrestationEnseignant.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  coursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  mois: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  annee: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  nombreHeures: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false
  },
  tauxHoraire: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  montant: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0
  },
  statut: {
    type: DataTypes.ENUM('saisie', 'validée', 'payée'),
    defaultValue: 'saisie'
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'PrestationEnseignant',
  tableName: MODULE_TABLE_PREFIX + 'prestations_enseignant',
  timestamps: true
})
