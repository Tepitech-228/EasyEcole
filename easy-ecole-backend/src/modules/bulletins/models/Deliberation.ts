import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Classe } from "../../inscription/models/Classe";
import { AnneeAcademique } from "../../inscription/models/AnneeAcademique";
import { ResultatDeliberation } from "./ResultatDeliberation";

const MODEL_PREFIX = 'Deliberation';
const TABLE_PREFIX = 'ins_';

export class Deliberation extends Model<InferAttributes<Deliberation>, InferCreationAttributes<Deliberation>> {
  declare id: CreationOptional<number>
  declare libelle: string
  declare classeId: ForeignKey<Classe['id']>
  declare anneeAcademiqueId: ForeignKey<AnneeAcademique['id']>
  declare periode: string
  declare date: Date
  declare statut: CreationOptional<string>
  declare effectif: CreationOptional<number>
  declare admis: CreationOptional<number>

  declare classe?: NonAttribute<Classe>
  declare anneeAcademique?: NonAttribute<AnneeAcademique>
  declare resultats?: NonAttribute<ResultatDeliberation[]>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare readonly deletedAt: CreationOptional<Date | null>

  declare static associations: {
    classe: Association<Deliberation, Classe>
    anneeAcademique: Association<Deliberation, AnneeAcademique>
    resultats: Association<Deliberation, ResultatDeliberation>
  }
}

Deliberation.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  libelle: { type: DataTypes.STRING(255), allowNull: false },
  classeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  anneeAcademiqueId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  periode: { type: DataTypes.STRING(50), allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false },
  statut: { type: DataTypes.ENUM('planifiee', 'en_cours', 'cloturee'), defaultValue: 'planifiee', allowNull: false },
  effectif: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  admis: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  tableName: TABLE_PREFIX + 'deliberations',
  modelName: MODEL_PREFIX,
  paranoid: true,
  timestamps: true
});
