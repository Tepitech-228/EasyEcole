import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { CahierDeTexte } from "./CahierDeTexte";

export class BlocCahierDeTexte extends Model<InferAttributes<BlocCahierDeTexte>, InferCreationAttributes<BlocCahierDeTexte>> {
  declare id: CreationOptional<string>
  declare date: Date
  declare heureDebut: Date
  declare heureFin: Date
  declare contenu: string

  declare cahierDeTexteId: ForeignKey<CahierDeTexte['id']>
  declare cahierDeTexte?: NonAttribute<CahierDeTexte>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    cahierDeTexte: Association<BlocCahierDeTexte, CahierDeTexte>,
  };
}

BlocCahierDeTexte.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  heureDebut: {
    type: DataTypes.TIME,
    allowNull: false
  },
  heureFin: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  contenu: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'BlocCahierDeTexte',
  tableName: MODULE_TABLE_PREFIX + 'blocs_cahier_de_texte',
  timestamps: true
})