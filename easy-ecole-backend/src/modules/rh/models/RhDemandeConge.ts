import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhEmploye } from "./RhEmploye";

export class RhDemandeConge extends Model<InferAttributes<RhDemandeConge>, InferCreationAttributes<RhDemandeConge>> {
  declare id: CreationOptional<number>
  declare employeId: ForeignKey<RhEmploye['id']>
  declare typeConge: 'annuel' | 'maladie' | 'maternite' | 'exceptionnel' | 'sans_solde'
  declare dateDebut: Date
  declare dateFin: Date
  declare duree: CreationOptional<number>
  declare motif: CreationOptional<string | null>
  declare statut: CreationOptional<'soumise' | 'validee_rh' | 'validee_superieur' | 'refusee' | 'annulee'>
  declare valideePar: CreationOptional<number | null>
  declare commentaireValidation: CreationOptional<string | null>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>

  declare employe?: NonAttribute<RhEmploye>

  declare static associations: {
    employe: Association<RhDemandeConge, RhEmploye>
  }
}

RhDemandeConge.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  employeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  typeConge: { type: DataTypes.ENUM('annuel', 'maladie', 'maternite', 'exceptionnel', 'sans_solde'), allowNull: false },
  dateDebut: { type: DataTypes.DATEONLY, allowNull: false },
  dateFin: { type: DataTypes.DATEONLY, allowNull: false },
  duree: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  motif: { type: DataTypes.TEXT, allowNull: true },
  statut: { type: DataTypes.ENUM('soumise', 'validee_rh', 'validee_superieur', 'refusee', 'annulee'), defaultValue: 'soumise' },
  valideePar: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  commentaireValidation: { type: DataTypes.TEXT, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'DemandeConge',
  tableName: MODULE_TABLE_PREFIX + 'demandes_conge',
  timestamps: true
})
