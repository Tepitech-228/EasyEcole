import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhEmploye } from "./RhEmploye";

export type TypeContratEnseignant = 'cdi' | 'cdd' | 'vacataire';
export type StatutContrat = 'brouillon' | 'actif' | 'resilie';

export class RhContratEnseignant extends Model<InferAttributes<RhContratEnseignant>, InferCreationAttributes<RhContratEnseignant>> {
  declare id: CreationOptional<number>
  declare typeContrat: TypeContratEnseignant
  declare dateDebut: Date
  declare dateFin: CreationOptional<Date | null>
  declare statut: CreationOptional<StatutContrat>
  declare montantMensuel: CreationOptional<number | null>
  declare tauxHoraire: CreationOptional<number | null>
  declare volumeHoraireMensuel: CreationOptional<number | null>
  declare description: CreationOptional<string | null>
  declare pieceJointe: CreationOptional<string | null>

  declare employeId: ForeignKey<RhEmploye['id']>
  declare employe?: NonAttribute<RhEmploye>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    employe: Association<RhContratEnseignant, RhEmploye>,
  };
}

RhContratEnseignant.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  typeContrat: {
    type: DataTypes.ENUM('cdi', 'cdd', 'vacataire'),
    allowNull: false
  },
  dateDebut: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dateFin: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('brouillon', 'actif', 'resilie'),
    defaultValue: 'brouillon'
  },
  montantMensuel: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  tauxHoraire: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  volumeHoraireMensuel: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pieceJointe: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'ContratEnseignant',
  tableName: MODULE_TABLE_PREFIX + 'contrats_enseignant',
  timestamps: true
})
