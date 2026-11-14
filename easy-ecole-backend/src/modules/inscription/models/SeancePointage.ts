import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Seance } from "./Seance";
import { Enseignant } from "../../auth/models/Enseignant";
import { Etablissement } from "../../etablissement/models/Etablissement";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class SeancePointage extends Model<InferAttributes<SeancePointage>, InferCreationAttributes<SeancePointage>> {
  declare id: CreationOptional<number>
  declare seanceId: ForeignKey<Seance["id"]>
  declare date: string
  declare enseignantId: ForeignKey<Enseignant["id"]>
  declare utilisateurId: ForeignKey<Utilisateur["id"]>
  declare etablissementId: ForeignKey<Etablissement["id"]>
  declare heureDebutReelle: CreationOptional<string | null>
  declare heureFinReelle: CreationOptional<string | null>
  declare motifDepart: CreationOptional<string | null>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

SeancePointage.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  seanceId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  enseignantId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  utilisateurId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  etablissementId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  heureDebutReelle: { type: DataTypes.TIME, allowNull: true },
  heureFinReelle: { type: DataTypes.TIME, allowNull: true },
  motifDepart: { type: DataTypes.STRING(500), allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + "SeancePointage",
  tableName: MODULE_TABLE_PREFIX + "seance_pointages",
  timestamps: true,
  indexes: [
    { unique: true, name: "uq_ins_seance_pointages_seance_date", fields: ["seanceId", "date"] },
    { name: "idx_ins_seance_pointages_site_date", fields: ["etablissementId", "date"] },
  ],
})
