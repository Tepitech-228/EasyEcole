import { Association, CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { Encaissement } from "./Encaissement";
import { Mouvement } from "./Mouvement";
import { SelectionCours } from "./SelectionCours";

export class Enveloppe extends Model<InferAttributes<Enveloppe>, InferCreationAttributes<Enveloppe>> {
  declare id: CreationOptional<number>;
  declare utilisateurId: number;
  declare dossierEtudiantId: CreationOptional<number | null>;
  declare anneeAcademiqueId: number;
  declare montantAlloue: number;
  declare montantReserve: number;
  declare montantConsomme: number;
  declare statut: "ouverte" | "suspendue" | "cloturee";
  declare dateCloture: CreationOptional<Date | null>;
  declare mouvements?: NonAttribute<Mouvement[]>;
  declare encaissements?: NonAttribute<Encaissement[]>;
  declare selections?: NonAttribute<SelectionCours[]>;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
  declare static associations: {
    mouvements: Association<Enveloppe, Mouvement>;
    encaissements: Association<Enveloppe, Encaissement>;
    selections: Association<Enveloppe, SelectionCours>;
  };
}

Enveloppe.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  utilisateurId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  dossierEtudiantId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  anneeAcademiqueId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  montantAlloue: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  montantReserve: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  montantConsomme: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  statut: { type: DataTypes.ENUM("ouverte", "suspendue", "cloturee"), allowNull: false, defaultValue: "ouverte" },
  dateCloture: { type: DataTypes.DATEONLY, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + "Enveloppe",
  tableName: MODULE_TABLE_PREFIX + "enveloppes",
  timestamps: true,
  indexes: [{ unique: true, fields: ["utilisateurId", "anneeAcademiqueId"] }],
});
