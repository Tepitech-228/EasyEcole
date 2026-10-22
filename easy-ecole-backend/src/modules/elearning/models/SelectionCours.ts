import { Association, CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ElearningModule";
import { CoursEnLigne } from "./CoursEnLigne";
import { Enveloppe } from "./Enveloppe";

export class SelectionCours extends Model<InferAttributes<SelectionCours>, InferCreationAttributes<SelectionCours>> {
  declare id: CreationOptional<number>;
  declare enveloppeId: number;
  declare utilisateurId: number;
  declare dossierEtudiantId: CreationOptional<number | null>;
  declare coursId: number;
  declare ueId: CreationOptional<number | null>;
  declare anneeAcademiqueId: number;
  declare credits: number;
  declare coutFige: number;
  declare statut: "propose" | "en_attente_comite" | "valide_payee" | "acces_ouvert" | "rejete" | "retiree" | "remboursee";
  declare dateProposition: CreationOptional<Date>;
  declare dateValidation: CreationOptional<Date | null>;
  declare validePar: CreationOptional<number | null>;
  declare mouvementId: CreationOptional<number | null>;
  declare cours?: NonAttribute<CoursEnLigne>;
  declare enveloppe?: NonAttribute<Enveloppe>;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
  declare static associations: {
    cours: Association<SelectionCours, CoursEnLigne>;
    enveloppe: Association<SelectionCours, Enveloppe>;
  };
}

SelectionCours.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  enveloppeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  utilisateurId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  dossierEtudiantId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  coursId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  ueId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  anneeAcademiqueId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  credits: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  coutFige: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  statut: {
    type: DataTypes.ENUM("propose", "en_attente_comite", "valide_payee", "acces_ouvert", "rejete", "retiree", "remboursee"),
    allowNull: false,
    defaultValue: "propose",
  },
  dateProposition: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  dateValidation: { type: DataTypes.DATE, allowNull: true },
  validePar: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  mouvementId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + "SelectionCours",
  tableName: MODULE_TABLE_PREFIX + "selections_cours",
  timestamps: true,
  indexes: [{ unique: true, fields: ["utilisateurId", "coursId", "anneeAcademiqueId"] }],
});
