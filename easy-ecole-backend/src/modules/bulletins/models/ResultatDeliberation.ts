import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Deliberation } from "./Deliberation";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";

const MODEL_PREFIX = 'ResultatDeliberation';
const TABLE_PREFIX = 'ins_';

export class ResultatDeliberation extends Model<InferAttributes<ResultatDeliberation>, InferCreationAttributes<ResultatDeliberation>> {
  declare id: CreationOptional<number>
  declare deliberationId: ForeignKey<Deliberation['id']>
  declare cursusApprenantId: ForeignKey<CursusApprenant['id']>
  declare nom: string
  declare prenoms: string
  declare matricule: string
  declare moyenne: CreationOptional<number | null>
  declare mention: CreationOptional<string | null>
  declare rang: CreationOptional<number | null>
  declare decision: CreationOptional<string>

  declare deliberation?: NonAttribute<Deliberation>
  declare cursusApprenant?: NonAttribute<CursusApprenant>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    deliberation: Association<ResultatDeliberation, Deliberation>
    cursusApprenant: Association<ResultatDeliberation, CursusApprenant>
  }
}

ResultatDeliberation.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  deliberationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  cursusApprenantId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  nom: { type: DataTypes.STRING(100), allowNull: false },
  prenoms: { type: DataTypes.STRING(100), allowNull: false },
  matricule: { type: DataTypes.STRING(50), allowNull: false },
  moyenne: { type: DataTypes.FLOAT, allowNull: true },
  mention: { type: DataTypes.STRING(50), allowNull: true },
  rang: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  decision: { type: DataTypes.ENUM('admis', 'rattrapage', 'redouble'), defaultValue: 'admis', allowNull: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  tableName: TABLE_PREFIX + 'resultats_deliberation',
  modelName: MODEL_PREFIX,
  timestamps: true
});
