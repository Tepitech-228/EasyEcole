import { Association, CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { CentreExamen } from "./CentreExamen";
import { Examen } from "./Examen";
import { ReservationExamen } from "./ReservationExamen";

export class SessionExamen extends Model<InferAttributes<SessionExamen>, InferCreationAttributes<SessionExamen>> {
  declare id: CreationOptional<number>;
  declare examenId: ForeignKey<Examen["id"]>;
  declare centreId: ForeignKey<CentreExamen["id"]>;
  declare dateExamen: Date;
  declare capacite: number;
  declare statut: CreationOptional<"ouverte" | "fermee" | "annulee">;
  declare creePar: number;
  declare examen?: NonAttribute<Examen>;
  declare centre?: NonAttribute<CentreExamen>;
  declare reservations?: NonAttribute<ReservationExamen[]>;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
  declare static associations: {
    examen: Association<SessionExamen, Examen>;
    centre: Association<SessionExamen, CentreExamen>;
    reservations: Association<SessionExamen, ReservationExamen>;
  };
}

SessionExamen.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  examenId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  centreId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  dateExamen: { type: DataTypes.DATE, allowNull: false },
  capacite: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  statut: { type: DataTypes.ENUM("ouverte", "fermee", "annulee"), allowNull: false, defaultValue: "ouverte" },
  creePar: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + "SessionExamen",
  tableName: MODULE_TABLE_PREFIX + "sessions_examens",
  timestamps: true,
});