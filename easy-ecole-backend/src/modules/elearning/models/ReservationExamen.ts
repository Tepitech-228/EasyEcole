import { Association, CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { Examen } from "./Examen";
import { SessionExamen } from "./SessionExamen";

export class ReservationExamen extends Model<InferAttributes<ReservationExamen>, InferCreationAttributes<ReservationExamen>> {
  declare id: CreationOptional<number>;
  declare examenId: ForeignKey<Examen["id"]>;
  declare sessionId: ForeignKey<SessionExamen["id"]>;
  declare utilisateurId: ForeignKey<Utilisateur["id"]>;
  declare statut: CreationOptional<"reservee" | "presente" | "absente" | "annulee">;
  declare marquePar: CreationOptional<number | null>;
  declare examen?: NonAttribute<Examen>;
  declare session?: NonAttribute<SessionExamen>;
  declare utilisateur?: NonAttribute<Utilisateur>;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
  declare static associations: {
    examen: Association<ReservationExamen, Examen>;
    session: Association<ReservationExamen, SessionExamen>;
    utilisateur: Association<ReservationExamen, Utilisateur>;
  };
}

ReservationExamen.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  examenId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  sessionId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  utilisateurId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  statut: { type: DataTypes.ENUM("reservee", "presente", "absente", "annulee"), allowNull: false, defaultValue: "reservee" },
  marquePar: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + "ReservationExamen",
  tableName: MODULE_TABLE_PREFIX + "reservations_examens",
  timestamps: true,
  indexes: [{ name: "uq_elearning_reservation_exam_student", unique: true, fields: ["examenId", "utilisateurId"] }],
});