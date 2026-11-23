import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";

export class RhTauxHoraireEnseignant extends Model<
  InferAttributes<RhTauxHoraireEnseignant>,
  InferCreationAttributes<RhTauxHoraireEnseignant>
> {
  declare id: CreationOptional<number>
  declare niveauEtudeId: number
  declare coursId: number
  declare enseignantId: CreationOptional<number | null>
  declare tauxHoraire: number
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

RhTauxHoraireEnseignant.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  niveauEtudeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  coursId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  enseignantId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  tauxHoraire: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + "TauxHoraireEnseignant",
  tableName: MODULE_TABLE_PREFIX + "taux_horaires_enseignants",
  timestamps: true,
  indexes: [
    { name: "idx_rh_taux_enseignant_cours_niveau", fields: ["enseignantId", "coursId", "niveauEtudeId"] }
  ],
})
