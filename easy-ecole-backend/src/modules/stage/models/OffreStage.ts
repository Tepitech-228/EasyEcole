import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Institution } from "../../auth/models/Institution";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../StageModule";

export class OffreStage extends Model<InferAttributes<OffreStage>, InferCreationAttributes<OffreStage>> {
  declare id: CreationOptional<string>
  declare titre: string
  declare description: string
  declare dateDebut: string
  declare dateFin: string
  declare lieu: string
  declare nombrePlaces: CreationOptional<number>
  declare statut: CreationOptional<string>
  declare institutionId: ForeignKey<Institution['id']>
  declare institution?: NonAttribute<Institution>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    institution: Association<OffreStage, Institution>
  }
}

OffreStage.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  titre: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  dateDebut: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dateFin: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  lieu: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  nombrePlaces: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  statut: {
    type: DataTypes.ENUM('ouvert', 'ferme'),
    defaultValue: 'ouvert'
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'OffreStage',
  tableName: MODULE_TABLE_PREFIX + 'offres_stage',
  timestamps: true
})
