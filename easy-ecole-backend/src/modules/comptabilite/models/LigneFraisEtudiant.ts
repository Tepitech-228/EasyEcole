import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ComptabiliteModule";

export class LigneFraisEtudiant extends Model<InferAttributes<LigneFraisEtudiant>, InferCreationAttributes<LigneFraisEtudiant>> {
  declare id: CreationOptional<number>
  declare dossierEtudiantId: ForeignKey<number>
  declare type: 'inscription' | 'scolarite' | 'bibliotheque' | 'assurance' | 'logement' | 'document' | 'penalite'
  declare montant: number
  declare reductionId: CreationOptional<ForeignKey<number> | null>
  declare paye: boolean
  declare solde: number

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

LigneFraisEtudiant.init({
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
    type: DataTypes.ENUM('inscription', 'scolarite', 'bibliotheque', 'assurance', 'logement', 'document', 'penalite'),
    allowNull: false
  },
  montant: {
    type: DataTypes.DECIMAL(12, 0),
    allowNull: false
  },
  reductionId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  paye: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  solde: {
    type: DataTypes.DECIMAL(12, 0),
    defaultValue: 0
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'LigneFraisEtudiant',
  tableName: MODULE_TABLE_PREFIX + 'lignes_frais_etudiant',
  timestamps: true
})
