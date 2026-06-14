import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Cours } from "./Cours";
import { Enseignant } from "../../auth/models/Enseignant";
import { Presence } from "./Presence";
import { BlocCahierDeTexte } from "./BlocCahierDeTexte";

export class CahierDeTexte extends Model<InferAttributes<CahierDeTexte>, InferCreationAttributes<CahierDeTexte>> {
  declare id: CreationOptional<string>
  declare titre: string
  declare description: CreationOptional<string>
  declare coursId: ForeignKey<Cours['id']>
  declare cours?: NonAttribute<Cours>
  declare enseignantId: ForeignKey<Enseignant['id']>
  declare enseignant?: NonAttribute<Enseignant>
  declare blocsCahierDeTexte?: NonAttribute<BlocCahierDeTexte[]>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    cours: Association<CahierDeTexte, Cours>,
    enseignant: Association<CahierDeTexte, Enseignant>,
    blocsCahierDeTexte: Association<CahierDeTexte, BlocCahierDeTexte>
  };
}

CahierDeTexte.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  titre: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'CahierDeTexte',
  tableName: MODULE_TABLE_PREFIX + 'cahiers_de_texte',
  timestamps: true
})