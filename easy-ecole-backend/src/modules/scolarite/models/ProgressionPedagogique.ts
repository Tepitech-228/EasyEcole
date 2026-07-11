import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";
import { Cours } from "../../inscription/models/Cours";
import { ChapitreCours } from "../../inscription/models/ChapitreCours";

export class ProgressionPedagogique extends Model<InferAttributes<ProgressionPedagogique>, InferCreationAttributes<ProgressionPedagogique>> {
  declare id: CreationOptional<string>
  declare coursId: ForeignKey<Cours['id']>
  declare cours?: NonAttribute<Cours>
  declare semaine: number
  declare chapitreId: ForeignKey<ChapitreCours['id'] | null>
  declare chapitre?: NonAttribute<ChapitreCours>
  declare volumeHoraire: number
  declare statut: string

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    cours: Association<ProgressionPedagogique, Cours>
    chapitre: Association<ProgressionPedagogique, ChapitreCours>
  };
}

ProgressionPedagogique.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  coursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  semaine: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  chapitreId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  volumeHoraire: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  statut: {
    type: DataTypes.ENUM('planifie', 'effectue'),
    defaultValue: 'planifie',
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'ProgressionPedagogique',
  tableName: MODULE_TABLE_PREFIX + 'progression_pedagogique',
  timestamps: true
})