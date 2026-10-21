import { Association, CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { Enveloppe } from "./Enveloppe";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class Encaissement extends Model<InferAttributes<Encaissement>, InferCreationAttributes<Encaissement>> {
  declare id: CreationOptional<number>;
  declare enveloppeId: number;
  declare utilisateurId: number;
  declare agentId: CreationOptional<number | null>;
  declare anneeAcademiqueId: number;
  declare montant: number;
  declare reference: CreationOptional<string | null>;
  declare dateEncaissement: CreationOptional<Date>;
  declare statut: "saisi" | "valide" | "annule";
  declare mouvementId: CreationOptional<number | null>;
  declare commentaire: CreationOptional<string | null>;
  declare utilisateur?: NonAttribute<Utilisateur>;
  declare enveloppe?: NonAttribute<Enveloppe>;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
  declare static associations: {
    utilisateur: Association<Encaissement, Utilisateur>;
    enveloppe: Association<Encaissement, Enveloppe>;
  };
}

Encaissement.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  enveloppeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  utilisateurId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  agentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  anneeAcademiqueId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  montant: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  reference: { type: DataTypes.STRING(191), allowNull: true },
  dateEncaissement: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  statut: { type: DataTypes.ENUM("saisi", "valide", "annule"), allowNull: false, defaultValue: "saisi" },
  mouvementId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  commentaire: { type: DataTypes.TEXT, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + "Encaissement",
  tableName: MODULE_TABLE_PREFIX + "encaissements",
  timestamps: true,
});
